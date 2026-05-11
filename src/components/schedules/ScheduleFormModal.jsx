import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Calendar } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { inputStyle, textareaStyle, selectStyle } from '../ui/FormField';
import ConfirmDialog from '../ui/ConfirmDialog';
import Avatar from '../ui/Avatar';
import { C, S } from '../../styles/tokens';
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  setParticipants,
  listParticipantsBySchedule,
  deleteAllParticipantsForSchedule,
} from '../../api';

/**
 * ScheduleFormModal — 予定の作成・編集・削除（v19）。
 *
 * Props:
 *   open, mode: 'create' | 'edit'
 *   initial:    既存予定（edit 時、participants も渡せる）
 *   project:    案件詳細から開いたとき、案件をプリセット（変更不可）
 *   projects:   案件選択肢（マイスケジュールから開いた時はピッカー表示）
 *   profiles:   参加者選択肢（全 profile）
 *   currentUser: 作成者として記録 / 編集権限判定に使う
 *   defaults:   create 時の初期値（date など）{ start_at, end_at, project_id }
 *   onClose, onSaved
 */
export default function ScheduleFormModal({
  open,
  mode = 'create',
  initial,
  project,
  projects = [],
  profiles = [],
  currentUser,
  defaults,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';

  const projectIsFixed = !!project?.id;
  const showProjectPicker = !projectIsFixed && projects.length > 0;

  const [title, setTitle]         = useState('');
  const [projectId, setProjectId] = useState('');
  const [startAt, setStartAt]     = useState(''); // datetime-local 形式 'YYYY-MM-DDTHH:mm'
  const [endAt, setEndAt]         = useState('');
  const [location, setLocation]   = useState('');
  const [memo, setMemo]           = useState('');
  const [participantIds, setParticipantIds] = useState([]);  // string[]

  const [error, setError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 編集権限：本人 or 管理者
  const canModify = useMemo(() => {
    if (!isEdit) return true; // 作成時は誰でも可
    if (!currentUser) return false;
    if (currentUser.is_admin) return true;
    return initial?.created_by === currentUser.id;
  }, [isEdit, currentUser, initial?.created_by]);

  // ISO → 'YYYY-MM-DDTHH:mm'（ローカル）
  const isoToLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  // 'YYYY-MM-DDTHH:mm' → ISO（ローカル時刻を UTC に）
  const localInputToIso = (s) => {
    if (!s) return null;
    return new Date(s).toISOString();
  };

  // open / initial 変化に追随
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setTitle(initial.title || '');
      setProjectId(initial.project_id || '');
      setStartAt(isoToLocalInput(initial.start_at));
      setEndAt(isoToLocalInput(initial.end_at));
      setLocation(initial.location || '');
      setMemo(initial.memo || '');
      setParticipantIds(Array.isArray(initial._participantIds) ? initial._participantIds : []);
    } else {
      setTitle('');
      setProjectId(defaults?.project_id || project?.id || '');
      setStartAt(defaults?.start_at || '');
      setEndAt(defaults?.end_at || '');
      setLocation('');
      setMemo('');
      // 自分は最初から参加者として含める（任意で外せる）
      setParticipantIds(currentUser?.id ? [currentUser.id] : []);
    }
    setError('');
    setSubmitting(false);
    setDeleteConfirmOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initial?.id, defaults?.start_at, defaults?.end_at, defaults?.project_id]);

  const toggleParticipant = (id) => {
    setParticipantIds(prev => prev.includes(id)
      ? prev.filter(p => p !== id)
      : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) { setError('タイトルを入力してください'); return; }
    if (!startAt) { setError('開始日時を入力してください'); return; }
    if (!endAt)   { setError('終了日時を入力してください'); return; }
    if (startAt >= endAt) { setError('終了日時は開始日時より後にしてください'); return; }

    setSubmitting(true);
    try {
      const payload = {
        project_id: projectIsFixed ? project.id : (projectId || null),
        title: title.trim(),
        start_at: localInputToIso(startAt),
        end_at:   localInputToIso(endAt),
        location: location.trim() || null,
        memo: memo.trim() || null,
      };

      let saved;
      if (isEdit && initial?.id) {
        saved = await updateSchedule(initial.id, payload);
      } else {
        saved = await createSchedule({
          ...payload,
          created_by: currentUser?.id || null,
        });
      }

      // 参加者を差分同期
      await setParticipants(saved.id, participantIds);

      await onSaved?.(saved);
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initial?.id) return;
    try {
      await deleteAllParticipantsForSchedule(initial.id);
      await deleteSchedule(initial.id);
      await onSaved?.(null);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  const activeProfiles = profiles.filter(p => p.is_active !== false);

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? '予定を編集' : '予定を作成'}
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
              {isEdit && canModify && (
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
              <Button onClick={handleSubmit} disabled={!canModify || submitting}>
                {submitting ? '保存中…' : (isEdit ? '保存する' : '作成する')}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormField label="タイトル" required>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：定例ミーティング"
              style={inputStyle}
              disabled={!canModify}
              autoFocus={!isEdit}
            />
          </FormField>

          {showProjectPicker && (
            <FormField label="案件" hint="案件と紐づけない場合は「案件なし」を選択">
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={selectStyle}
                disabled={!canModify}
              >
                <option value="">— 案件なし —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S.m }}>
            <FormField label="開始日時" required>
              <input
                type="datetime-local"
                value={startAt}
                onChange={e => setStartAt(e.target.value)}
                style={inputStyle}
                disabled={!canModify}
              />
            </FormField>
            <FormField label="終了日時" required>
              <input
                type="datetime-local"
                value={endAt}
                onChange={e => setEndAt(e.target.value)}
                style={inputStyle}
                disabled={!canModify}
              />
            </FormField>
          </div>

          <FormField label="場所">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="会議室 A / オンライン / Slack ハドル など"
              style={inputStyle}
              disabled={!canModify}
            />
          </FormField>

          <FormField label="メモ" hint="議題やリンクなど">
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              style={textareaStyle}
              disabled={!canModify}
            />
          </FormField>

          <FormField
            label={`参加者${participantIds.length > 0 ? `（${participantIds.length} 人）` : ''}`}
            hint="チェックを入れた人を参加者として登録"
          >
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              background: C.surface,
              padding: S.xs,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {activeProfiles.length === 0 ? (
                <div style={{ padding: S.s, color: C.textMuted, fontSize: '0.857rem', textAlign: 'center' }}>
                  メンバーが登録されていません
                </div>
              ) : activeProfiles.map(p => {
                const checked = participantIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: S.s,
                      padding: `${S.xs} ${S.s}`,
                      borderRadius: '4px',
                      cursor: canModify ? 'pointer' : 'default',
                      background: checked ? C.accentLight : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(p.id)}
                      disabled={!canModify}
                      style={{ accentColor: C.accent }}
                    />
                    <Avatar name={p.full_name} src={p.avatar_url} size={20} />
                    <span style={{ fontSize: '0.857rem', color: C.text, fontWeight: checked ? 700 : 400 }}>
                      {p.full_name}
                    </span>
                    {p.email && (
                      <span style={{ fontSize: '0.7rem', color: C.textMuted, marginLeft: 'auto' }}>
                        {p.email}
                      </span>
                    )}
                  </label>
                );
              })}
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

          {isEdit && !canModify && (
            <div style={{
              padding: S.s,
              background: C.bg,
              color: C.textMuted,
              borderRadius: '6px',
              fontSize: '0.75rem',
              marginTop: S.s,
              display: 'flex',
              alignItems: 'center',
              gap: S.xs,
            }}>
              <Calendar size={12} />
              この予定は作成者または管理者のみ編集・削除できます
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="予定の削除"
        message={
          initial && (
            <>
              予定「<strong>{initial.title}</strong>」を削除します。<br />
              参加者情報も一緒に削除されます。この操作は取り消せません。
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

/** edit 用に初期 participantIds をセットするヘルパー */
export async function loadScheduleParticipantIds(scheduleId) {
  if (!scheduleId) return [];
  const rows = await listParticipantsBySchedule(scheduleId);
  return rows.map(r => r.user_id);
}
