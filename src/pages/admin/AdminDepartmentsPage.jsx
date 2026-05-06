import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Users } from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DepartmentFormModal from '../../components/departments/DepartmentFormModal';
import DepartmentMembersModal from '../../components/departments/DepartmentMembersModal';
import useReloadOnFocus from '../../hooks/useReloadOnFocus';
import useIsCompact from '../../hooks/useIsCompact';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listTeams,
  listAllTeamMembers,
} from '../../api';

/**
 * AdminDepartmentsPage — 部署管理（Admin のみ）。
 *
 *   - 部署一覧をテーブル表示（Appwrite から取得）
 *   - 作成 / 編集 / 削除（モーダル）
 *
 * チーム数表示はまだダミー（teams が実 DB 化された後で連動する）。
 * 配下チームがある部署を削除した時の整合性チェックも、teams 実 DB 化後に追加予定。
 */
export default function AdminDepartmentsPage() {
  const isCompact = useIsCompact();
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams]             = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [createOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [membersTarget, setMembersTarget] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, t, tm] = await Promise.all([
        listDepartments({ limit: 100 }),
        listTeams(),
        listAllTeamMembers(),
      ]);
      setDepartments(d);
      setTeams(t);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || '部署の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // 部署 ID → { teamCount, memberCount }
  const statsByDept = useMemo(() => {
    const map = new Map();
    for (const d of departments) {
      const deptTeamIds = teams.filter(t => t.department_id === d.id).map(t => t.id);
      const userIds = new Set(
        teamMembers.filter(m => deptTeamIds.includes(m.team_id)).map(m => m.user_id)
      );
      map.set(d.id, { teamCount: deptTeamIds.length, memberCount: userIds.size });
    }
    return map;
  }, [departments, teams, teamMembers]);

  const handleCreate = async (data) => {
    try {
      await createDepartment({
        name: data.name,
        description: data.description,
      });
      await reload();
    } catch (err) {
      console.error(err);
      alert('作成に失敗しました：' + (err?.message || err));
    }
  };
  const handleEdit = async (data) => {
    try {
      await updateDepartment(data.id, {
        name: data.name,
        description: data.description,
      });
      await reload();
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました：' + (err?.message || err));
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepartment(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* ヘッダー */}
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
            部署管理
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            部署の作成・編集・削除を行います（管理者のみ）
          </p>
        </div>
        <Button
          Icon={Plus}
          size={isCompact ? 'sm' : 'md'}
          onClick={() => setCreateOpen(true)}
        >
          部署を作成
        </Button>
      </div>

      {/* テーブル（横スクロール対応） */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        overflow: 'auto',
        boxShadow: C.shadow1,
      }}>
        {loading ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
            読み込み中...
          </div>
        ) : error ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.danger }}>
            {error}
            <div style={{ marginTop: S.s }}>
              <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
            </div>
          </div>
        ) : departments.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.857rem' }}>
            <thead>
              <tr style={{ background: C.bgSub }}>
                <Th>部署名</Th>
                <Th>説明</Th>
                <Th align="right">チーム数</Th>
                <Th align="right">メンバー数</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => (
                <DepartmentRow
                  key={dept.id}
                  department={dept}
                  stats={statsByDept.get(dept.id) || { teamCount: 0, memberCount: 0 }}
                  iconOnly={isCompact}
                  onEdit={() => setEditTarget(dept)}
                  onDelete={() => setDeleteTarget(dept)}
                  onMembers={() => setMembersTarget(dept)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* モーダル類 */}
      <DepartmentFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <DepartmentFormModal
        open={!!editTarget}
        mode="edit"
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <DepartmentMembersModal
        open={!!membersTarget}
        department={membersTarget}
        onClose={() => setMembersTarget(null)}
        onChanged={reload}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="部署の削除"
        message={
          deleteTarget && (
            <>
              部署「<strong>{deleteTarget.name}</strong>」を削除します。<br />
              この操作は取り消せません。配下のチームがある場合は先にチームを移動・削除してください。
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

function DepartmentRow({ department, stats, iconOnly = false, onEdit, onDelete, onMembers }) {
  const { teamCount = 0, memberCount = 0 } = stats || {};

  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.s }}>
          <Building2 size={ICON_SM} color={C.textMuted} />
          <span style={{ fontWeight: 700, color: C.text }}>{department.name}</span>
        </div>
      </Td>
      <Td>
        <span style={{ color: C.textSub }}>
          {department.description || <span style={{ color: C.textMuted }}>—</span>}
        </span>
      </Td>
      <Td align="right">
        <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
          {teamCount}
        </span>
      </Td>
      <Td align="right">
        <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
          {memberCount}
        </span>
      </Td>
      <Td align="right">
        <div style={{ display: 'inline-flex', gap: S.xs }}>
          <Button variant="secondary" size="sm" Icon={Users} iconOnly={iconOnly} onClick={onMembers}>
            メンバー
          </Button>
          <Button variant="secondary" size="sm" Icon={Pencil} iconOnly={iconOnly} onClick={onEdit}>
            編集
          </Button>
          <Button variant="danger" size="sm" Icon={Trash2} iconOnly={iconOnly} onClick={onDelete}>
            削除
          </Button>
        </div>
      </Td>
    </tr>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{
      padding: S.xxl,
      textAlign: 'center',
    }}>
      <Building2 size={36} color={C.textMuted} strokeWidth={1.5} />
      <h3 style={{ color: C.text, fontSize: '1rem', fontWeight: 700, margin: `${S.s} 0 ${S.xs}` }}>
        部署がまだありません
      </h3>
      <p style={{ color: C.textSub, fontSize: '0.857rem', margin: `0 0 ${S.m}` }}>
        最初の部署を作成しましょう
      </p>
      <Button Icon={Plus} onClick={onCreate}>部署を作成</Button>
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
