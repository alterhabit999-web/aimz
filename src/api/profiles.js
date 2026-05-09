/**
 * api/profiles.js — profiles コレクションへのアクセス
 *
 * profiles のドキュメント ID は Appwrite Auth の userId と同一にする運用。
 * （= ログイン直後の user.$id でそのまま getDocument できる）
 *
 * UI 側は `id` プロパティを参照するコードが多いので、
 * 戻り値は `{ ...doc, id: doc.$id }` に正規化してから返す。
 */

import { Query } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.PROFILES;

/** Appwrite document → UI 用に正規化（$id を id に） */
const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** 自分のプロフィールを取得（無ければ null） */
export async function getProfile(userId) {
  if (!userId) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, userId);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

/** プロフィールを作成（招待→アカウント作成時に呼ぶ） */
export async function createProfile({ userId, full_name, email, is_admin = false, avatar_url = null }) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, userId,
    {
      full_name,
      email: email || null,
      avatar_url,
      is_admin,
      is_active: true,
    }
  );
  return normalize(doc);
}

/** プロフィール更新（マイページから） */
export async function updateProfile(userId, patch) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, userId, patch);
  return normalize(doc);
}

/** 全プロフィール一覧（管理画面・チームメンバー選択肢用） */
export async function listProfiles({ limit = 100, search } = {}) {
  const queries = [Query.limit(limit), Query.orderAsc('full_name')];
  if (search) queries.push(Query.search('full_name', search));
  const res = await databases.listDocuments(DATABASE_ID, COL, queries);
  return res.documents.map(normalize);
}

/** 1ユーザー停止 / 復帰 */
export async function setProfileActive(userId, isActive) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, userId, { is_active: isActive });
  return normalize(doc);
}

/** 管理者フラグ変更 */
export async function setProfileAdmin(userId, isAdmin) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, userId, { is_admin: isAdmin });
  return normalize(doc);
}

/** プロフィール削除（招待取り消し等） */
export async function deleteProfile(userId) {
  return databases.deleteDocument(DATABASE_ID, COL, userId);
}
