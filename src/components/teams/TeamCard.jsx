import React from 'react';
import { Crown, Users as UsersIcon } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Avatar from '../ui/Avatar';

/**
 * TeamCard — チーム一覧の 1 枚カード。
 *
 *   - チーム名・所属部署
 *   - メンバー数
 *   - リーダー（王冠アイコン）と先頭数名のアバター
 *   - 説明（あれば）
 *
 * Props:
 *   team: { id, name, description, department_id }
 *   department?: { id, name }                       事前に解決した部署
 *   members?: Array<{ id, full_name, role }>        事前に解決したメンバー一覧
 */
const MAX_VISIBLE_AVATARS = 5;

export default function TeamCard({ team, department, members = [] }) {
  const dept = department;
  const leaders = members.filter(m => m.role === 'leader');
  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const remaining = members.length - visible.length;

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '8px',
      padding: S.m,
      boxShadow: C.shadow1,
      display: 'flex',
      flexDirection: 'column',
      gap: S.s,
    }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: S.s }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.75rem',
            color: C.textMuted,
            marginBottom: '2px',
          }}>
            {dept?.name || '—'}
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {team.name}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: C.textSub,
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          <UsersIcon size={12} />
          {members.length}
        </div>
      </div>

      {/* 説明 */}
      {team.description && (
        <div style={{
          fontSize: '0.857rem',
          color: C.textSub,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {team.description}
        </div>
      )}

      {/* リーダー */}
      {leaders.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.xs,
          fontSize: '0.75rem',
          color: C.textSub,
        }}>
          <Crown size={12} color={C.orange} fill={C.orange} />
          <span style={{ fontWeight: 700 }}>リーダー：</span>
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {leaders.map(l => l.full_name).join(' / ')}
          </span>
        </div>
      )}

      {/* メンバーアバター列 */}
      {members.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '-6px',
          marginTop: 'auto',
          paddingTop: S.xs,
          borderTop: `1px dashed ${C.border}`,
        }}>
          {visible.map((m, i) => (
            <div key={m.id} style={{
              marginLeft: i === 0 ? 0 : '-6px',
              border: `2px solid ${C.surface}`,
              borderRadius: '50%',
              position: 'relative',
            }} title={m.full_name + (m.role === 'leader' ? '（リーダー）' : '')}>
              <Avatar name={m.full_name} size={28} />
            </div>
          ))}
          {remaining > 0 && (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: C.bgSub,
              color: C.textSub,
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '-6px',
              border: `2px solid ${C.surface}`,
            }}>
              +{remaining}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
