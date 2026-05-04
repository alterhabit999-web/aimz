import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  GanttChartSquare,
  LayoutGrid,
  ListChecks,
  FileText,
} from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import {
  getProject,
  listByProject as listAssigneesOfProject,
  listProfiles,
  listDepartments,
  listTeams,
  listAllTeamMembers,
  listTasksByProject,
  updateProject,
  setAssignees,
  deleteAllForProject,
  deleteProject,
  deleteAllFilesForProject,
} from '../api';

import ProjectHeader from '../components/projects/ProjectHeader';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

import GanttTab from '../components/projects/tabs/GanttTab';
import KanbanTab from '../components/projects/tabs/KanbanTab';
import TaskListTab from '../components/projects/tabs/TaskListTab';
import FilesTab from '../components/projects/tabs/FilesTab';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

/**
 * ProjectDetailPage — 案件詳細（PHASE 3 で実 DB 化）。
 *
 *   - ヘッダー：案件名・ステータス・優先度・期間・所属・担当者・進捗・編集/削除
 *   - タブ：ガント（デフォルト） / カンバン / タスク一覧 / ファイル
 *
 * タブ内のタスク機能はまだダミー（tasks 実 DB 化フェーズで連動）。
 */
const TABS = [
  { id: 'gantt',    label: 'ガント',     Icon: GanttChartSquare },
  { id: 'kanban',   label: 'カンバン',   Icon: LayoutGrid },
  { id: 'tasks',    label: 'タスク一覧', Icon: ListChecks },
  { id: 'files',    label: 'ファイル',   Icon: FileText },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]           = useState(null);
  const [assigneeRows, setAssigneeRows] = useState([]);
  const [profiles, setProfiles]         = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [teams, setTeams]               = useState([]);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [notFound, setNotFound]         = useState(false);

  const [activeTab, setActiveTab]       = useState('gantt');
  const [editOpen, setEditOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pr, pa, prof, d, t, tm, tk] = await Promise.all([
        getProject(projectId),
        listAssigneesOfProject(projectId),
        listProfiles({ limit: 200 }),
        listDepartments(),
        listTeams(),
        listAllTeamMembers(),
        listTasksByProject(projectId),
      ]);
      if (!pr) {
        setNotFound(true);
        return;
      }
      setProject(pr);
      setAssigneeRows(pa);
      setProfiles(prof);
      setDepartments(d);
      setTeams(t);
      setTeamMembers(tm);
      setTasks(tk);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // 派生
  const view = useMemo(() => {
    if (!project) return null;
    const profileById = new Map(profiles.map(p => [p.id, p]));
    const team = teams.find(t => t.id === project.team_id) || null;
    const department = team ? departments.find(d => d.id === team.department_id) : null;
    const assignees = assigneeRows
      .map(a => profileById.get(a.user_id))
      .filter(Boolean);
    // ユーザーが該当チームに所属しているか
    const myMembership = teamMembers.find(m => m.user_id === user?.id && m.team_id === project.team_id);
    const editable = !!user?.is_admin || !!myMembership;
    // 自分の所属チーム ID（編集モーダル用）
    const myTeamIds = teamMembers.filter(m => m.user_id === user?.id).map(m => m.team_id);
    // 進捗：配下タスクの progress_rate 平均
    const progress = tasks.length === 0
      ? 0
      : Math.round(tasks.reduce((acc, t) => acc + (t.progress_rate || 0), 0) / tasks.length);
    return {
      team, department, assignees, editable, myTeamIds, progress,
      assigneeIds: assigneeRows.map(a => a.user_id),
    };
  }, [project, profiles, teams, departments, assigneeRows, teamMembers, tasks, user]);

  if (notFound) {
    return <Navigate to="/projects" replace />;
  }

  if (loading) {
    return <Notice>読み込み中...</Notice>;
  }
  if (error) {
    return (
      <Notice danger>
        {error}
      </Notice>
    );
  }
  if (!project || !view) return null;

  const handleEdit = async (data) => {
    await updateProject(data.id, {
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      start_date: data.start_date,
      end_date: data.end_date,
      // team_id は edit 時 disabled なので変更しない
    });
    if (data.assignee_ids) {
      await setAssignees(data.id, data.assignee_ids);
    }
    await reload();
  };

  const handleDelete = async () => {
    try {
      // カスケード：担当者・配下ファイルを先に削除
      await deleteAllFilesForProject(project.id);
      await deleteAllForProject(project.id);
      // 注意：配下タスク・サブタスク・スケジュール・通知の削除は
      // 専用カスケードヘルパーが今は無いため、案件削除時の不整合は当面残る。
      // RLS 本実装時 / 削除フロー再設計時に整理する。
      await deleteProject(project.id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  // 編集モーダルの初期値
  const editInitial = { ...project, assignee_ids: view.assigneeIds };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <ProjectHeader
        project={project}
        team={view.team}
        department={view.department}
        assignees={view.assignees}
        progress={view.progress}
        canEdit={view.editable}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* タブナビ */}
      <div style={{
        display: 'flex',
        gap: '2px',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: S.l,
        overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: S.xs,
                padding: `${S.s} ${S.m}`,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                color: active ? C.accent : C.textSub,
                fontWeight: active ? 700 : 400,
                fontSize: '0.857rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              <t.Icon size={ICON_SM} strokeWidth={active ? 2.2 : 1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* タブ本体（タスク機能はまだダミー） */}
      <div>
        {activeTab === 'gantt'  && <GanttTab    project={project} />}
        {activeTab === 'kanban' && <KanbanTab   project={project} />}
        {activeTab === 'tasks'  && <TaskListTab project={project} />}
        {activeTab === 'files'  && <FilesTab    project={project} />}
      </div>

      {/* 編集モーダル */}
      <ProjectFormModal
        open={editOpen}
        mode="edit"
        initial={editInitial}
        teams={teams}
        departments={departments}
        teamMembers={teamMembers}
        profiles={profiles}
        myTeamIds={view.myTeamIds}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />

      {/* 削除確認 */}
      <ConfirmDialog
        open={deleteOpen}
        title="案件の削除"
        message={
          <>
            案件「<strong>{project.name}</strong>」を削除します。<br />
            この操作は取り消せません。配下のタスク・ファイルもすべて削除されます。
          </>
        }
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function Notice({ children, danger }) {
  return (
    <div style={{
      maxWidth: '1280px', margin: '0 auto',
      padding: S.xl, textAlign: 'center',
      color: danger ? C.danger : C.textMuted,
    }}>
      {children}
    </div>
  );
}
