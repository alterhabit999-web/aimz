import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, FolderOpen, ListChecks } from 'lucide-react';
import { C, S } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusVariant, priorityVariant } from '../components/ui/Badge';
import { formatShortDate } from '../utils/format';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import {
  listTasksByAssignee,
  listSubtasksByAssignee,
  listSubtasksByTask,
  listProjects,
  listProfiles,
  listAllTeamMembers,
  getTask,
  updateTask,
  updateSubtask,
  deleteTask,
  setSubtasksForTask,
  deleteAllSubtasksForTask,
  syncProjectStatusFromTasks,
} from '../api';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

/**
 * MyTasksPage — `/tasks`：自分が抱えているタスク・小タスクをまとめて確認・編集する。
 *
 * - 担当の親タスク：assignee_id === user.id
 * - 担当の小タスク：assignee_id === user.id
 *   ※ 親タスクが自分の担当でなくとも、小タスクが自分の担当なら表示する
 *   親タスクは「親情報＋進捗」、小タスクはチェックボックスでその場で完了切替
 *
 * 編集：
 *   - 親タスクの行をクリック → TaskDetailModal で編集
 *   - 小タスクの行をクリック → 親タスクの TaskDetailModal を開く（小タスクは親モーダル内で編集）
 *
 * グルーピング：案件（プロジェクト）単位、ステータスフィルター付き。
 */

const STATUS_FILTERS = [
  { key: 'all',         label: 'すべて' },
  { key: 'in_progress', label: '進行中・未着手' },
  { key: 'done',        label: '完了' },
];

export default function MyTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [parentTasks, setParentTasks]     = useState([]);   // 自分担当の親タスク
  const [mySubtasks, setMySubtasks]       = useState([]);   // 自分担当の小タスク
  const [parentByTaskId, setParentByTaskId] = useState(new Map()); // 小タスクの親解決用
  const [projects, setProjects]           = useState([]);
  const [profiles, setProfiles]           = useState([]);
  const [teamMembers, setTeamMembers]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const [statusFilter, setStatusFilter]   = useState('in_progress');

  // モーダル状態
  const [modalOpen, setModalOpen]         = useState(false);
  const [modalTask, setModalTask]         = useState(null);     // edit 対象（subtasks 含む）
  const [modalProject, setModalProject]   = useState(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [pt, mst, pj, pr, tm] = await Promise.all([
        listTasksByAssignee(user.id),
        listSubtasksByAssignee(user.id),
        listProjects({ limit: 200 }),
        listProfiles({ limit: 200 }),
        listAllTeamMembers(),
      ]);

      // 小タスクの親タスクを解決（親タスクが自分担当でないケースもあるため、別途取得）
      const ownedTaskIds = new Set(pt.map(t => t.id));
      const missingParentIds = [...new Set(mst.map(s => s.task_id))].filter(id => !ownedTaskIds.has(id));
      const fetchedParents = await Promise.all(missingParentIds.map(id => getTask(id).catch(() => null)));
      const parentMap = new Map(pt.map(t => [t.id, t]));
      for (const p of fetchedParents) if (p) parentMap.set(p.id, p);

      setParentTasks(pt);
      setMySubtasks(mst);
      setParentByTaskId(parentMap);
      setProjects(pj);
      setProfiles(pr);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  // ─── 派生：案件単位にグルーピング ───
  const groups = useMemo(() => {
    const filterTaskByStatus = (t) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'done') return t.status === '完了';
      return t.status !== '完了'; // in_progress
    };
    const filterSubtaskByStatus = (s) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'done') return !!s.is_completed;
      return !s.is_completed; // in_progress
    };

    // 案件 ID → { project, parents: [], subtasks: [] }
    const map = new Map();
    const ensure = (projectId) => {
      if (!map.has(projectId)) {
        map.set(projectId, {
          projectId,
          project: projectById.get(projectId) || null,
          parents: [],
          subtasks: [],
        });
      }
      return map.get(projectId);
    };

    for (const t of parentTasks) {
      if (!filterTaskByStatus(t)) continue;
      ensure(t.project_id).parents.push(t);
    }
    for (const s of mySubtasks) {
      if (!filterSubtaskByStatus(s)) continue;
      const parent = parentByTaskId.get(s.task_id);
      const projectId = parent?.project_id || '__unknown__';
      ensure(projectId).subtasks.push({ ...s, parentTask: parent });
    }

    // 並び順：案件名昇順
    return [...map.values()].sort((a, b) => {
      const an = a.project?.name || '不明な案件';
      const bn = b.project?.name || '不明な案件';
      return an.localeCompare(bn, 'ja');
    });
  }, [parentTasks, mySubtasks, parentByTaskId, projectById, statusFilter]);

  const totalCount = useMemo(() => {
    let n = 0;
    for (const g of groups) n += g.parents.length + g.subtasks.length;
    return n;
  }, [groups]);

  // ─── アクション ───
  const openTaskModal = async (task) => {
    const project = projectById.get(task.project_id);
    if (!project) {
      alert('案件情報が見つかりません');
      return;
    }
    // 既存の小タスクを取得
    const subs = await listSubtasksByTask(task.id);
    setModalTask({ ...task, subtasks: subs });
    setModalProject(project);
    setModalOpen(true);
  };

  const openParentModalForSubtask = async (subtask) => {
    const parent = parentByTaskId.get(subtask.task_id);
    if (!parent) {
      alert('親タスク情報が見つかりません');
      return;
    }
    await openTaskModal(parent);
  };

  const handleToggleSubtask = async (subtask, ev) => {
    ev.stopPropagation();
    try {
      await updateSubtask(subtask.id, { is_completed: !subtask.is_completed });
      // ローカル状態だけ更新（ちらつき防止）
      setMySubtasks(prev =>
        prev.map(s => s.id === subtask.id ? { ...s, is_completed: !subtask.is_completed } : s)
      );
      // 親タスクが progress_mode='auto' のときに進捗が変わるため、案件側のステータス同期は
      // モーダル経由で保存しないのでここではスキップ（次回 reload で反映）
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました：' + (err?.message || ''));
    }
  };

  const handleSubmitTask = async ({ task, subtasks }) => {
    if (!modalTask?.id) return;
    const { id, ...patch } = task;
    await updateTask(id, patch);
    await setSubtasksForTask(id, subtasks);
    if (modalProject?.id) await syncProjectStatusFromTasks(modalProject.id);
    await reload();
  };

  const handleDeleteTask = async (task) => {
    if (!task) return;
    await deleteAllSubtasksForTask(task.id);
    await deleteTask(task.id);
    if (modalProject?.id) await syncProjectStatusFromTasks(modalProject.id);
    await reload();
  };

  // 編集権限：自分担当のタスクは編集可（admin はもちろん可）
  const editable = true;

  if (!user) return null;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: 'clamp(1.05rem, 4vw, 1.5rem)',
        fontWeight: 700,
        color: C.text,
        margin: 0,
        marginBottom: S.l,
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <ListChecks size={22} color={C.accent} />
        タスク一覧
        <span style={{ fontSize: '0.857rem', color: C.textSub, fontWeight: 400 }}>
          {loading ? '' : `${totalCount} 件`}
        </span>
      </h1>

      {/* ステータスフィルター */}
      <div style={{ display: 'flex', gap: S.xs, marginBottom: S.m, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={statusFilter === f.key ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error ? (
        <Card>
          <div style={{ padding: S.l, textAlign: 'center', color: C.danger }}>
            {error}
            <div style={{ marginTop: S.s }}>
              <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
            </div>
          </div>
        </Card>
      ) : loading ? (
        <Card><div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>読み込み中...</div></Card>
      ) : groups.length === 0 ? (
        <Card>
          <div style={{ padding: S.xxl, textAlign: 'center', color: C.textMuted }}>
            <CheckSquare size={36} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.s }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: S.xs }}>
              {statusFilter === 'done' ? '完了したタスクはありません' : '担当しているタスクはありません'}
            </div>
            <p style={{ fontSize: '0.857rem', margin: 0 }}>
              案件詳細からタスクを作成・割り当てると、ここに表示されます
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.m }}>
          {groups.map(g => (
            <ProjectGroup
              key={g.projectId}
              group={g}
              onTaskClick={openTaskModal}
              onSubtaskClick={openParentModalForSubtask}
              onSubtaskToggle={handleToggleSubtask}
              onProjectOpen={g.project ? () => navigate(`/projects/${g.project.id}`) : null}
            />
          ))}
        </div>
      )}

      <TaskDetailModal
        open={modalOpen}
        mode="edit"
        project={modalProject}
        initial={modalTask}
        teamMembers={teamMembers}
        profiles={profiles}
        editable={editable}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

// ============================================================
// 案件グループ
// ============================================================
function ProjectGroup({ group, onTaskClick, onSubtaskClick, onSubtaskToggle, onProjectOpen }) {
  return (
    <Card>
      {/* グループヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        marginBottom: S.s,
        paddingBottom: S.s,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <FolderOpen size={16} color={C.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
            {group.project?.name || '不明な案件'}
          </div>
          {group.project && (
            <div style={{ fontSize: '0.75rem', color: C.textMuted }}>
              {group.parents.length} 件のタスク / {group.subtasks.length} 件の小タスク
            </div>
          )}
        </div>
        {onProjectOpen && (
          <Button size="sm" variant="secondary" onClick={onProjectOpen}>
            案件を開く
          </Button>
        )}
      </div>

      {/* 親タスク */}
      {group.parents.length > 0 && (
        <div style={{ marginBottom: group.subtasks.length > 0 ? S.m : 0 }}>
          <SectionHeader>担当タスク</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {group.parents.map(t => (
              <ParentTaskRow key={t.id} task={t} onClick={() => onTaskClick(t)} />
            ))}
          </div>
        </div>
      )}

      {/* 小タスク */}
      {group.subtasks.length > 0 && (
        <div>
          <SectionHeader>担当の小タスク</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {group.subtasks.map(s => (
              <SubtaskRow
                key={s.id}
                subtask={s}
                onClick={() => onSubtaskClick(s)}
                onToggle={(ev) => onSubtaskToggle(s, ev)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: '0.75rem',
      fontWeight: 700,
      color: C.textSub,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: S.xs,
    }}>
      {children}
    </div>
  );
}

function ParentTaskRow({ task, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        padding: `${S.s} ${S.s}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
          {task.name}
        </div>
        <div style={{
          display: 'flex',
          gap: S.s,
          marginTop: '2px',
          fontSize: '0.75rem',
          color: C.textSub,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {task.due_date ? <span>期限：{formatShortDate(task.due_date)}</span> : <span style={{ color: C.textMuted }}>期限なし</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: S.xs, alignItems: 'center', flexShrink: 0 }}>
        {task.priority && <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>}
        <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
      </div>
    </div>
  );
}

function SubtaskRow({ subtask, onClick, onToggle }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        padding: `${S.s} ${S.s}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <button
        onClick={onToggle}
        title={subtask.is_completed ? '完了を解除' : '完了にする'}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {subtask.is_completed
          ? <CheckSquare size={18} color={C.success} />
          : <Square size={18} color={C.textMuted} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.857rem',
          color: subtask.is_completed ? C.textMuted : C.text,
          textDecoration: subtask.is_completed ? 'line-through' : 'none',
        }}>
          {subtask.name}
        </div>
        <div style={{
          display: 'flex',
          gap: S.s,
          marginTop: '2px',
          fontSize: '0.75rem',
          color: C.textSub,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {subtask.parentTask && (
            <span style={{ color: C.textMuted }}>親：{subtask.parentTask.name}</span>
          )}
          {subtask.due_date && <span>期限：{formatShortDate(subtask.due_date)}</span>}
        </div>
      </div>
    </div>
  );
}
