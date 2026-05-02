import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle, selectStyle } from '../ui/FormField';
import { useAuth } from '../../contexts/AuthContext';
import { C, S } from '../../styles/tokens';

const STATUS_OPTIONS   = ['未着手', '進行中', '完了', '保留'];
const PRIORITY_OPTIONS = ['高', '中', '低'];

/**
 * ProjectFormModal — 案件の作成・編集モーダル。
 *
 * Props:
 *   open: boolean
 *   mode: 'create' | 'edit'
 *   initial: 既存案件データ（edit 時のみ）
 *     { id, name, description, team_id, status, priority,
 *       start_date, end_date, assignee_ids }
 *   teams:        全チーム配列（プルダウン用）
 *   departments:  全部署配列（チームのラベル用）
 *   teamMembers:  全 team_members（メンバー候補の絞り込み用）
 *   profiles:     全プロフィール（メンバー名解決用）
 *   myTeamIds:    自分の所属チーム ID 配列（自チームに絞る用）
 *   onClose:  () => void
 *   onSubmit: (data) => Promise<void>
 *     data = { id?, name, description, team_id, status, priority,
 *              start_date, end_date, assignee_ids }
 */
export default function ProjectFormModal({
  open, mode = 'create', initial,
  teams = [], departments = [], teamMembers = [], profiles = [],
  myTeamIds = [],
  onClose, onSubmit,
}) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const departmentById = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);
  const profileById    = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  // チーム選択肢：Admin は全チーム、それ以外は自分の所属チーム
  const teamOptions = useMemo(() => {
    if (user?.is_admin) return teams;
    const myIdSet = new Set(myTeamIds);
    return teams.filter(t => myIdSet.has(t.id));
  }, [user?.is_admin, teams, myTeamIds]);

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId]           = useState('');
  const [status, setStatus]           = useState('未着手');
  const [priority, setPriority]       = useState('中');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // open / initial の変化に追随
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setName(initial.name || '');
      setDescription(initial.description || '');
      setTeamId(initial.team_id || '');
      setStatus(initial.status || '未着手');
      setPriority(initial.priority || '中');
      setStartDate(initial.start_date || '');
      setEndDate(initial.end_date || '');
      setAssigneeIds(initial.assignee_ids || []);
    } else {
      setName('');
      setDescription('');
      setTeamId(teamOptions[0]?.id || '');
      setStatus('未着手');
      setPriority('中');
      setStartDate('');
      setEndDate('');
      setAssigneeIds([]);
    }
    setError('');
    setSubmitting(false);
  }, [open, isEdit, initial, teamOptions]);

  // チーム変更時、担当者選択肢を絞り込む
  const memberCandidates = useMemo(() => {
    if (!teamId) return [];
    return teamMembers
      .filter(m => m.team_id === teamId)
      .map(m => {
        const p = profileById.get(m.user_id);
        return p ? { ...p, role: m.role } : null;
      })
      .filter(Boolean);
  }, [teamId, teamMembers, profileById]);

  // チーム変更時、不正な assignee を取り除く
  useEffect(() => {
    if (!teamId) return;
    const validIds = new Set(memberCandidates.map(m => m.id));
    setAssigneeIds(prev => prev.filter(id => validIds.has(id)));
  }, [teamId, memberCandidates]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim())  { setError('案件名を入力してください'); return; }
    if (!teamId)       { setError('担当チームを選択してください'); return; }
    if (!startDate)    { setError('開始日を入力してください'); return; }
    if (!endDate)      { setError('終了日（期限）を入力してください'); return; }
    if (startDate > endDate) {
      setError('開始日は終了日より前にしてください');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.({
        ...(isEdit ? { id: initial.id } : {}),
        name: name.trim(),
        description: description.trim(),
        team_id: teamId,
        status,
        priority,
        start_date: startDate,
        end_date: endDate,
        assignee_ids: assigneeIds,
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
      title={isEdit ? '案件を編集' : '案件を作成'}
      onClose={onClose}
      width="600px"
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
        <FormField label="案件名" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：社内ポータル刷新"
            style={inputStyle}
            autoFocus
          />
        </FormField>

        <FormField label="説明" hint="案件の概要・背景">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例：老朽化した社内ポータルを React で刷新する"
            style={textareaStyle}
            rows={3}
          />
        </FormField>

        <FormField label="担当チーム" required>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            style={selectStyle}
            disabled={isEdit}  // 編集時はチーム移動不可（要件次第で変更）
          >
            <option value="">選択してください</option>
            {teamOptions.map(t => {
              const dept = departmentById.get(t.department_id);
              return (
                <option key={t.id} value={t.id}>
                  {dept?.name ? `${dept.name} / ` : ''}{t.name}
                </option>
              );
            })}
          </select>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.m }}>
          <FormField label="ステータス" required>
            <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="優先度">
            <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.m }}>
          <FormField label="開始日" required>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </FormField>
          <FormField label="終了日（期限）" required>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="担当者" hint="チームメンバーから複数選択可">
          {memberCandidates.length === 0 ? (
            <div style={{
              padding: S.s,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              color: C.textMuted,
              fontSize: '0.857rem',
              background: C.surface,
            }}>
              チームを選択するとメンバーが表示されます
            </div>
          ) : (
            <UserMultiSelect
              users={memberCandidates}
              selectedIds={assigneeIds}
              onChange={setAssigneeIds}
            />
          )}
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
// UserMultiSelect (ProjectFormModal 内専用)
// ============================================================
function UserMultiSelect({ users, selectedIds, onChange }) {
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
      {users.map(u => {
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
            {u.role === 'leader' && (
              <span style={{ fontSize: '0.7rem', color: C.orange, marginLeft: 'auto' }}>リーダー</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
