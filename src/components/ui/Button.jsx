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
 *
 * iconOnly: true でアイコンのみ表示（tooltip = title prop または children）
 *   → 業務アプリで狭いウィンドウ時に操作ボタンをコンパクト化するために使う。
 *      title 属性が無い場合は children のテキストを自動で title に。
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

// iconOnly モード時の正方形寸法
const ICON_ONLY_SIZE = {
  sm: { padding: '6px', fontSize: '0.857rem', width: '32px', height: '30px' },
  md: { padding: '8px', fontSize: '1rem',     width: '38px', height: '36px' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  Icon,
  iconOnly = false,
  children,
  disabled,
  style,
  title,
  ...props
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const s = iconOnly
    ? (ICON_ONLY_SIZE[size] || ICON_ONLY_SIZE.md)
    : (SIZE_STYLES[size] || SIZE_STYLES.md);

  // iconOnly 時は children を tooltip にフォールバック
  const resolvedTitle = title
    || (iconOnly && typeof children === 'string' ? children : undefined);

  return (
    <button
      disabled={disabled}
      title={resolvedTitle}
      aria-label={iconOnly && typeof children === 'string' ? children : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconOnly ? 0 : S.xs,
        borderRadius: '6px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, background 0.15s',
        flexShrink: 0,
        ...v,
        ...s,
        ...style,
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />}
      {!iconOnly && children}
    </button>
  );
}
