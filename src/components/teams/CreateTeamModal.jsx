import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle, selectStyle } from '../ui/FormField';
import { DUMMY_DEPARTMENTS, DUMMY_USERS, myDepartments } from '../../data/dummy';
import { useAuth } from '../../contexts/AuthContext';
import { C, S } from '../../styles/tokens';

/**
 * CreateTeamModal — チーム新規作成。
 *
 * 仕様：
 *   - チーム名（必須）
 *   - 所属部署（必須、選択。自分の所属部署を優先表示）
 *   - 説明（任意）
 *   - リーダー（必須、自分含む全ユーザーから選択。複数可）
 *   - メンバー（任意、複数可、リーダー以外）
 *
 * 現状はダミーデータに対する書き込みは行わず、
 * onSubmit に新規チーム情報を渡すだけ。
 * （次のフェーズで Appwrite DB 連携時に実書き込みに差し替え）
 */
export default function CreateTeamModal({ open, onClose, onSubmit }) {
  const { user } = useAuth();
  const myDeptList = myDepartments(user?.id);
  const defaultDeptId = myDeptList[0]?.id || DUMMY_DEPARTMENTS[0]?.id || '';

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDeptId);
  const [description, setDescription] = useState('');
  const [leaderIds, setLeaderIds] = useState([user?.id].filter(Boolean));
  const [memberIds, setMemberIds] = useState([]);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setDepartmentId(defaultDeptId);
    setDescription('');
    setLeaderIds([user?.id].filter(Boolean));
    setMemberIds([]);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = (e) => {
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
    onSubmit?.({
      name: name.trim(),
      department_id: departmentId,
      description: description.trim(),
      leader_ids: leaderIds,
      member_ids: memberIds,
    });
    reset();
    onClose?.();
  };

  // リーダーに選ばれているユーザーはメンバーから除外
  const memberCandidates = DUMMY_USERS.filter(u => !leaderIds.includes(u.id));

  return (
    <Modal
      open={open}
      title="チームを作成"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleSubmit}>作成する</Button>
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
            {DUMMY_DEPARTMENTS.map(d => (
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
            users={DUMMY_USERS}
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
