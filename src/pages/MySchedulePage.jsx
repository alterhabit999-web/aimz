import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, MapPin, FolderOpen, CheckSquare } from 'lucide-react';
import { C, S } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge, { statusVariant, priorityVariant } from '../components/ui/Badge';
import { formatTime } from '../utils/format';
import {
  listSchedules,
  listSchedulesByUser,
  listTasksByAssignee,
  listProjects,
} from '../api';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

/**
 * MySchedulePage — `/schedule`：自分の予定 + 担当タスクをカレンダーで表示。
 *
 * - スケジュール：schedule_participants で自分が参加 or 自分が created_by
 * - タスク：assignee_id === 自分 で due_date が当該月のもの
 *
 * 月表示のグリッド。日セルをクリックするとその日の詳細をモーダルで表示。
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// ─── 日付ユーティリティ ───
const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameYmd = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** その月のグリッドに表示する日付配列（前月末・翌月頭で 6 行 × 7 列を埋める） */
function buildMonthGrid(year, month /* 0-11 */) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0=日
  const grid = [];
  // 前月のはみ出し
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    grid.push({ date: d, inMonth: false });
  }
  // 当月
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    grid.push({ date: new Date(year, month, i), inMonth: true });
  }
  // 翌月で 42 セル（6 週）まで埋める
  while (grid.length < 42) {
    const last = grid[grid.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    grid.push({ date: d, inMonth: false });
  }
  return grid;
}

export default function MySchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [today] = useState(() => startOfDay(new Date()));
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const [allSchedules, setAllSchedules] = useState([]); // 自分が参加 or 自分が作成
  const [tasks, setTasks]               = useState([]);
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // クリックされた日（モーダル）
  const [selectedDate, setSelectedDate] = useState(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // 自分の参加中のスケジュール ID を取得
      const myParticipations = await listSchedulesByUser(user.id);
      const myScheduleIds = new Set(myParticipations.map(p => p.schedule_id));

      const [allSched, myTasks, pj] = await Promise.all([
        listSchedules({ limit: 500 }),
        listTasksByAssignee(user.id),
        listProjects({ limit: 200 }),
      ]);

      // 自分が参加 or 作成のスケジュールに絞る
      const mySchedules = allSched.filter(s =>
        myScheduleIds.has(s.id) || s.created_by === user.id
      );

      setAllSchedules(mySchedules);
      setTasks(myTasks);
      setProjects(pj);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  // ─── 派生：日付 → イベント配列 ───
  const eventsByDate = useMemo(() => {
    const map = new Map(); // 'YYYY-MM-DD' → { schedules: [], tasks: [] }
    const ensure = (key) => {
      if (!map.has(key)) map.set(key, { schedules: [], tasks: [] });
      return map.get(key);
    };
    for (const s of allSchedules) {
      if (!s.start_at) continue;
      const key = ymd(new Date(s.start_at));
      ensure(key).schedules.push(s);
    }
    for (const t of tasks) {
      if (!t.due_date) continue;
      ensure(t.due_date).tasks.push(t);
    }
    // 各日のスケジュールを開始時刻順
    for (const [, v] of map) {
      v.schedules.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    }
    return map;
  }, [allSchedules, tasks]);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor.year, cursor.month]);

  const goPrev = () => setCursor(c => {
    const m = c.month - 1;
    return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
  });
  const goNext = () => setCursor(c => {
    const m = c.month + 1;
    return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
  });
  const goToday = () => {
    const t = new Date();
    setCursor({ year: t.getFullYear(), month: t.getMonth() });
  };

  if (!user) return null;

  const monthLabel = `${cursor.year}年 ${cursor.month + 1}月`;
  const selectedEvents = selectedDate ? (eventsByDate.get(ymd(selectedDate)) || { schedules: [], tasks: [] }) : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: 'clamp(1.05rem, 4vw, 1.5rem)',
        fontWeight: 700,
        color: C.text,
        margin: 0,
        marginBottom: S.l,
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <Calendar size={22} color={C.accent} />
        スケジュール
      </h1>

      {/* 月ナビゲーション */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        marginBottom: S.m,
        flexWrap: 'wrap',
      }}>
        <Button size="sm" variant="secondary" Icon={ChevronLeft} onClick={goPrev}>前月</Button>
        <Button size="sm" variant="secondary" onClick={goToday}>今月</Button>
        <Button size="sm" variant="secondary" onClick={goNext}>翌月 <ChevronRight size={14} /></Button>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: C.text,
          marginLeft: S.s,
        }}>
          {monthLabel}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: C.textSub, display: 'flex', gap: S.s, alignItems: 'center' }}>
          <Legend color={C.accent}>予定</Legend>
          <Legend color={C.orange}>タスク期限</Legend>
        </div>
      </div>

      {error ? (
        <Card>
          <div style={{ padding: S.l, textAlign: 'center', color: C.danger }}>
            {error}
            <div style={{ marginTop: S.s }}>
              <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          {loading && (
            <div style={{ padding: S.s, textAlign: 'center', color: C.textMuted, fontSize: '0.857rem' }}>
              読み込み中...
            </div>
          )}
          {/* 曜日ヘッダー */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px',
            background: C.border,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} style={{
                background: C.bgSub,
                padding: `${S.xs} 0`,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: i === 0 ? C.danger : (i === 6 ? C.accent : C.textSub),
              }}>
                {wd}
              </div>
            ))}
            {/* 日付セル */}
            {grid.map((cell, idx) => {
              const isToday = sameYmd(cell.date, today);
              const events = eventsByDate.get(ymd(cell.date));
              const dayOfWeek = cell.date.getDay();
              const dateColor = !cell.inMonth
                ? C.textMuted
                : (dayOfWeek === 0 ? C.danger : (dayOfWeek === 6 ? C.accent : C.text));
              return (
                <DayCell
                  key={idx}
                  cell={cell}
                  isToday={isToday}
                  events={events}
                  dateColor={dateColor}
                  onClick={() => setSelectedDate(cell.date)}
                />
              );
            })}
          </div>
        </Card>
      )}

      {/* 日詳細モーダル */}
      <Modal
        open={!!selectedDate}
        title={selectedDate ? `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1}月 ${selectedDate.getDate()}日 の予定・タスク` : ''}
        onClose={() => setSelectedDate(null)}
        width="600px"
      >
        {selectedEvents && (
          <DayDetail
            events={selectedEvents}
            projectById={projectById}
            onProjectOpen={(projectId) => { setSelectedDate(null); navigate(`/projects/${projectId}`); }}
          />
        )}
      </Modal>
    </div>
  );
}

function Legend({ color, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
      }} />
      {children}
    </span>
  );
}

function DayCell({ cell, isToday, events, dateColor, onClick }) {
  const totalEvents = (events?.schedules?.length || 0) + (events?.tasks?.length || 0);
  return (
    <button
      onClick={onClick}
      style={{
        background: cell.inMonth ? C.surface : C.bg,
        border: 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        minHeight: '90px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: cell.inMonth ? 1 : 0.5,
        outline: isToday ? `2px solid ${C.accent}` : 'none',
        outlineOffset: '-2px',
        position: 'relative',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (cell.inMonth) e.currentTarget.style.background = C.bg; }}
      onMouseLeave={e => { e.currentTarget.style.background = cell.inMonth ? C.surface : C.bg; }}
    >
      <div style={{
        fontSize: '0.75rem',
        fontWeight: isToday ? 700 : 500,
        color: dateColor,
      }}>
        {cell.date.getDate()}
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflow: 'hidden',
      }}>
        {events?.schedules?.slice(0, 2).map(s => (
          <EventChip key={`s-${s.id}`} color={C.accent} label={s.title} />
        ))}
        {events?.tasks?.slice(0, 2).map(t => (
          <EventChip key={`t-${t.id}`} color={C.orange} label={`📌 ${t.name}`} />
        ))}
        {totalEvents > 4 && (
          <div style={{ fontSize: '0.65rem', color: C.textMuted }}>
            他 {totalEvents - 4} 件
          </div>
        )}
      </div>
    </button>
  );
}

function EventChip({ color, label }) {
  return (
    <div style={{
      fontSize: '0.65rem',
      color: '#fff',
      background: color,
      padding: '1px 4px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {label}
    </div>
  );
}

function DayDetail({ events, projectById, onProjectOpen }) {
  const { schedules, tasks } = events;
  const empty = schedules.length === 0 && tasks.length === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: S.m, minHeight: '120px' }}>
      {empty && (
        <div style={{ padding: S.l, textAlign: 'center', color: C.textMuted, fontSize: '0.857rem' }}>
          この日の予定・タスクはありません
        </div>
      )}

      {schedules.length > 0 && (
        <section>
          <SectionHeader>予定</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.xs }}>
            {schedules.map(s => (
              <div key={s.id} style={{
                padding: S.s,
                borderRadius: '6px',
                background: C.bg,
                display: 'flex',
                gap: S.s,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  flexShrink: 0,
                  width: '88px',
                  color: C.accent,
                  fontSize: '0.857rem',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatTime(s.start_at)}
                  <div style={{ color: C.textMuted, fontWeight: 400, fontSize: '0.75rem' }}>
                    〜 {formatTime(s.end_at)}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                    {s.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: S.s,
                    marginTop: '2px',
                    fontSize: '0.75rem',
                    color: C.textSub,
                    flexWrap: 'wrap',
                  }}>
                    {s.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <MapPin size={12} />{s.location}
                      </span>
                    )}
                    {s.project_id && projectById.get(s.project_id) && (
                      <button
                        onClick={() => onProjectOpen(s.project_id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: C.accent,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.75rem',
                        }}
                      >
                        <FolderOpen size={12} />{projectById.get(s.project_id).name}
                      </button>
                    )}
                  </div>
                  {s.memo && (
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: C.textSub, whiteSpace: 'pre-wrap' }}>
                      {s.memo}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tasks.length > 0 && (
        <section>
          <SectionHeader>タスク期限</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.xs }}>
            {tasks.map(t => (
              <div key={t.id} style={{
                padding: S.s,
                borderRadius: '6px',
                background: C.bg,
                display: 'flex',
                gap: S.s,
                alignItems: 'flex-start',
              }}>
                <CheckSquare size={16} color={C.orange} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                    {t.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: S.xs,
                    marginTop: '2px',
                    fontSize: '0.75rem',
                    color: C.textSub,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {projectById.get(t.project_id) && (
                      <button
                        onClick={() => onProjectOpen(t.project_id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          color: C.accent,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.75rem',
                        }}
                      >
                        <FolderOpen size={12} />{projectById.get(t.project_id).name}
                      </button>
                    )}
                    {t.priority && <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>}
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: '0.75rem',
      fontWeight: 700,
      color: C.textSub,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: S.xs,
    }}>
      {children}
    </div>
  );
}
