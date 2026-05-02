/**
 * api/project-assignees.js — project_assignees（案件担当者中間テーブル）
 *
 * 設計：
 *   - documentId は `${project_id}__${user_id}` 形式（"_" 1 つだとユーザーIDが
 *     アンダースコアを含む可能性があるため "__" で区切る）。
 *   - team_members と同じパターン：addAssignee / removeAssignee / setAssignees / deleteAllForProject
 */

import { Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.PROJECT_ASSIGNEES;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

const docIdOf = (projectId, userId) => `${projectId}__${userId}`;

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
  const id = docIdOf(projectId, userId);
  try {
    const doc = await databases.createDocument(DATABASE_ID, COL, id, {
      project_id: projectId, user_id: userId,
    });
    return normalize(doc);
  } catch (err) {
    if (err?.code === 409) return null; // 既存：何もしない
    throw err;
  }
}

export async function removeAssignee(projectId, userId) {
  const id = docIdOf(projectId, userId);
  try {
    return await databases.deleteDocument(DATABASE_ID, COL, id);
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
