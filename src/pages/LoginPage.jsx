import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BarChart2, AlertCircle } from 'lucide-react';
import { C, S } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

/**
 * LoginPage — メール + パスワードでログイン（Appwrite Auth）。
 */
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 既にログイン済みなら元の場所へ
  if (user) {
    const to = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={to} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // メッセージを日本語化
      let msg = err?.message || 'ログインに失敗しました';
      if (err?.code === 'account_inactive') {
        msg = 'このアカウントは停止されています。管理者にお問い合わせください。';
      } else if (/invalid credentials|wrong/i.test(msg)) {
        msg = 'メールアドレスまたはパスワードが正しくありません';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.bg,
      padding: S.l,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: C.surface,
        borderRadius: '8px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow2,
        padding: S.xl,
      }}>
        {/* ロゴ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: S.s,
          marginBottom: S.xs,
        }}>
          <BarChart2 size={28} color={C.accent} strokeWidth={2.5} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>AimZ</span>
        </div>
        <p style={{
          color: C.textSub,
          fontSize: '0.857rem',
          textAlign: 'center',
          marginBottom: S.xl,
        }}>
          案件・タスク管理
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          <div>
            <label style={labelStyle}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={submitting} style={{ width: '100%', marginTop: S.xs }}>
            {submitting ? 'ログイン中…' : 'ログイン'}
          </Button>
        </form>

        <p style={{
          color: C.textMuted,
          fontSize: '0.75rem',
          textAlign: 'center',
          marginTop: S.l,
        }}>
          アカウントは管理者が作成します。ログイン情報が分からない場合は管理者にお問い合わせください。
        </p>
      </div>
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
