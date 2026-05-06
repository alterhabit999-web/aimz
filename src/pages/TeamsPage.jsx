import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Users as UsersIcon, UserCog, Pencil, Trash2 } from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import {
  listProfiles,
  listDepartments,
  listTeams,
  listAllTeamMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  setTeamMembers,
  deleteAllForTeam,
} from '../api';
import TeamCard from '../components/teams/TeamCard';
import MembersTable from '../components/teams/MembersTable';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import useReloadOnFocus from '../hooks/useReloadOnFocus';
import useIsCompact from '../hooks/useIsCompact';

/**
 * TeamsPage — チーム画面（仕様 v1.3、PHASE 3 で実 DB 化）。
 *
 *   1. 上部：ページヘッダー（タイトル + アクション）
 *   2. チーム一覧セクション（部署別グルーピング、カード表示）
 *   3. メンバー一覧セクション（テーブル表示、検索付き）
 *
 * チーム作成は管理者またはチームリーダーのみ可。
 * カード上のメニューから編集・削除も可能（権限あり時）。
 */
export default function TeamsPage() {
  const { user } = useAuth();
  const isCompact = useIsCompact();

  // ─── 全データを 1 度に取得 ───
  const [profiles, setProfiles]         = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [teams, setTeams]               = useState([]);
  const [teamMembers, setTeamMembersS]  = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ─── 編集系のモーダル状態 ───
  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, d, t, tm] = await Promise.all([
        listProfiles({ limit: 200 }),
        listDepartments(),
        listTeams(),
        listAllTeamMembers(),
      ]);
      setProfiles(p);
      setDepartments(d);
      setTeams(t);
      setTeamMembersS(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // ─── 派生データの組み立て ───
  const view = useMemo(() => {
    const profileById    = new Map(profiles.map(p => [p.id, p]));
    const departmentById = new Map(departments.map(d => [d.id, d]));
    const teamById       = new Map(teams.map(t => [t.id, t]));

    // 自分の team_members → 自分の所属チーム → 自分の所属部署
    const myMemberships = teamMembers.filter(m => m.user_id === user?.id);
    const myTeamIds     = myMemberships.map(m => m.team_id);
    const myTeams       = myTeamIds.map(id => teamById.get(id)).filter(Boolean);
    const myDeptIds     = [...new Set(myTeams.map(t => t.department_id))];
    const myDepts       = myDeptIds.map(id => departmentById.get(id)).filter(Boolean);

    // 同部署の他チームも閲覧可能（v1.3 仕様）
    const isAdmin       = !!user?.is_admin;
    const visibleTeams  = isAdmin ? teams : teams.filter(t => myDeptIds.includes(t.department_id));
    const visibleTeamIdSet = new Set(visibleTeams.map(t => t.id));

    // 各チームのメンバー（profile + role）を組み立て
    const teamsEnriched = visibleTeams.map(t => {
      const members = teamMembers
        .filter(m => m.team_id === t.id)
        .map(m => {
          const p = profileById.get(m.user_id);
          if (!p) return null;
          return { ...p, role: m.role };
        })
        .filter(Boolean);
      return { ...t, members, dept: departmentById.get(t.department_id) };
    });

    // 同部署のメンバー（重複除去 + memberships を組み立て）
    const visibleUserIds = [...new Set(
      teamMembers.filter(m => visibleTeamIdSet.has(m.team_id)).map(m => m.user_id)
    )];
    const enrichedMembers = visibleUserIds.map(uid => {
      const p = profileById.get(uid);
      if (!p) return null;
      const memberships = teamMembers
        .filter(m => m.user_id === uid && visibleTeamIdSet.has(m.team_id))
        .map(m => {
          const team = teamById.get(m.team_id);
          const dept = team ? departmentById.get(team.department_id) : null;
          return { ...m, team, dept };
        });
      return { ...p, memberships };
    }).filter(Boolean);

    // チーム作成権限：管理者 または いずれかのチームの leader
    const isLeaderAnywhere = myMemberships.some(m => m.role === 'leader');
    const canCreate = isAdmin || isLeaderAnywhere;

    return {
      myDepts,
      myDeptIds,
      teamsEnriched,
      enrichedMembers,
      canCreate,
    };
  }, [profiles, departments, teams, teamMembers, user?.id, user?.is_admin]);

  // 部署別グルーピング
  const teamsByDept = useMemo(() => {
    const map = new Map();
    view.teamsEnriched.forEach(t => {
      const key = t.department_id;
      if (!map.has(key)) {
        map.set(key, { dept: t.dept || { id: key, name: '—' }, teams: [] });
      }
      map.get(key).teams.push(t);
    });
    return Array.from(map.values()).filter(g => g.teams.length > 0);
  }, [view.teamsEnriched]);

  // ─── 編集権限：管理者 or 自チームのリーダー ───
  const canEditTeam = useCallback((team) => {
    if (user?.is_admin) return true;
    const myMembership = teamMembers.find(m => m.user_id === user?.id && m.team_id === team.id);
    return myMembership?.role === 'leader';
  }, [teamMembers, user]);

  // ─── 保存系ハンドラ ───
  const handleCreate = async (data) => {
    const created = await createTeam({
      department_id: data.department_id,
      name: data.name,
      description: data.description,
      created_by: user?.id || null,
    });
    await setTeamMembers(created.id, data.members);
    await reload();
  };
  const handleUpdate = async (data) => {
    await updateTeam(data.id, {
      department_id: data.department_id,
      name: data.name,
      description: data.description,
    });
    await setTeamMembers(data.id, data.members);
    await reload();
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAllForTeam(deleteTarget.id);
      await deleteTeam(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  // 編集モーダル用：選択チームに members を組み立て
  const editInitial = useMemo(() => {
    if (!editTarget) return null;
    const members = teamMembers
      .filter(m => m.team_id === editTarget.id)
      .map(m => ({ user_id: m.user_id, role: m.role }));
    return { ...editTarget, members };
  }, [editTarget, teamMembers]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* ページヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: S.m,
        flexWrap: 'wrap',
        marginBottom: S.l,
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.05rem, 4vw, 1.5rem)', fontWeight: 700, color: C.text, margin: 0 }}>
            チーム
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            所属部署内のチームとメンバーを表示します
          </p>
        </div>
        {view.canCreate && (
          <Button
            Icon={Plus}
            size={isCompact ? 'sm' : 'md'}
            onClick={() => setCreateOpen(true)}
          >
            チームを作成
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
          {/* セクション 1：チーム一覧 */}
          <Section title="チーム一覧" Icon={UsersIcon} count={view.teamsEnriched.length}>
            {teamsByDept.length === 0 ? (
              <EmptyState>所属部署にチームがありません</EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: S.l }}>
                {teamsByDept.map(g => (
                  <div key={g.dept.id}>
                    <h3 style={{
                      fontSize: '0.857rem', fontWeight: 700, color: C.textSub,
                      margin: `0 0 ${S.s} 0`, paddingLeft: S.xs,
                    }}>
                      {g.dept.name}
                      <span style={{ color: C.textMuted, marginLeft: S.xs, fontSize: '0.75rem' }}>
                        ({g.teams.length})
                      </span>
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: S.m,
                    }}>
                      {g.teams.map(t => (
                        <TeamCardWithActions
                          key={t.id}
                          team={t}
                          editable={canEditTeam(t)}
                          onEdit={() => setEditTarget(t)}
                          onDelete={() => setDeleteTarget(t)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* セクション 2：メンバー一覧 */}
          <Section title="メンバー一覧" Icon={UserCog} count={view.enrichedMembers.length} style={{ marginTop: S.xl }}>
            {view.enrichedMembers.length === 0 ? (
              <EmptyState>メンバーがいません</EmptyState>
            ) : (
              <MembersTable members={view.enrichedMembers} />
            )}
          </Section>
        </>
      )}

      {/* 作成モーダル */}
      <CreateTeamModal
        open={createOpen}
        mode="create"
        departments={departments}
        profiles={profiles}
        myDeptIds={view.myDeptIds}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {/* 編集モーダル */}
      <CreateTeamModal
        open={!!editTarget}
        mode="edit"
        initial={editInitial}
        departments={departments}
        profiles={profiles}
        myDeptIds={view.myDeptIds}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />

      {/* 削除確認 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="チームの削除"
        message={
          deleteTarget && (
            <>
              チーム「<strong>{deleteTarget.name}</strong>」を削除します。<br />
              所属メンバーの紐付けも解除されます。配下の案件があると整合性が崩れる可能性があるためご注意ください。
            </>
          )
        }
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── TeamCard + 編集/削除メニュー ───
function TeamCardWithActions({ team, editable, onEdit, onDelete }) {
  return (
    <div style={{ position: 'relative' }}>
      <TeamCard team={team} department={team.dept} members={team.members} />
      {editable && (
        <div style={{
          position: 'absolute', top: S.xs, right: S.xs,
          display: 'flex', gap: '4px',
        }}>
          <button
            type="button"
            onClick={onEdit}
            title="編集"
            style={iconBtn}
            onMouseEnter={e => e.currentTarget.style.background = C.bgSub}
            onMouseLeave={e => e.currentTarget.style.background = C.surface}
          >
            <Pencil size={12} color={C.textSub} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="削除"
            style={iconBtn}
            onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
          >
            <Trash2 size={12} color={C.danger} />
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: '24px',
  height: '24px',
  background: '#ffffff',
  border: `1px solid ${'#d6d3d0'}`,
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

// ─── 共通 UI ───
function Section({ title, Icon, count, style, children }) {
  return (
    <section style={{ marginBottom: S.xl, ...style }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: S.xs,
        marginBottom: S.m, paddingBottom: S.s, borderBottom: `1px solid ${C.border}`,
      }}>
        {Icon && <Icon size={ICON_SM} color={C.accent} strokeWidth={2} />}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: 0 }}>
          {title}
        </h2>
        {typeof count === 'number' && (
          <span style={{ fontSize: '0.75rem', color: C.textMuted, fontWeight: 700 }}>
            {count}件
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div style={{
      padding: S.xl, background: C.surface, border: `1px dashed ${C.border}`,
      borderRadius: '8px', textAlign: 'center', color: C.textMuted, fontSize: '0.857rem',
    }}>
      {children}
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
