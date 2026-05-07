import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Shield,
  Crown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { inputStyle } from '../../components/ui/FormField';
import {
  listProfiles,
  updateProfile,
  deleteProfile,
  listTeams,
  listDepartments,
  listAllTeamMembers,
  setUserMemberships,
} from '../../api';
import InviteUserModal from '../../components/users/InviteUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import useReloadOnFocus from '../../hooks/useReloadOnFocus';
import useIsCompact from '../../hooks/useIsCompact';

/**
 * UsersPage — ユーザー管理（仕様 3-2 / 3-14）。
 *
 *   - ユーザー一覧テーブル：名前 / メール / ロール / 所属 / 状態 / 操作
 *   - 招待モーダル（メール + 管理者フラグ + メッセージ）
 *   - 編集モーダル（氏名 / 管理者 / 停止）
 *   - 削除確認ダイアログ
 *
 * データソース：Appwrite profiles コレクション（PHASE 3 で実 DB 化）。
 * チームメンバーシップ判定はまだダミー（後続フェーズで実 DB 化）。
 */
export default function UsersPage() {
  const isCompact = useIsCompact();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | admin | leader | active | inactive
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ─── 実 DB から取得 ───
  const [profiles, setProfiles]       = useState([]);
  const [teams, setTeams]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t, d, tm] = await Promise.all([
        listProfiles({ limit: 100 }),
        listTeams(),
        listDepartments(),
        listAllTeamMembers(),
      ]);
      setProfiles(p);
      setTeams(t);
      setDepartments(d);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // 派生：teamId / userId → メタ情報を解決
  const teamById       = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);
  const departmentById = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);
  const isTeamLeaderOf = useCallback(
    (userId) => teamMembers.some(m => m.user_id === userId && m.role === 'leader'),
    [teamMembers]
  );
  const membershipsOfUser = useCallback(
    (userId) => teamMembers
      .filter(m => m.user_id === userId)
      .map(m => {
        const team = teamById.get(m.team_id);
        const dept = team ? departmentById.get(team.department_id) : null;
        return { ...m, team, dept };
      }),
    [teamMembers, teamById, departmentById]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter(u => {
      const matchQ = !q ||
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      const matchF = (() => {
        if (filter === 'admin')    return u.is_admin;
        if (filter === 'leader')   return !u.is_admin && isTeamLeaderOf(u.id);
        if (filter === 'active')   return u.is_active !== false;
        if (filter === 'inactive') return u.is_active === false;
        return true;
      })();
      return matchQ && matchF;
    });
  }, [profiles, query, filter, isTeamLeaderOf]);

  const handleInvited = (data) => {
    // 招待発行後の動作は InviteUserModal 内で完結（invitations にトークンを保存）
    console.log('ユーザー招待:', data);
  };

  const handleEdit = async (data) => {
    try {
      await updateProfile(data.id, {
        full_name: data.full_name,
        is_admin:  data.is_admin,
        is_active: data.is_active,
      });
      // 所属（team_members）の差分同期
      if (Array.isArray(data.memberships)) {
        await setUserMemberships(data.id, data.memberships);
      }
      await reload();
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました：' + (err?.message || err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProfile(deleteTarget.id);
      // 配下の team_members も削除（ユーザーが所属していたチームから除外）
      // ※ Auth ユーザーは Console から手動削除する必要あり（既知の制限）
      await setUserMemberships(deleteTarget.id, []);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました：' + (err?.message || err));
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
            ユーザー管理
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            ユーザーの招待・権限変更・停止・削除を行います（管理者のみ）
          </p>
        </div>
        <Button
          Icon={UserPlus}
          size={isCompact ? 'sm' : 'md'}
          onClick={() => setInviteOpen(true)}
        >
          ユーザーを招待
        </Button>
      </div>

      {/* フィルターバー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        marginBottom: S.m,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
          <Search size={ICON_SM} color={C.textMuted} style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="氏名・メールで検索"
            style={{ ...inputStyle, paddingLeft: '36px', fontSize: '0.857rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all',      label: 'すべて' },
            { id: 'admin',    label: '管理者' },
            { id: 'leader',   label: 'リーダー' },
            { id: 'active',   label: '有効' },
            { id: 'inactive', label: '停止中' },
          ].map(f => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
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
                {f.label}
              </button>
            );
          })}
        </div>

        <span style={{ color: C.textMuted, fontSize: '0.75rem', marginLeft: 'auto' }}>
          {filtered.length} 件
        </span>
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
        ) : filtered.length === 0 ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
            該当するユーザーはいません
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.857rem' }}>
            <thead>
              <tr style={{ background: C.bgSub }}>
                <Th>氏名</Th>
                <Th>メール</Th>
                <Th>ロール</Th>
                <Th>所属</Th>
                <Th>状態</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  memberships={membershipsOfUser(u.id)}
                  leader={isTeamLeaderOf(u.id)}
                  iconOnly={isCompact}
                  onEdit={() => setEditTarget(u)}
                  onDelete={() => setDeleteTarget(u)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* モーダル類 */}
      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvited}
      />

      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        teams={teams}
        departments={departments}
        teamMembers={teamMembers}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="ユーザーの削除"
        message={
          deleteTarget && (
            <>
              ユーザー「<strong>{deleteTarget.full_name}</strong>」を削除します。<br />
              担当タスクは「未割当」になります。この操作は取り消せません。
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

// ============================================================
// UserRow
// ============================================================
function UserRow({ user, memberships = [], leader, iconOnly = false, onEdit, onDelete }) {
  const active = user.is_active !== false;

  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      {/* 氏名 */}
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.s }}>
          <Avatar name={user.full_name} src={user.avatar_url} size={28} />
          <span style={{
            fontWeight: 700,
            color: active ? C.text : C.textMuted,
            textDecoration: active ? 'none' : 'line-through',
          }}>
            {user.full_name}
          </span>
        </div>
      </Td>

      {/* メール */}
      <Td>
        <span style={{ color: C.textSub, fontSize: '0.857rem' }}>{user.email}</span>
      </Td>

      {/* ロール */}
      <Td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          {user.is_admin && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={11} color={C.accent} />
              <Badge variant="accent">管理者</Badge>
            </span>
          )}
          {leader && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={11} color={C.orange} fill={C.orange} />
              <Badge variant="orange">リーダー</Badge>
            </span>
          )}
          {!user.is_admin && !leader && (
            <Badge variant="default">メンバー</Badge>
          )}
        </div>
      </Td>

      {/* 所属チーム */}
      <Td>
        {memberships.length === 0 ? (
          <span style={{ color: C.textMuted }}>未所属</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {memberships.map((m, i) => (
              <span
                key={i}
                title={`${m.dept?.name ? m.dept.name + ' / ' : ''}${m.role === 'leader' ? 'リーダー' : 'メンバー'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '2px 6px',
                  background: C.bgSub,
                  color: C.textSub,
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontWeight: m.role === 'leader' ? 700 : 400,
                }}
              >
                {m.team?.name || '—'}
                {m.role === 'leader' && (
                  <Crown size={9} color={C.orange} fill={C.orange} />
                )}
              </span>
            ))}
          </div>
        )}
      </Td>

      {/* 状態 */}
      <Td>
        {active ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.success, fontSize: '0.75rem', fontWeight: 700 }}>
            <CheckCircle2 size={12} />
            有効
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.danger, fontSize: '0.75rem', fontWeight: 700 }}>
            <XCircle size={12} />
            停止中
          </span>
        )}
      </Td>

      {/* 操作 */}
      <Td align="right">
        <div style={{ display: 'inline-flex', gap: S.xs }}>
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
