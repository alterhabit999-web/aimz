import React from 'react';
import { C, S } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import { formatLongDate } from '../utils/format';

import TodayScheduleWidget from '../components/dashboard/TodayScheduleWidget';
import UpcomingTasksWidget from '../components/dashboard/UpcomingTasksWidget';
import MyTasksWidget from '../components/dashboard/MyTasksWidget';
import ProjectsProgressWidget from '../components/dashboard/ProjectsProgressWidget';
import NotificationsWidget from '../components/dashboard/NotificationsWidget';

/**
 * DashboardPage — トップ画面。仕様 3-10。
 *
 * レイアウト：
 *   挨拶 + 日付
 *   ┌──────────────┬──────────────┐
 *   │ 本日のスケジュール │ お知らせ        │
 *   ├──────────────┼──────────────┤
 *   │ 期限が迫るタスク │ 担当プロジェクト │
 *   ├──────────────┴──────────────┤
 *   │ 自分の担当タスク（横長）          │
 *   └─────────────────────────┘
 */
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* 挨拶 */}
      <div style={{ marginBottom: S.l }}>
        <h1 style={{
          fontSize: '1.5rem',
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
        <UpcomingTasksWidget />
        <ProjectsProgressWidget />
      </div>

      {/* 横長で最後に */}
      <div style={{ marginBottom: S.xl }}>
        <MyTasksWidget />
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
