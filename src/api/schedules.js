/**
 * api/schedules.js — schedules コレクションへのアクセス
 *
 * start_at / end_at は datetime（時刻まで含む）なので、
 * UI 側はローカルタイム文字列（'2026-05-02T10:00:00'）を扱う。
 *   保存時：`new Date(local).toISOString()` で UTC ISO8601 に変換
 *   読み出し：`new Date(iso)` のままで OK（フォーマッタがローカルで getHours する）
 *
 * 参加者は schedule_participants 中間テーブル（別モジュール）で管理する。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.SCHEDULES;

const toIsoDateTime = (s) => {
  if (!s) return null;
  // 既に ISO（Z や ±hh:mm 付き）ならそのまま
  if (typeof s === 'string' && /[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
  return new Date(s).toISOString();
};

const normalize = (doc) => {
  if (!doc) return null;
  return { ...doc, id: doc.$id };
};

/** 全スケジュール一覧（開始時刻昇順） */
export async function listSchedules({ limit = 200 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
    Query.orderAsc('start_at'),
  ]);
  return res.documents.map(normalize);
}

/** 指定案件のスケジュール */
export async function listSchedulesByProject(projectId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.orderAsc('start_at'),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

/** 指定日のスケジュール（YYYY-MM-DD） */
export async function listSchedulesOnDate(dateStr) {
  // その日 00:00 〜 翌日 00:00 の範囲を JST と仮定して問い合わせ
  // （厳密には timezone 設定で扱うべきだが、PHASE 3 の段階ではローカル時刻ベース）
  const startLocal = new Date(`${dateStr}T00:00:00`);
  const endLocal   = new Date(`${dateStr}T00:00:00`);
  endLocal.setDate(endLocal.getDate() + 1);
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.greaterThanEqual('start_at', startLocal.toISOString()),
    Query.lessThan('start_at', endLocal.toISOString()),
    Query.orderAsc('start_at'),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

export async function getSchedule(id) {
  if (!id) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, id);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

export async function createSchedule({
  id, project_id = null, title,
  start_at, end_at,
  location = null, memo = null,
  created_by = null,
}) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      project_id: project_id || null,
      title,
      start_at: toIsoDateTime(start_at),
      end_at:   toIsoDateTime(end_at),
      location: location || null,
      memo:     memo || null,
      created_by: created_by || null,
    }
  );
  return normalize(doc);
}

export async function updateSchedule(id, patch) {
  const cleaned = { ...patch };
  if ('start_at' in cleaned) cleaned.start_at = toIsoDateTime(cleaned.start_at);
  if ('end_at'   in cleaned) cleaned.end_at   = toIsoDateTime(cleaned.end_at);
  delete cleaned.id;
  delete cleaned.$id;
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, cleaned);
  return normalize(doc);
}

/** スケジュール削除（呼び出し側で schedule_participants も削除する） */
export async function deleteSchedule(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}
