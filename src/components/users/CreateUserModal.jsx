import React, { useState } from 'react';
import { Shield, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { ID } from 'appwrite';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';
import { account } from '../../appwrite';
import { createProfile } from '../../api';

/**
 * CreateUserModal — 管理者が直接ユーザーアカウントを作成するモーダル（v19）。
 *
 * 旧 InviteUserModal の置き換え：トークン発行 → 招待リンク → ユーザーが踏んでアカウント作成
 * という従来フローは「The current user is not authorized to perform the requested action」
 * 系のエラーが運用環境で頻発したため廃止。
 *
 * 新フロー：
 *   1. 管理者がモーダルから氏名・メール・パスワード（自動生成可）・管理者フラグを入力
 *   2. account.create() で Appwrite Auth ユーザーを作成
 *   3. createProfile() で profiles レコードも作成
 *   4. 完了画面で初期パスワードを表示。管理者がコピーして本人に共有
 *
 * 注意：
 *   - account.create() は現在ログイン中の管理者のセッションを切り替えない（別ユーザー作成のみ）
 *   - profile レコード作成は profiles コレクションの Role.users() Create 権限で動作
 */

/** 12 字のランダムパスワード生成（英大小・数字・記号を最低 1 つずつ） */
function generatePassword() {
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower  = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

export default function CreateUserModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState('input'); // 'input' | 'done'
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [isAdmin, setIsAdmin]   = useState(false);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const reset = () => {
    setStep('input');
    setFullName('');
    setEmail('');
    setPassword(generatePassword());
    setIsAdmin(false);
    setError('');
    setSubmitting(false);
    setCopiedField(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('氏名を入力してください'); return; }
    if (!email.trim())    { setError('メールアドレスを入力してください'); return; }
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!okEmail) { setError('メールアドレスの形式が正しくありません'); return; }
    if (!password || password.length < 8) {
      setError('パスワードは 8 文字以上にしてください'); return;
    }

    setSubmitting(true);
    try {
      // 1) Appwrite Auth ユーザーを作成
      //    Web SDK の account.create() は現在のセッションを切り替えない（別ユーザー作成）
      const userId = ID.unique();
      const newAuthUser = await account.create(
        userId, email.trim(), password, fullName.trim()
      );

      // 2) profiles レコードを作成（管理者の users() 権限で作成可能）
      await createProfile({
        userId: newAuthUser.$id,
        full_name: fullName.trim(),
        email: email.trim(),
        is_admin: isAdmin,
      });

      setStep('done');
      onCreated?.({
        id: newAuthUser.$id,
        full_name: fullName.trim(),
        email: email.trim(),
        is_admin: isAdmin,
      });
    } catch (err) {
      console.error(err);
      let msg = err?.message || 'アカウント作成に失敗しました';
      if (/already exists|user_already_exists/i.test(msg)) {
        msg = 'このメールアドレスは既に登録されています';
      } else if (/password.*weak|weak.*password/i.test(msg)) {
        msg = 'パスワードが弱すぎます。別の文字列を試してください';
      }
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleCopy = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleCopyBoth = async () => {
    const text = `AimZ ログイン情報\n\nメール: ${email.trim()}\nパスワード: ${password}\nログイン URL: ${window.location.origin}${process.env.PUBLIC_URL || ''}/login`;
    await handleCopy('both', text);
  };

  return (
    <Modal
      open={open}
      title={step === 'input' ? 'ユーザーを作成' : 'ユーザーを作成しました'}
      onClose={handleClose}
      footer={
        step === 'input' ? (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '作成中…' : 'アカウントを作成'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>完了</Button>
        )
      }
    >
      {step === 'input' ? (
        <form onSubmit={handleSubmit}>
          <FormField label="氏名" required>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="山田 太郎"
              style={inputStyle}
              autoFocus
            />
          </FormField>

          <FormField label="メールアドレス" required>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@company.com"
              style={inputStyle}
            />
          </FormField>

          <FormField label="初期パスワード" required hint="本人に共有後、本人にマイページで変更してもらってください">
            <div style={{ display: 'flex', gap: S.xs }}>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
              <Button
                type="button"
                size="md"
                variant="secondary"
                Icon={RefreshCw}
                onClick={() => setPassword(generatePassword())}
                title="再生成"
              >
                再生成
              </Button>
            </div>
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
                管理者として作成する
              </span>
            </label>
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
            <AlertCircle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              作成後、初期パスワードが画面に表示されます。本人に共有してください
              （メールでの自動送信は未対応）。本人はマイページからパスワード変更可能です。
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
            <strong>{fullName}</strong>（{email}）のアカウントを作成しました。<br />
            以下のログイン情報を本人にお伝えください。
          </p>

          {/* メール表示 */}
          <CredentialRow
            label="メールアドレス"
            value={email}
            copied={copiedField === 'email'}
            onCopy={() => handleCopy('email', email)}
          />
          <CredentialRow
            label="初期パスワード"
            value={password}
            copied={copiedField === 'password'}
            onCopy={() => handleCopy('password', password)}
            mono
          />

          <div style={{ marginTop: S.s }}>
            <Button
              size="sm"
              variant="secondary"
              Icon={copiedField === 'both' ? Check : Copy}
              onClick={handleCopyBoth}
            >
              {copiedField === 'both' ? 'コピー済み' : 'ログイン情報をまとめてコピー'}
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
            display: 'flex',
            gap: S.xs,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              初期パスワードはこの画面でしか確認できません。閉じる前に必ず控えてください。
              本人はログイン後にマイページからパスワード変更できます。
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CredentialRow({ label, value, copied, onCopy, mono }) {
  return (
    <div style={{ marginBottom: S.xs }}>
      <div style={{ fontSize: '0.75rem', color: C.textSub, fontWeight: 700, marginBottom: '2px' }}>
        {label}
      </div>
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
          fontSize: '0.857rem',
          color: C.text,
          fontFamily: mono ? 'monospace' : 'inherit',
          overflow: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {value}
        </code>
        <Button size="sm" variant="secondary" Icon={copied ? Check : Copy} onClick={onCopy}>
          {copied ? '済' : 'コピー'}
        </Button>
      </div>
    </div>
  );
}
