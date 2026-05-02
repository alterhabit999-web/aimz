import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud, FileText, Download, Trash2, FileImage, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../ui/Button';
import ConfirmDialog from '../../ui/ConfirmDialog';
import {
  listFilesByProject,
  uploadProjectFile,
  deleteProjectFile,
  getFileDownloadUrl,
  listProfiles,
  listAllTeamMembers,
  MAX_FILE_SIZE,
} from '../../../api';
import { formatTimeAgo } from '../../../utils/format';

/**
 * FilesTab — 案件詳細「ファイル」タブ（PHASE 3 で実装）。
 *
 * - ドラッグ&ドロップ or クリックでアップロード
 * - PNG / JPG / PDF / Word / Excel を許可、50MB 上限
 * - リスト表示（ファイル名・サイズ・アップロード者・日時）
 * - ダウンロード / 削除（アップロード本人 or admin）
 */

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

function getExt(filename) {
  const m = /\.([^.]+)$/.exec(filename || '');
  return m ? m[1].toLowerCase() : '';
}

function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileTypeIcon({ ext }) {
  if (['png', 'jpg', 'jpeg'].includes(ext)) return <FileImage size={20} color={C.accent} />;
  if (['xls', 'xlsx'].includes(ext))        return <FileSpreadsheet size={20} color={C.success} />;
  if (['doc', 'docx'].includes(ext))        return <FileText size={20} color={'#1e64c8'} />;
  if (ext === 'pdf')                        return <FileText size={20} color={C.danger} />;
  return <FileIcon size={20} color={C.textMuted} />;
}

export default function FilesTab({ project }) {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [files, setFiles]           = useState([]);
  const [profiles, setProfiles]     = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 権限：admin or 案件チームメンバー（アップロード可）
  const canUpload = useMemo(() => {
    if (!user) return false;
    if (user.is_admin) return true;
    return teamMembers.some(m => m.user_id === user.id && m.team_id === project.team_id);
  }, [user, teamMembers, project.team_id]);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, prof, tm] = await Promise.all([
        listFilesByProject(project.id),
        listProfiles({ limit: 200 }),
        listAllTeamMembers(),
      ]);
      setFiles(list);
      setProfiles(prof);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'ファイル一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { reload(); }, [reload]);

  // ─── アップロード処理（共通） ───
  const handleUpload = async (file) => {
    setUploadError('');
    if (!file) return;
    const ext = getExt(file.name);
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`許可されていない拡張子です（.${ext}）。PNG / JPG / PDF / Word / Excel のみ。`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`ファイルサイズが上限（50MB）を超えています。`);
      return;
    }
    setUploading(true);
    try {
      await uploadProjectFile(project.id, file, user?.id || null);
      await reload();
    } catch (err) {
      console.error(err);
      setUploadError(err?.message || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (e.target) e.target.value = ''; // 同じファイルを再選択できるようリセット
  };

  // ─── ドラッグ&ドロップ ───
  const onDragOver = (e) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ─── 削除 ───
  const requestDelete = (file) => {
    setDeleteTarget(file);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProjectFile(deleteTarget.id, deleteTarget.file_id);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  // 削除権限：アップロード本人 or admin
  const canDelete = (file) => {
    if (user?.is_admin) return true;
    return file.uploaded_by && file.uploaded_by === user?.id;
  };

  return (
    <div>
      {/* ドロップゾーン */}
      {canUpload && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            background: dragActive ? C.accentLight : C.surface,
            border: `2px dashed ${dragActive ? C.accent : C.border}`,
            borderRadius: '8px',
            padding: S.xxl,
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <UploadCloud
            size={36}
            color={dragActive ? C.accent : C.textMuted}
            strokeWidth={1.5}
          />
          <h3 style={{
            color: C.text, fontSize: '1rem', fontWeight: 700,
            margin: `${S.s} 0 ${S.xs}`,
          }}>
            {uploading ? 'アップロード中…' : 'ここにファイルをドロップ または クリックで選択'}
          </h3>
          <p style={{ color: C.textSub, fontSize: '0.857rem', margin: 0 }}>
            PNG / JPG / PDF / Word / Excel（最大 50MB）
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXTS.map(e => '.' + e).join(',')}
            onChange={onPickFile}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {uploadError && (
        <div style={{
          marginTop: S.s,
          padding: S.s,
          background: C.dangerBg,
          color: C.danger,
          borderRadius: '6px',
          fontSize: '0.857rem',
        }}>
          {uploadError}
        </div>
      )}

      {/* ファイル一覧 */}
      <div style={{ marginTop: S.l }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: S.s,
        }}>
          <div style={{ color: C.textSub, fontSize: '0.857rem' }}>
            {loading ? '読み込み中…' : `${files.length} 件のファイル`}
          </div>
        </div>

        {error ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.danger }}>
            {error}
            <div style={{ marginTop: S.s }}>
              <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
            読み込み中...
          </div>
        ) : files.length === 0 ? (
          <div style={{
            padding: S.xl,
            background: C.surface,
            border: `1px dashed ${C.border}`,
            borderRadius: '8px',
            textAlign: 'center',
            color: C.textMuted,
            fontSize: '0.857rem',
          }}>
            まだファイルはアップロードされていません
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
            {files.map(f => (
              <FileRow
                key={f.id}
                file={f}
                uploader={f.uploaded_by ? profileById.get(f.uploaded_by) : null}
                canDelete={canDelete(f)}
                onDelete={() => requestDelete(f)}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="ファイルの削除"
        message={
          deleteTarget && (
            <>
              ファイル「<strong>{deleteTarget.file_name}</strong>」を削除します。<br />
              この操作は取り消せません。
            </>
          )
        }
        confirmLabel="削除する"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function FileRow({ file, uploader, canDelete, onDelete }) {
  const ext = getExt(file.file_name);
  const downloadUrl = getFileDownloadUrl(file.file_id);

  return (
    <li style={{
      display: 'flex',
      alignItems: 'center',
      gap: S.m,
      padding: S.s,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
    }}>
      <div style={{ flexShrink: 0 }}>
        <FileTypeIcon ext={ext} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.857rem',
          fontWeight: 700,
          color: C.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {file.file_name}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          marginTop: '2px',
          fontSize: '0.75rem',
          color: C.textMuted,
        }}>
          <span>{formatSize(file.file_size)}</span>
          {uploader && <span>· {uploader.full_name}</span>}
          <span>· {formatTimeAgo(file.created_at)}</span>
        </div>
      </div>

      <div style={{ display: 'inline-flex', gap: S.xs, flexShrink: 0 }}>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="ダウンロード"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            color: C.accent,
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentLight}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Download size={12} />
          ダウンロード
        </a>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="削除"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: C.danger,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  );
}
