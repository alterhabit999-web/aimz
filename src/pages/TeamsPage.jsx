import React, { useMemo, useState } from 'react';
import { Plus, Users as UsersIcon, UserCog } from 'lucide-react';
import { C, S, ICON_SM } from '../styles/tokens';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import {
  visibleTeams,
  visibleMembers,
  myDepartments,
  canCreateTeam,
} from '../data/dummy';
import TeamCard from '../components/teams/TeamCard';
import MembersTable from '../components/teams/MembersTable';
import CreateTeamModal from '../components/teams/CreateTeamModal';

/**
 * TeamsPage — チーム画面（仕様 v1.3）。
 *
 * レイアウト（縦並び）：
 *   1. 上部：ページヘッダー（タイトル + アクション）
 *   2. チーム一覧セクション（部署別グルーピング、カード表示）
 *   3. メンバー一覧セクション（テーブル表示、検索付き）
 *
 * チーム作成は管理者またはチームリーダーのみ可。
 */
export default function TeamsPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  // 表示対象：自分の所属部署にあるチーム＆その部署のメンバー
  const teams   = visibleTeams(user?.id);
  const members = visibleMembers(user?.id);
  const depts   = myDepartments(user?.id);
  const showCreate = canCreateTeam(user);

  // 部署別グルーピング
  const teamsByDept = useMemo(() => {
    const map = new Map();
    depts.forEach(d => map.set(d.id, { dept: d, teams: [] }));
    teams.forEach(t => {
      if (!map.has(t.department_id)) {
        // 念のため：所属外の部署もカバー
        map.set(t.department_id, { dept: { id: t.department_id, name: '—' }, teams: [] });
      }
      map.get(t.department_id).teams.push(t);
    });
    return Array.from(map.values()).filter(g => g.teams.length > 0);
  }, [teams, depts]);

  const handleCreate = (newTeam) => {
    // 暫定：ダミーデータ追加は省略。Appwrite 連携時に実装。
    // ここでは alert で確認するのみ。
    console.log('新規チーム作成（ダミー）:', newTeam);
    alert(`チーム「${newTeam.name}」を作成しました（※ダミー、まだ DB に保存されません）`);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* ページヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: S.m,
        marginBottom: S.l,
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: C.text,
            margin: 0,
          }}>
            チーム
          </h1>
          <p style={{
            color: C.textSub,
            fontSize: '0.857rem',
            marginTop: S.xs,
            marginBottom: 0,
          }}>
            所属部署内のチームとメンバーを表示します
          </p>
        </div>
        {showCreate && (
          <Button Icon={Plus} onClick={() => setCreateOpen(true)}>
            チームを作成
          </Button>
        )}
      </div>

      {/* セクション 1：チーム一覧 */}
      <Section title="チーム一覧" Icon={UsersIcon} count={teams.length}>
        {teamsByDept.length === 0 ? (
          <EmptyState>所属部署にチームがありません</EmptyState>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.l }}>
            {teamsByDept.map(g => (
              <div key={g.dept.id}>
                <h3 style={{
                  fontSize: '0.857rem',
                  fontWeight: 700,
                  color: C.textSub,
                  margin: `0 0 ${S.s} 0`,
                  paddingLeft: S.xs,
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
                  {g.teams.map(t => <TeamCard key={t.id} team={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* セクション 2：メンバー一覧 */}
      <Section title="メンバー一覧" Icon={UserCog} count={members.length} style={{ marginTop: S.xl }}>
        {members.length === 0 ? (
          <EmptyState>メンバーがいません</EmptyState>
        ) : (
          <MembersTable members={members} />
        )}
      </Section>

      {/* チーム作成モーダル */}
      <CreateTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

// ============================================================
// Section — タイトル付きセクションのラッパー
// ============================================================
function Section({ title, Icon, count, style, children }) {
  return (
    <section style={{ marginBottom: S.xl, ...style }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
        marginBottom: S.m,
        paddingBottom: S.s,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {Icon && <Icon size={ICON_SM} color={C.accent} strokeWidth={2} />}
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: C.text,
          margin: 0,
        }}>
          {title}
        </h2>
        {typeof count === 'number' && (
          <span style={{
            fontSize: '0.75rem',
            color: C.textMuted,
            fontWeight: 700,
          }}>
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
      padding: S.xl,
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: '8px',
      textAlign: 'center',
      color: C.textMuted,
      fontSize: '0.857rem',
    }}>
      {children}
    </div>
  );
}
