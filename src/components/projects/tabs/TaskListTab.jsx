import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Avatar from '../../ui/Avatar';
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
import useReloadOnFocus from '../../../hooks/useReloadOnFocus';

/**
 * TaskListTab — 案件詳細「タスク一覧」タブ。
 *
 * - 当該案件のタスクを Appwrite から取得
 * - クリック / ＋ボタンで TaskDetailModal を開いて作成・編集
 * - 親タスク + 小タスクを同時に保存（API 内で差分同期）
 */
export default function TaskListTab({ project }) {
  const { user } = useAuth();

  const [tasks, setTasks]               = useState([]);
  const [subtasksByTaskMap, setStMap]   = useState(new Map()); // taskId → subtasks[]
  const [profiles, setProfiles]         = useState([]);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);

  // 権限：admin or 案件チームメンバー
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
      // 各タスクの小タスクを並行取得
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
  useReloadOnFocus(reload);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const openCreate = () => {
    setSelectedTask(null);
    setModalMode('create');
    setModalOpen(true);
  };
  const openEdit = (task) => {
    // 既存の小タスクを混ぜて initial に渡す
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
        order_index: tasks.length, // 末尾に追加
        created_by: user?.id || null,
      });
      if (subtasks?.length) {
        await setSubtasksForTask(created.id, subtasks);
      }
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

  const editable = allowCreate;

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
          <div style={{ marginTop: S.s }}>
            <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
          </div>
        </div>
      ) : loading ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
          読み込み中...
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState onCreate={allowCreate ? openCreate : null} />
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'auto',
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
                <TaskRow
                  key={t.id}
                  task={t}
                  subtasks={subtasksByTaskMap.get(t.id) || []}
                  profileById={profileById}
                  onClick={() => openEdit(t)}
                />
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
        teamMembers={teamMembers}
        profiles={profiles}
        editable={editable}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function TaskRow({ task, subtasks, profileById, onClick }) {
  const assignee = task.assignee_id ? profileById.get(task.assignee_id) : null;
  const completedSubtasks = subtasks.filter(s => s.is_completed).length;
  const progress = task.progress_mode === 'auto'
    ? (subtasks.length === 0 ? 0 : Math.round((completedSubtasks / subtasks.length) * 100))
    : (task.progress_rate ?? 0);

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
