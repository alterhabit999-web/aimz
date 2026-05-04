import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { C, S, ICON_SM, ICON_MD } from '../../styles/tokens';
import Avatar from '../ui/Avatar';

/**
 * Header — 上部バー。
 * サイドバー開閉ボタン・通知ベル（クリックで /notifications）・自分のアバター。
 */
export default function Header({ onToggleSidebar, user, unreadCount = 0 }) {
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

      {/* 通知ベル（クリックで /notifications へ。未読バッジ付き） */}
      <NavLink
        to="/notifications"
        title={unreadCount > 0 ? `未読 ${unreadCount} 件` : '通知'}
        style={({ isActive }) => ({
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '6px',
          borderRadius: '6px',
          background: isActive ? C.accentLight : 'transparent',
          color: isActive ? C.accent : C.textSub,
          textDecoration: 'none',
          transition: 'background 0.15s, color 0.15s',
        })}
        onMouseEnter={e => {
          if (!e.currentTarget.dataset.active) e.currentTarget.style.background = C.bgSub;
        }}
        onMouseLeave={e => {
          if (!e.currentTarget.dataset.active) e.currentTarget.style.background = 'transparent';
        }}
      >
        <Bell size={ICON_SM} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            minWidth: '14px',
            height: '14px',
            padding: '0 3px',
            borderRadius: '7px',
            background: C.danger,
            color: '#fff',
            fontSize: '0.625rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </NavLink>

      <Avatar name={user?.full_name} src={user?.avatar_url} size={28} />
    </header>
  );
}
