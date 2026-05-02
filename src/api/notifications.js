/**
 * api/notifications.js — notifications コレクション
 *
 * 通知は Appwrite が自動付与する `$createdAt` をそのまま `created_at` として正規化。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.NOTIFICATIONS;

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    // UI 互換のため $createdAt を created_at にも置く
    created_at: doc.$createdAt,
  };
};

/** 自分の通知一覧（新しい順） */
export async function listNotificationsForUser(userId, { limit = 100 } = {}) {
  if (!userId) return [];
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('user_id', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function createNotification({
  user_id, type, title, body = null,
  related_type = null, related_id = null,
}) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, ID.unique(),
    {
      user_id, type, title,
      body: body || null,
      related_type: related_type || null,
      related_id: related_id || null,
      is_read: false,
    }
  );
  return normalize(doc);
}

export async function markNotificationRead(id, isRead = true) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, { is_read: isRead });
  return normalize(doc);
}

export async function markAllNotificationsRead(userId) {
  const list = await listNotificationsForUser(userId, { limit: 200 });
  const unread = list.filter(n => !n.is_read);
  for (const n of unread) {
    await markNotificationRead(n.id, true);
  }
  return unread.length;
}

export async function deleteNotification(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}
