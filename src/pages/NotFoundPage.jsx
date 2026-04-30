import React from 'react';
import { Link } from 'react-router-dom';
import { C, S } from '../styles/tokens';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 700, color: C.textMuted, margin: 0 }}>404</h1>
      <p style={{ color: C.textSub, marginTop: S.s, marginBottom: S.l }}>
        ページが見つかりませんでした
      </p>
      <Link
        to="/dashboard"
        style={{
          padding: '8px 16px',
          background: C.accent,
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.857rem',
        }}
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  );
}
