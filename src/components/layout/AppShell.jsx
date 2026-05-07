import React, { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { C, S } from '../../styles/tokens';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import {
  listNotificationsForUser,
  listAllTeamMembers,
  listTeams,
  listDepartments,
} from '../../api';
import useReloadOnFocus from '../../hooks/useReloadOnFocus';
import useIsCompact from '../../hooks/useIsCompact';

/**
 * AppShell — ログイン後の全ページに共通する枠組み。
 * 左：Sidebar / 上：Header / 中央：各ページ（<Outlet />）
 *
 * AppShell 自身が以下を取得して Sidebar / Header に props で渡す：
 *   - 自分の未読通知数
 *   - 自分の所属部署一覧（teams + team_members + departments から派生）
 * フォーカス時に自動再読込（v12 useReloadOnFocus）。
 */
export default function AppShell() {
  const { user } = useAuth();
  const isCompact = useIsCompact();
  // 狭い時はサイドバーを初期非表示にしてメイン領域を確保する
  const [sidebarOpen, setSidebarOpen] = useState(!isCompact);

  const [unreadCount, setUnreadCount]       = useState(0);
  const [myDepartments, setMyDepartments]   = useState([]);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [notifs, teams, deptList, teamMembers] = await Promise.all([
        listNotificationsForUser(user.id, { limit: 100 }),
        listTeams(),
        listDepartments(),
        listAllTeamMembers(),
      ]);
      // 未読数
      setUnreadCount(notifs.filter(n => !n.is_read).length);

      // 自分の所属チームから部署 ID を集約 → 部署一覧を解決
      const myTeamIds = new Set(
        teamMembers.filter(m => m.user_id === user.id).map(m => m.team_id)
      );
      const myDeptIds = new Set(
        teams.filter(t => myTeamIds.has(t.id)).map(t => t.department_id)
      );
      setMyDepartments(deptList.filter(d => myDeptIds.has(d.id)));
    } catch (err) {
      console.error('AppShell reload:', err);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar open={sidebarOpen} user={user} departments={myDepartments} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          user={user}
          unreadCount={unreadCount}
        />

        <main style={{ flex: 1, overflow: 'auto', padding: isCompact ? S.s : S.l }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
