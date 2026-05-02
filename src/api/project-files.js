/**
 * api/project-files.js — project_files コレクション + Appwrite Storage 連携
 *
 * 設計：
 *   - 実体ファイルは Appwrite Storage（bucket）にアップロード
 *   - メタ情報（file_name / file_id / file_size / mime_type / uploaded_by）を
 *     project_files コレクションに保存
 *   - 削除時は両方を消す
 *
 * 仕様（v1.4 セクション 3-7）：PNG / JPG / PDF / Word / Excel、最大 50MB。
 */

import { ID, Query } from 'appwrite';
import { databases, storage, DATABASE_ID, STORAGE_BUCKET_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.PROJECT_FILES;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    created_at: doc.$createdAt,
  };
};

/** 案件のファイル一覧（新しい順） */
export async function listFilesByProject(projectId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.orderDesc('$createdAt'),
    Query.limit(200),
  ]);
  return res.documents.map(normalize);
}

/**
 * ファイルアップロード：
 *   1. Storage に upload（fileId 自動生成）
 *   2. project_files にメタ情報を登録
 */
export async function uploadProjectFile(projectId, file, uploadedBy = null) {
  if (!file) throw new Error('ファイルが選択されていません');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('ファイルサイズが上限（50MB）を超えています');
  }

  const fileId = ID.unique();
  // Storage に upload（クライアント SDK では permissions 引数省略でデフォルト権限）
  const stored = await storage.createFile(STORAGE_BUCKET_ID, fileId, file);

  // メタ情報を DB に
  const doc = await databases.createDocument(
    DATABASE_ID, COL, ID.unique(),
    {
      project_id: projectId,
      file_name: file.name,
      file_id: stored.$id,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: uploadedBy || null,
    }
  );
  return normalize(doc);
}

/** 削除：DB レコード + Storage の実体を両方消す */
export async function deleteProjectFile(metaId, fileId) {
  // Storage 側を先に消す（見えないファイルが残るのを避ける）
  if (fileId) {
    try {
      await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
    } catch (err) {
      // 既に消えている場合は無視
      if (err?.code !== 404) console.warn('storage.deleteFile:', err?.message);
    }
  }
  return databases.deleteDocument(DATABASE_ID, COL, metaId);
}

/** 案件削除時のカスケード：配下のファイルを全削除 */
export async function deleteAllFilesForProject(projectId) {
  const list = await listFilesByProject(projectId);
  for (const f of list) {
    await deleteProjectFile(f.id, f.file_id);
  }
}

/** 表示用 URL（インラインプレビューや画像表示） */
export function getFileViewUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileView(STORAGE_BUCKET_ID, fileId);
}

/** ダウンロード用 URL */
export function getFileDownloadUrl(fileId) {
  if (!fileId) return null;
  return storage.getFileDownload(STORAGE_BUCKET_ID, fileId);
}
