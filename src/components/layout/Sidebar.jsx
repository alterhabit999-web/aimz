import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Bell,
  Settings,
  UserCog,
  Building2,
  Users,
  BarChart2,
  ChevronRight,
  User,
} from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Avatar from '../ui/Avatar';
import SectionLabel from '../ui/SectionLabel';

/**
 * Sidebar — 左側のナビゲーション。
 * 仕様 v1.3：
 *   - ロゴ直下に所属部署名を小さく表示（複数所属なら "/" 区切りで併記）
 *   - メニュー順：ダッシュボード → 案件一覧 → チーム → 通知
 *   - 管理者：管理者ダッシュボード / ユーザー管理 / 部署管理
 *   - アカウント：マイページ
 *
 * Props:
 *   open: boolean
 *   user: 自分の profile
 *   departments: 自分の所属部署配列（AppShell で実 DB から取得して渡す）
 */
export default function Sidebar({ open, user, departments = [] }) {
  if (!open) return null;

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
        padding: `${S.l} ${S.m} ${S.s}`,
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

      {/* 所属部署（小さく） */}
      {departments.length > 0 && (
        <div style={{
          padding: `0 ${S.m} ${S.m}`,
          borderBottom: `1px solid ${C.border}`,
          fontSize: '0.75rem',
          color: C.textSub,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}>
          <Building2 size={11} color={C.textMuted} />
          {departments.map((d, i) => (
            <React.Fragment key={d.id}>
              {i > 0 && <span style={{ color: C.textMuted }}>/</span>}
              <span>{d.name}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: S.s, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <SectionLabel>メニュー</SectionLabel>
        <NavItem to="/dashboard"     label="ダッシュボード" Icon={LayoutDashboard} />
        <NavItem to="/projects"      label="案件一覧"       Icon={FolderOpen} />
        <NavItem to="/teams"         label="チーム"         Icon={Users} />
        <NavItem to="/notifications" label="通知"           Icon={Bell} />

        {user?.is_admin && (
          <>
            <SectionLabel style={{ marginTop: S.m }}>管理者</SectionLabel>
            <NavItem to="/admin"             label="管理者ダッシュボード" Icon={Settings} />
            <NavItem to="/admin/users"       label="ユーザー管理"         Icon={UserCog} />
            <NavItem to="/admin/departments" label="部署管理"             Icon={Building2} />
          </>
        )}

        <SectionLabel style={{ marginTop: S.m }}>アカウント</SectionLabel>
        <NavItem to="/profile" label="マイページ" Icon={User} />
      </nav>

      {/* ユーザー情報 */}
      <div style={{
        padding: S.m,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <Avatar name={user?.full_name} src={user?.avatar_url} size={32} />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            fontSize: '0.857rem',
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {user?.full_name}
          </div>
          {user?.is_admin && (
            <div style={{ fontSize: '0.75rem', color: C.accent }}>管理者</div>
          )}
        </div>
        <ChevronRight size={14} color={C.textMuted} />
      </div>
    </aside>
  );
}

// ============================================================
// NavLink ベースのアクティブ判定対応ナビ項目
// ============================================================
function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        width: '100%',
        padding: `7px ${S.m}`,
        background: isActive ? C.accentLight : 'transparent',
        color: isActive ? C.accent : C.textSub,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.857rem',
        fontWeight: isActive ? 700 : 400,
        textAlign: 'left',
        textDecoration: 'none',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={ICON_SM} strokeWidth={isActive ? 2.2 : 1.8} />
          {label}
        </>
      )}
    </NavLink>
  );
}
