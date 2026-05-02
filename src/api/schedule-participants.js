/**
 * api/schedule-participants.js — schedule_participants 中間テーブル
 *
 * 設計：
 *   - documentId は `${schedule_id}__${user_id}` 形式（"_" 衝突回避で "__"）
 *   - team-members / project-assignees と同じパターン
 */

import { Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.SCHEDULE_PARTICIPANTS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

const docIdOf = (scheduleId, userId) => `${scheduleId}__${userId}`;

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
  const id = docIdOf(scheduleId, userId);
  try {
    const doc = await databases.createDocument(DATABASE_ID, COL, id, {
      schedule_id: scheduleId, user_id: userId,
    });
    return normalize(doc);
  } catch (err) {
    if (err?.code === 409) return null;
    throw err;
  }
}

export async function removeParticipant(scheduleId, userId) {
  const id = docIdOf(scheduleId, userId);
  try {
    return await databases.deleteDocument(DATABASE_ID, COL, id);
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
