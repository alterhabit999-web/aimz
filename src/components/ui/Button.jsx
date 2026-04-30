import React from 'react';
import { C, S } from '../../styles/tokens';

/**
 * Button — 共通ボタン。
 *
 * variant:
 *   'primary'    塗り（アクセント）
 *   'secondary'  枠線
 *   'danger'     塗り（赤）
 *   'ghost'      背景なし
 *
 * size: 'sm' | 'md'
 */
const VARIANT_STYLES = {
  primary: {
    background: C.accent,
    color: '#ffffff',
    border: `1px solid ${C.accent}`,
  },
  secondary: {
    background: 'transparent',
    color: C.accent,
    border: `1px solid ${C.accent}`,
  },
  danger: {
    background: C.danger,
    color: '#ffffff',
    border: `1px solid ${C.danger}`,
  },
  ghost: {
    background: 'transparent',
    color: C.textSub,
    border: '1px solid transparent',
  },
};

const SIZE_STYLES = {
  sm: { padding: '4px 10px', fontSize: '0.857rem' },
  md: { padding: '8px 16px', fontSize: '1rem' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  Icon,
  children,
  disabled,
  style,
  ...props
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S.xs,
        borderRadius: '6px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, background 0.15s',
        ...v,
        ...s,
        ...style,
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />}
      {children}
    </button>
  );
}
