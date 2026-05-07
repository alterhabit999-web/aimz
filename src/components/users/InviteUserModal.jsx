import React, { useState } from 'react';
import { Mail, Copy, Check, Shield, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { createInvitation } from '../../api';

/**
 * InviteUserModal — メール招待モーダル（仕様 3-2）。
 *
 * フロー（PHASE 3 で実 DB 化）：
 *   1. メールアドレス + 管理者フラグ + 招待メッセージ入力
 *   2. 「招待リンクを発行」 → invitations コレクションにトークン保存（有効期限 7 日）
 *   3. 招待リンクが画面に表示され、コピー可能
 *   4. 完了で閉じる
 *
 * 実際の招待メール送信・トークン消化（アカウント作成）は PHASE 4 で実装。
 */
export default function InviteUserModal({ open, onClose, onInvited }) {
  const { user } = useAuth();
  const [step, setStep] = useState('input'); // 'input' | 'done'
  const [email, setEmail]     = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [token, setToken]     = useState('');
  const [copied, setCopied]   = useState(false);

  const reset = () => {
    setStep('input');
    setEmail(''); setIsAdmin(false); setMessage('');
    setError('');
    setToken('');
    setCopied(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleInvite = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) { setError('メールアドレスを入力してください'); return; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setError('メールアドレスの形式が正しくありません'); return; }

    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 日後に失効

      const created = await createInvitation({
        email: email.trim(),
        is_admin: isAdmin,
        message: message.trim() || null,
        invited_by: user?.id || null,
        expires_at: expiresAt,
      });
      setToken(created.token);
      setStep('done');
      onInvited?.({
        id: created.id,
        email: created.email,
        is_admin: created.is_admin,
        message: created.message,
        token: created.token,
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || '招待の発行に失敗しました');
      setSubmitting(false);
    }
  };

  const inviteUrl = `${window.location.origin}${process.env.PUBLIC_URL || ''}/invitations/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 古いブラウザのフォールバック等は割愛
    }
  };

  const handleMailto = () => {
    const subject = encodeURIComponent('AimZ への招待');
    const lines = [
      `${email} 様`,
      '',
      'AimZ にご招待します。下記のリンクからアカウントを作成してください。',
      '',
      inviteUrl,
      '',
    ];
    if (message?.trim()) {
      lines.push('--- 招待メッセージ ---');
      lines.push(message.trim());
      lines.push('');
    }
    lines.push('有効期限：発行から 7 日');
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  };

  return (
    <Modal
      open={open}
      title={step === 'input' ? 'ユーザーを招待' : '招待リンクが発行されました'}
      onClose={handleClose}
      footer={
        step === 'input' ? (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>キャンセル</Button>
            <Button onClick={handleInvite} disabled={submitting}>
              {submitting ? '発行中…' : '招待リンクを発行'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>完了</Button>
        )
      }
    >
      {step === 'input' ? (
        <form onSubmit={handleInvite}>
          <FormField label="メールアドレス" required>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@company.com"
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label="権限">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: S.s,
              padding: S.s,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              background: isAdmin ? C.accentLight : C.surface,
            }}>
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={e => setIsAdmin(e.target.checked)}
                style={{ accentColor: C.accent }}
              />
              <Shield size={14} color={isAdmin ? C.accent : C.textMuted} />
              <span style={{ fontSize: '0.857rem', color: C.text }}>
                管理者として招待する
              </span>
            </label>
          </FormField>

          <FormField label="招待メッセージ" hint="招待メールに添えるメッセージ（任意）">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="一緒に働きましょう"
              rows={3}
              style={{
                ...inputStyle,
                minHeight: '70px',
                resize: 'vertical',
              }}
            />
          </FormField>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: S.xs,
            padding: S.s,
            background: C.bg,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: C.textMuted,
          }}>
            <Mail size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              現在は招待リンクのみ発行します。実際のメール送信は Appwrite Functions 連携時に実装します。
            </span>
          </div>

          {error && (
            <div style={{
              padding: S.s,
              background: C.dangerBg,
              color: C.danger,
              borderRadius: '6px',
              fontSize: '0.857rem',
              marginTop: S.s,
            }}>
              {error}
            </div>
          )}
        </form>
      ) : (
        <div>
          <p style={{ color: C.text, fontSize: '0.95rem', margin: `0 0 ${S.m}` }}>
            <strong>{email}</strong> 宛の招待リンクを発行しました。<br />
            このリンクをコピーしてメール等で送ってください。
          </p>

          <div style={{
            padding: S.s,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: S.s,
          }}>
            <code style={{
              flex: 1,
              fontSize: '0.75rem',
              color: C.textSub,
              fontFamily: 'monospace',
              overflow: 'auto',
              whiteSpace: 'nowrap',
            }}>
              {inviteUrl}
            </code>
            <Button size="sm" variant="secondary" Icon={copied ? Check : Copy} onClick={handleCopy}>
              {copied ? 'コピー済み' : 'コピー'}
            </Button>
          </div>

          {/* メーラー起動 */}
          <div style={{ marginTop: S.s, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" Icon={Send} onClick={handleMailto}>
              メーラーで招待を送る
            </Button>
          </div>

          <div style={{
            marginTop: S.m,
            padding: S.s,
            background: C.warningBg,
            border: `1px solid ${C.warning}`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#7a5b00',
          }}>
            ※ トークンは invitations コレクションに保存されました（有効期限 7 日）。
            メール送信とアカウント作成フローは PHASE 4（認証本実装）で対応します。
          </div>
        </div>
      )}
    </Modal>
  );
}
