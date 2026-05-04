import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  syncProjectStatusFromTasks,
} from '../../../api';
import useReloadOnFocus from '../../../hooks/useReloadOnFocus';

/**
 * KanbanTab — カンバンボード（DnD 対応）。
 *
 * - カラム間：ドラッグで status を変更
 * - 同カラム内：ドラッグで order_index を変更
 * - 楽観更新：UI 即時反映 → 背景で updateTask、失敗時はロールバック
 */
const COLUMNS = [
  { status: '未着手', color: C.textMuted },
  { status: '進行中', color: C.accent },
  { status: '完了',   color: C.success },
];
const STATUS_LIST = COLUMNS.map(c => c.status);

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

  // DnD 状態
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
  useReloadOnFocus(reload);

  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  // カラムごとのタスク（order_index 昇順）
  const tasksByCol = useMemo(() => {
    const map = new Map(STATUS_LIST.map(s => [s, []]));
    for (const t of tasks) {
      if (map.has(t.status)) map.get(t.status).push(t);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
    return map;
  }, [tasks]);

  const taskById = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const activeTask = activeId ? taskById.get(activeId) : null;

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

  // ─── DnD: ドラッグ終了 ───
  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskRef = taskById.get(active.id);
    if (!activeTaskRef) return;

    // over.id はタスク ID または カラム ID（"col-未着手" 形式）
    let toStatus, toIndex;
    if (typeof over.id === 'string' && over.id.startsWith('col-')) {
      // 空カラム or カラムドロップゾーンに直接ドロップ
      toStatus = over.id.slice(4);
      toIndex = (tasksByCol.get(toStatus) || []).length;
    } else {
      const overTask = taskById.get(over.id);
      if (!overTask) return;
      toStatus = overTask.status;
      const list = tasksByCol.get(toStatus) || [];
      toIndex = list.findIndex(t => t.id === overTask.id);
      if (toIndex < 0) toIndex = list.length;
    }

    const fromStatus = activeTaskRef.status;
    const fromList = (tasksByCol.get(fromStatus) || []).slice();
    const fromIndex = fromList.findIndex(t => t.id === active.id);

    if (fromStatus === toStatus && fromIndex === toIndex) return;

    // 楽観更新：tasks を新しい順序で組み立て
    const before = tasks;
    let nextTasks;
    if (fromStatus === toStatus) {
      // 同カラム内：arrayMove
      const moved = arrayMove(fromList, fromIndex, toIndex);
      const otherTasks = tasks.filter(t => t.status !== fromStatus);
      nextTasks = [
        ...otherTasks,
        ...moved.map((t, i) => ({ ...t, order_index: i })),
      ];
    } else {
      // カラム間：active のステータスを変えて新カラムに挿入
      const newSrcList = fromList.filter(t => t.id !== active.id);
      const toListBase = (tasksByCol.get(toStatus) || []).slice();
      const movedTask = { ...activeTaskRef, status: toStatus };
      toListBase.splice(toIndex, 0, movedTask);

      const otherTasks = tasks.filter(t => t.status !== fromStatus && t.status !== toStatus);
      nextTasks = [
        ...otherTasks,
        ...newSrcList.map((t, i) => ({ ...t, order_index: i })),
        ...toListBase.map((t, i) => ({ ...t, order_index: i })),
      ];
    }
    setTasks(nextTasks);

    // 背景で DB 反映
    try {
      // 変更があったタスクだけ updateTask を呼ぶ
      const beforeMap = new Map(before.map(t => [t.id, t]));
      for (const nt of nextTasks) {
        const ot = beforeMap.get(nt.id);
        if (!ot) continue;
        const changed = ot.status !== nt.status || (ot.order_index || 0) !== (nt.order_index || 0);
        if (changed) {
          await updateTask(nt.id, {
            status: nt.status,
            order_index: nt.order_index,
          });
        }
      }
      // ステータス変更があった場合はプロジェクトステータスも同期
      if (fromStatus !== toStatus) {
        await syncProjectStatusFromTasks(project.id);
      }
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました：' + (err?.message || err));
      setTasks(before); // ロールバック
    }
  };

  return (
    <div>
      {error ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.danger, marginTop: S.m }}>
          {error}
        </div>
      ) : loading ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted, marginTop: S.m }}>
          読み込み中...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
            gap: S.s,
            overflowX: 'auto',
          }}>
            {COLUMNS.map(col => {
              const colTasks = tasksByCol.get(col.status) || [];
              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  color={col.color}
                  tasks={colTasks}
                  subtasksByTaskMap={subtasksByTaskMap}
                  profileById={profileById}
                  allowCreate={allowCreate}
                  onCardClick={openEdit}
                  onAddClick={() => openCreate(col.status)}
                />
              );
            })}
          </div>

          {/* ドラッグ中のオーバーレイ（見栄え向上） */}
          <DragOverlay>
            {activeTask ? (
              <KanbanCardView
                task={activeTask}
                subtasks={subtasksByTaskMap.get(activeTask.id) || []}
                profileById={profileById}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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

// ============================================================
// カラム
// ============================================================
function KanbanColumn({ status, color, tasks, subtasksByTaskMap, profileById, allowCreate, onCardClick, onAddClick }) {
  // カラム自体を droppable にするため、空カラムでもドロップ受け取り用に SortableContext + ダミー id を使う。
  // ここでは over.id がカラム ID になるよう、カラム末尾のドロップゾーンを別ノードで描く。
  const taskIds = tasks.map(t => t.id);

  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      padding: S.s,
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: S.s,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${S.xs}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
            {status}
          </span>
        </div>
        <span style={{ color: C.textMuted, fontSize: '0.75rem', fontWeight: 700 }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: S.s, flex: 1 }}>
          {tasks.map(t => (
            <SortableKanbanCard
              key={t.id}
              task={t}
              subtasks={subtasksByTaskMap.get(t.id) || []}
              profileById={profileById}
              onClick={() => onCardClick(t)}
            />
          ))}
          {/* 空カラム / 末尾ドロップゾーン用の id="col-XXX" */}
          <DropZone id={`col-${status}`} />
        </div>
      </SortableContext>

      {allowCreate && (
        <button
          type="button"
          onClick={onAddClick}
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
}

// ============================================================
// 末尾ドロップゾーン（カラム末尾 / 空カラム時の受け皿）
// ============================================================
function DropZone({ id }) {
  const { setNodeRef, isOver } = useSortable({ id, data: { type: 'column-end' } });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: '40px',
        border: isOver ? `2px dashed ${C.accent}` : `2px dashed transparent`,
        borderRadius: '6px',
        background: isOver ? C.accentLight : 'transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    />
  );
}

// ============================================================
// Sortable Card
// ============================================================
function SortableKanbanCard({ task, subtasks, profileById, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCardView
        task={task}
        subtasks={subtasks}
        profileById={profileById}
        onClick={onClick}
        dragHandleListeners={listeners}
      />
    </div>
  );
}

function KanbanCardView({ task, subtasks, profileById, onClick, dragHandleListeners, isDragOverlay }) {
  const assignee = task.assignee_id ? profileById.get(task.assignee_id) : null;
  const progress = task.progress_mode === 'auto'
    ? (subtasks.length === 0 ? 0 : Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100))
    : (task.progress_rate ?? 0);

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${isDragOverlay ? C.accent : C.border}`,
        borderRadius: '6px',
        padding: S.s,
        boxShadow: isDragOverlay ? C.shadow2 : C.shadow1,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        if (isDragOverlay) return;
        e.currentTarget.style.borderColor = C.accent;
        e.currentTarget.style.boxShadow = C.shadow2;
      }}
      onMouseLeave={e => {
        if (isDragOverlay) return;
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = C.shadow1;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
        {/* ドラッグハンドル */}
        {dragHandleListeners && (
          <button
            type="button"
            {...dragHandleListeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="ドラッグして移動"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'grab',
              color: C.textMuted,
              padding: '2px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div style={{
          flex: 1,
          minWidth: 0,
          fontSize: '0.857rem',
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.4,
        }}>
          {task.name}
        </div>
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
