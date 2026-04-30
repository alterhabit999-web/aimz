import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/layout/RequireAuth';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersPage from './pages/admin/UsersPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import NotFoundPage from './pages/NotFoundPage';

import './App.css';

/**
 * App — アプリのルート。ルーティングと AuthProvider を組み立てる。
 *
 * ルート構成（仕様 v1.3）：
 *   /login                    （未ログインのみ）
 *   /                         → /dashboard
 *   /dashboard                ダッシュボード
 *   /projects                 案件一覧
 *   /projects/:projectId      案件詳細
 *   /teams                    チーム（チーム一覧＋メンバー一覧）
 *   /notifications            通知
 *   /profile                  マイページ
 *   /admin                    管理者ダッシュボード（admin のみ）
 *   /admin/users              ユーザー管理（admin のみ）
 *   /admin/departments        部署管理（admin のみ）
 *
 * GitHub Pages 配下（/aimz）でも動くように basename を設定。
 */
const BASENAME = process.env.PUBLIC_URL || '';

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <AuthProvider>
        <Routes>
          {/* 未ログインでもアクセス可 */}
          <Route path="/login" element={<LoginPage />} />

          {/* ログイン必須エリア */}
          <Route element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"             element={<DashboardPage />} />
            <Route path="/projects"              element={<ProjectsPage />} />
            <Route path="/projects/:projectId"   element={<ProjectDetailPage />} />
            <Route path="/teams"                 element={<TeamsPage />} />
            <Route path="/notifications"         element={<NotificationsPage />} />
            <Route path="/profile"               element={<ProfilePage />} />

            {/* /departments の旧ルートは /teams にリダイレクト */}
            <Route path="/departments" element={<Navigate to="/teams" replace />} />

            {/* 管理者専用 */}
            <Route path="/admin" element={
              <RequireAuth requireAdmin><AdminDashboardPage /></RequireAuth>
            } />
            <Route path="/admin/users" element={
              <RequireAuth requireAdmin><UsersPage /></RequireAuth>
            } />
            <Route path="/admin/departments" element={
              <RequireAuth requireAdmin><AdminDepartmentsPage /></RequireAuth>
            } />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
