/**
 * api/avatars.js — プロフィール画像（アバター）アップロード関連
 *
 * - Appwrite Free プランの Bucket 上限のため、現状は AVATAR_BUCKET_ID =
 *   STORAGE_BUCKET_ID として案件ファイル用 Bucket を共用する（v15）。
 * - 将来 avatars 専用 Bucket に分けても、この層の interface は変えない。
 *
 * 制約：
 *   - 最大 5 MB（クライアント側で強制）
 *   - 許可形式：image/png / image/jpeg（既存 Bucket は webp 不許可のため除外）
 *
 * 提供 API：
 *   - uploadAvatar(file)         → URL（フル URL 文字列）
 *   - deleteAvatarByUrl(url)     → URL に含まれる fileId で削除（Storage 由来のときのみ）
 *   - isStorageAvatar(url)       → Storage 由来の URL かどうか判定
 */

import { ID } from 'appwrite';
import { storage, AVATAR_BUCKET_ID } from '../appwrite';

export const AVATAR_MAX_BYTES = 5_000_000;
export const AVATAR_ACCEPT = ['image/png', 'image/jpeg'];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];

/** 拡張子バリデーション（ファイル名のドット以降を見る） */
function getExtension(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

/** クライアント側のサイズ + 形式バリデーション */
function validateFile(file) {
  if (!file) throw new Error('ファイルが選択されていません');
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error(`ファイルサイズは ${(AVATAR_MAX_BYTES / 1_000_000).toFixed(0)} MB 以下にしてください`);
  }
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('許可されている形式は PNG / JPG / JPEG です');
  }
}

/**
 * アバター画像をアップロードして、表示用の URL を返す。
 * file: File オブジェクト
 * 戻り値：保存可能な URL（profiles.avatar_url にそのまま入れる）
 */
export async function uploadAvatar(file) {
  validateFile(file);
  const fileId = ID.unique();
  await storage.createFile(AVATAR_BUCKET_ID, fileId, file);
  // 表示用 URL を取得
  // appwrite v16 SDK では getFileView は string を返すが、URL オブジェクトの環境もある
  const view = storage.getFileView(AVATAR_BUCKET_ID, fileId);
  return typeof view === 'string' ? view : view.toString();
}

/** Storage 由来の URL からファイル ID を抽出する（取れなければ null） */
export function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;
  // 想定パターン例：
  //   https://sgp.cloud.appwrite.io/v1/storage/buckets/<bucket>/files/<fileId>/view?...
  const m = /\/storage\/buckets\/([^/]+)\/files\/([^/?#]+)/.exec(url);
  if (!m) return null;
  return { bucketId: m[1], fileId: m[2] };
}

/** Storage 由来のアバター URL かどうか */
export function isStorageAvatar(url) {
  const info = extractFileId(url);
  return !!info && info.bucketId === AVATAR_BUCKET_ID;
}

/**
 * URL に紐づく Storage ファイルを削除する。
 * Storage 由来でなければ何もしない。
 */
export async function deleteAvatarByUrl(url) {
  const info = extractFileId(url);
  if (!info) return; // 外部 URL 等：触らない
  if (info.bucketId !== AVATAR_BUCKET_ID) return; // 別 Bucket の URL：誤削除防止
  try {
    await storage.deleteFile(info.bucketId, info.fileId);
  } catch (err) {
    // 既に消えている等は無視
    if (err?.code !== 404) {
      console.warn('deleteAvatarByUrl:', err?.message);
    }
  }
}
