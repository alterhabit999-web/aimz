/**
 * api/subtasks.js — subtasks（小タスク）コレクション
 *
 * 親タスクと一緒に保存される運用なので、`setSubtasksForTask` で差分同期する。
 * UI 側は SubtaskList 内で `st-local-XXX` の一時 ID を振っているため、
 * Appwrite document ID として使えない（"-" は OK だが新規かどうかの判別フラグとして使う）。
 *
 * 差分同期の方針：
 *   - DB から既存の小タスクを取得
 *   - 入力配列に id があり DB にも存在 → patch
 *   - 入力配列に id がない or 'st-local-' プレフィックス → 新規作成
 *   - DB にあるが入力配列にない → 削除
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.SUBTASKS;

const toIso  = (s) => !s ? null : (typeof s === 'string' && s.includes('T') ? s : new Date(`${s}T00:00:00Z`).toISOString());
const toDate = (s) => !s ? null : s.slice(0, 10);

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    due_date: toDate(doc.due_date),
  };
};

export async function listSubtasksByTask(taskId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('task_id', taskId),
    Query.orderAsc('order_index'),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

/** 指定ユーザーが担当の小タスク一覧（マイタスクページ用） */
export async function listSubtasksByAssignee(userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('assignee_id', userId),
    Query.limit(500),
  ]);
  return res.documents.map(normalize);
}

export async function createSubtask({
  id, task_id, name,
  is_completed = false, assignee_id = null,
  due_date = null, order_index = 0,
}) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      task_id, name,
      is_completed,
      assignee_id: assignee_id || null,
      due_date: toIso(due_date),
      order_index: order_index ?? 0,
    }
  );
  return normalize(doc);
}

export async function updateSubtask(id, patch) {
  const cleaned = { ...patch };
  if ('due_date' in cleaned) cleaned.due_date = toIso(cleaned.due_date);
  delete cleaned.id;
  delete cleaned.$id;
  delete cleaned.task_id; // 親変更は禁止（必要なら別途対応）
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, cleaned);
  return normalize(doc);
}

export async function deleteSubtask(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}

/** task の subtasks をすべて削除（task 削除時にカスケードで呼ぶ） */
export async function deleteAllSubtasksForTask(taskId) {
  const list = await listSubtasksByTask(taskId);
  for (const s of list) {
    try { await deleteSubtask(s.id); } catch (err) {
      console.warn('[subtasks] cascade delete failed:', s.id, err?.message);
    }
  }
}

/**
 * 親タスクの subtasks を一括同期する。
 *   subtasks 配列の各要素：
 *     { id?, name, is_completed, assignee_id, due_date, order_index? }
 *   id が無い or 'st-local-' で始まる → 新規作成（order_index は配列の順序で振り直す）
 *   id があり既存 → patch
 *   既存にあるが入力に無い → delete
 */
export async function setSubtasksForTask(taskId, subtasks) {
  const existing = await listSubtasksByTask(taskId);
  const existingMap = new Map(existing.map(s => [s.id, s]));

  // 入力に id がある（かつ st-local- ではない）ものを追跡
  const keptIds = new Set(
    subtasks
      .map(s => s.id)
      .filter(id => typeof id === 'string' && id && !id.startsWith('st-local-'))
  );

  // 1) 削除：既存にあるが入力に無いもの
  for (const s of existing) {
    if (!keptIds.has(s.id)) {
      try { await deleteSubtask(s.id); } catch (err) {
        console.warn('[subtasks] sync delete failed:', s.id, err?.message);
      }
    }
  }

  // 2) 順序を再付与しながら、new は create、既存は変更があれば update
  for (let i = 0; i < subtasks.length; i++) {
    const s = subtasks[i];
    const isNew = !s.id || (typeof s.id === 'string' && s.id.startsWith('st-local-'));
    if (isNew) {
      await createSubtask({
        task_id: taskId,
        name: s.name,
        is_completed: !!s.is_completed,
        assignee_id: s.assignee_id || null,
        due_date: s.due_date || null,
        order_index: i,
      });
    } else {
      const cur = existingMap.get(s.id);
      // 変更検知（軽量比較）
      const changed = !cur ||
        cur.name !== s.name ||
        !!cur.is_completed !== !!s.is_completed ||
        (cur.assignee_id || null) !== (s.assignee_id || null) ||
        (cur.due_date    || null) !== (s.due_date    || null) ||
        (cur.order_index ?? 0)    !== i;
      if (changed) {
        await updateSubtask(s.id, {
          name: s.name,
          is_completed: !!s.is_completed,
          assignee_id: s.assignee_id || null,
          due_date: s.due_date || null,
          order_index: i,
        });
      }
    }
  }
}
