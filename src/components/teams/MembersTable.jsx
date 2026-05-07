import React, { useMemo, useState } from 'react';
import { Search, Crown } from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { inputStyle } from '../ui/FormField';

/**
 * MembersTable — メンバー一覧（テーブル形式）。
 *
 * 列：氏名 / 部署・チーム / ロール / メール
 * 検索：氏名・メールで絞り込み
 *
 * Props:
 *   members: Array<{
 *     id, full_name, email, is_admin,
 *     memberships: [{ team_id, role, team: {name}, dept: {name} }]
 *   }>
 *
 *   各メンバーの memberships は呼び出し側で事前に組み立てて渡す。
 */
export default function MembersTable({ members }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      (m.full_name || '').toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <div>
      {/* 検索バー */}
      <div style={{ position: 'relative', marginBottom: S.m, maxWidth: '320px' }}>
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
          style={{
            ...inputStyle,
            paddingLeft: '36px',
            fontSize: '0.857rem',
          }}
        />
      </div>

      {/* テーブル（横スクロール対応） */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        overflow: 'auto',
        boxShadow: C.shadow1,
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
            該当するメンバーはいません
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.857rem',
          }}>
            <thead>
              <tr style={{ background: C.bgSub }}>
                <Th>氏名</Th>
                <Th>所属</Th>
                <Th>ロール</Th>
                <Th>メール</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => <MemberRow key={member.id} member={member} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member }) {
  // 親（TeamsPage）で組み立て済みのチーム所属情報を使う
  const memberships = member.memberships || [];
  const isLeaderAnywhere = memberships.some(m => m.role === 'leader');

  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      {/* 氏名 */}
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.s }}>
          <Avatar name={member.full_name} size={28} />
          <span style={{ fontWeight: 700, color: C.text }}>{member.full_name}</span>
        </div>
      </Td>

      {/* 所属 */}
      <Td>
        {memberships.length === 0 ? (
          <span style={{ color: C.textMuted }}>未所属</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {memberships.map((m, i) => (
              <div key={i} style={{ fontSize: '0.857rem', color: C.text }}>
                <span style={{ color: C.textMuted }}>{m.dept?.name || '—'}</span>
                <span style={{ color: C.textMuted, margin: '0 4px' }}>›</span>
                <span>{m.team?.name || '—'}</span>
                {m.role === 'leader' && (
                  <Crown size={11} color={C.orange} fill={C.orange} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </Td>

      {/* ロール */}
      <Td>
        {member.is_admin ? (
          <Badge variant="accent">管理者</Badge>
        ) : isLeaderAnywhere ? (
          <Badge variant="orange">リーダー</Badge>
        ) : (
          <Badge variant="default">メンバー</Badge>
        )}
      </Td>

      {/* メール */}
      <Td>
        <span style={{ color: C.textSub, fontSize: '0.857rem' }}>{member.email}</span>
      </Td>
    </tr>
  );
}

function Th({ children }) {
  return (
    <th style={{
      padding: `${S.s} ${S.m}`,
      textAlign: 'left',
      fontWeight: 700,
      color: C.textSub,
      fontSize: '0.75rem',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td style={{
      padding: `${S.s} ${S.m}`,
      verticalAlign: 'middle',
    }}>
      {children}
    </td>
  );
}
