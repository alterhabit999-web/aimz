import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, UserPlus, MessageSquare } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { myNotifications } from '../../data/dummy';
import { formatTimeAgo } from '../../utils/format';

/**
 * NotificationsWidget — お知らせ（アプリ内通知）。
 * 未読件数バッジ付き。クリックで通知ページへ。
 * 仕様 3-10-5。
 */
export default function NotificationsWidget() {
  const { user } = useAuth();
  const notifications = myNotifications(user?.id)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card
      title="お知らせ"
      Icon={Bell}
      action={unreadCount > 0 ? (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: '10px',
          background: C.danger,
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}>
          未読 {unreadCount}
        </span>
      ) : null}
    >
      {notifications.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          お知らせはありません
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
          {notifications.slice(0, 5).map(n => <NotificationRow key={n.id} notification={n} />)}
        </ul>
      )}

      {notifications.length > 5 && (
        <Link
          to="/notifications"
          style={{
            display: 'block',
            marginTop: S.s,
            textAlign: 'center',
            color: C.textLink,
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
            padding: S.xs,
          }}
        >
          すべての通知を見る
        </Link>
      )}
    </Card>
  );
}

const TYPE_ICON = {
  task_assigned: UserPlus,
  due_reminder:  Clock,
  comment:       MessageSquare,
};

function NotificationRow({ notification }) {
  const Icon = TYPE_ICON[notification.type] || Bell;
  const isUnread = !notification.is_read;

  return (
    <li style={{
      display: 'flex',
      gap: S.s,
      padding: S.s,
      borderRadius: '6px',
      background: isUnread ? C.accentLight : 'transparent',
      borderLeft: isUnread ? `3px solid ${C.accent}` : '3px solid transparent',
    }}>
      <div style={{
        flexShrink: 0,
        color: isUnread ? C.accent : C.textMuted,
        marginTop: '2px',
      }}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.857rem',
          fontWeight: isUnread ? 700 : 400,
          color: C.text,
        }}>
          {notification.title}
        </div>
        {notification.body && (
          <div style={{
            fontSize: '0.75rem',
            color: C.textSub,
            marginTop: '2px',
          }}>
            {notification.body}
          </div>
        )}
      </div>
      <div style={{
        flexShrink: 0,
        fontSize: '0.75rem',
        color: C.textMuted,
        whiteSpace: 'nowrap',
      }}>
        {formatTimeAgo(notification.created_at)}
      </div>
    </li>
  );
}
