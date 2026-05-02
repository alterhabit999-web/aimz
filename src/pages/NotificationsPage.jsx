import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  listProjects,
  getTask,
} from '../api';
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

  const [items, setItems]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [list, projs] = await Promise.all([
        listNotificationsForUser(user.id, { limit: 100 }),
        listProjects({ limit: 200 }),
      ]);
      setItems(list);
      setProjects(projs);
    } catch (err) {
      console.error(err);
      setError(err?.message || '通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const visible = useMemo(() => {
    if (filter === 'all')    return items;
    if (filter === 'unread') return items.filter(n => !n.is_read);
    return items.filter(n => n.type === filter);
  }, [items, filter]);

  const unreadCount = items.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    // Optimistic update
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await markNotificationRead(id, true);
    } catch (err) {
      console.error(err);
      // 失敗したら元に戻す
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    }
  };

  const markAllRead = async () => {
    const before = items;
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(user.id);
    } catch (err) {
      console.error(err);
      setItems(before);
    }
  };

  const handleClick = async (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.related_type === 'project' && n.related_id) {
      navigate(`/projects/${n.related_id}`);
    } else if (n.related_type === 'task' && n.related_id) {
      // タスクの親案件 ID を解決して遷移
      try {
        const task = await getTask(n.related_id);
        if (task?.project_id) navigate(`/projects/${task.project_id}`);
      } catch (err) { console.error(err); }
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
      {loading ? (
        <Notice>読み込み中...</Notice>
      ) : error ? (
        <Notice danger>
          {error}
          <div style={{ marginTop: S.s }}>
            <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
          </div>
        </Notice>
      ) : visible.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
          {visible.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              projectById={projectById}
              onClick={() => handleClick(n)}
              onMarkRead={() => markRead(n.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({ notification, projectById, onClick, onMarkRead }) {
  const Icon = TYPE_ICON[notification.type] || Bell;
  const unread = !notification.is_read;

  // 関連先のサブテキスト：project は projectById で解決、task は親案件まで辿らず簡易表示
  let relatedLabel = null;
  if (notification.related_type === 'project' && notification.related_id) {
    const p = projectById.get(notification.related_id);
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

function Notice({ children, danger }) {
  return (
    <div style={{
      padding: S.xl, textAlign: 'center',
      color: danger ? C.danger : C.textMuted,
    }}>
      {children}
    </div>
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
