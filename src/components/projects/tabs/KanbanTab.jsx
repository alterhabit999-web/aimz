import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Avatar from '../../ui/Avatar';
import Badge, { priorityVariant } from '../../ui/Badge';
import { formatShortDate } from '../../../utils/format';
import TaskDetailModal from '../../tasks/TaskDetailModal';
import {
  listTasksByProject,
  listSubtasksByTask,
  listProfiles,
  listAllTeamMembers,
  createTask,
  updateTask,
  deleteTask,
  setSubtasksForTask,
  deleteAllSubtasksForTask,
} from '../../../api';

/**
 * KanbanTab — 案件詳細「カンバン」タブ。
 * カラム別表示。DnD は別フェーズ。
 */
const COLUMNS = [
  { status: '未着手', color: C.textMuted },
  { status: '進行中', color: C.accent },
  { status: '完了',   color: C.success },
];

export default function KanbanTab({ project }) {
  const { user } = useAuth();

  const [tasks, setTasks]               = useState([]);
  const [subtasksByTaskMap, setStMap]   = useState(new Map());
  const [profiles, setProfiles]         = useState([]);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('未着手');

  const allowCreate = useMemo(() => {
    if (!user) return false;
    if (user.is_admin) return true;
    return teamMembers.some(m => m.user_id === user.id && m.team_id === project.team_id);
  }, [user, teamMembers, project.team_id]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ts, pr, tm] = await Promise.all([
        listTasksByProject(project.id),
        listProfiles({ limit: 200 }),
        listAllTeamMembers(),
      ]);
      const stEntries = await Promise.all(
        ts.map(async t => [t.id, await listSubtasksByTask(t.id)])
      );
      setTasks(ts);
      setStMap(new Map(stEntries));
      setProfiles(pr);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { reload(); }, [reload]);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const openCreate = (status) => {
    setSelectedTask(null);
    setDefaultStatus(status || '未着手');
    setModalMode('create');
    setModalOpen(true);
  };
  const openEdit = (task) => {
    setSelectedTask({ ...task, subtasks: subtasksByTaskMap.get(task.id) || [] });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSubmit = async ({ task, subtasks }) => {
    if (modalMode === 'edit' && task.id) {
      const { id, ...patch } = task;
      await updateTask(id, patch);
      await setSubtasksForTask(id, subtasks);
    } else {
      const created = await createTask({
        ...task,
        order_index: tasks.length,
        created_by: user?.id || null,
      });
      if (subtasks?.length) await setSubtasksForTask(created.id, subtasks);
    }
    await reload();
  };
  const handleDelete = async (task) => {
    if (!task) return;
    await deleteAllSubtasksForTask(task.id);
    await deleteTask(task.id);
    await reload();
  };

  return (
    <div>
      <PlaceholderNote>
        ドラッグ&ドロップは別フェーズで実装します。現在はカラム別表示のみ。
      </PlaceholderNote>

      {error ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.danger, marginTop: S.m }}>
          {error}
        </div>
      ) : loading ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted, marginTop: S.m }}>
          読み込み中...
        </div>
      ) : (
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                      {col.status}
                    </span>
                  </div>
                  <span style={{ color: C.textMuted, fontSize: '0.75rem', fontWeight: 700 }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: S.s }}>
                  {colTasks.map(t => (
                    <KanbanCard
                      key={t.id}
                      task={t}
                      subtasks={subtasksByTaskMap.get(t.id) || []}
                      profileById={profileById}
                      onClick={() => openEdit(t)}
                    />
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
      )}

      <TaskDetailModal
        open={modalOpen}
        mode={modalMode}
        project={project}
        initial={selectedTask}
        defaultStatus={defaultStatus}
        teamMembers={teamMembers}
        profiles={profiles}
        editable={allowCreate}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function KanbanCard({ task, subtasks, profileById, onClick }) {
  const assignee = task.assignee_id ? profileById.get(task.assignee_id) : null;
  const progress = task.progress_mode === 'auto'
    ? (subtasks.length === 0 ? 0 : Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100))
    : (task.progress_rate ?? 0);

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
