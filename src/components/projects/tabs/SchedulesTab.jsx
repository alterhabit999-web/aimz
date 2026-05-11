import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, MapPin, Users as UsersIcon, Clock } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import { formatTime, formatShortDate } from '../../../utils/format';
import ScheduleFormModal, { loadScheduleParticipantIds } from '../../schedules/ScheduleFormModal';
import {
  listSchedulesByProject,
  listAllScheduleParticipants,
  listProfiles,
} from '../../../api';
import useReloadOnFocus from '../../../hooks/useReloadOnFocus';

/**
 * SchedulesTab — 案件詳細「予定」タブ（v19 新規）。
 *
 *   - 当該案件の schedules を時系列（開始時刻昇順）で表示
 *   - 「予定を追加」ボタン → ScheduleFormModal (project プリセット済み)
 *   - 各行クリック → 編集モーダル
 *   - 編集・削除は作成者本人 or 管理者のみ（モーダル側で判定）
 */
export default function SchedulesTab({ project }) {
  const { user } = useAuth();
  const [schedules, setSchedules]     = useState([]);
  const [participants, setParticipants] = useState([]);  // 当該案件分の participants
  const [profiles, setProfiles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [modalMode, setModalMode]     = useState('create');
  const [modalInitial, setModalInitial] = useState(null);

  const reload = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [ss, allParts, ps] = await Promise.all([
        listSchedulesByProject(project.id),
        listAllScheduleParticipants({ limit: 1000 }),
        listProfiles({ limit: 200 }),
      ]);
      const scheduleIdSet = new Set(ss.map(s => s.id));
      const myProjectParts = allParts.filter(p => scheduleIdSet.has(p.schedule_id));
      setSchedules(ss);
      setParticipants(myProjectParts);
      setProfiles(ps);
    } catch (err) {
      console.error(err);
      setError(err?.message || '予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const participantsBySchedule = useMemo(() => {
    const m = new Map();
    for (const p of participants) {
      const arr = m.get(p.schedule_id) || [];
      arr.push(p);
      m.set(p.schedule_id, arr);
    }
    return m;
  }, [participants]);

  const openCreate = () => {
    setModalMode('create');
    setModalInitial(null);
    setModalOpen(true);
  };
  const openEdit = async (schedule) => {
    try {
      const ids = await loadScheduleParticipantIds(schedule.id);
      setModalMode('edit');
      setModalInitial({ ...schedule, _participantIds: ids });
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('予定の取得に失敗しました：' + (err?.message || ''));
    }
  };
  const handleSaved = async () => {
    await reload();
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: S.m,
      }}>
        <div style={{ color: C.textSub, fontSize: '0.857rem' }}>
          {loading ? '読み込み中…' : `${schedules.length} 件の予定`}
        </div>
        <Button size="sm" Icon={Plus} onClick={openCreate}>
          予定を追加
        </Button>
      </div>

      {error ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.danger }}>
          {error}
          <div style={{ marginTop: S.s }}>
            <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
          </div>
        </div>
      ) : loading ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
          読み込み中...
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.xs }}>
          {schedules.map(s => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              participants={participantsBySchedule.get(s.id) || []}
              profileById={profileById}
              onClick={() => openEdit(s)}
              isMine={s.created_by === user?.id}
            />
          ))}
        </div>
      )}

      <ScheduleFormModal
        open={modalOpen}
        mode={modalMode}
        initial={modalInitial}
        project={project}
        profiles={profiles}
        currentUser={user}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function ScheduleRow({ schedule, participants, profileById, onClick, isMine }) {
  const participantProfiles = participants
    .map(p => profileById.get(p.user_id))
    .filter(Boolean);
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: S.m,
        padding: S.m,
        background: isMine ? C.bg : C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = C.bgSub}
      onMouseLeave={(e) => e.currentTarget.style.background = isMine ? C.bg : C.surface}
    >
      {/* 日時 */}
      <div style={{
        flexShrink: 0,
        width: '120px',
        color: C.accent,
        fontSize: '0.857rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <div style={{ fontSize: '0.75rem', color: C.textSub, fontWeight: 400 }}>
          {formatShortDate(schedule.start_at?.slice(0, 10))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          {formatTime(schedule.start_at)}
        </div>
        <div style={{ color: C.textMuted, fontWeight: 400, fontSize: '0.75rem' }}>
          〜 {formatTime(schedule.end_at)}
        </div>
      </div>

      {/* 本文 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.text }}>
          {schedule.title}
        </div>
        <div style={{
          display: 'flex',
          gap: S.s,
          marginTop: '4px',
          fontSize: '0.75rem',
          color: C.textSub,
          flexWrap: 'wrap',
        }}>
          {schedule.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <MapPin size={12} />{schedule.location}
            </span>
          )}
          {participantProfiles.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <UsersIcon size={12} />{participantProfiles.length}名
            </span>
          )}
        </div>
        {schedule.memo && (
          <div style={{
            marginTop: S.xs,
            fontSize: '0.75rem',
            color: C.textSub,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {schedule.memo}
          </div>
        )}
        {participantProfiles.length > 0 && (
          <div style={{
            marginTop: S.xs,
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
          }}>
            {participantProfiles.slice(0, 8).map(p => (
              <span
                key={p.id}
                title={p.full_name}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Avatar name={p.full_name} src={p.avatar_url} size={20} />
              </span>
            ))}
            {participantProfiles.length > 8 && (
              <span style={{ fontSize: '0.7rem', color: C.textMuted, alignSelf: 'center' }}>
                +{participantProfiles.length - 8}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{
      padding: S.xxl,
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: '8px',
      color: C.textMuted,
      textAlign: 'center',
    }}>
      <Calendar size={36} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.s }} />
      <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: S.xs }}>
        まだ予定がありません
      </div>
      <p style={{ fontSize: '0.857rem', margin: `0 0 ${S.m}` }}>
        ミーティングや顧客打ち合わせなどを登録しましょう
      </p>
      <Button Icon={Plus} onClick={onCreate}>予定を追加</Button>
    </div>
  );
}
