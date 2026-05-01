import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle, selectStyle } from '../ui/FormField';
import { useAuth } from '../../contexts/AuthContext';
import { C, S } from '../../styles/tokens';

/**
 * CreateTeamModal — チーム作成・編集モーダル。
 *
 * Props:
 *   open: boolean
 *   mode: 'create' | 'edit'
 *   initial: { id, name, department_id, description, members: [{user_id, role}] }
 *   departments: 全部署リスト（プルダウン選択肢）
 *   profiles:    全ユーザー（メンバー選択肢）
 *   myDeptIds:   自分の所属部署 ID 配列（hint 用）
 *   onClose:  () => void
 *   onSubmit: (data) => Promise<void>
 *     data = {
 *       id?, name, department_id, description,
 *       members: [{ user_id, role: 'leader' | 'member' }]
 *     }
 */
export default function CreateTeamModal({
  open,
  mode = 'create',
  initial,
  departments = [],
  profiles = [],
  myDeptIds = [],
  onClose,
  onSubmit,
}) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [leaderIds, setLeaderIds] = useState([]);
  const [memberIds, setMemberIds] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // open / initial 変化に応じて初期化
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setName(initial.name || '');
      setDepartmentId(initial.department_id || '');
      setDescription(initial.description || '');
      const leaders = (initial.members || []).filter(m => m.role === 'leader').map(m => m.user_id);
      const members = (initial.members || []).filter(m => m.role === 'member').map(m => m.user_id);
      setLeaderIds(leaders);
      setMemberIds(members);
    } else {
      const defaultDeptId = myDeptIds[0] || departments[0]?.id || '';
      setName('');
      setDepartmentId(defaultDeptId);
      setDescription('');
      setLeaderIds([user?.id].filter(Boolean));
      setMemberIds([]);
    }
    setError('');
    setSubmitting(false);
  }, [open, isEdit, initial, departments, myDeptIds, user?.id]);

  const myDeptList = departments.filter(d => myDeptIds.includes(d.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('チーム名を入力してください');
      return;
    }
    if (!departmentId) {
      setError('所属部署を選択してください');
      return;
    }
    if (leaderIds.length === 0) {
      setError('リーダーを 1 人以上選択してください');
      return;
    }
    setSubmitting(true);
    try {
      const allMembers = [
        ...leaderIds.map(uid => ({ user_id: uid, role: 'leader' })),
        ...memberIds.map(uid => ({ user_id: uid, role: 'member' })),
      ];
      await onSubmit?.({
        id: initial?.id,
        name: name.trim(),
        department_id: departmentId,
        description: description.trim(),
        members: allMembers,
      });
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
      setSubmitting(false);
    }
  };

  // リーダーに選ばれているユーザーはメンバーから除外
  const memberCandidates = profiles.filter(u => !leaderIds.includes(u.id));

  return (
    <Modal
      open={open}
      title={isEdit ? 'チームを編集' : 'チームを作成'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中…' : (isEdit ? '保存する' : '作成する')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField label="チーム名" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：法人営業"
            style={inputStyle}
            autoFocus
          />
        </FormField>

        <FormField label="所属部署" required hint={
          myDeptList.length > 0 ? `あなたの所属：${myDeptList.map(d => d.name).join(' / ')}` : null
        }>
          <select
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            style={selectStyle}
          >
            <option value="">選択してください</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="説明" hint="チームの役割や対象範囲などを記載">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例：法人顧客向けの営業活動を担当"
            style={textareaStyle}
            rows={3}
          />
        </FormField>

        <FormField label="リーダー" required hint="チーム作成・編集ができる人を 1 名以上指定">
          <UserMultiSelect
            users={profiles}
            selectedIds={leaderIds}
            onChange={setLeaderIds}
            placeholder="リーダーを選択"
          />
        </FormField>

        <FormField label="メンバー">
          <UserMultiSelect
            users={memberCandidates}
            selectedIds={memberIds}
            onChange={setMemberIds}
            placeholder="メンバーを追加"
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

// ============================================================
// UserMultiSelect — チェックボックス式の複数選択
// ============================================================
function UserMultiSelect({ users, selectedIds, onChange, placeholder }) {
  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      maxHeight: '160px',
      overflowY: 'auto',
      background: C.surface,
    }}>
      {users.length === 0 ? (
        <div style={{ padding: S.s, color: C.textMuted, fontSize: '0.857rem', textAlign: 'center' }}>
          {placeholder || '選択肢がありません'}
        </div>
      ) : (
        users.map(u => {
          const checked = selectedIds.includes(u.id);
          return (
            <label
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: S.s,
                padding: `${S.xs} ${S.s}`,
                cursor: 'pointer',
                background: checked ? C.accentLight : 'transparent',
                fontSize: '0.857rem',
                borderBottom: `1px solid ${C.border}`,
              }}
              onMouseEnter={e => { if (!checked) e.currentTarget.style.background = C.bg; }}
              onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(u.id)}
                style={{ accentColor: C.accent }}
              />
              <span style={{ color: C.text, fontWeight: checked ? 700 : 400 }}>
                {u.full_name}
              </span>
              {u.is_admin && (
                <span style={{ fontSize: '0.7rem', color: C.accent, marginLeft: 'auto' }}>管理者</span>
              )}
            </label>
          );
        })
      )}
    </div>
  );
}
