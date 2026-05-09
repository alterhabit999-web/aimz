/**
 * api/team-members.js — team_members（チームメンバー中間テーブル）へのアクセス
 *
 * 設計：
 *   - documentId は ID.unique() で発行（Appwrite docId は 36 文字制限のため、
 *     合成キーだと Appwrite Auth の userId × teamId の組合せで上限を超える）
 *   - 一意性は (team_id, user_id) のクエリで担保
 *   - role は 'leader' | 'member'
 *
 * 提供 API：
 *   - listAll() / listByTeam / listByUser
 *   - addMember / removeMember / updateRole
 *   - setTeamMembers(teamId, members)：メンバー編成を差分で同期
 *   - deleteAllForTeam(teamId)：チーム削除時に呼ぶ
 */

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.TEAM_MEMBERS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** team_id + user_id で既存メンバーシップを検索（旧式合成キー時代の docId にも対応） */
async function findMembership(teamId, userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('team_id', teamId),
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/** 全 team_members を取得（メンバーシップ全体を派生させるダッシュボード等で使う） */
export async function listAllTeamMembers({ limit = 500 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function listByTeam(teamId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('team_id', teamId),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

export async function listMembershipsByUser(userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('user_id', userId),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

/** メンバー追加（既存なら role を上書き） */
export async function addMember(teamId, userId, role = 'member') {
  const existing = await findMembership(teamId, userId);
  if (existing) {
    if (existing.role === role) return normalize(existing);
    const doc = await databases.updateDocument(DATABASE_ID, COL, existing.$id, { role });
    return normalize(doc);
  }
  const doc = await databases.createDocument(DATABASE_ID, COL, ID.unique(), {
    team_id: teamId, user_id: userId, role,
  });
  return normalize(doc);
}

export async function removeMember(teamId, userId) {
  const existing = await findMembership(teamId, userId);
  if (!existing) return null;
  try {
    return await databases.deleteDocument(DATABASE_ID, COL, existing.$id);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

export async function updateRole(teamId, userId, role) {
  const existing = await findMembership(teamId, userId);
  if (!existing) return null;
  const doc = await databases.updateDocument(DATABASE_ID, COL, existing.$id, { role });
  return normalize(doc);
}

/**
 * チームのメンバー編成を一括同期する。
 *   members: [{ user_id, role }]
 * 既存の編成と差分を取り、追加・更新・削除を行う。
 */
export async function setTeamMembers(teamId, members) {
  const desired = new Map(members.map(m => [m.user_id, m.role]));
  const existing = await listByTeam(teamId);

  // 削除
  for (const m of existing) {
    if (!desired.has(m.user_id)) {
      await removeMember(teamId, m.user_id);
    }
  }
  // 追加 or role 更新
  for (const [userId, role] of desired) {
    const cur = existing.find(m => m.user_id === userId);
    if (!cur) {
      await addMember(teamId, userId, role);
    } else if (cur.role !== role) {
      await updateRole(teamId, userId, role);
    }
  }
}

/** チーム削除時に呼ぶ：配下の team_members を全削除 */
export async function deleteAllForTeam(teamId) {
  const list = await listByTeam(teamId);
  for (const m of list) {
    await removeMember(teamId, m.user_id);
  }
}

/**
 * ユーザーの所属（team_members）を一括同期する。
 *   userId: 対象ユーザー
 *   memberships: [{ team_id, role: 'leader' | 'member' }]
 * 既存の編成と差分を取り、追加・更新・削除を行う。
 */
export async function setUserMemberships(userId, memberships) {
  const desired = new Map(memberships.map(m => [m.team_id, m.role]));
  const existing = await listMembershipsByUser(userId);

  // 削除：入力に無いもの
  for (const m of existing) {
    if (!desired.has(m.team_id)) {
      await removeMember(m.team_id, userId);
    }
  }
  // 追加 or role 更新
  for (const [teamId, role] of desired) {
    const cur = existing.find(m => m.team_id === teamId);
    if (!cur) {
      await addMember(teamId, userId, role);
    } else if (cur.role !== role) {
      await updateRole(teamId, userId, role);
    }
  }
}
