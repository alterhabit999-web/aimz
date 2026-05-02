import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle, selectStyle } from '../ui/FormField';
import ConfirmDialog from '../ui/ConfirmDialog';
import { C, S } from '../../styles/tokens';

import SubtaskList from './SubtaskList';
import ProgressModeControl from './ProgressModeControl';
import CommentsPlaceholder from './CommentsPlaceholder';

const STATUS_OPTIONS   = ['未着手', '進行中', '完了'];
const PRIORITY_OPTIONS = ['高', '中', '低'];

/** 小タスク完了率（リアルタイム計算） */
const calcSubtaskProgress = (list) => {
  if (!list || list.length === 0) return 0;
  const done = list.filter(s => s.is_completed).length;
  return Math.round((done / list.length) * 100);
};

/**
 * TaskDetailModal — タスクの作成・編集・小タスク管理・コメント枠を一体化したモーダル。
 *
 * Props:
 *   open, mode: 'create' | 'edit'
 *   project: { id, team_id, ... }     必須（チームメンバー選択肢取得用）
 *   initial: 既存タスク（edit 時）   省略時は新規作成
 *     edit 時は呼び出し側で listSubtasksByTask の結果を `subtasks` プロパティに含めて渡す
 *   defaultStatus: 'create' 時の初期ステータス（カンバンの「+」から起動時に使う）
 *   teamMembers, profiles: 担当者選択肢の構築用（props 駆動）
 *   editable: 編集可能フラグ（呼び出し側で権限判定済み）
 *   onClose:  () => void
 *   onSubmit: (data) => Promise<void>
 *     data = { task: {...}, subtasks: [...] }
 *   onDelete: (task) => Promise<void>   edit 時のみ
 */
export default function TaskDetailModal({
  open,
  mode = 'create',
  project,
  initial,
  defaultStatus,
  teamMembers = [],
  profiles = [],
  editable = true,
  onClose,
  onSubmit,
  onDelete,
}) {
  const isEdit = mode === 'edit';

  // 親タスクのフォーム値
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]         = useState('未着手');
  const [priority, setPriority]     = useState('中');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate]   = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [progressMode, setProgressMode] = useState('manual');
  const [manualProgress, setManualProgress] = useState(0);

  // 小タスク（ローカルバッファ）
  const [subtasks, setSubtasks] = useState([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 担当者選択肢：当該案件のチームメンバー
  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const memberOptions = useMemo(() => {
    if (!project?.team_id) return [];
    return teamMembers
      .filter(m => m.team_id === project.team_id)
      .map(m => {
        const p = profileById.get(m.user_id);
        return p ? { ...p, role: m.role } : null;
      })
      .filter(Boolean);
  }, [project?.team_id, teamMembers, profileById]);

  // open / initial 変化に追随してフォームを初期化
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setName(initial.name || '');
      setDescription(initial.description || '');
      setStatus(initial.status || '未着手');
      setPriority(initial.priority || '中');
      setAssigneeId(initial.assignee_id || '');
      setStartDate(initial.start_date || '');
      setDueDate(initial.due_date || '');
      setProgressMode(initial.progress_mode || 'manual');
      setManualProgress(initial.progress_rate ?? 0);
      setSubtasks(initial.subtasks || []);
    } else {
      setName('');
      setDescription('');
      setStatus(defaultStatus || '未着手');
      setPriority('中');
      setAssigneeId('');
      setStartDate('');
      setDueDate('');
      setProgressMode('manual');
      setManualProgress(0);
      setSubtasks([]);
    }
    setError('');
    setSubmitting(false);
    setDeleteConfirmOpen(false);
  }, [open, isEdit, initial, defaultStatus]);

  // auto モード時のリアルタイム計算値
  const autoProgress = calcSubtaskProgress(subtasks);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) { setError('タスク名を入力してください'); return; }
    if (startDate && dueDate && startDate > dueDate) {
      setError('開始日は期限より前にしてください');
      return;
    }
    const finalProgress = progressMode === 'auto' ? autoProgress : manualProgress;

    setSubmitting(true);
    try {
      await onSubmit?.({
        task: {
          ...(isEdit ? { id: initial.id } : {}),
          project_id: project?.id,
          name: name.trim(),
          description: description.trim(),
          status,
          priority,
          assignee_id: assigneeId || null,
          start_date: startDate || null,
          due_date: dueDate || null,
          progress_mode: progressMode,
          progress_rate: finalProgress,
        },
        subtasks,
      });
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete?.(initial);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? 'タスク詳細' : 'タスクを作成'}
        onClose={onClose}
        width="640px"
        footer={
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: S.s,
          }}>
            <div>
              {isEdit && editable && (
                <Button
                  variant="ghost"
                  Icon={Trash2}
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={submitting}
                  style={{ color: C.danger }}
                >
                  削除
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: S.s }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>キャンセル</Button>
              <Button onClick={handleSubmit} disabled={!editable || submitting}>
                {submitting ? '保存中…' : (isEdit ? '保存する' : '作成する')}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* タスク名 */}
          <FormField label="タスク名" required>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：API 設計レビュー"
              style={inputStyle}
              disabled={!editable}
              autoFocus={!isEdit}
            />
          </FormField>

          {/* 説明 */}
          <FormField label="説明">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="タスクの詳細・前提・参照リンクなど"
              style={textareaStyle}
              rows={3}
              disabled={!editable}
            />
          </FormField>

          {/* ステータス・優先度 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.m }}>
            <FormField label="ステータス" required>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={selectStyle}
                disabled={!editable}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="優先度">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={selectStyle}
                disabled={!editable}
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>

          {/* 担当者 */}
          <FormField label="担当者" hint={memberOptions.length === 0 ? 'チームにメンバーがいません' : 'チームメンバーから選択'}>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              style={selectStyle}
              disabled={!editable || memberOptions.length === 0}
            >
              <option value="">未割当</option>
              {memberOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name}{m.role === 'leader' ? '（リーダー）' : ''}
                </option>
              ))}
            </select>
          </FormField>

          {/* 期間 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.m }}>
            <FormField label="開始日">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
                disabled={!editable}
              />
            </FormField>
            <FormField label="期限">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
                disabled={!editable}
              />
            </FormField>
          </div>

          {/* 進捗率（モード切替） */}
          <FormField label="進捗率">
            <ProgressModeControl
              mode={progressMode}
              manualValue={manualProgress}
              autoValue={autoProgress}
              subtaskCount={subtasks.length}
              onModeChange={editable ? setProgressMode : undefined}
              onManualChange={editable ? setManualProgress : undefined}
            />
          </FormField>

          {/* 小タスク */}
          <FormField
            label={`小タスク${subtasks.length > 0 ? `（${subtasks.filter(s => s.is_completed).length}/${subtasks.length}）` : ''}`}
            hint="末尾の入力欄に名前を打ち、Enter で追加。チェックで完了。"
          >
            <SubtaskList
              subtasks={subtasks}
              onChange={setSubtasks}
              readOnly={!editable}
              profileById={profileById}
            />
          </FormField>

          {/* コメントプレースホルダー */}
          {isEdit && (
            <div style={{ marginTop: S.m }}>
              <CommentsPlaceholder />
            </div>
          )}

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

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="タスクの削除"
        message={
          initial && (
            <>
              タスク「<strong>{initial.name}</strong>」を削除します。<br />
              配下の小タスクもすべて削除されます。この操作は取り消せません。
            </>
          )
        }
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}
