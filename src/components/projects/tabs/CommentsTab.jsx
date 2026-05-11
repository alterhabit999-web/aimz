import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Edit2, Trash2, Check, X } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { formatTimeAgo } from '../../../utils/format';
import {
  listCommentsByProject,
  createComment,
  updateComment,
  deleteComment,
  listProfiles,
  createNotification,
} from '../../../api';
import useReloadOnFocus from '../../../hooks/useReloadOnFocus';
import MentionTextarea, { extractMentionedIds, renderMentionTokens } from './MentionTextarea';

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
      // メンション通知：本文中の @<full_name> を抽出して該当ユーザーに通知
      try {
        const mentionedIds = extractMentionedIds(text, profiles)
          .filter(id => id !== user.id);  // 自分宛は通知しない
        const author = profiles.find(p => p.id === user.id);
        const authorName = author?.full_name || user.full_name || '誰か';
        const projectName = project.name || '案件';
        const snippet = text.length > 80 ? text.slice(0, 80) + '…' : text;
        await Promise.all(
          mentionedIds.map(uid =>
            createNotification({
              user_id: uid,
              type: 'mention',
              title: `${authorName} があなたをコメントでメンションしました`,
              body: `[${projectName}] ${snippet}`,
              related_type: 'project',
              related_id: project.id,
            }).catch(err => console.warn('[mention] 通知作成失敗', uid, err?.message))
          )
        );
      } catch (err) {
        console.warn('[mention] 通知処理スキップ:', err?.message);
      }
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
      // 編集前の本文と比較し、新たに増えたメンションのみ通知
      const original = comments.find(c => c.id === editingId);
      const before = new Set(extractMentionedIds(original?.body || '', profiles));
      const afterIds = extractMentionedIds(text, profiles)
        .filter(id => id !== user.id && !before.has(id));

      await updateComment(editingId, { body: text });

      if (afterIds.length > 0) {
        const author = profiles.find(p => p.id === user.id);
        const authorName = author?.full_name || user.full_name || '誰か';
        const projectName = project.name || '案件';
        const snippet = text.length > 80 ? text.slice(0, 80) + '…' : text;
        await Promise.all(
          afterIds.map(uid =>
            createNotification({
              user_id: uid,
              type: 'mention',
              title: `${authorName} があなたをコメントでメンションしました`,
              body: `[${projectName}] ${snippet}`,
              related_type: 'project',
              related_id: project.id,
            }).catch(err => console.warn('[mention] 通知作成失敗', uid, err?.message))
          )
        );
      }
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
            profilesForEdit={profiles}
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
        profiles={profiles}
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
  profilesForEdit = [],
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
            <MentionTextarea
              value={editBody}
              onChange={(v) => onEditBodyChange(v)}
              profiles={profilesForEdit}
              rows={3}
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
              <CommentBody body={comment.body} profiles={profilesForEdit} />
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
// 投稿フォーム（v19：MentionTextarea で @ サジェスト対応）
// ============================================================
function CommentComposer({ body, onChange, onSubmit, submitting, currentUser, profiles = [] }) {
  const textareaRef = useRef(null);
  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit(e);
    }
  };
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
          <MentionTextarea
            textareaRef={textareaRef}
            value={body}
            onChange={(v) => onChange(v)}
            profiles={profiles}
            placeholder="この案件にコメント… （@ でメンション）"
            rows={3}
            disabled={submitting}
            onKeyDown={handleKeyDown}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: S.xs,
            gap: S.s,
          }}>
            <span style={{ fontSize: '0.7rem', color: C.textMuted }}>
              @ でメンション・⌘ / Ctrl + Enter で投稿
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

// ============================================================
// コメント本文：@<full_name> をハイライト表示
// ============================================================
function CommentBody({ body, profiles }) {
  const tokens = renderMentionTokens(body, profiles);
  if (tokens.length === 0) return <>{body}</>;
  return (
    <>
      {tokens.map((t, i) => {
        if (t.type === 'mention') {
          return (
            <span
              key={i}
              title={t.profile.email || t.profile.full_name}
              style={{
                display: 'inline-block',
                padding: '0 4px',
                margin: '0 1px',
                borderRadius: '3px',
                background: C.accentLight,
                color: C.accent,
                fontWeight: 700,
              }}
            >
              {t.text}
            </span>
          );
        }
        return <React.Fragment key={i}>{t.text}</React.Fragment>;
      })}
    </>
  );
}
