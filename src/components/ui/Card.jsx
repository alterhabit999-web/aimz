import React from 'react';
import { C, S, ICON_SM } from '../../styles/tokens';

/**
 * Card — 角丸・薄シャドウのコンテナ。
 * 見出し（title）とアイコン（Icon）はオプション。
 */
export default function Card({ title, Icon, action, children, style }) {
  return (
    <div style={{
      background: C.surface,
      borderRadius: '8px',
      border: `1px solid ${C.border}`,
      boxShadow: C.shadow1,
      padding: S.l,
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: S.m,
        }}>
          {title && (
            <h2 style={{
              fontSize: '0.857rem',
              fontWeight: 700,
              color: C.text,
              display: 'flex',
              alignItems: 'center',
              gap: S.xs,
              margin: 0,
            }}>
              {Icon && <Icon size={ICON_SM} color={C.accent} strokeWidth={2} />}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
