/**
 * api/schedule-participants.js — schedule_participants 中間テーブル
 *
 * 設計（v18 で team_members / project_assignees と同様の方針に統一）：
 *   - documentId は ID.unique() で発行（Appwrite docId は 36 字制限）
 *   - 一意性は (schedule_id, user_id) のクエリで担保
 *   - 旧形式の合成 docId を持つ既存ドキュメントもクエリで発見できるためそのまま動作
 */

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.SCHEDULE_PARTICIPANTS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

async function findParticipant(scheduleId, userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('schedule_id', scheduleId),
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function listAllScheduleParticipants({ limit = 1000 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function listParticipantsBySchedule(scheduleId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('schedule_id', scheduleId),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

export async function listSchedulesByUser(userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('user_id', userId),
    Query.limit(500),
  ]);
  return res.documents.map(normalize);
}

export async function addParticipant(scheduleId, userId) {
  const existing = await findParticipant(scheduleId, userId);
  if (existing) return normalize(existing);
  const doc = await databases.createDocument(DATABASE_ID, COL, ID.unique(), {
    schedule_id: scheduleId, user_id: userId,
  });
  return normalize(doc);
}

export async function removeParticipant(scheduleId, userId) {
  const existing = await findParticipant(scheduleId, userId);
  if (!existing) return null;
  try {
    return await databases.deleteDocument(DATABASE_ID, COL, existing.$id);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

/** スケジュールの参加者一覧を一括同期 */
export async function setParticipants(scheduleId, userIds) {
  const desired = new Set(userIds);
  const existing = await listParticipantsBySchedule(scheduleId);
  for (const p of existing) {
    if (!desired.has(p.user_id)) await removeParticipant(scheduleId, p.user_id);
  }
  const existingSet = new Set(existing.map(p => p.user_id));
  for (const uid of desired) {
    if (!existingSet.has(uid)) await addParticipant(scheduleId, uid);
  }
}

/** スケジュール削除時のカスケード */
export async function deleteAllParticipantsForSchedule(scheduleId) {
  const list = await listParticipantsBySchedule(scheduleId);
  for (const p of list) {
    await removeParticipant(scheduleId, p.user_id);
  }
}
