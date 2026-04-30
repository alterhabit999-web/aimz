import React from 'react';
import { Construction } from 'lucide-react';
import { C, S } from '../../styles/tokens';

/**
 * PlaceholderPage — 未実装ページの仮表示。
 * UI 実装が進むごとに本物のページに差し替えていく。
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: S.l }}>
        {title}
      </h1>

      <div style={{
        padding: S.xl,
        background: C.surface,
        borderRadius: '8px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow1,
        textAlign: 'center',
      }}>
        <Construction size={48} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.m }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: C.text, marginBottom: S.s }}>
          このページは準備中です
        </h2>
        {description && (
          <p style={{ color: C.textSub, fontSize: '0.857rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
