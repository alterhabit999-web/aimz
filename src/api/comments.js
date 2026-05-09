/**
 * api/comments.js — comments（案件コメント）コレクション（v17）
 *
 * 案件詳細のコメントタブで使う。
 * 投稿時刻・更新時刻は Appwrite の $createdAt / $updatedAt をそのまま使う。
 *
 * 提供 API：
 *   - listCommentsByProject(projectId)
 *   - createComment({ project_id, user_id, body })
 *   - updateComment(id, { body })
 *   - deleteComment(id)
 *   - deleteAllCommentsForProject(projectId)  ← 案件削除時のカスケード用
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.COMMENTS;

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    created_at: doc.$createdAt,
    updated_at: doc.$updatedAt,
  };
};

export async function listCommentsByProject(projectId, { limit = 200 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.orderAsc('$createdAt'),
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function createComment({ project_id, user_id, body }) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, ID.unique(),
    { project_id, user_id, body },
  );
  return normalize(doc);
}

export async function updateComment(id, { body }) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, { body });
  return normalize(doc);
}

export async function deleteComment(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}

/** 案件削除時のカスケード */
export async function deleteAllCommentsForProject(projectId) {
  const list = await listCommentsByProject(projectId, { limit: 500 });
  for (const c of list) {
    try { await deleteComment(c.id); } catch (_) {}
  }
}
