import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';

/**
 * DepartmentFormModal — 部署の作成・編集。
 *
 * Props:
 *   open: boolean
 *   mode: 'create' | 'edit'
 *   initial: 既存部署データ（edit 時のみ）
 *   onSubmit: (data) => void
 *   onClose: () => void
 */
export default function DepartmentFormModal({ open, mode = 'create', initial, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setDescription(initial?.description || '');
    setError('');
  }, [open, initial]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('部署名を入力してください');
      return;
    }
    onSubmit?.({
      ...(isEdit ? { id: initial.id } : {}),
      name: name.trim(),
      description: description.trim(),
    });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '部署を編集' : '部署を作成'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSubmit}>{isEdit ? '保存する' : '作成する'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField label="部署名" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：営業部"
            style={inputStyle}
            autoFocus
          />
        </FormField>

        <FormField label="説明" hint="部署の役割・概要など">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例：営業活動全般を担当"
            style={textareaStyle}
            rows={3}
          />
        </FormField>

        {error && (
          <div style={{
            padding: S.s,
            background: C.dangerBg,
            color: C.danger,
            borderRadius: '6px',
            fontSize: '0.857rem',
            marginTop: S.s,
          }}>
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
