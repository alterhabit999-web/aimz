import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { C, S } from '../../styles/tokens';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { myNotifications } from '../../data/dummy';

/**
 * AppShell — ログイン後の全ページに共通する枠組み。
 * 左：Sidebar / 上：Header / 中央：各ページ（<Outlet />）
 */
export default function AppShell() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const unreadCount = myNotifications(user?.id).filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar open={sidebarOpen} user={user} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          user={user}
          unreadCount={unreadCount}
        />

        <main style={{ flex: 1, overflow: 'auto', padding: S.l }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
