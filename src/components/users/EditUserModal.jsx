import React, { useEffect, useState } from 'react';
import { Shield, UserX, UserCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';

/**
 * EditUserModal — ユーザーの権限・有効状態を編集。
 * チームへの追加除外は別画面（/teams からのリーダー操作）に委任する想定。
 */
export default function EditUserModal({ open, user, onClose, onSubmit }) {
  const [fullName, setFullName] = useState('');
  const [isAdmin, setIsAdmin]   = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.full_name || '');
    setIsAdmin(!!user.is_admin);
    setIsActive(user.is_active !== false);
  }, [open, user]);

  if (!user) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSubmit?.({
      id: user.id,
      full_name: fullName.trim() || user.full_name,
      is_admin: isAdmin,
      is_active: isActive,
    });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      title="ユーザーを編集"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSubmit}>保存する</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{
          padding: S.s,
          background: C.bg,
          borderRadius: '6px',
          fontSize: '0.857rem',
          color: C.textSub,
          marginBottom: S.m,
        }}>
          <span style={{ color: C.textMuted, fontSize: '0.75rem' }}>メールアドレス：</span>
          <span style={{ color: C.text, fontWeight: 700 }}>{user.email}</span>
        </div>

        <FormField label="氏名" required>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={inputStyle}
          />
        </FormField>

        <FormField label="権限">
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.s,
            padding: S.s,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            background: isAdmin ? C.accentLight : C.surface,
          }}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              style={{ accentColor: C.accent }}
            />
            <Shield size={14} color={isAdmin ? C.accent : C.textMuted} />
            <span style={{ fontSize: '0.857rem', color: C.text }}>
              管理者
            </span>
          </label>
        </FormField>

        <FormField label="アカウント状態">
          <div style={{ display: 'flex', gap: S.s }}>
            <StateBtn
              active={isActive === true}
              onClick={() => setIsActive(true)}
              Icon={UserCheck}
              label="有効"
              color={C.success}
            />
            <StateBtn
              active={isActive === false}
              onClick={() => setIsActive(false)}
              Icon={UserX}
              label="停止"
              color={C.danger}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '4px' }}>
            停止するとログインできなくなります（チーム所属は残ります）
          </div>
        </FormField>
      </form>
    </Modal>
  );
}

function StateBtn({ active, onClick, Icon, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 12px',
        border: `1px solid ${active ? color : C.border}`,
        background: active ? `${color}15` : C.surface,
        color: active ? color : C.textSub,
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.857rem',
        fontWeight: 700,
        fontFamily: 'inherit',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
