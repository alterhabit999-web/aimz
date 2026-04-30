import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import { todaySchedules } from '../../data/dummy';
import { formatTime } from '../../utils/format';

/**
 * TodayScheduleWidget — 今日の予定をタイムライン形式で表示。
 * 仕様 3-10-1。
 */
export default function TodayScheduleWidget() {
  const schedules = todaySchedules().slice().sort(
    (a, b) => a.start_at.localeCompare(b.start_at)
  );

  return (
    <Card title="本日のスケジュール" Icon={Calendar}>
      {schedules.length === 0 ? (
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
            <ScheduleRow key={s.id} schedule={s} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ScheduleRow({ schedule }) {
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
        {schedule.location && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.75rem',
            color: C.textSub,
            marginTop: '2px',
          }}>
            <MapPin size={12} />
            {schedule.location}
          </div>
        )}
      </div>
    </li>
  );
}

function EmptyState({ children }) {
  return (
    <p style={{
      color: C.textMuted,
      fontSize: '0.857rem',
      textAlign: 'center',
      padding: `${S.l} 0`,
      margin: 0,
    }}>
      {children}
    </p>
  );
}
