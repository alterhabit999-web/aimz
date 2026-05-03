import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import Badge, { statusVariant, priorityVariant } from '../ui/Badge';

const STATUS_ORDER = ['進行中', '未着手', '完了'];

/**
 * MyTasksWidget — 自分の担当タスクをステータス別にグルーピング表示。
 * 仕様 3-10-3。
 *
 * Props:
 *   groups: { '未着手': [...], '進行中': [...], '完了': [...] }
 *     各タスクに projectName を含めること
 *   loading: boolean
 */
export default function MyTasksWidget({ groups = {}, loading = false }) {
  const total = STATUS_ORDER.reduce((acc, s) => acc + (groups[s]?.length || 0), 0);

  return (
    <Card title="自分の担当タスク" Icon={CheckSquare}>
      {loading ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          読み込み中...
        </p>
      ) : total === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          担当タスクはありません
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          {STATUS_ORDER.map(status => {
            const tasks = groups[status] || [];
            if (tasks.length === 0) return null;
            return (
              <section key={status}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: S.xs,
                  marginBottom: S.xs,
                }}>
                  <Badge variant={statusVariant(status)}>{status}</Badge>
                  <span style={{ color: C.textMuted, fontSize: '0.75rem', fontWeight: 700 }}>
                    {tasks.length}件
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {tasks.slice(0, 4).map(t => <TaskRow key={t.id} task={t} />)}
                </ul>
                {tasks.length > 4 && (
                  <div style={{ color: C.textMuted, fontSize: '0.75rem', paddingLeft: S.s, marginTop: S.xs }}>
                    他 {tasks.length - 4} 件
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function TaskRow({ task }) {
  return (
    <li>
      <Link
        to={`/projects/${task.project_id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          padding: `4px ${S.s}`,
          borderRadius: '4px',
          textDecoration: 'none',
          color: 'inherit',
          background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.bg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.857rem',
            color: task.status === '完了' ? C.textMuted : C.text,
            textDecoration: task.status === '完了' ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {task.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '1px' }}>
            {task.projectName || '—'}
          </div>
        </div>
        {task.priority && (
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        )}
      </Link>
    </li>
  );
}
