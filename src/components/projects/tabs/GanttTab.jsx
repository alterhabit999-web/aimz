import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GanttChartSquare, Plus } from 'lucide-react';
import { C, S } from '../../../styles/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import Badge, { statusVariant } from '../../ui/Badge';
import Button from '../../ui/Button';
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
 * GanttTab — ガントチャート（PHASE 3 で本実装）。
 *
 * - タイムラインは案件の start_date 〜 end_date を 1 日単位で表示
 * - タスクごとに 1 行：左固定列（タスク名）+ バー（status 色 / 優先度色補助）
 * - 今日の縦線
 * - バーをドラッグで移動：中央=平行移動、左端=開始日のみ、右端=期限のみ
 * - ドロップ時に updateTask + syncProjectStatusFromTasks
 */

const DAY_MS = 1000 * 60 * 60 * 24;
const DAY_WIDTH = 32;       // 1 日あたりのピクセル幅
const ROW_HEIGHT = 36;      // 1 タスク行の高さ
const NAME_COL_WIDTH = 220; // 左固定列の幅
const HEADER_HEIGHT = 48;

// 'YYYY-MM-DD' → 0:00 のローカル日付
function toMidnight(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}
function dateAddDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}
function diffDays(a, b) {
  return Math.round((toMidnight(b) - toMidnight(a)) / DAY_MS);
}
function toIsoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ステータス色
const STATUS_BAR_COLOR = {
  '未着手': C.textMuted,
  '進行中': C.accent,
  '完了':   C.success,
};

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
  useReloadOnFocus(reload);

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

  // ─── ドラッグでタスクの日程を更新 ───
  const handleTaskDateUpdate = async (taskId, patch) => {
    // 楽観更新
    const before = tasks;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...patch } : t));
    try {
      await updateTask(taskId, patch);
    } catch (err) {
      console.error(err);
      alert('日程の更新に失敗しました：' + (err?.message || err));
      setTasks(before);
    }
  };

  // ─── タイムラインの期間 ───
  const timeline = useMemo(() => {
    const startStr = project.start_date || tasks[0]?.start_date || tasks[0]?.due_date;
    const endStr = project.end_date || tasks[tasks.length - 1]?.due_date || tasks[tasks.length - 1]?.start_date;
    if (!startStr || !endStr) return null;
    const start = toMidnight(startStr);
    const end = toMidnight(endStr);
    const totalDays = Math.max(1, diffDays(start, end) + 1);
    return { start, end, totalDays };
  }, [project.start_date, project.end_date, tasks]);

  return (
    <div>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
      ) : !timeline ? (
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
          案件に開始日・終了日が設定されていないため、タイムラインを表示できません
        </div>
      ) : (
        <GanttChart
          tasks={tasks}
          timeline={timeline}
          editable={allowCreate}
          onRowClick={openEdit}
          onUpdate={handleTaskDateUpdate}
        />
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

// ============================================================
// GanttChart 本体
// ============================================================
function GanttChart({ tasks, timeline, editable, onRowClick, onUpdate }) {
  const { start, totalDays } = timeline;
  const totalWidth = totalDays * DAY_WIDTH;

  // 今日の x 位置
  const todayOffset = diffDays(start, new Date());
  const showToday = todayOffset >= 0 && todayOffset < totalDays;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      overflow: 'auto',
      boxShadow: C.shadow1,
      maxHeight: '600px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${NAME_COL_WIDTH}px ${totalWidth}px`,
        minWidth: NAME_COL_WIDTH + totalWidth,
        position: 'relative', // 今日線を内部に絶対配置するため
      }}>
        {/* ヘッダー：タスク列 */}
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 3,
          height: HEADER_HEIGHT,
          background: C.bgSub,
          borderBottom: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${S.s}`,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: C.textSub,
        }}>
          タスク
        </div>

        {/* ヘッダー：日付ラベル */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          height: HEADER_HEIGHT,
          background: C.bgSub,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
        }}>
          {Array.from({ length: totalDays }, (_, i) => {
            const d = dateAddDays(start, i);
            const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isFirstOfMonth = d.getDate() === 1 || i === 0;
            return (
              <div
                key={i}
                style={{
                  width: DAY_WIDTH,
                  borderRight: `1px solid ${C.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: isWeekend ? C.danger : C.textSub,
                  background: isWeekend ? C.dangerBg : 'transparent',
                  position: 'relative',
                }}
              >
                {isFirstOfMonth && (
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: C.text,
                    position: 'absolute',
                    top: '4px',
                  }}>
                    {d.getMonth() + 1}月
                  </div>
                )}
                <div style={{ fontWeight: 700, marginTop: isFirstOfMonth ? '14px' : '0' }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: '0.65rem' }}>{dow}</div>
              </div>
            );
          })}
        </div>

        {/* タスク行 */}
        {tasks.map(task => (
          <React.Fragment key={task.id}>
            {/* 左固定：タスク名 */}
            <div
              onClick={() => onRowClick(task)}
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 1,
                height: ROW_HEIGHT,
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                borderRight: `1px solid ${C.border}`,
                padding: `0 ${S.s}`,
                display: 'flex',
                alignItems: 'center',
                gap: S.xs,
                fontSize: '0.857rem',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = C.surface}
            >
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              <span style={{
                flex: 1,
                color: C.text,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {task.name}
              </span>
            </div>

            {/* 右側：バー領域 */}
            <GanttRow
              task={task}
              start={start}
              totalDays={totalDays}
              editable={editable}
              onClick={() => onRowClick(task)}
              onUpdate={onUpdate}
            />
          </React.Fragment>
        ))}

        {/* 今日の縦線（全行を横断するため絶対配置） */}
        {showToday && (
          <div style={{
            position: 'absolute',
            top: HEADER_HEIGHT,
            left: NAME_COL_WIDTH + todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
            width: '2px',
            height: tasks.length * ROW_HEIGHT,
            background: C.danger,
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 1,
          }} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// GanttRow — 1 タスク分の横バー
// ============================================================
function GanttRow({ task, start, totalDays, editable, onClick, onUpdate }) {
  const containerRef = useRef(null);
  // ドラッグ直後の onClick を抑制するためのフラグ
  const wasDraggingRef = useRef(false);

  // ドラッグ状態
  const [drag, setDrag] = useState(null); // { mode: 'move' | 'left' | 'right', deltaDays, originalStart, originalEnd }

  const taskStart = task.start_date ? toMidnight(task.start_date) : null;
  const taskEnd   = task.due_date   ? toMidnight(task.due_date)   : null;

  // 期間がないタスクはバーを描画しない
  const hasBar = taskStart && taskEnd;

  // バーの位置（ドラッグ中はプレビュー位置を反映）
  const previewStart = hasBar ? (drag ? dateAddDays(taskStart, drag.shiftStart || 0) : taskStart) : null;
  const previewEnd   = hasBar ? (drag ? dateAddDays(taskEnd,   drag.shiftEnd   || 0) : taskEnd  ) : null;

  const offset = hasBar ? Math.max(0, diffDays(start, previewStart)) : 0;
  const span   = hasBar ? Math.max(1, diffDays(previewStart, previewEnd) + 1) : 1;

  const x = offset * DAY_WIDTH;
  const width = span * DAY_WIDTH - 4;

  // ─── ポインター操作 ───
  const onPointerDown = (mode) => (e) => {
    if (!editable || !hasBar) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({
      mode,
      startX: e.clientX,
      shiftStart: 0,
      shiftEnd: 0,
    });
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const deltaPx = e.clientX - drag.startX;
    const deltaDays = Math.round(deltaPx / DAY_WIDTH);
    let shiftStart = 0;
    let shiftEnd = 0;
    if (drag.mode === 'move') {
      shiftStart = deltaDays;
      shiftEnd = deltaDays;
    } else if (drag.mode === 'left') {
      // 開始日のみ移動。end を超えないようクランプ
      const maxShift = diffDays(taskStart, taskEnd); // = +n（開始 < 終了）
      shiftStart = Math.min(deltaDays, maxShift);
    } else if (drag.mode === 'right') {
      // 終了日のみ移動。start を超えないようクランプ
      const minShift = -diffDays(taskStart, taskEnd);
      shiftEnd = Math.max(deltaDays, minShift);
    }
    setDrag({ ...drag, shiftStart, shiftEnd });
  };

  const onPointerUp = async (e) => {
    if (!drag) return;
    const { shiftStart, shiftEnd } = drag;
    setDrag(null);
    // 動きがあったらドラッグ扱い → 直後の onClick を 1 回抑制
    if (shiftStart !== 0 || shiftEnd !== 0) {
      wasDraggingRef.current = true;
      setTimeout(() => { wasDraggingRef.current = false; }, 0);
    }
    if (shiftStart === 0 && shiftEnd === 0) return;
    const newStart = dateAddDays(taskStart, shiftStart);
    const newEnd   = dateAddDays(taskEnd,   shiftEnd);
    await onUpdate(task.id, {
      start_date: toIsoDate(newStart),
      due_date:   toIsoDate(newEnd),
    });
  };

  // バーの色（ステータス）
  const barColor = STATUS_BAR_COLOR[task.status] || C.accent;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: ROW_HEIGHT,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        cursor: hasBar ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (drag || wasDraggingRef.current) return;
        onClick?.();
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      {/* 日ごとの縦線（弱い） */}
      {Array.from({ length: totalDays }, (_, i) => {
        const d = dateAddDays(start, i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * DAY_WIDTH,
              top: 0,
              bottom: 0,
              width: DAY_WIDTH,
              borderRight: `1px solid ${C.border}`,
              background: isWeekend ? `${C.dangerBg}40` : 'transparent',
            }}
          />
        );
      })}

      {/* タスクバー */}
      {hasBar && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            height: ROW_HEIGHT - 12,
            left: x + 2,
            width,
            background: barColor,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '6px',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: editable ? 'grab' : 'pointer',
            userSelect: 'none',
            boxShadow: drag ? C.shadow2 : C.shadow1,
            opacity: drag ? 0.85 : 1,
            transition: drag ? 'none' : 'background 0.15s',
          }}
          onPointerDown={onPointerDown('move')}
          title={`${toIsoDate(previewStart)} → ${toIsoDate(previewEnd)}`}
        >
          {/* 進捗オーバーレイ */}
          {(task.progress_rate || 0) > 0 && (
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${task.progress_rate}%`,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '4px 0 0 4px',
              pointerEvents: 'none',
            }} />
          )}

          <span style={{
            position: 'relative',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            paddingRight: '6px',
          }}>
            {task.name}
          </span>

          {/* リサイズハンドル：左端 */}
          {editable && (
            <div
              onPointerDown={onPointerDown('left')}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'ew-resize',
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          )}

          {/* リサイズハンドル：右端 */}
          {editable && (
            <div
              onPointerDown={onPointerDown('right')}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'ew-resize',
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          )}
        </div>
      )}
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

// 警告抑制用：未使用 import の保持
// （GanttChartSquare は将来的なヘッダーアイコンで使う想定）
void GanttChartSquare;
