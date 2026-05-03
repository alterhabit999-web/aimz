/**
 * api/projects.js — projects コレクションへのアクセス
 *
 * 日付フィールド（start_date / end_date）は Appwrite では datetime 型なので
 * ISO8601 文字列で保存。UI 側は `YYYY-MM-DD` を扱うので入出力で変換する。
 *
 * 担当者は project_assignees 中間テーブル（別モジュール）で管理する。
 * UI 互換のため、normalize で `assignee_ids: []` を空配列で保持して返す。
 *   実際の担当者一覧は ProjectsPage / ProjectDetailPage 側で
 *   listAllProjectAssignees() と組み合わせて解決する。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.PROJECTS;

const toAppwriteDate = (s) => {
  if (!s) return null;
  if (typeof s === 'string' && s.includes('T')) return s;
  // 'YYYY-MM-DD' を 00:00 UTC として保存
  return new Date(`${s}T00:00:00Z`).toISOString();
};
const fromAppwriteDate = (s) => {
  if (!s) return null;
  return s.slice(0, 10);
};

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    start_date: fromAppwriteDate(doc.start_date),
    end_date:   fromAppwriteDate(doc.end_date),
    // 担当者は別 API で解決するので、UI 互換のため空配列をデフォルトで持たせる
    assignee_ids: doc.assignee_ids ?? [],
  };
};

/** 案件一覧 */
export async function listProjects({ limit = 200 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
    Query.orderDesc('$createdAt'),
  ]);
  return res.documents.map(normalize);
}

export async function listProjectsByTeam(teamId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('team_id', teamId),
    Query.limit(200),
    Query.orderDesc('$createdAt'),
  ]);
  return res.documents.map(normalize);
}

export async function getProject(id) {
  if (!id) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, id);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

/** 案件作成 */
export async function createProject({
  id, team_id, name, description = null,
  status = '未着手', priority = '中',
  start_date = null, end_date = null,
  created_by = null,
}) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      team_id,
      name,
      description: description || null,
      status,
      priority,
      start_date: toAppwriteDate(start_date),
      end_date:   toAppwriteDate(end_date),
      created_by: created_by || null,
    }
  );
  return normalize(doc);
}

/** 案件更新（部分更新） */
export async function updateProject(id, patch) {
  const cleaned = { ...patch };
  if ('start_date' in cleaned) cleaned.start_date = toAppwriteDate(cleaned.start_date);
  if ('end_date'   in cleaned) cleaned.end_date   = toAppwriteDate(cleaned.end_date);
  // assignee_ids は中間テーブル管理なので projects へは保存しない
  delete cleaned.assignee_ids;
  delete cleaned.id;
  delete cleaned.$id;
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, cleaned);
  return normalize(doc);
}

/** 案件削除（呼び出し側で project_assignees / tasks も削除すること） */
export async function deleteProject(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}

/**
 * プロジェクトのステータスをタスクの状態から自動更新する。
 *
 * ルール：
 *   - 「未着手」のプロジェクトで、タスクが 1 つでも「進行中」または「完了」になっていたら
 *     プロジェクトを「進行中」に変更する。
 *   - 「進行中」「完了」「保留」のプロジェクトは触らない（手動設定を尊重）。
 *   - 完了化は手動のまま（全タスク完了でも自動で完了にはしない）。
 *
 * 各タスクの create / update / delete のあとに呼び出す。
 */
export async function syncProjectStatusFromTasks(projectId, tasksOfProject) {
  if (!projectId) return null;

  const project = await getProject(projectId);
  if (!project) return null;

  // 自動変更の対象は「未着手」のみ
  if (project.status !== '未着手') return project;

  // tasks 配列が渡されていなければ取得
  let tasks = tasksOfProject;
  if (!tasks) {
    // 動的 import で循環依存を回避
    const { listTasksByProject } = await import('./tasks');
    tasks = await listTasksByProject(projectId);
  }

  const hasActive = tasks.some(t => t.status === '進行中' || t.status === '完了');
  if (hasActive) {
    return updateProject(projectId, { status: '進行中' });
  }
  return project;
}
