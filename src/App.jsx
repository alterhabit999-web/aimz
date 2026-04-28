import React, { useState } from 'react';
import {
  Menu,
  LayoutDashboard,
  Building2,
  FolderOpen,
  Bell,
  Settings,
  Users,
  Calendar,
  Clock,
  BarChart2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import './App.css';

// ============================================================
// デザインシステム — SmartHR Design System ベース
// 参照: ./DESIGN.md
// ============================================================
const C = {
  // 背景
  bg:          '#f8f7f6',   // ページ全体の背景（Stone 01）
  bgSub:       '#edebe8',   // サイドバー・テーブルヘッダー背景（Stone 02）
  surface:     '#ffffff',   // カード・入力欄・コンポーネントの背景

  // アクセント（ブランドカラー）
  accent:      '#0077c7',   // ボタン・アクティブ・フォーカス（Product Main）
  accentLight: '#e8f4fb',   // アクセントの薄い版（選択状態の背景など）
  brand:       '#00c4cc',   // ブランドカラー（ロゴ・チャート用。UIには使わない）

  // ステータスカラー
  success:     '#4bb47d',
  successBg:   '#edfaf3',
  warning:     '#ffcc17',
  warningBg:   '#fffbea',
  danger:      '#e01e5a',
  dangerBg:    '#fdeef4',
  orange:      '#ff9900',
  orangeBg:    '#fff5e6',

  // テキスト
  text:        '#23221e',   // 本文・見出し（Text Black）
  textSub:     '#706d65',   // サブテキスト・ラベル（Text Grey）
  textMuted:   '#aaa69f',   // 補助テキスト（Stone 03）
  textDisabled:'#c1bdb7',   // 無効状態（Text Disabled）
  textLink:    '#0071c1',   // テキストリンク

  // ボーダー・シャドウ
  border:      '#d6d3d0',
  borderFocus: '#0077c7',
  shadow1:     '0 2px 4px rgba(0,0,0,0.1)',
  shadow2:     '0 4px 8px rgba(0,0,0,0.15)',
};

// ============================================================
// スペーシング（8px ベース）
// ============================================================
const S = {
  xs:  '4px',
  s:   '8px',
  m:   '16px',
  l:   '24px',
  xl:  '32px',
  xxl: '40px',
};

// アイコンサイズの標準値
const ICON_SM = 16;
const ICON_MD = 18;

// ============================================================
// ダミーデータ（開発確認用）
// ============================================================
const DUMMY_USER = {
  name: '山田 太郎',
  email: 'yamada@example.com',
  isAdmin: true,
};

// ============================================================
// メインアプリ
// ============================================================
export default function App() {
  const [currentUser] = useState(DUMMY_USER);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* サイドバー */}
      <Sidebar
        open={sidebarOpen}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={currentUser}
      />

      {/* メインコンテンツ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ヘッダー */}
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          user={currentUser}
        />

        {/* ページ本体 */}
        <main style={{ flex: 1, overflow: 'auto', padding: S.l }}>
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'login'     && <LoginPage onLogin={() => setCurrentPage('dashboard')} />}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// サイドバー
// ============================================================
function Sidebar({ open, currentPage, onNavigate, user }) {
  if (!open) return null;

  const NavItem = ({ label, page, Icon }) => {
    const active = currentPage === page;
    return (
      <button
        onClick={() => onNavigate(page)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          width: '100%',
          padding: `7px ${S.m}`,
          background: active ? C.accentLight : 'transparent',
          color: active ? C.accent : C.textSub,
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.857rem',
          fontWeight: active ? 700 : 400,
          textAlign: 'left',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <Icon size={ICON_SM} strokeWidth={active ? 2.2 : 1.8} />
        {label}
      </button>
    );
  };

  return (
    <aside style={{
      width: '220px',
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* ロゴ */}
      <div style={{
        padding: `${S.l} ${S.m}`,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <BarChart2 size={22} color={C.accent} strokeWidth={2.5} />
        <span style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: C.accent,
          letterSpacing: '-0.01em',
        }}>
          AimZ
        </span>
      </div>

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: S.s, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <SectionLabel>メニュー</SectionLabel>
        <NavItem label="ダッシュボード" page="dashboard"   Icon={LayoutDashboard} />
        <NavItem label="部署・チーム"   page="departments" Icon={Building2} />
        <NavItem label="案件一覧"       page="projects"    Icon={FolderOpen} />
        <NavItem label="通知"           page="notifications" Icon={Bell} />

        {user?.isAdmin && (
          <>
            <SectionLabel style={{ marginTop: S.m }}>管理者</SectionLabel>
            <NavItem label="管理者ダッシュボード" page="admin" Icon={Settings} />
            <NavItem label="ユーザー管理"         page="users" Icon={Users} />
          </>
        )}
      </nav>

      {/* ユーザー情報 */}
      <div style={{
        padding: S.m,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <Avatar name={user?.name} size={32} />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            fontSize: '0.857rem',
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {user?.name}
          </div>
          {user?.isAdmin && (
            <div style={{ fontSize: '0.75rem', color: C.accent }}>管理者</div>
          )}
        </div>
        <ChevronRight size={14} color={C.textMuted} />
      </div>
    </aside>
  );
}

// ============================================================
// ヘッダー
// ============================================================
function Header({ onToggleSidebar, user }) {
  return (
    <header style={{
      height: '56px',
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${S.l}`,
      gap: S.m,
      flexShrink: 0,
    }}>
      <button
        onClick={onToggleSidebar}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: C.textSub,
          padding: S.xs,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="サイドバーを開閉"
      >
        <Menu size={ICON_MD} />
      </button>
      <div style={{ flex: 1 }} />
      <Bell size={ICON_SM} color={C.textSub} />
      <Avatar name={user?.name} size={28} />
    </header>
  );
}

// ============================================================
// ダッシュボードページ（仮）
// ============================================================
function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: S.l }}>
        ダッシュボード
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: S.m,
      }}>
        <Card title="本日のスケジュール" Icon={Calendar}>
          <p style={{ color: C.textSub, fontSize: '0.857rem' }}>
            今日の予定はここに表示されます
          </p>
        </Card>
        <Card title="期限が迫るタスク" Icon={Clock}>
          <p style={{ color: C.textSub, fontSize: '0.857rem' }}>
            3日以内・1週間以内の期限タスクが表示されます
          </p>
        </Card>
        <Card title="担当プロジェクト" Icon={FolderOpen}>
          <p style={{ color: C.textSub, fontSize: '0.857rem' }}>
            自分が担当する案件の進捗が表示されます
          </p>
        </Card>
      </div>

      {/* 開発ステータス */}
      <div style={{
        marginTop: S.xl,
        padding: S.l,
        background: C.surface,
        borderRadius: '8px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow1,
        display: 'flex',
        gap: S.m,
        alignItems: 'flex-start',
      }}>
        <AlertTriangle size={18} color={C.orange} style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: S.xs }}>
            開発中
          </h2>
          <p style={{ color: C.textSub, fontSize: '0.857rem', lineHeight: 1.6 }}>
            AimZ は現在開発中です。このページはデザインシステムの確認用サンプルです。<br />
            Claude Code での開発を進めていきます。
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ログインページ（仮）
// ============================================================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '1rem',
    color: C.text,
    background: C.surface,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: C.surface,
        borderRadius: '8px',
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow2,
        padding: S.xl,
      }}>
        {/* ロゴ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: S.s, marginBottom: S.xs }}>
          <BarChart2 size={28} color={C.accent} strokeWidth={2.5} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>AimZ</span>
        </div>
        <p style={{ color: C.textSub, fontSize: '0.857rem', textAlign: 'center', marginBottom: S.xl }}>
          案件・タスク管理
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.857rem',
              fontWeight: 700,
              color: C.text,
              marginBottom: S.xs,
            }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.857rem',
              fontWeight: 700,
              color: C.text,
              marginBottom: S.xs,
            }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            onClick={onLogin}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: C.accent,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: S.xs,
            }}
          >
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 汎用コンポーネント
// ============================================================

function Card({ title, Icon, children }) {
  return (
    <div style={{
      background: C.surface,
      borderRadius: '8px',
      border: `1px solid ${C.border}`,
      boxShadow: C.shadow1,
      padding: S.l,
    }}>
      <h2 style={{
        fontSize: '0.857rem',
        fontWeight: 700,
        color: C.text,
        marginBottom: S.m,
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
      }}>
        {Icon && <Icon size={ICON_SM} color={C.accent} strokeWidth={2} />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: C.accent,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {name?.[0] ?? '?'}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      color: C.textMuted,
      fontSize: '0.667rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      padding: `${S.s} ${S.s}`,
      textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </div>
  );
}
