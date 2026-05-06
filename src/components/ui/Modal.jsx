import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { C, S, ICON_MD } from '../../styles/tokens';
import useIsCompact from '../../hooks/useIsCompact';

/**
 * Modal — 中央表示のダイアログ。
 * 開閉アニメーションは控えめ。Esc キーで閉じる。バックドロップクリックでも閉じる。
 *
 * Props:
 *   open: boolean          開く/閉じる
 *   title: string          タイトル
 *   onClose: () => void    閉じる時のコールバック
 *   width: string          幅（デフォルト 480px）
 *   footer: ReactNode      フッター（ボタン群など）
 *   children: ReactNode    本文
 */
export default function Modal({ open, title, onClose, width = '520px', footer, children }) {
  const dialogRef = useRef(null);
  const isCompact = useIsCompact();

  // Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // body のスクロールロック
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(35, 34, 30, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: isCompact ? `${S.m} ${S.s}` : `${S.xl} ${S.l}`,
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          width: '100%',
          // 画面幅を超えないように常に内側に収める
          maxWidth: `min(${width}, calc(100vw - ${isCompact ? '16px' : '32px'}))`,
          background: C.surface,
          borderRadius: '8px',
          boxShadow: C.shadow2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: isCompact ? `${S.s} ${S.m}` : `${S.m} ${S.l}`,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: S.s,
          flexShrink: 0,
        }}>
          <h2 id="modal-title" style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            fontWeight: 700,
            color: C.text,
            margin: 0,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: S.xs,
              borderRadius: '4px',
              color: C.textSub,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={ICON_MD} />
          </button>
        </div>

        {/* 本文（スクロール領域） */}
        <div style={{
          padding: isCompact ? S.m : S.l,
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>

        {/* フッター */}
        {footer && (
          <div style={{
            padding: isCompact ? `${S.s} ${S.m}` : `${S.m} ${S.l}`,
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: S.s,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
