import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  UserPlus,
  MessageSquare,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import {
  myNotifications,
  findTask,
  findProject,
} from '../data/dummy';
import { formatTimeAgo } from '../utils/format';

/**
 * NotificationsPage — 通知一覧（仕様 3-15）。
 *
 *   - フィルター：すべて / 未読 / タイプ別
 *   - クリックで関連の案件 / タスクへ遷移
 *   - 既読化（ローカル状態）／全部既読
 */
const TYPE_ICON = {
  task_assigned: UserPlus,
  due_reminder:  Clock,
  comment:       MessageSquare,
};

const TYPE_LABEL = {
  task_assigned: 'タスクアサイン',
  due_reminder:  '期限リマインド',
  comment:       'コメント',
};

const FILTERS = [
  { id: 'all',           label: 'すべて' },
  { id: 'unread',        label: '未読のみ' },
  { id: 'task_assigned', label: 'タスクアサイン' },
  { id: 'due_reminder',  label: '期限リマインド' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 通知をローカル state に取り込む（dummy データは const なのでミュータブルに扱う）
  const initial = useMemo(
    () => myNotifications(user?.id).slice().sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [user]
  );
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    if (filter === 'all')    return items;
    if (filter === 'unread') return items.filter(n => !n.is_read);
    return items.filter(n => n.type === filter);
  }, [items, filter]);

  const unreadCount = items.filter(n => !n.is_read).length;

  const markRead = (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (n) => {
    markRead(n.id);
    if (n.related_type === 'project' && n.related_id) {
      navigate(`/projects/${n.related_id}`);
    } else if (n.related_type === 'task' && n.related_id) {
      const task = findTask(n.related_id);
      if (task) navigate(`/projects/${task.project_id}`);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: S.m,
        marginBottom: S.l,
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: 0 }}>
            通知
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            タスクアサイン・期限リマインドなどのお知らせ
            {unreadCount > 0 && (
              <span style={{ color: C.danger, fontWeight: 700, marginLeft: S.s }}>
                未読 {unreadCount} 件
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" Icon={CheckCheck} onClick={markAllRead}>
            すべて既読にする
          </Button>
        )}
      </div>

      {/* フィルター */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: S.m,
        flexWrap: 'wrap',
      }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentLight : C.surface,
                color: active ? C.accent : C.textSub,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              {f.label}
              {f.id === 'unread' && unreadCount > 0 && (
                <span style={{
                  marginLeft: '4px',
                  padding: '0 5px',
                  background: active ? C.accent : C.bgSub,
                  color: active ? '#fff' : C.textSub,
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 通知リスト */}
      {visible.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
          {visible.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => handleClick(n)}
              onMarkRead={() => markRead(n.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick, onMarkRead }) {
  const Icon = TYPE_ICON[notification.type] || Bell;
  const unread = !notification.is_read;

  // 関連先のサブテキスト
  let relatedLabel = null;
  if (notification.related_type === 'task') {
    const t = findTask(notification.related_id);
    if (t) {
      const p = findProject(t.project_id);
      relatedLabel = p ? `案件：${p.name}` : null;
    }
  } else if (notification.related_type === 'project') {
    const p = findProject(notification.related_id);
    relatedLabel = p ? `案件：${p.name}` : null;
  }

  return (
    <li>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          gap: S.s,
          padding: S.m,
          background: unread ? C.accentLight : C.surface,
          border: `1px solid ${unread ? C.accent : C.border}`,
          borderLeftWidth: '4px',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadow1}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {/* タイプアイコン */}
        <div style={{
          flexShrink: 0,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: unread ? C.accent : C.bgSub,
          color: unread ? '#fff' : C.textSub,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={ICON_SM} strokeWidth={2} />
        </div>

        {/* 本文 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: S.s, marginBottom: '2px' }}>
            <span style={{
              fontSize: '0.7rem',
              color: C.textMuted,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '3px',
              background: C.bgSub,
            }}>
              {TYPE_LABEL[notification.type] || '通知'}
            </span>
          </div>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: unread ? 700 : 400,
            color: C.text,
            lineHeight: 1.4,
          }}>
            {notification.title}
          </div>
          {notification.body && (
            <div style={{
              fontSize: '0.857rem',
              color: C.textSub,
              marginTop: '2px',
              lineHeight: 1.5,
            }}>
              {notification.body}
            </div>
          )}
          {relatedLabel && (
            <div style={{
              fontSize: '0.75rem',
              color: C.textMuted,
              marginTop: S.xs,
            }}>
              {relatedLabel}
            </div>
          )}
        </div>

        {/* 時刻と既読化ボタン */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: S.xs,
        }}>
          <span style={{ fontSize: '0.75rem', color: C.textMuted, whiteSpace: 'nowrap' }}>
            {formatTimeAgo(notification.created_at)}
          </span>
          {unread && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
              style={{
                fontSize: '0.7rem',
                color: C.accent,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              既読にする
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({ filter }) {
  const labelMap = {
    all:           '通知はまだありません',
    unread:        '未読の通知はありません',
    task_assigned: 'アサイン関連の通知はありません',
    due_reminder:  '期限関連の通知はありません',
  };
  return (
    <div style={{
      padding: S.xxl,
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: '8px',
      textAlign: 'center',
      color: C.textMuted,
    }}>
      <Inbox size={36} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.s }} />
      <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
        {labelMap[filter] || '通知はありません'}
      </div>
    </div>
  );
}
