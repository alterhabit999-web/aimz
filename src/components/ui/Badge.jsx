import React from 'react';
import { C } from '../../styles/tokens';

/**
 * Badge — ステータス・優先度などを示す小さなバッジ。
 *
 * variant:
 *   'default' | 'success' | 'warning' | 'danger' | 'orange' | 'accent'
 */
const VARIANT_COLORS = {
  default: { bg: C.bgSub,      fg: C.textSub },
  success: { bg: C.successBg,  fg: C.success },
  warning: { bg: C.warningBg,  fg: '#a17e00' },
  danger:  { bg: C.dangerBg,   fg: C.danger },
  orange:  { bg: C.orangeBg,   fg: C.orange },
  accent:  { bg: C.accentLight, fg: C.accent },
};

export default function Badge({ variant = 'default', children, style }) {
  const v = VARIANT_COLORS[variant] || VARIANT_COLORS.default;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 700,
      background: v.bg,
      color: v.fg,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  );
}

// ステータス → variant のマッピング（仕様書のステータス値）
export const statusVariant = (status) => {
  switch (status) {
    case '完了':   return 'success';
    case '進行中': return 'accent';
    case '保留':   return 'warning';
    case '未着手':
    default:       return 'default';
  }
};

// 優先度 → variant のマッピング
export const priorityVariant = (priority) => {
  switch (priority) {
    case '高': return 'danger';
    case '中': return 'orange';
    case '低': return 'default';
    default:   return 'default';
  }
};
