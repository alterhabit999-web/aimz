import React, { useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { tasksByProject, findUser, canCreateTask, computedProgress } from '../../../data/dummy';
import { useAuth } from '../../../contexts/AuthContext';
import Avatar from '../../ui/Avatar';
import Badge, { priorityVariant } from '../../ui/Badge';
import { formatShortDate } from '../../../utils/format';
import TaskDetailModal from '../../tasks/TaskDetailModal';

/**
 * KanbanTab — カンバンボード（DnD なし、現状はカラム別表示）。
 * カードクリック → タスク詳細モーダル
 * カラム下「+ 新規」 → 該当ステータスでタスク作成モーダル
 *
 * 注：仕様書 3-4 の親タスクのステータスは「未着手 / 進行中 / 完了」の 3 種。
 *      「保留」は案件側のみ。カンバンはタスクのステータスを使うので 3 カラム構成にする。
 */
const COLUMNS = [
  { status: '未着手', color: C.textMuted },
  { status: '進行中', color: C.accent },
  { status: '完了',   color: C.success },
];

export default function KanbanTab({ project }) {
  const { user } = useAuth();
  const tasks = tasksByProject(project.id);
  const allowCreate = canCreateTask(user, project);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('未着手');

  const openCreate = (status) => {
    setSelectedTask(null);
    setDefaultStatus(status || '未着手');
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
      <PlaceholderNote>
        ドラッグ&ドロップは別フェーズで実装します。現在はカラム別表示のみ。
      </PlaceholderNote>

      <div style={{
        marginTop: S.m,
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
        gap: S.s,
        overflowX: 'auto',
      }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                padding: S.s,
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: S.s,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `0 ${S.xs}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: col.color,
                  }} />
                  <span style={{
                    fontSize: '0.857rem',
                    fontWeight: 700,
                    color: C.text,
                  }}>
                    {col.status}
                  </span>
                </div>
                <span style={{ color: C.textMuted, fontSize: '0.75rem', fontWeight: 700 }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: S.s }}>
                {colTasks.map(t => (
                  <KanbanCard key={t.id} task={t} onClick={() => openEdit(t)} />
                ))}
              </div>

              {allowCreate && (
                <button
                  type="button"
                  onClick={() => openCreate(col.status)}
                  style={{
                    marginTop: 'auto',
                    padding: '6px 8px',
                    background: 'transparent',
                    border: `1px dashed ${C.border}`,
                    borderRadius: '6px',
                    color: C.textSub,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.accent;
                    e.currentTarget.style.color = C.accent;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.textSub;
                  }}
                >
                  <Plus size={12} />
                  新規
                </button>
              )}
            </div>
          );
        })}
      </div>

      <TaskDetailModal
        open={modalOpen}
        mode={modalMode}
        project={project}
        initial={selectedTask}
        defaultStatus={defaultStatus}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function KanbanCard({ task, onClick }) {
  const assignee = task.assignee_id ? findUser(task.assignee_id) : null;
  const progress = computedProgress(task);

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '6px',
        padding: S.s,
        boxShadow: C.shadow1,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.accent;
        e.currentTarget.style.boxShadow = C.shadow2;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = C.shadow1;
      }}
    >
      <div style={{
        fontSize: '0.857rem',
        fontWeight: 700,
        color: C.text,
        lineHeight: 1.4,
      }}>
        {task.name}
      </div>

      {/* 進捗バー（小さく） */}
      {progress > 0 && (
        <div style={{
          height: '3px',
          background: C.bgSub,
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 ? C.success : C.accent,
          }} />
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: S.xs,
      }}>
        <div>
          {task.priority && (
            <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: C.textSub }}>
          {task.due_date ? formatShortDate(task.due_date) : ''}
        </div>
        {assignee && <Avatar name={assignee.full_name} size={20} />}
      </div>
    </div>
  );
}

function PlaceholderNote({ children }) {
  return (
    <div style={{
      padding: S.s,
      background: C.warningBg,
      border: `1px solid ${C.warning}`,
      borderRadius: '6px',
      color: '#7a5b00',
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: S.xs,
    }}>
      <LayoutGrid size={14} />
      {children}
    </div>
  );
}
