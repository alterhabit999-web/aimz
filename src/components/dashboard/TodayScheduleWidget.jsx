import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, MapPin, Users as UsersIcon } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import { listSchedulesOnDate, listAllScheduleParticipants } from '../../api';
import { formatTime } from '../../utils/format';
import useReloadOnFocus from '../../hooks/useReloadOnFocus';

/**
 * TodayScheduleWidget — 今日の予定をタイムライン形式で表示。
 * 仕様 3-10-1。Appwrite から取得（PHASE 3 で実 DB 化）。
 */
export default function TodayScheduleWidget() {
  const [schedules, setSchedules] = useState([]);
  const [participantCountById, setParticipantCountById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const [list, participants] = await Promise.all([
        listSchedulesOnDate(dateStr),
        listAllScheduleParticipants({ limit: 1000 }),
      ]);

      const counts = new Map();
      for (const p of participants) {
        counts.set(p.schedule_id, (counts.get(p.schedule_id) || 0) + 1);
      }
      setSchedules(list);
      setParticipantCountById(counts);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'スケジュール取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  return (
    <Card title="本日のスケジュール" Icon={Calendar}>
      {loading ? (
        <EmptyState>読み込み中...</EmptyState>
      ) : error ? (
        <EmptyState danger>{error}</EmptyState>
      ) : schedules.length === 0 ? (
        <EmptyState>今日の予定はありません</EmptyState>
      ) : (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: S.s,
        }}>
          {schedules.map(s => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              participantCount={participantCountById.get(s.id) || 0}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ScheduleRow({ schedule, participantCount }) {
  return (
    <li style={{
      display: 'flex',
      gap: S.m,
      padding: `${S.s} ${S.s}`,
      borderRadius: '6px',
      background: C.bg,
    }}>
      {/* 時間 */}
      <div style={{
        flexShrink: 0,
        width: '88px',
        color: C.accent,
        fontSize: '0.857rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatTime(schedule.start_at)}
        <span style={{ color: C.textMuted, fontWeight: 400 }}> - </span>
        {formatTime(schedule.end_at)}
      </div>

      {/* タイトル + 場所 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.857rem',
          fontWeight: 700,
          color: C.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {schedule.title}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          marginTop: '2px',
          fontSize: '0.75rem',
          color: C.textSub,
        }}>
          {schedule.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <MapPin size={12} />
              {schedule.location}
            </span>
          )}
          {participantCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <UsersIcon size={12} />
              {participantCount}名
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({ children, danger }) {
  return (
    <p style={{
      color: danger ? C.danger : C.textMuted,
      fontSize: '0.857rem',
      textAlign: 'center',
      padding: `${S.l} 0`,
      margin: 0,
    }}>
      {children}
    </p>
  );
}
