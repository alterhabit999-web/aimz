import React from 'react';
import { C, S } from '../../styles/tokens';

/**
 * SectionLabel — サイドバーやセクションの小見出し。
 * 大文字・トラッキング広め。
 */
export default function SectionLabel({ children, style }) {
  return (
    <div style={{
      color: C.textMuted,
      fontSize: '0.667rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      padding: `${S.s} ${S.s}`,
      textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </div>
  );
}
