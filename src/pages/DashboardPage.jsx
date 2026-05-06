import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { C, S } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import { formatLongDate } from '../utils/format';
import {
  listTasks,
  listProjects,
  listAllTeamMembers,
} from '../api';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

import TodayScheduleWidget from '../components/dashboard/TodayScheduleWidget';
import UpcomingTasksWidget from '../components/dashboard/UpcomingTasksWidget';
import MyTasksWidget from '../components/dashboard/MyTasksWidget';
import ProjectsProgressWidget from '../components/dashboard/ProjectsProgressWidget';
import NotificationsWidget from '../components/dashboard/NotificationsWidget';

/**
 * DashboardPage — トップ画面。仕様 3-10。
 *
 * 残ウィジェット（UpcomingTasks / MyTasks / ProjectsProgress）の派生データを
 * このページで一括ロード + useMemo で組み立てて props で渡す。
 * TodayScheduleWidget / NotificationsWidget は内部で個別にロード（別データ）。
 */
const STATUS_ORDER = ['進行中', '未着手', '完了'];

// 期限までの日数（'YYYY-MM-DD' 想定）
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [tasks, setTasks]             = useState([]);
  const [projects, setProjects]       = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]         = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p, tm] = await Promise.all([
        listTasks(),
        listProjects({ limit: 200 }),
        listAllTeamMembers(),
      ]);
      setTasks(t);
      setProjects(p);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // ─── 派生データ ───
  const view = useMemo(() => {
    const projectById = new Map(projects.map(p => [p.id, p]));

    // 自分の担当タスク
    const myTasks = tasks.filter(t => t.assignee_id === user?.id);

    // 期限が近い順にソート（未完了 + due_date あり + 7日以内）
    const upcoming = myTasks
      .filter(t => t.status !== '完了' && t.due_date)
      .map(t => ({
        ...t,
        days: daysUntil(t.due_date),
        projectName: projectById.get(t.project_id)?.name || '',
      }))
      .filter(t => t.days != null && t.days <= 7) // 期限超過 + 7 日以内
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);

    // ステータス別グルーピング（projectName を組み込んで渡す）
    const grouped = { 進行中: [], 未着手: [], 完了: [] };
    for (const t of myTasks) {
      if (!grouped[t.status]) continue;
      grouped[t.status].push({
        ...t,
        projectName: projectById.get(t.project_id)?.name || '',
      });
    }
    // 期限が近い順に整列（完了は updated 降順を簡易的に order_index で）
    for (const k of STATUS_ORDER) {
      grouped[k].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    }

    // 自分のチームの案件 + 進捗（タスクの progress_rate 平均）
    const myTeamIds = new Set(
      teamMembers.filter(m => m.user_id === user?.id).map(m => m.team_id)
    );
    const myProjects = projects.filter(p => myTeamIds.has(p.team_id));
    const tasksByProj = new Map();
    for (const t of tasks) {
      const arr = tasksByProj.get(t.project_id) || [];
      arr.push(t);
      tasksByProj.set(t.project_id, arr);
    }
    const enrichedProjects = myProjects.map(p => {
      const arr = tasksByProj.get(p.id) || [];
      const progress = arr.length === 0
        ? 0
        : Math.round(arr.reduce((acc, t) => acc + (t.progress_rate || 0), 0) / arr.length);
      return { ...p, progress };
    });

    return { upcoming, grouped, enrichedProjects };
  }, [tasks, projects, teamMembers, user?.id]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* 挨拶 */}
      <div style={{ marginBottom: S.l }}>
        <h1 style={{
          fontSize: 'clamp(1.05rem, 4vw, 1.5rem)',
          fontWeight: 700,
          color: C.text,
          margin: 0,
        }}>
          {greetingByHour()}、{user?.full_name} さん
        </h1>
        <p style={{
          color: C.textSub,
          fontSize: '0.857rem',
          marginTop: S.xs,
          marginBottom: 0,
        }}>
          {formatLongDate(new Date())}
        </p>
      </div>

      {/* グリッド */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: S.m,
        marginBottom: S.m,
      }}>
        <TodayScheduleWidget />
        <NotificationsWidget />
        <UpcomingTasksWidget tasks={view.upcoming} loading={loading} />
        <ProjectsProgressWidget projects={view.enrichedProjects} loading={loading} />
      </div>

      {/* 横長で最後に */}
      <div style={{ marginBottom: S.xl }}>
        <MyTasksWidget groups={view.grouped} loading={loading} />
      </div>
    </div>
  );
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 5)  return 'こんばんは';
  if (h < 11) return 'おはようございます';
  if (h < 18) return 'こんにちは';
  return 'こんばんは';
}
