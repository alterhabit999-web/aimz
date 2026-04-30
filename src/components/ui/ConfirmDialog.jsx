import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { C, S } from '../../styles/tokens';

/**
 * ConfirmDialog — 削除等の確認ダイアログ。
 *
 * Props:
 *   open: boolean
 *   title: string
 *   message: string | ReactNode
 *   confirmLabel: string         確認ボタンの文言（デフォルト「削除する」）
 *   cancelLabel: string          キャンセルボタンの文言
 *   variant: 'danger' | 'primary'  確認ボタンの色
 *   onConfirm: () => void
 *   onClose: () => void
 */
export default function ConfirmDialog({
  open,
  title = '確認',
  message,
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  variant = 'danger',
  onConfirm,
  onClose,
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      width="420px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant} onClick={handleConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div style={{
        display: 'flex',
        gap: S.m,
        alignItems: 'flex-start',
      }}>
        <div style={{
          flexShrink: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: variant === 'danger' ? C.dangerBg : C.accentLight,
          color: variant === 'danger' ? C.danger : C.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AlertTriangle size={20} />
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <div style={{
            color: C.text,
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            {message}
          </div>
        </div>
      </div>
    </Modal>
  );
}
