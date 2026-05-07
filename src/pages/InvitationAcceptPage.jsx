import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ID } from 'appwrite';
import { BarChart2, AlertCircle, CheckCircle2, Mail, Shield } from 'lucide-react';
import { C, S } from '../styles/tokens';
import Button from '../components/ui/Button';
import { account } from '../appwrite';
import {
  getInvitationByToken,
  markInvitationUsed,
  createProfile,
} from '../api';
import { useAuth } from '../contexts/AuthContext';

/**
 * InvitationAcceptPage — 招待リンク `/invitations/:token` の処理ページ。
 *
 * フロー：
 *   1. token をクエリ → invitations から検証（存在 / is_used / expires_at）
 *   2. 氏名・パスワード入力フォームを表示（メールは invitation 由来で固定）
 *   3. submit：
 *        a. account.create(ID.unique(), email, password, full_name)
 *        b. account.createEmailPasswordSession で自動ログイン（先に！）
 *        c. createProfile({ userId: 同じ id, full_name, email, is_admin }) ← ログイン後
 *        d. markInvitationUsed(invitation.id) ← ログイン後
 *        e. AuthContext を refresh してプロフィール反映
 *        f. ダッシュボードへ
 *
 * ※ b 〜 d の順序が重要：profiles / invitations の create/update は Role.users()
 *    なので、未ログイン状態では弾かれる。account.create で Auth ユーザーを作った直後に
 *    まず login してセッションを確立し、その後に profiles 作成・招待消化を行う。
 *    invitations の read だけは Role.any() で公開（トークン検証用、PHASE 4 例外）。
 *
 * このページは RequireAuth の外側で公開する（未ログイン状態でもアクセス可能）。
 */
export default function InvitationAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, refresh } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loadError, setLoadError]   = useState('');
  const [loading, setLoading]       = useState(true);

  const [fullName, setFullName]     = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // トークン検証
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const inv = await getInvitationByToken(token);
        if (cancelled) return;
        if (!inv) {
          setLoadError('この招待リンクは無効です。URL をご確認ください。');
          return;
        }
        if (inv.is_used) {
          setLoadError('この招待リンクは既に使用されています。');
          return;
        }
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
          setLoadError('この招待リンクは有効期限が切れています。管理者に再発行を依頼してください。');
          return;
        }
        setInvitation(inv);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(err?.message || '招待情報の取得に失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!fullName.trim()) { setSubmitError('氏名を入力してください'); return; }
    if (!password)        { setSubmitError('パスワードを入力してください'); return; }
    if (password.length < 8) { setSubmitError('パスワードは 8 文字以上にしてください'); return; }
    if (password !== confirmPwd) { setSubmitError('パスワードと確認用が一致しません'); return; }

    setSubmitting(true);
    try {
      // a. Appwrite Auth ユーザー作成（カスタム ID）
      const userId = ID.unique();
      await account.create(userId, invitation.email, password, fullName.trim());

      // b. 自動ログイン（先にセッションを確立）
      //    AuthContext.login は内部で getProfile を呼ぶが、まだ profile が無いので
      //    Auth の name/email にフォールバックする（問題なし）
      await login(invitation.email, password);

      // c. profiles に同じ ID で登録（ログイン後なので Role.users() の create が通る）
      await createProfile({
        userId,
        full_name: fullName.trim(),
        email: invitation.email,
        is_admin: !!invitation.is_admin,
      });

      // d. 招待を消化済みに（ログイン後）
      try {
        await markInvitationUsed(invitation.id);
      } catch (err) {
        // 消化記録に失敗しても致命的ではないのでログだけ
        console.warn('markInvitationUsed:', err?.message);
      }

      // e. AuthContext を再取得してプロフィール内容（is_admin 含む）を反映
      try { await refresh(); } catch (_) {}

      // f. ダッシュボードへ
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      // よくあるエラーメッセージを日本語化
      let msg = err?.message || 'アカウント作成に失敗しました';
      if (/already exists|email|already/i.test(msg)) {
        msg = 'このメールアドレスは既に登録されています。ログイン画面からログインしてください。';
      } else if (/password.*8|short/i.test(msg)) {
        msg = 'パスワードは 8 文字以上にしてください';
      } else if (/session is active|prohibited/i.test(msg)) {
        msg = '既にログイン中です。ログアウトしてから再度お試しください。';
      }
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  // ─── レイアウト共通 ───
  const wrap = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: C.bg,
    padding: S.l,
  };
  const card = {
    width: '100%',
    maxWidth: '440px',
    background: C.surface,
    borderRadius: '8px',
    border: `1px solid ${C.border}`,
    boxShadow: C.shadow2,
    padding: S.xl,
  };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={card}>
          <Logo />
          <p style={{ textAlign: 'center', color: C.textMuted, fontSize: '0.857rem' }}>
            招待情報を確認しています…
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={wrap}>
        <div style={card}>
          <Logo />
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: S.s,
            padding: S.m,
            background: C.dangerBg,
            color: C.danger,
            borderRadius: '6px',
            fontSize: '0.857rem',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{loadError}</span>
          </div>
          <div style={{ marginTop: S.l, textAlign: 'center' }}>
            <Link to="/login" style={{ color: C.textLink, fontSize: '0.857rem' }}>
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <Logo />

        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: C.text,
          textAlign: 'center',
          margin: `0 0 ${S.s}`,
        }}>
          AimZ へようこそ
        </h2>
        <p style={{
          color: C.textSub,
          fontSize: '0.857rem',
          textAlign: 'center',
          marginBottom: S.l,
        }}>
          招待を受け取りました。アカウントを作成しましょう。
        </p>

        {/* 招待情報 */}
        <div style={{
          padding: S.s,
          background: C.bg,
          borderRadius: '6px',
          marginBottom: S.l,
          fontSize: '0.857rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, color: C.textSub }}>
            <Mail size={14} />
            <span style={{ color: C.text, fontWeight: 700 }}>{invitation.email}</span>
          </div>
          {invitation.is_admin && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: S.xs,
              padding: '2px 8px',
              borderRadius: '4px',
              background: C.accentLight,
              color: C.accent,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              <Shield size={12} />
              管理者として招待されています
            </div>
          )}
          {invitation.message && (
            <div style={{
              marginTop: S.s,
              paddingTop: S.s,
              borderTop: `1px solid ${C.border}`,
              fontSize: '0.857rem',
              color: C.textSub,
              whiteSpace: 'pre-wrap',
            }}>
              {invitation.message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          <div>
            <label style={labelStyle}>氏名</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="山田 太郎"
              required
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>パスワード（8 文字以上）</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>パスワード（確認）</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={inputStyle}
            />
          </div>

          {submitError && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: S.xs,
              padding: S.s,
              background: C.dangerBg,
              color: C.danger,
              borderRadius: '6px',
              fontSize: '0.857rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{submitError}</span>
            </div>
          )}

          <Button type="submit" disabled={submitting} style={{ width: '100%', marginTop: S.xs }}>
            {submitting ? (
              <span>アカウント作成中…</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} />
                アカウントを作成してログイン
              </span>
            )}
          </Button>
        </form>

        <div style={{ marginTop: S.l, textAlign: 'center' }}>
          <Link to="/login" style={{ color: C.textLink, fontSize: '0.75rem' }}>
            既にアカウントをお持ちの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: S.s,
      marginBottom: S.l,
    }}>
      <BarChart2 size={28} color={C.accent} strokeWidth={2.5} />
      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>AimZ</span>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.857rem',
  fontWeight: 700,
  color: C.text,
  marginBottom: S.xs,
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: '6px',
  fontSize: '1rem',
  color: C.text,
  background: C.surface,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
