import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../styles/tokens';

/**
 * RequireAuth — 子ルートを認証必須にするラッパー。
 * 未ログインなら /login にリダイレクト。
 * v21：profiles.is_active === false なら強制ログアウトして /login へ。
 * Admin 専用ルートには requireAdmin を指定。
 */
export default function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  // セッション中に管理者から停止されたユーザーを検出 → 自動ログアウト
  useEffect(() => {
    if (!loading && user && user.is_active === false) {
      logout();
    }
  }, [loading, user, logout]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.textSub,
      }}>
        読み込み中…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.is_active === false) {
    // 上の useEffect が logout 実行中。一瞬待つために何もレンダしない
    return null;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
