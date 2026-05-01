/**
 * api/teams.js — teams コレクションへのアクセス
 *
 * teams は単純な CRUD。team_members（中間テーブル）の操作は team-members.js 側で扱う。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.TEAMS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** チーム一覧（部署 → 名前順） */
export async function listTeams({ limit = 200 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
    Query.orderAsc('name'),
  ]);
  return res.documents.map(normalize);
}

export async function listTeamsByDepartment(departmentId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('department_id', departmentId),
    Query.orderAsc('name'),
  ]);
  return res.documents.map(normalize);
}

export async function getTeam(id) {
  if (!id) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, id);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

export async function createTeam({ id, department_id, name, description = null, created_by = null }) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      department_id,
      name,
      description: description || null,
      created_by: created_by || null,
    }
  );
  return normalize(doc);
}

export async function updateTeam(id, patch) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, patch);
  return normalize(doc);
}

/** チーム削除（呼び出し側で配下の team_members も削除すること） */
export async function deleteTeam(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}
