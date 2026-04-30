import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  GanttChartSquare,
  LayoutGrid,
  ListChecks,
  FileText,
} from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import { useAuth } from '../contexts/AuthContext';
import { findProject, canEditProject } from '../data/dummy';

import ProjectHeader from '../components/projects/ProjectHeader';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

import GanttTab from '../components/projects/tabs/GanttTab';
import KanbanTab from '../components/projects/tabs/KanbanTab';
import TaskListTab from '../components/projects/tabs/TaskListTab';
import FilesTab from '../components/projects/tabs/FilesTab';

/**
 * ProjectDetailPage — 案件詳細（仕様 v1.3）。
 *
 *   - ヘッダー：案件名・ステータス・優先度・期間・所属・担当者・進捗・編集/削除
 *   - タブ：ガント（デフォルト） / カンバン / タスク一覧 / ファイル
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
  const project = findProject(projectId);

  const [activeTab, setActiveTab] = useState('gantt');  // デフォルト：ガント
  const [editOpen, setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  const editable = canEditProject(user, project);

  const handleEdit = (data) => {
    console.log('案件編集（ダミー）:', data);
    alert(`案件「${data.name}」を更新しました（※ダミー、まだ DB に保存されません）`);
  };

  const handleDelete = () => {
    console.log('案件削除（ダミー）:', project);
    alert(`案件「${project.name}」を削除しました（※ダミー、まだ DB から削除されません）`);
    navigate('/projects');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <ProjectHeader
        project={project}
        canEdit={editable}
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

      {/* タブ本体 */}
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
        initial={project}
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
