import React from 'react';
import { C, S } from '../../styles/tokens';

/**
 * FormField — ラベル + 入力欄のセット。
 *
 * 子要素として <input> / <select> / <textarea> を渡す。
 * required を立てるとラベルに「*」が付く。
 */
export default function FormField({ label, required, hint, error, children }) {
  return (
    <div style={{ marginBottom: S.m }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '0.857rem',
          fontWeight: 700,
          color: C.text,
          marginBottom: S.xs,
        }}>
          {label}
          {required && (
            <span style={{ color: C.danger, marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '4px' }}>
          {hint}
        </div>
      )}
      {error && (
        <div style={{ fontSize: '0.75rem', color: C.danger, marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 入力欄の共通スタイル
// ============================================================
export const inputStyle = {
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

export const textareaStyle = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23706d65' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: '32px',
};
