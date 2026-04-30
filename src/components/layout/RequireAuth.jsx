import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../styles/tokens';

/**
 * RequireAuth — 子ルートを認証必須にするラッパー。
 * 未ログインなら /login にリダイレクト。
 * Admin 専用ルートには requireAdmin を指定。
 */
export default function RequireAuth({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
