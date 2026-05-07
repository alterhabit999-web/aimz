import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Send,
  Shield,
  Clock,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Badge from '../ui/Badge';
import { C, S } from '../../styles/tokens';
import {
  listInvitations,
  reissueInvitation,
  deleteInvitation,
  invitationStatus,
} from '../../api';

/**
 * InvitationsModal — 発行済み招待リンクの一覧と運用操作。
 *
 * 機能：
 *   - 招待一覧（メール / 状態 / 発行日 / 期限）
 *   - URL のコピー
 *   - mailto: で外部メーラーを起動（本文に招待 URL を埋め込む）
 *   - 再発行（新しいトークンに差し替え、旧 URL を無効化）
 *   - 取消（削除）
 *
 * 招待時に発行された URL は token から再構築する：
 *   `${origin}${PUBLIC_URL}/invitations/${token}`
 */
export default function InvitationsModal({ open, onClose, currentUser }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [reissuingId, setReissuingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 自分が発行した招待か、それ以外を区別
  const myId = currentUser?.id;

  const reload = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listInvitations({ limit: 200 });
      setItems(list);
    } catch (err) {
      console.error(err);
      setError(err?.message || '招待一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => { reload(); }, [reload]);

  const buildUrl = (token) =>
    `${window.location.origin}${process.env.PUBLIC_URL || ''}/invitations/${token}`;

  const handleCopy = async (inv) => {
    try {
      await navigator.clipboard.writeText(buildUrl(inv.token));
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMailto = (inv) => {
    const url = buildUrl(inv.token);
    const subject = encodeURIComponent('AimZ への招待');
    const lines = [
      `${inv.email} 様`,
      '',
      'AimZ にご招待します。下記のリンクからアカウントを作成してください。',
      '',
      url,
      '',
    ];
    if (inv.message) {
      lines.push('--- 招待メッセージ ---');
      lines.push(inv.message);
      lines.push('');
    }
    if (inv.expires_at) {
      lines.push(`有効期限：${new Date(inv.expires_at).toLocaleString('ja-JP')}`);
    }
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${encodeURIComponent(inv.email)}?subject=${subject}&body=${body}`;
  };

  const handleReissue = async (inv) => {
    setReissuingId(inv.id);
    try {
      await reissueInvitation(inv.id, { expiresInDays: 7 });
      await reload();
    } catch (err) {
      console.error(err);
      alert('再発行に失敗しました：' + (err?.message || err));
    } finally {
      setReissuingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvitation(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  // ─── ステータス別グルーピング ───
  const grouped = useMemo(() => {
    const active = [];
    const expired = [];
    const used = [];
    for (const inv of items) {
      const st = invitationStatus(inv);
      if (st === 'active')  active.push(inv);
      else if (st === 'expired') expired.push(inv);
      else if (st === 'used') used.push(inv);
    }
    return { active, expired, used };
  }, [items]);

  return (
    <>
      <Modal
        open={open}
        title="招待履歴"
        onClose={onClose}
        width="720px"
        footer={<Button variant="secondary" onClick={onClose}>閉じる</Button>}
      >
        {error && (
          <div style={{
            padding: S.s, background: C.dangerBg, color: C.danger,
            borderRadius: '6px', fontSize: '0.857rem', marginBottom: S.m,
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: S.l, textAlign: 'center', color: C.textMuted }}>
            読み込み中...
          </div>
        ) : items.length === 0 ? (
          <div style={{
            padding: S.l,
            background: C.surface,
            border: `1px dashed ${C.border}`,
            borderRadius: '6px',
            textAlign: 'center',
            color: C.textMuted,
            fontSize: '0.857rem',
          }}>
            まだ招待を発行していません
          </div>
        ) : (
          <>
            <Section
              title="未使用（送付可能）"
              count={grouped.active.length}
              accent={C.accent}
            >
              {grouped.active.map(inv => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  url={buildUrl(inv.token)}
                  copied={copiedId === inv.id}
                  reissuing={reissuingId === inv.id}
                  myId={myId}
                  onCopy={() => handleCopy(inv)}
                  onMailto={() => handleMailto(inv)}
                  onReissue={() => handleReissue(inv)}
                  onDelete={() => setDeleteTarget(inv)}
                />
              ))}
            </Section>

            {grouped.expired.length > 0 && (
              <Section
                title="期限切れ（要再発行）"
                count={grouped.expired.length}
                accent={C.warning}
              >
                {grouped.expired.map(inv => (
                  <InvitationRow
                    key={inv.id}
                    invitation={inv}
                    url={buildUrl(inv.token)}
                    copied={copiedId === inv.id}
                    reissuing={reissuingId === inv.id}
                    myId={myId}
                    onCopy={() => handleCopy(inv)}
                    onMailto={() => handleMailto(inv)}
                    onReissue={() => handleReissue(inv)}
                    onDelete={() => setDeleteTarget(inv)}
                  />
                ))}
              </Section>
            )}

            {grouped.used.length > 0 && (
              <Section
                title="使用済み"
                count={grouped.used.length}
                accent={C.success}
              >
                {grouped.used.map(inv => (
                  <InvitationRow
                    key={inv.id}
                    invitation={inv}
                    url={buildUrl(inv.token)}
                    copied={copiedId === inv.id}
                    reissuing={reissuingId === inv.id}
                    myId={myId}
                    onCopy={() => handleCopy(inv)}
                    onMailto={() => handleMailto(inv)}
                    onReissue={() => handleReissue(inv)}
                    onDelete={() => setDeleteTarget(inv)}
                    minimal
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="招待を取り消し"
        message={
          deleteTarget && (
            <>
              <strong>{deleteTarget.email}</strong> への招待を取り消します。<br />
              発行済みの URL は無効になります。
            </>
          )
        }
        confirmLabel="取り消す"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ============================================================
// Section（状態別グループ見出し）
// ============================================================
function Section({ title, count, accent, children }) {
  return (
    <div style={{ marginBottom: S.l }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
        marginBottom: S.s,
        paddingBottom: S.xs,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: accent || C.accent,
        }} />
        <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
          {title}
        </span>
        <span style={{ color: C.textMuted, fontSize: '0.75rem', fontWeight: 700 }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: S.xs }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// InvitationRow（1 招待）
// ============================================================
function InvitationRow({
  invitation, url, copied, reissuing, myId,
  onCopy, onMailto, onReissue, onDelete,
  minimal = false,
}) {
  const status = invitationStatus(invitation);
  const isOwn = invitation.invited_by && invitation.invited_by === myId;

  return (
    <div style={{
      padding: S.s,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: S.xs,
    }}>
      {/* 上段：メール + バッジ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
        flexWrap: 'wrap',
      }}>
        <Mail size={14} color={C.textMuted} />
        <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {invitation.email}
        </span>
        {invitation.is_admin && (
          <Badge variant="accent">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <Shield size={10} />管理者
            </span>
          </Badge>
        )}
        {!isOwn && invitation.invited_by && (
          <span style={{ fontSize: '0.7rem', color: C.textMuted }}>他者発行</span>
        )}
      </div>

      {/* 中段：URL（コピー対象） */}
      {!minimal && (
        <div style={{
          fontSize: '0.7rem',
          color: C.textSub,
          fontFamily: 'monospace',
          background: C.bg,
          padding: '4px 8px',
          borderRadius: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} title={url}>
          {url}
        </div>
      )}

      {/* 下段：メタ + アクション */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
        flexWrap: 'wrap',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.7rem',
          color: status === 'expired' ? C.warning : C.textMuted,
        }}>
          <Clock size={10} />
          {invitation.expires_at
            ? `期限：${new Date(invitation.expires_at).toLocaleDateString('ja-JP')}`
            : '期限なし'}
        </span>

        <div style={{ flex: 1 }} />

        {/* アクション */}
        {status === 'active' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              Icon={copied ? Check : Copy}
              onClick={onCopy}
            >
              {copied ? 'コピー済み' : 'コピー'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              Icon={Send}
              onClick={onMailto}
            >
              メール
            </Button>
            <Button
              size="sm"
              variant="secondary"
              Icon={RefreshCw}
              onClick={onReissue}
              disabled={reissuing}
            >
              {reissuing ? '…' : '再発行'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              Icon={Trash2}
              onClick={onDelete}
            >
              取消
            </Button>
          </>
        )}
        {status === 'expired' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              Icon={RefreshCw}
              onClick={onReissue}
              disabled={reissuing}
            >
              {reissuing ? '…' : '再発行'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              Icon={Trash2}
              onClick={onDelete}
            >
              削除
            </Button>
          </>
        )}
        {status === 'used' && (
          <Button
            size="sm"
            variant="danger"
            Icon={Trash2}
            onClick={onDelete}
          >
            削除
          </Button>
        )}
      </div>
    </div>
  );
}
