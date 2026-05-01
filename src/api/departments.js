/**
 * api/departments.js — departments コレクションへのアクセス
 *
 * 戻り値は UI 互換のため `$id` を `id` に正規化して返す。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.DEPARTMENTS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** 部署一覧（名前順） */
export async function listDepartments({ limit = 100 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
    Query.orderAsc('name'),
  ]);
  return res.documents.map(normalize);
}

/** 1 部署取得 */
export async function getDepartment(id) {
  if (!id) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, id);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

/** 部署作成（id 任意：未指定なら Appwrite が自動採番） */
export async function createDepartment({ id, name, description = null, created_by = null }) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      name,
      description: description || null,
      created_by: created_by || null,
    }
  );
  return normalize(doc);
}

/** 部署更新 */
export async function updateDepartment(id, patch) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, patch);
  return normalize(doc);
}

/** 部署削除 */
export async function deleteDepartment(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}
