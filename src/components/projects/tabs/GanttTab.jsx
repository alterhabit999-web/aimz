import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GanttChartSquare, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Badge, { statusVariant, priorityVariant } from '../../ui/Badge';
import Button from '../../ui/Button';
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
  syncProjectStatusFromTasks,
} from '../../../api';

/**
 * GanttTab — ガントチャートタブ（プレースホルダー実装）。
 * 行クリックでタスク詳細モーダル。本格的なバー描画は別フェーズで実装。
 */
export default function GanttTab({ project }) {
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

  const openCreate = () => {
    setSelectedTask(null);
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
    await syncProjectStatusFromTasks(project.id);
    await reload();
  };

  const handleDelete = async (task) => {
    if (!task) return;
    await deleteAllSubtasksForTask(task.id);
    await deleteTask(task.id);
    await syncProjectStatusFromTasks(project.id);
    await reload();
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
          {loading ? '読み込み中…' : `${tasks.length} 件のタスク`}
        </div>
        {allowCreate && (
          <Button size="sm" Icon={Plus} onClick={openCreate}>
            タスクを追加
          </Button>
        )}
      </div>

      {error ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.danger }}>
          {error}
        </div>
      ) : loading ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
          読み込み中...
        </div>
      ) : tasks.length === 0 ? (
        <EmptyTasks />
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {tasks.map((t, i) => {
            const sts = subtasksByTaskMap.get(t.id) || [];
            const progress = t.progress_mode === 'auto'
              ? (sts.length === 0 ? 0 : Math.round((sts.filter(s => s.is_completed).length / sts.length) * 100))
              : (t.progress_rate ?? 0);
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
