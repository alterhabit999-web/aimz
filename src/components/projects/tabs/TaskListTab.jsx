import React, { useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { tasksByProject, findUser, subtasksByTask, canCreateTask, computedProgress } from '../../../data/dummy';
import { useAuth } from '../../../contexts/AuthContext';
import Avatar from '../../ui/Avatar';
import Badge, { statusVariant, priorityVariant } from '../../ui/Badge';
import Button from '../../ui/Button';
import { formatShortDate } from '../../../utils/format';
import TaskDetailModal from '../../tasks/TaskDetailModal';

/**
 * TaskListTab — タスク一覧タブ。
 * 行クリックでタスク詳細モーダルを開く。+ 新規ボタンで作成モーダルを開く。
 */
export default function TaskListTab({ project }) {
  const { user } = useAuth();
  const tasks = tasksByProject(project.id);
  const allowCreate = canCreateTask(user, project);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);

  const openCreate = () => {
    setSelectedTask(null);
    setModalMode('create');
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSubmit = (data) => {
    console.log(modalMode === 'edit' ? 'タスク更新（ダミー）:' : 'タスク作成（ダミー）:', data);
    alert(`タスク「${data.task.name}」を${modalMode === 'edit' ? '更新' : '作成'}しました（※ダミー）`);
  };
  const handleDelete = (task) => {
    console.log('タスク削除（ダミー）:', task);
    alert(`タスク「${task.name}」を削除しました（※ダミー）`);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: S.m,
      }}>
        <div style={{ color: C.textSub, fontSize: '0.857rem' }}>
          {tasks.length} 件のタスク
        </div>
        {allowCreate && (
          <Button size="sm" Icon={Plus} onClick={openCreate}>
            タスクを追加
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState onCreate={allowCreate ? openCreate : null} />
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: C.shadow1,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.857rem' }}>
            <thead>
              <tr style={{ background: C.bgSub }}>
                <Th>タスク名</Th>
                <Th>担当者</Th>
                <Th>期間</Th>
                <Th>優先度</Th>
                <Th>ステータス</Th>
                <Th align="right">進捗</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <TaskRow key={t.id} task={t} onClick={() => openEdit(t)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailModal
        open={modalOpen}
        mode={modalMode}
        project={project}
        initial={selectedTask}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function TaskRow({ task, onClick }) {
  const assignee = task.assignee_id ? findUser(task.assignee_id) : null;
  const subtasks = subtasksByTask(task.id);
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const progress = computedProgress(task);

  return (
    <tr
      onClick={onClick}
      style={{
        borderTop: `1px solid ${C.border}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Td>
        <div style={{ fontWeight: 700, color: C.text }}>{task.name}</div>
        {subtasks.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
            color: C.textMuted,
            fontSize: '0.75rem',
          }}>
            <CheckSquare size={12} />
            <span>{completedSubtasks} / {subtasks.length} 小タスク完了</span>
          </div>
        )}
      </Td>
      <Td>
        {assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Avatar name={assignee.full_name} size={24} />
            <span style={{ color: C.text }}>{assignee.full_name}</span>
          </div>
        ) : (
          <span style={{ color: C.textMuted }}>未割当</span>
        )}
      </Td>
      <Td>
        <div style={{ color: C.textSub, fontVariantNumeric: 'tabular-nums' }}>
          {task.start_date ? formatShortDate(task.start_date) : '—'}
          {' → '}
          {task.due_date ? formatShortDate(task.due_date) : '—'}
        </div>
      </Td>
      <Td>
        {task.priority && <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>}
      </Td>
      <Td>
        <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
      </Td>
      <Td align="right">
        <span style={{
          fontWeight: 700,
          color: progress === 100 ? C.success : C.text,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress}%
        </span>
      </Td>
    </tr>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{
      padding: S.xxl,
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: '8px',
      color: C.textMuted,
      textAlign: 'center',
    }}>
      <CheckSquare size={36} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.s }} />
      <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: S.xs }}>
        まだタスクがありません
      </div>
      <p style={{ fontSize: '0.857rem', margin: `0 0 ${S.m}` }}>
        最初のタスクを追加しましょう
      </p>
      {onCreate && (
        <Button Icon={Plus} onClick={onCreate}>タスクを追加</Button>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th style={{
      padding: `${S.s} ${S.m}`,
      textAlign: align,
      fontWeight: 700,
      color: C.textSub,
      fontSize: '0.75rem',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }) {
  return (
    <td style={{
      padding: `${S.s} ${S.m}`,
      verticalAlign: 'middle',
      textAlign: align,
    }}>
      {children}
    </td>
  );
}
