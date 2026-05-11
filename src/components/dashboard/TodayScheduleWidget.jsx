import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users as UsersIcon, CheckSquare, FolderOpen } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import Badge, { statusVariant, priorityVariant } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import {
  listSchedulesOnDate,
  listAllScheduleParticipants,
  listTasksByAssignee,
  listProjects,
} from '../../api';
import { formatTime } from '../../utils/format';
import useReloadOnFocus from '../../hooks/useReloadOnFocus';

/**
 * TodayScheduleWidget — ダッシュボードの「本日の予定・タスク」（v19 で拡張）。
 *
 * 仕様：
 *   - 上段「予定」：schedules.start_at が今日（0:00〜翌 0:00）の予定をタイムライン表示
 *   - 下段「タスク」：自分担当（assignee_id === user.id）かつ
 *     start_date ≤ 今日 ≤ due_date のタスク（status !== '完了'）
 *     ＝ 「本日アクティブなタスク」を案 B で抽出
 */
export default function TodayScheduleWidget() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [participantCountById, setParticipantCountById] = useState(new Map());
  const [activeTasks, setActiveTasks] = useState([]);
  const [projectById, setProjectById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 自分担当タスクは user がいないと取れないので並列化を分ける
      const tasksPromise = user?.id ? listTasksByAssignee(user.id) : Promise.resolve([]);
      const [list, participants, myTasks, projects] = await Promise.all([
        listSchedulesOnDate(todayStr),
        listAllScheduleParticipants({ limit: 1000 }),
        tasksPromise,
        listProjects({ limit: 200 }),
      ]);

      // 予定の参加者数
      const counts = new Map();
      for (const p of participants) {
        counts.set(p.schedule_id, (counts.get(p.schedule_id) || 0) + 1);
      }

      // 案件 ID → 案件
      const pMap = new Map(projects.map(p => [p.id, p]));

      // 本日アクティブなタスクを抽出
      // 'YYYY-MM-DD' 同士の文字列比較で日付の前後判定が可能
      const active = myTasks.filter(t => {
        if (t.status === '完了') return false;
        const hasStart = !!t.start_date;
        const hasDue   = !!t.due_date;
        // 期間指定無し → 今日アクティブとは言えないので除外
        if (!hasStart && !hasDue) return false;
        if (hasStart && t.start_date > todayStr) return false;  // まだ開始前
        if (hasDue   && t.due_date   < todayStr) return false;  // 既に期限切れ
        return true;
      }).sort((a, b) => {
        // 優先度の高い順、次に期限の近い順
        const prRank = { '高': 0, '中': 1, '低': 2 };
        const pa = prRank[a.priority] ?? 1;
        const pb = prRank[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        const da = a.due_date || '9999-12-31';
        const db = b.due_date || '9999-12-31';
        return da.localeCompare(db);
      });

      setSchedules(list);
      setParticipantCountById(counts);
      setActiveTasks(active);
      setProjectById(pMap);
    } catch (err) {
      console.error(err);
      setError(err?.message || '本日の予定・タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [todayStr, user?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  const totalCount = schedules.length + activeTasks.length;

  return (
    <Card title="本日の予定・タスク" Icon={Calendar}>
      {loading ? (
        <EmptyState>読み込み中...</EmptyState>
      ) : error ? (
        <EmptyState danger>{error}</EmptyState>
      ) : totalCount === 0 ? (
        <EmptyState>今日の予定・担当タスクはありません</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          {/* 予定セクション */}
          {schedules.length > 0 && (
            <Section title="予定" count={schedules.length}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.s }}>
                {schedules.map(s => (
                  <ScheduleRow
                    key={s.id}
                    schedule={s}
                    participantCount={participantCountById.get(s.id) || 0}
                  />
                ))}
              </ul>
            </Section>
          )}

          {/* タスクセクション */}
          {activeTasks.length > 0 && (
            <Section title="本日アクティブな担当タスク" count={activeTasks.length}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.s }}>
                {activeTasks.map(t => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    project={projectById.get(t.project_id)}
                    todayStr={todayStr}
                  />
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </Card>
  );
}

function Section({ title, count, children }) {
  return (
    <section>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: C.textSub,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: S.xs,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {title}
        <span style={{
          background: C.bgSub,
          color: C.textSub,
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '0 6px',
          borderRadius: '8px',
        }}>
          {count}
        </span>
      </div>
      {children}
    </section>
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

function TaskRow({ task, project, todayStr }) {
  const dueToday = task.due_date === todayStr;
  const linkTo = task.project_id ? `/projects/${task.project_id}` : '/tasks';
  return (
    <li>
      <Link
        to={linkTo}
        style={{
          display: 'flex',
          gap: S.m,
          padding: S.s,
          borderRadius: '6px',
          background: C.bg,
          textDecoration: 'none',
          color: 'inherit',
          alignItems: 'flex-start',
        }}
      >
        <CheckSquare size={16} color={dueToday ? C.orange : C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.857rem',
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {task.name}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.xs,
            marginTop: '2px',
            fontSize: '0.75rem',
            color: C.textSub,
            flexWrap: 'wrap',
          }}>
            {project && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <FolderOpen size={11} />
                {project.name}
              </span>
            )}
            {task.priority && <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>}
            <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
            {dueToday && (
              <span style={{ color: C.orange, fontWeight: 700 }}>本日が期限</span>
            )}
          </div>
        </div>
      </Link>
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
