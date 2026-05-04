import React, { useEffect, useMemo, useState } from 'react';
import { Shield, UserX, UserCheck, Crown, Building2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle } from '../ui/FormField';
import { C, S } from '../../styles/tokens';

/**
 * EditUserModal — ユーザーの権限・有効状態 + 所属（部署/チーム）を編集。
 *
 * Props:
 *   open: boolean
 *   user: 編集対象 profile
 *   teams: 全チーム
 *   departments: 全部署
 *   teamMembers: 全 team_members（user の現在の所属を解決するため）
 *   onClose: () => void
 *   onSubmit: ({ id, full_name, is_admin, is_active, memberships }) => Promise<void>
 *     memberships = [{ team_id, role: 'leader' | 'member' }]
 */
export default function EditUserModal({
  open, user, teams = [], departments = [], teamMembers = [],
  onClose, onSubmit,
}) {
  const [fullName, setFullName] = useState('');
  const [isAdmin, setIsAdmin]   = useState(false);
  const [isActive, setIsActive] = useState(true);
  // memberships: Map<team_id, role | null（未所属）>
  const [memberships, setMemberships] = useState(new Map());
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  // チームを部署別にグルーピング
  const teamsByDept = useMemo(() => {
    const map = new Map();
    for (const t of teams) {
      if (!map.has(t.department_id)) map.set(t.department_id, []);
      map.get(t.department_id).push(t);
    }
    return map;
  }, [teams]);

  // open / user 変化に応じて初期化
  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.full_name || '');
    setIsAdmin(!!user.is_admin);
    setIsActive(user.is_active !== false);
    // 現在の所属を Map に展開
    const m = new Map();
    for (const tm of teamMembers) {
      if (tm.user_id === user.id) m.set(tm.team_id, tm.role || 'member');
    }
    setMemberships(m);
    setError('');
    setSubmitting(false);
  }, [open, user, teamMembers]);

  if (!user) return null;

  const setRole = (teamId, role) => {
    setMemberships(prev => {
      const next = new Map(prev);
      if (role === null) next.delete(teamId);
      else next.set(teamId, role);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const memArr = [...memberships.entries()].map(([team_id, role]) => ({ team_id, role }));
      await onSubmit?.({
        id: user.id,
        full_name: fullName.trim() || user.full_name,
        is_admin: isAdmin,
        is_active: isActive,
        memberships: memArr,
      });
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="ユーザーを編集"
      onClose={onClose}
      width="600px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中…' : '保存する'}
          </Button>
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

        <FormField
          label="所属チーム"
          hint="部署別にチームを表示。各チームで「未所属 / メンバー / リーダー」を選択。"
        >
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            background: C.surface,
            maxHeight: '320px',
            overflowY: 'auto',
          }}>
            {departments.length === 0 ? (
              <div style={{ padding: S.s, color: C.textMuted, fontSize: '0.857rem', textAlign: 'center' }}>
                部署が登録されていません
              </div>
            ) : (
              departments.map(d => {
                const ts = teamsByDept.get(d.id) || [];
                if (ts.length === 0) return null;
                return (
                  <div key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: `${S.xs} ${S.s}`,
                      background: C.bgSub,
                      color: C.textSub,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}>
                      <Building2 size={12} />
                      {d.name}
                    </div>
                    {ts.map(t => {
                      const role = memberships.get(t.id) || null;
                      return (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: S.s,
                            padding: `${S.xs} ${S.s}`,
                            borderTop: `1px solid ${C.border}`,
                          }}
                        >
                          <span style={{ flex: 1, fontSize: '0.857rem', color: C.text, fontWeight: role ? 700 : 400 }}>
                            {t.name}
                          </span>
                          <RolePicker value={role} onChange={(v) => setRole(t.id, v)} />
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
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

// ============================================================
// 所属ロールピッカー（未所属 / メンバー / リーダー）
// ============================================================
function RolePicker({ value, onChange }) {
  const opts = [
    { v: null,       label: '未所属',   color: C.textMuted },
    { v: 'member',   label: 'メンバー', color: C.accent },
    { v: 'leader',   label: 'リーダー', color: C.orange },
  ];
  return (
    <div style={{ display: 'inline-flex', gap: '2px' }}>
      {opts.map(o => {
        const active = value === o.v;
        return (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${active ? o.color : C.border}`,
              background: active ? `${o.color}15` : C.surface,
              color: active ? o.color : C.textSub,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {o.v === 'leader' && <Crown size={10} />}
            {o.label}
          </button>
        );
      })}
    </div>
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
