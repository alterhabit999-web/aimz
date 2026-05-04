import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, FolderOpen, Search } from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import Button from '../components/ui/Button';
import { inputStyle } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import {
  listProfiles,
  listDepartments,
  listTeams,
  listAllTeamMembers,
  listProjects,
  listAllProjectAssignees,
  listTasks,
  createProject,
  setAssignees,
} from '../api';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

/**
 * ProjectsPage — 案件一覧（PHASE 3 で実 DB 化）。
 *
 *   - 自分の所属部署内のチームを順に並べ、チームごとに案件カードを表示
 *   - 検索バー（案件名・説明で絞り込み）
 *   - 「案件を作成」ボタン（admin / 自チームメンバー）
 */
const STATUS_FILTERS = ['すべて', '未着手', '進行中', '完了', '保留'];

export default function ProjectsPage() {
  const { user } = useAuth();

  // 取得データ
  const [profiles, setProfiles]           = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [teams, setTeams]                 = useState([]);
  const [teamMembers, setTeamMembers]     = useState([]);
  const [projects, setProjects]           = useState([]);
  const [assigneeRows, setAssigneeRows]   = useState([]);
  const [tasks, setTasks]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const [createOpen, setCreateOpen]       = useState(false);
  const [query, setQuery]                 = useState('');
  const [statusFilter, setStatusFilter]   = useState('すべて');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, d, t, tm, pr, pa, tk] = await Promise.all([
        listProfiles({ limit: 200 }),
        listDepartments(),
        listTeams(),
        listAllTeamMembers(),
        listProjects(),
        listAllProjectAssignees(),
        listTasks(),
      ]);
      setProfiles(p);
      setDepartments(d);
      setTeams(t);
      setTeamMembers(tm);
      setProjects(pr);
      setAssigneeRows(pa);
      setTasks(tk);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // ─── 派生データ ───
  const view = useMemo(() => {
    const profileById    = new Map(profiles.map(p => [p.id, p]));
    const departmentById = new Map(departments.map(d => [d.id, d]));

    // 自分の所属
    const myMemberships = teamMembers.filter(m => m.user_id === user?.id);
    const myTeamIdArr   = myMemberships.map(m => m.team_id);
    const myDeptIds     = [...new Set(
      myTeamIdArr.map(id => teams.find(t => t.id === id)?.department_id).filter(Boolean)
    )];

    // 同部署のチーム（Admin は全部）
    const isAdmin = !!user?.is_admin;
    const visibleTeams = isAdmin ? teams : teams.filter(t => myDeptIds.includes(t.department_id));

    // 案件 → 担当者配列を組み立て
    const assigneesByProject = new Map();
    for (const a of assigneeRows) {
      const list = assigneesByProject.get(a.project_id) || [];
      const p = profileById.get(a.user_id);
      if (p) list.push(p);
      assigneesByProject.set(a.project_id, list);
    }

    // 案件 → 進捗率（配下タスクの progress_rate 平均）
    const progressByProject = new Map();
    const tasksByProj = new Map();
    for (const t of tasks) {
      const arr = tasksByProj.get(t.project_id) || [];
      arr.push(t);
      tasksByProj.set(t.project_id, arr);
    }
    for (const [pid, arr] of tasksByProj) {
      if (arr.length === 0) { progressByProject.set(pid, 0); continue; }
      const sum = arr.reduce((acc, t) => acc + (t.progress_rate || 0), 0);
      progressByProject.set(pid, Math.round(sum / arr.length));
    }

    // 作成権限：admin or いずれかのチームメンバー
    const canCreate = isAdmin || myMemberships.length > 0;

    return {
      profileById,
      departmentById,
      visibleTeams,
      assigneesByProject,
      progressByProject,
      myTeamIds: myTeamIdArr,
      canCreate,
    };
  }, [profiles, departments, teams, teamMembers, assigneeRows, tasks, user?.id, user?.is_admin]);

  // チーム別グルーピング
  const teamGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const myIdSet = new Set(view.myTeamIds);
    return view.visibleTeams.map(t => {
      const dept = view.departmentById.get(t.department_id);
      const ps = projects
        .filter(p => p.team_id === t.id)
        .filter(p => {
          const matchQ = !q ||
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q);
          const matchS = statusFilter === 'すべて' || p.status === statusFilter;
          return matchQ && matchS;
        });
      return { team: t, dept, projects: ps, isMine: myIdSet.has(t.id) };
    }).filter(g => g.projects.length > 0);
  }, [view, projects, query, statusFilter]);

  const totalCount = teamGroups.reduce((acc, g) => acc + g.projects.length, 0);

  const handleCreate = async (data) => {
    const created = await createProject({
      team_id: data.team_id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      start_date: data.start_date,
      end_date: data.end_date,
      created_by: user?.id || null,
    });
    if (data.assignee_ids?.length) {
      await setAssignees(created.id, data.assignee_ids);
    }
    await reload();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: S.m,
        marginBottom: S.l,
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: 0 }}>
            案件一覧
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            所属部署で閲覧可能な案件をチーム別に表示します
          </p>
        </div>
        {view.canCreate && (
          <Button Icon={Plus} onClick={() => setCreateOpen(true)}>
            案件を作成
          </Button>
        )}
      </div>

      {/* ローディング / エラー */}
      {loading ? (
        <Notice>読み込み中...</Notice>
      ) : error ? (
        <Notice danger>
          {error}
          <div style={{ marginTop: S.s }}>
            <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
          </div>
        </Notice>
      ) : (
        <>
          {/* フィルターバー */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.s,
            marginBottom: S.l,
            flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
              <Search size={ICON_SM} color={C.textMuted} style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="案件名・説明で検索"
                style={{ ...inputStyle, paddingLeft: '36px', fontSize: '0.857rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {STATUS_FILTERS.map(s => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '6px 12px',
                      border: `1px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accentLight : C.surface,
                      color: active ? C.accent : C.textSub,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <span style={{ color: C.textMuted, fontSize: '0.75rem', marginLeft: 'auto' }}>
              {totalCount} 件
            </span>
          </div>

          {/* チーム別案件リスト */}
          {teamGroups.length === 0 ? (
            <EmptyState query={query} statusFilter={statusFilter} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: S.xl }}>
              {teamGroups.map(g => (
                <section key={g.team.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: S.s,
                    marginBottom: S.s,
                    paddingBottom: S.xs,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: 0 }}>
                      {g.team.name}
                    </h3>
                    <span style={{ color: C.textMuted, fontSize: '0.75rem' }}>
                      {g.dept?.name || '—'}
                    </span>
                    {g.isMine && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, color: C.accent,
                        padding: '2px 6px', background: C.accentLight, borderRadius: '3px',
                      }}>
                        所属
                      </span>
                    )}
                    <span style={{ color: C.textMuted, fontSize: '0.75rem', marginLeft: 'auto' }}>
                      {g.projects.length} 件
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: S.m,
                  }}>
                    {g.projects.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        assignees={view.assigneesByProject.get(p.id) || []}
                        progress={view.progressByProject.get(p.id) || 0}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* 作成モーダル */}
      <ProjectFormModal
        open={createOpen}
        mode="create"
        teams={teams}
        departments={departments}
        teamMembers={teamMembers}
        profiles={profiles}
        myTeamIds={view.myTeamIds}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function EmptyState({ query, statusFilter }) {
  const hasFilter = query || statusFilter !== 'すべて';
  return (
    <div style={{
      padding: S.xxl, background: C.surface, border: `1px dashed ${C.border}`,
      borderRadius: '8px', textAlign: 'center',
    }}>
      <FolderOpen size={36} color={C.textMuted} strokeWidth={1.5} style={{ marginBottom: S.s }} />
      <h3 style={{ color: C.text, fontSize: '1rem', fontWeight: 700, margin: `0 0 ${S.xs}` }}>
        {hasFilter ? '該当する案件がありません' : '閲覧できる案件がありません'}
      </h3>
      <p style={{ color: C.textSub, fontSize: '0.857rem', margin: 0 }}>
        {hasFilter
          ? '検索条件を変えてみてください'
          : '所属部署内のチームに案件が登録されると、ここに表示されます'}
      </p>
    </div>
  );
}

function Notice({ children, danger }) {
  return (
    <div style={{
      padding: S.xl, textAlign: 'center',
      color: danger ? C.danger : C.textMuted,
    }}>
      {children}
    </div>
  );
}
