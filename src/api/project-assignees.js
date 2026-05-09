/**
 * api/project-assignees.js — project_assignees（案件担当者中間テーブル）
 *
 * 設計（v18 で team_members と同様の方針に統一）：
 *   - documentId は ID.unique() で発行（Appwrite docId は 36 字制限のため、
 *     合成キー `${projectId}__${userId}` だと長 ID 同士で超過するリスクがある）
 *   - 一意性は (project_id, user_id) のクエリで担保
 *   - 旧形式の合成 docId を持つ既存ドキュメントもクエリで発見できるためそのまま動作
 *
 * 提供 API：
 *   - listAll / listByProject / listAssignmentsByUser
 *   - addAssignee / removeAssignee / setAssignees / deleteAllForProject
 */

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.PROJECT_ASSIGNEES;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** project_id + user_id で既存アサインを検索（旧式合成 docId にも対応） */
async function findAssignment(projectId, userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function listAllProjectAssignees({ limit = 1000 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function listByProject(projectId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

export async function listAssignmentsByUser(userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('user_id', userId),
    Query.limit(500),
  ]);
  return res.documents.map(normalize);
}

export async function addAssignee(projectId, userId) {
  const existing = await findAssignment(projectId, userId);
  if (existing) return normalize(existing); // 既存：何もしない
  const doc = await databases.createDocument(DATABASE_ID, COL, ID.unique(), {
    project_id: projectId, user_id: userId,
  });
  return normalize(doc);
}

export async function removeAssignee(projectId, userId) {
  const existing = await findAssignment(projectId, userId);
  if (!existing) return null;
  try {
    return await databases.deleteDocument(DATABASE_ID, COL, existing.$id);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

/**
 * 案件の担当者一覧を一括同期する。
 *   userIds: string[]
 */
export async function setAssignees(projectId, userIds) {
  const desired = new Set(userIds);
  const existing = await listByProject(projectId);

  for (const a of existing) {
    if (!desired.has(a.user_id)) {
      await removeAssignee(projectId, a.user_id);
    }
  }
  const existingSet = new Set(existing.map(a => a.user_id));
  for (const uid of desired) {
    if (!existingSet.has(uid)) {
      await addAssignee(projectId, uid);
    }
  }
}

/** 案件削除時に呼ぶ：配下の project_assignees を全削除 */
export async function deleteAllForProject(projectId) {
  const list = await listByProject(projectId);
  for (const a of list) {
    await removeAssignee(projectId, a.user_id);
  }
}
