import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Edit2, Trash2, Check, X } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { textareaStyle } from '../../ui/FormField';
import { formatTimeAgo } from '../../../utils/format';
import {
  listCommentsByProject,
  createComment,
  updateComment,
  deleteComment,
  listProfiles,
} from '../../../api';
import useReloadOnFocus from '../../../hooks/useReloadOnFocus';

/**
 * CommentsTab — 案件詳細の「コメント」タブ（v17 新規）。
 *
 * - コメントは時系列順に表示（古い順）
 * - 投稿は authenticated ユーザーなら誰でも可
 * - 編集 / 削除は投稿者本人 or 管理者のみ
 */
export default function CommentsTab({ project }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [profiles, setProfiles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [body, setBody]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody]   = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([
        listCommentsByProject(project.id),
        listProfiles({ limit: 200 }),
      ]);
      setComments(c);
      setProfiles(p);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const handlePost = async (e) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text || !user?.id) return;
    setSubmitting(true);
    try {
      await createComment({
        project_id: project.id,
        user_id: user.id,
        body: text,
      });
      setBody('');
      await reload();
    } catch (err) {
      console.error(err);
      alert('コメント投稿に失敗しました：' + (err?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditBody(c.body);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };
  const saveEdit = async () => {
    const text = editBody.trim();
    if (!text) return;
    try {
      await updateComment(editingId, { body: text });
      cancelEdit();
      await reload();
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました：' + (err?.message || ''));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteComment(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || ''));
    }
  };

  const canModify = (comment) => {
    if (!user) return false;
    return user.is_admin || comment.user_id === user.id;
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        marginBottom: S.m,
      }}>
        <MessageSquare size={16} color={C.accent} />
        <span style={{ color: C.textSub, fontSize: '0.857rem' }}>
          {loading ? '読み込み中…' : `${comments.length} 件のコメント`}
        </span>
      </div>

      {error && (
        <div style={{
          padding: S.s,
          background: C.dangerBg,
          color: C.danger,
          borderRadius: '6px',
          fontSize: '0.857rem',
          marginBottom: S.m,
        }}>
          {error}
          <div style={{ marginTop: S.s }}>
            <Button size="sm" variant="secondary" onClick={reload}>再試行</Button>
          </div>
        </div>
      )}

      {/* コメント一覧 */}
      {!loading && comments.length === 0 && !error && (
        <div style={{
          padding: S.xl,
          textAlign: 'center',
          color: C.textMuted,
          background: C.surface,
          border: `1px dashed ${C.border}`,
          borderRadius: '8px',
          marginBottom: S.m,
        }}>
          まだコメントがありません。最初のコメントを投稿しましょう。
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: S.s, marginBottom: S.l }}>
        {comments.map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            author={profileById.get(c.user_id)}
            isMine={c.user_id === user?.id}
            canModify={canModify(c)}
            isEditing={editingId === c.id}
            editBody={editBody}
            onEditBodyChange={setEditBody}
            onStartEdit={() => startEdit(c)}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onRequestDelete={() => setDeleteTarget(c)}
          />
        ))}
      </div>

      {/* 投稿フォーム */}
      <CommentComposer
        body={body}
        onChange={setBody}
        onSubmit={handlePost}
        submitting={submitting}
        currentUser={user}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="コメントの削除"
        message="このコメントを削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ============================================================
// コメント 1 件
// ============================================================
function CommentItem({
  comment, author, isMine, canModify,
  isEditing, editBody, onEditBodyChange,
  onStartEdit, onCancelEdit, onSaveEdit, onRequestDelete,
}) {
  return (
    <div style={{
      display: 'flex',
      gap: S.s,
      padding: S.m,
      background: isMine ? C.bg : C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
    }}>
      <Avatar name={author?.full_name || '?'} src={author?.avatar_url} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: S.xs,
          marginBottom: S.xs,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
            {author?.full_name || '不明なユーザー'}
          </span>
          <span style={{ fontSize: '0.75rem', color: C.textMuted }}>
            {formatTimeAgo(comment.created_at)}
          </span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span style={{ fontSize: '0.7rem', color: C.textMuted, fontStyle: 'italic' }}>
              （編集済み）
            </span>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={editBody}
              onChange={e => onEditBodyChange(e.target.value)}
              rows={3}
              style={{ ...textareaStyle, fontSize: '0.857rem' }}
            />
            <div style={{ display: 'flex', gap: S.xs, marginTop: S.xs }}>
              <Button size="sm" Icon={Check} onClick={onSaveEdit}>保存</Button>
              <Button size="sm" variant="secondary" Icon={X} onClick={onCancelEdit}>キャンセル</Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: '0.857rem',
              color: C.text,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {comment.body}
            </div>
            {canModify && (
              <div style={{ display: 'flex', gap: S.xs, marginTop: S.xs }}>
                <Button size="sm" variant="ghost" Icon={Edit2} onClick={onStartEdit}>
                  編集
                </Button>
                <Button size="sm" variant="ghost" Icon={Trash2} onClick={onRequestDelete} style={{ color: C.danger }}>
                  削除
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 投稿フォーム
// ============================================================
function CommentComposer({ body, onChange, onSubmit, submitting, currentUser }) {
  const textareaRef = useRef(null);
  return (
    <form onSubmit={onSubmit} style={{
      padding: S.m,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', gap: S.s, alignItems: 'flex-start' }}>
        <Avatar name={currentUser?.full_name} src={currentUser?.avatar_url} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => onChange(e.target.value)}
            placeholder="この案件にコメント…"
            rows={3}
            disabled={submitting}
            style={textareaStyle}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: S.xs,
            gap: S.s,
          }}>
            <span style={{ fontSize: '0.7rem', color: C.textMuted }}>
              ⌘ / Ctrl + Enter で投稿
            </span>
            <Button
              type="submit"
              size="sm"
              Icon={Send}
              disabled={!body.trim() || submitting}
            >
              {submitting ? '送信中…' : '投稿'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
