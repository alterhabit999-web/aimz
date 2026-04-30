import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import Badge, { priorityVariant } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { upcomingTasks, findProject, daysUntil } from '../../data/dummy';
import { formatDueRelative, formatShortDate } from '../../utils/format';

/**
 * UpcomingTasksWidget — 期限が迫る自分のタスク一覧。
 * 期限超過 + 今後7日以内を期限が近い順に表示。
 * 仕様 3-10-2。
 */
export default function UpcomingTasksWidget() {
  const { user } = useAuth();
  const tasks = upcomingTasks(user?.id, 7);

  return (
    <Card title="期限が迫るタスク" Icon={Clock}>
      {tasks.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          1週間以内に期限のタスクはありません
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
          {tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </ul>
      )}
    </Card>
  );
}

function TaskRow({ task }) {
  const project = findProject(task.project_id);
  const days = daysUntil(task.due_date);
  const isOverdue = days < 0;
  const isUrgent = !isOverdue && days <= 3;

  const dueColor = isOverdue ? C.danger : isUrgent ? C.orange : C.textSub;
  const dueIcon  = isOverdue ? AlertCircle : Clock;
  const DueIcon  = dueIcon;

  return (
    <li>
      <Link
        to={`/projects/${task.project_id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          padding: S.s,
          borderRadius: '6px',
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
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {task.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '2px' }}>
            {project?.name}
          </div>
        </div>

        {task.priority && (
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          color: dueColor,
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          minWidth: '70px',
          justifyContent: 'flex-end',
        }}>
          <DueIcon size={12} />
          <span title={formatShortDate(task.due_date)}>
            {formatDueRelative(days)}
          </span>
        </div>
      </Link>
    </li>
  );
}
