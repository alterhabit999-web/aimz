import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, UserPlus, X as XIcon, Building2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { selectStyle } from '../ui/FormField';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { C, S } from '../../styles/tokens';
import {
  listProfiles,
  listTeams,
  listAllTeamMembers,
  addMember,
  removeMember,
} from '../../api';

/**
 * DepartmentMembersModal — 部署のメンバー一覧 + 追加 / 除外（管理者用）。
 *
 * 仕様：
 *   - メンバー = その部署のいずれかのチームに所属している全ユーザー（重複除去）
 *   - 追加 = ユーザー + 加入先チーム + ロール を選んで team_members に追加
 *   - 除外 = そのユーザーの「この部署のすべてのチーム所属」を一括削除
 *
 * Props:
 *   open: boolean
 *   department: 対象部署
 *   onClose: () => void
 *   onChanged?: () => Promise<void>   呼び出し側で再読込したい場合
 */
export default function DepartmentMembersModal({ open, department, onClose, onChanged }) {
  const [profiles, setProfiles]       = useState([]);
  const [teams, setTeams]             = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // 追加フォーム
  const [addUserId, setAddUserId] = useState('');
  const [addTeamId, setAddTeamId] = useState('');
  const [addRole, setAddRole]     = useState('member');
  const [addError, setAddError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 除外確認
  const [removeTarget, setRemoveTarget] = useState(null); // user

  const reload = useCallback(async () => {
    if (!department?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, t, tm] = await Promise.all([
        listProfiles({ limit: 200 }),
        listTeams(),
        listAllTeamMembers(),
      ]);
      setProfiles(p);
      setTeams(t);
      setTeamMembers(tm);
    } catch (err) {
      console.error(err);
      setError(err?.message || '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [department?.id]);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  // 派生データ
  const view = useMemo(() => {
    if (!department) return null;
    const profileById = new Map(profiles.map(p => [p.id, p]));
    // この部署のチーム
    const deptTeams = teams.filter(t => t.department_id === department.id);
    const deptTeamIds = new Set(deptTeams.map(t => t.id));
    // この部署の team_members
    const deptMemberships = teamMembers.filter(m => deptTeamIds.has(m.team_id));
    // メンバー = ユーザー単位で重複除去
    const userIds = [...new Set(deptMemberships.map(m => m.user_id))];
    const members = userIds.map(uid => {
      const user = profileById.get(uid);
      if (!user) return null;
      const myMs = deptMemberships
        .filter(m => m.user_id === uid)
        .map(m => ({ ...m, team: deptTeams.find(t => t.id === m.team_id) }));
      const isLeader = myMs.some(m => m.role === 'leader');
      return { user, memberships: myMs, isLeader };
    }).filter(Boolean);

    // 追加候補 = まだ部署のどのチームにも所属していないユーザー
    const memberSet = new Set(userIds);
    const candidates = profiles.filter(p => !memberSet.has(p.id));

    return { deptTeams, members, candidates };
  }, [department, profiles, teams, teamMembers]);

  // 追加処理
  const handleAdd = async (e) => {
    e?.preventDefault();
    setAddError('');
    if (!addUserId) { setAddError('ユーザーを選択してください'); return; }
    if (!addTeamId) { setAddError('加入先チームを選択してください'); return; }
    setSubmitting(true);
    try {
      await addMember(addTeamId, addUserId, addRole);
      // フォームをリセット
      setAddUserId('');
      setAddTeamId('');
      setAddRole('member');
      await reload();
      await onChanged?.();
    } catch (err) {
      console.error(err);
      setAddError(err?.message || '追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 除外確認 → 実行
  const confirmRemove = async () => {
    if (!removeTarget || !view) return;
    try {
      // この部署のすべてのチームから当該ユーザーを外す
      for (const t of view.deptTeams) {
        try { await removeMember(t.id, removeTarget.id); } catch (_) {}
      }
      setRemoveTarget(null);
      await reload();
      await onChanged?.();
    } catch (err) {
      console.error(err);
      alert('除外に失敗しました：' + (err?.message || err));
    }
  };

  if (!department) return null;

  return (
    <>
      <Modal
        open={open}
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: S.xs }}>
            <Building2 size={16} color={C.accent} />
            {department.name} のメンバー
          </span>
        }
        onClose={onClose}
        width="640px"
        footer={<Button variant="secondary" onClick={onClose}>閉じる</Button>}
      >
        {error && (
          <div style={{
            padding: S.s, background: C.dangerBg, color: C.danger,
            borderRadius: '6px', fontSize: '0.857rem', marginBottom: S.m,
          }}>
            {error}
          </div>
        )}

        {/* メンバー追加フォーム */}
        <div style={{
          padding: S.m,
          background: C.bg,
          borderRadius: '6px',
          marginBottom: S.l,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.xs,
            marginBottom: S.s,
            color: C.textSub,
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            <UserPlus size={12} />
            メンバーを追加
          </div>

          <form onSubmit={handleAdd}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 110px auto',
              gap: S.s,
              alignItems: 'end',
            }}>
              <FormField label="ユーザー">
                <select
                  value={addUserId}
                  onChange={e => setAddUserId(e.target.value)}
                  style={selectStyle}
                  disabled={loading || (view?.candidates.length === 0)}
                >
                  <option value="">
                    {view?.candidates.length === 0
                      ? '追加可能なユーザーはいません'
                      : '選択してください'}
                  </option>
                  {view?.candidates.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}{u.is_admin ? ' [管理者]' : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="加入先チーム">
                <select
                  value={addTeamId}
                  onChange={e => setAddTeamId(e.target.value)}
                  style={selectStyle}
                  disabled={loading}
                >
                  <option value="">選択してください</option>
                  {view?.deptTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="ロール">
                <select
                  value={addRole}
                  onChange={e => setAddRole(e.target.value)}
                  style={selectStyle}
                  disabled={loading}
                >
                  <option value="member">メンバー</option>
                  <option value="leader">リーダー</option>
                </select>
              </FormField>

              <Button type="submit" disabled={submitting || loading}>
                {submitting ? '追加中…' : '追加'}
              </Button>
            </div>

            {addError && (
              <div style={{
                marginTop: S.xs,
                padding: '4px 8px',
                background: C.dangerBg,
                color: C.danger,
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}>
                {addError}
              </div>
            )}
          </form>
        </div>

        {/* メンバー一覧 */}
        <div style={{ fontSize: '0.75rem', color: C.textMuted, fontWeight: 700, marginBottom: S.s }}>
          現在のメンバー（{view?.members.length || 0} 名）
        </div>

        {loading ? (
          <div style={{ padding: S.l, textAlign: 'center', color: C.textMuted }}>
            読み込み中...
          </div>
        ) : !view || view.members.length === 0 ? (
          <div style={{
            padding: S.l,
            background: C.surface,
            border: `1px dashed ${C.border}`,
            borderRadius: '6px',
            textAlign: 'center',
            color: C.textMuted,
            fontSize: '0.857rem',
          }}>
            この部署にメンバーはいません
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: S.xs }}>
            {view.members.map(({ user, memberships, isLeader }) => (
              <li
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: S.s,
                  padding: S.s,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                }}
              >
                <Avatar name={user.full_name} src={user.avatar_url} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: S.xs,
                    fontWeight: 700, color: C.text, fontSize: '0.857rem',
                  }}>
                    {user.full_name}
                    {isLeader && <Crown size={11} color={C.orange} fill={C.orange} />}
                  </div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '4px',
                    marginTop: '2px',
                  }}>
                    {memberships.map((m, i) => (
                      <span
                        key={i}
                        title={m.role === 'leader' ? 'リーダー' : 'メンバー'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 6px',
                          background: C.bgSub,
                          color: C.textSub,
                          borderRadius: '3px',
                          fontSize: '0.7rem',
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
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(user)}
                  aria-label="部署から除外"
                  title="部署から除外（この部署の全チーム所属を解除）"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: C.danger,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <XIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        title="メンバーを部署から除外"
        message={
          removeTarget && (
            <>
              <strong>{removeTarget.full_name}</strong> を「<strong>{department.name}</strong>」から除外します。<br />
              この部署のすべてのチーム所属が解除されます。<br />
              （他部署のチーム所属には影響しません）
            </>
          )
        }
        confirmLabel="除外する"
        onConfirm={confirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </>
  );
}
