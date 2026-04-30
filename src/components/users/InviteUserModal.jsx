import React, { useState } from 'react';
import { Mail, Copy, Check, Shield } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';

/**
 * InviteUserModal — メール招待モーダル（仕様 3-2）。
 *
 * フロー：
 *   1. メールアドレス + 管理者フラグ + 招待メッセージ入力
 *   2. 「招待リンクを発行」 → ダミートークン生成
 *   3. 招待リンクが画面に表示され、コピー可能
 *   4. 完了で閉じる
 */
function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export default function InviteUserModal({ open, onClose, onInvited }) {
  const [step, setStep] = useState('input'); // 'input' | 'done'
  const [email, setEmail]     = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  const [token, setToken]     = useState('');
  const [copied, setCopied]   = useState(false);

  const reset = () => {
    setStep('input');
    setEmail(''); setIsAdmin(false); setMessage('');
    setError('');
    setToken('');
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleInvite = (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) { setError('メールアドレスを入力してください'); return; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setError('メールアドレスの形式が正しくありません'); return; }

    const newToken = genToken();
    setToken(newToken);
    setStep('done');
    onInvited?.({ email: email.trim(), is_admin: isAdmin, message, token: newToken });
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

  return (
    <Modal
      open={open}
      title={step === 'input' ? 'ユーザーを招待' : '招待リンクが発行されました'}
      onClose={handleClose}
      footer={
        step === 'input' ? (
          <>
            <Button variant="secondary" onClick={handleClose}>キャンセル</Button>
            <Button onClick={handleInvite}>招待リンクを発行</Button>
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

          <div style={{
            marginTop: S.m,
            padding: S.s,
            background: C.warningBg,
            border: `1px solid ${C.warning}`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#7a5b00',
          }}>
            ※ ダミー：このリンクはまだ DB に保存されていません。Appwrite 連携時に実招待として動作します。
          </div>
        </div>
      )}
    </Modal>
  );
}
