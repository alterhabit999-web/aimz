import React, { useState } from 'react';
import { GanttChartSquare, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { tasksByProject, canCreateTask, computedProgress } from '../../../data/dummy';
import { useAuth } from '../../../contexts/AuthContext';
import Badge, { statusVariant, priorityVariant } from '../../ui/Badge';
import Button from '../../ui/Button';
import { formatShortDate } from '../../../utils/format';
import TaskDetailModal from '../../tasks/TaskDetailModal';

/**
 * GanttTab — ガントチャートタブ（プレースホルダー実装）。
 * 行クリックでタスク詳細モーダル。本格的なバー描画は別フェーズで実装。
 */
export default function GanttTab({ project }) {
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
      <PlaceholderNote>
        本格的なバー描画・今日線・ドラッグ移動は別フェーズで実装します。現在は対象タスクの簡易表示。
      </PlaceholderNote>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: S.m,
        marginBottom: S.s,
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
        <EmptyTasks />
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {tasks.map((t, i) => {
            const progress = computedProgress(t);
            return (
              <div
                key={t.id}
                onClick={() => openEdit(t)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: S.m,
                  alignItems: 'center',
                  padding: `${S.s} ${S.m}`,
                  borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                  fontSize: '0.857rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontWeight: 700, color: C.text }}>{t.name}</span>
                <span style={{ color: C.textSub, fontVariantNumeric: 'tabular-nums' }}>
                  {formatShortDate(t.start_date)} → {formatShortDate(t.due_date)}
                </span>
                {t.priority && (
                  <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                )}
                <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                <span style={{
                  fontWeight: 700,
                  color: progress === 100 ? C.success : C.text,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '40px',
                  textAlign: 'right',
                }}>
                  {progress}%
                </span>
              </div>
            );
          })}
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
      <GanttChartSquare size={14} />
      {children}
    </div>
  );
}

function EmptyTasks() {
  return (
    <div style={{
      padding: S.xl,
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: '8px',
      color: C.textMuted,
      textAlign: 'center',
      marginTop: S.m,
    }}>
      まだタスクが登録されていません
    </div>
  );
}
