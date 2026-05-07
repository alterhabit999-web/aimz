/**
 * api/invitations.js — invitations コレクション
 *
 * 招待は管理者がメールアドレス + 管理者フラグ + メッセージを入力して発行する。
 * トークンは クライアント側で生成（PHASE 4 で実 Appwrite Auth と統合する）。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.INVITATIONS;

const normalize = (doc) => doc ? { ...doc, id: doc.$id } : null;

/** ランダムなトークン（64 文字以下、英数字） */
export function generateInviteToken() {
  const part = () => Math.random().toString(36).slice(2, 12);
  return `${part()}${part()}${part()}${part()}`.slice(0, 48);
}

export async function listInvitations({ limit = 100 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);
  return res.documents.map(normalize);
}

export async function getInvitationByToken(token) {
  if (!token) return null;
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('token', token),
    Query.limit(1),
  ]);
  return res.documents[0] ? normalize(res.documents[0]) : null;
}

/** 招待を発行（既存 email を上書き：再招待で token を作り直す） */
export async function createInvitation({
  email, is_admin = false, message = null,
  invited_by = null, expires_at,
}) {
  const token = generateInviteToken();

  // 既存の同 email があれば削除
  try {
    const existing = await databases.listDocuments(DATABASE_ID, COL, [
      Query.equal('email', email),
      Query.limit(1),
    ]);
    if (existing.documents[0]) {
      await databases.deleteDocument(DATABASE_ID, COL, existing.documents[0].$id);
    }
  } catch (_) { /* ignore */ }

  const doc = await databases.createDocument(
    DATABASE_ID, COL, ID.unique(),
    {
      email,
      token,
      is_admin: !!is_admin,
      message: message || null,
      invited_by: invited_by || null,
      is_used: false,
      expires_at: expires_at instanceof Date ? expires_at.toISOString() : expires_at,
    }
  );
  return normalize(doc);
}

export async function markInvitationUsed(id) {
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, { is_used: true });
  return normalize(doc);
}

export async function deleteInvitation(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}

/**
 * 招待を再発行する：トークンと有効期限を新しくする。
 * 既存招待のメタ（is_admin / message / invited_by）は引き継ぐ。
 *   旧 token は破棄され、旧 URL は無効になる。
 */
export async function reissueInvitation(id, { expiresInDays = 7 } = {}) {
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, {
    token: generateInviteToken(),
    is_used: false,
    expires_at: expires.toISOString(),
  });
  return normalize(doc);
}

/** 状態判定（未使用 / 使用済み / 期限切れ） */
export function invitationStatus(invitation) {
  if (!invitation) return 'unknown';
  if (invitation.is_used) return 'used';
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return 'expired';
  }
  return 'active';
}
