import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { C, S, ICON_SM, ICON_MD } from '../../styles/tokens';
import Avatar from '../ui/Avatar';

/**
 * Header — 上部バー。
 * サイドバー開閉ボタン・通知ベル・自分のアバター。
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

      {/* 通知ベル（未読バッジ付き） */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Bell size={ICON_SM} color={C.textSub} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
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
      </div>

      <Avatar name={user?.full_name} size={28} />
    </header>
  );
}
