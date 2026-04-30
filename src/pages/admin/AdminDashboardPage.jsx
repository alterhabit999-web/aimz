import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCog,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge, { priorityVariant } from '../../components/ui/Badge';
import {
  DUMMY_DEPARTMENTS,
  DUMMY_TEAMS,
  DUMMY_USERS,
  findDepartment,
  findProject,
  findUser,
  teamProjectSummary,
  memberWorkloads,
  overdueTasks,
} from '../../data/dummy';
import { formatShortDate } from '../../utils/format';
import { daysUntil } from '../../data/dummy';

/**
 * AdminDashboardPage — 管理者ダッシュボード（仕様 3-14）。
 *
 * 構成：
 *   - 上段：サマリー数値（部署 / チーム / ユーザー / 期限超過タスク）
 *   - 中段：全チーム進捗 / メンバー別タスク負荷
 *   - 下段：期限超過タスク一覧
 *   - 末尾：管理用画面へのショートカット
 */
export default function AdminDashboardPage() {
  const overdues = overdueTasks();
  const workloads = memberWorkloads();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: S.l }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: 0 }}>
          管理者ダッシュボード
        </h1>
        <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
          全体の進捗状況・メンバー負荷・期限超過を一覧します
        </p>
      </div>

      {/* 上段：サマリー数値 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: S.m,
        marginBottom: S.m,
      }}>
        <SummaryCard
          Icon={Building2}
          label="部署"
          value={DUMMY_DEPARTMENTS.length}
          to="/admin/departments"
        />
        <SummaryCard
          Icon={Users}
          label="チーム"
          value={DUMMY_TEAMS.length}
          to="/teams"
        />
        <SummaryCard
          Icon={UserCog}
          label="ユーザー"
          value={DUMMY_USERS.length}
          to="/admin/users"
        />
        <SummaryCard
          Icon={AlertTriangle}
          label="期限超過タスク"
          value={overdues.length}
          danger={overdues.length > 0}
        />
      </div>

      {/* 中段：チーム進捗 + メンバー負荷 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: S.m,
        marginBottom: S.m,
      }}>
        <TeamProgressCard />
        <MemberWorkloadCard workloads={workloads} />
      </div>

      {/* 下段：期限超過タスク */}
      <OverdueTasksCard overdues={overdues} />

      {/* ショートカット */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: S.m,
        marginTop: S.m,
      }}>
        <ShortcutCard Icon={UserCog}    title="ユーザー管理" desc="招待・権限・所属設定" to="/admin/users" />
        <ShortcutCard Icon={Building2}  title="部署管理"     desc="部署の作成・編集・削除" to="/admin/departments" />
        <ShortcutCard Icon={Settings}   title="チーム管理"   desc="チーム一覧 + メンバー" to="/teams" />
      </div>
    </div>
  );
}

// ============================================================
// 上段：サマリー
// ============================================================
function SummaryCard({ Icon, label, value, danger, to }) {
  const inner = (
    <div style={{
      background: C.surface,
      border: `1px solid ${danger && value > 0 ? C.danger : C.border}`,
      borderRadius: '8px',
      padding: S.m,
      boxShadow: C.shadow1,
      display: 'flex',
      alignItems: 'center',
      gap: S.m,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: danger && value > 0 ? C.dangerBg : C.accentLight,
        color: danger && value > 0 ? C.danger : C.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={ICON_SM} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.7rem',
          color: C.textMuted,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: danger && value > 0 ? C.danger : C.text,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </div>
      </div>
      {to && <ChevronRight size={14} color={C.textMuted} />}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

// ============================================================
// チーム進捗カード
// ============================================================
function TeamProgressCard() {
  const rows = DUMMY_TEAMS.map(t => {
    const dept = findDepartment(t.department_id);
    const summary = teamProjectSummary(t.id);
    return { team: t, dept, ...summary };
  }).filter(r => r.count > 0);

  return (
    <Card title="全チーム進捗率" Icon={TrendingUp}>
      {rows.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          チームに案件が登録されていません
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.s }}>
          {rows.map(r => (
            <li key={r.team.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: S.xs,
                  minWidth: 0,
                  flex: 1,
                }}>
                  <span style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                    {r.team.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: C.textMuted }}>
                    {r.dept?.name}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: C.textSub,
                  whiteSpace: 'nowrap',
                  marginLeft: S.s,
                }}>
                  完了 {r.completedCount} / {r.count}
                </div>
                <div style={{
                  fontSize: '0.857rem',
                  fontWeight: 700,
                  color: r.avgProgress === 100 ? C.success : C.text,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '44px',
                  textAlign: 'right',
                }}>
                  {r.avgProgress}%
                </div>
              </div>
              <div style={{
                height: '6px',
                background: C.bgSub,
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${r.avgProgress}%`,
                  height: '100%',
                  background: r.avgProgress === 100 ? C.success : C.accent,
                  transition: 'width 0.3s',
                }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// メンバー負荷カード
// ============================================================
function MemberWorkloadCard({ workloads }) {
  const max = Math.max(1, ...workloads.map(w => w.openCount));
  const visible = workloads.filter(w => w.total > 0).slice(0, 8);

  return (
    <Card title="メンバー別タスク負荷" Icon={Users}>
      {visible.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          タスクがアサインされているメンバーはいません
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.s }}>
          {visible.map(w => {
            const ratio = w.openCount / max;
            // 負荷レベル：未完了タスク数で 3 段階
            const heat =
              w.openCount >= 5 ? C.danger :
              w.openCount >= 3 ? C.orange :
              C.accent;
            return (
              <li key={w.user.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: S.s,
              }}>
                <Avatar name={w.user.full_name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                    {w.user.full_name}
                  </div>
                  <div style={{
                    height: '6px',
                    background: C.bgSub,
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginTop: '4px',
                  }}>
                    <div style={{
                      width: `${ratio * 100}%`,
                      height: '100%',
                      background: heat,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  minWidth: '64px',
                }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>
                    未完了 {w.openCount}
                  </span>
                  {w.overdueCount > 0 && (
                    <span style={{ color: C.danger, fontSize: '0.7rem' }}>
                      期限超過 {w.overdueCount}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// 期限超過タスク
// ============================================================
function OverdueTasksCard({ overdues }) {
  return (
    <Card title="期限超過タスク" Icon={AlertTriangle}>
      {overdues.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          期限超過のタスクはありません 🎉
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {overdues.map(t => {
            const project = findProject(t.project_id);
            const assignee = t.assignee_id ? findUser(t.assignee_id) : null;
            const days = daysUntil(t.due_date);
            return (
              <li key={t.id}>
                <Link
                  to={`/projects/${t.project_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: S.s,
                    padding: S.s,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.857rem', fontWeight: 700, color: C.text }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '2px' }}>
                      {project?.name}
                    </div>
                  </div>
                  {assignee && (
                    <div title={assignee.full_name}>
                      <Avatar name={assignee.full_name} size={24} />
                    </div>
                  )}
                  {t.priority && <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>}
                  <div style={{
                    minWidth: '120px',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                  }}>
                    <div style={{ color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                      {formatShortDate(t.due_date)}
                    </div>
                    <div style={{ color: C.danger, fontWeight: 700 }}>
                      {Math.abs(days)} 日超過
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// ショートカット
// ============================================================
function ShortcutCard({ Icon, title, desc, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: S.m,
        boxShadow: C.shadow1,
        display: 'flex',
        alignItems: 'center',
        gap: S.m,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.accent;
        e.currentTarget.style.boxShadow = C.shadow2;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = C.shadow1;
      }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: C.accentLight,
          color: C.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={ICON_SM} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.text }}>
            {title}
          </div>
          <div style={{ fontSize: '0.75rem', color: C.textSub, marginTop: '2px' }}>
            {desc}
          </div>
        </div>
        <ChevronRight size={14} color={C.textMuted} />
      </div>
    </Link>
  );
}
