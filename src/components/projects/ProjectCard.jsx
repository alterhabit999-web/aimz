import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users as UsersIcon } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Avatar from '../ui/Avatar';
import Badge, { statusVariant, priorityVariant } from '../ui/Badge';
import { assigneesOfProject, projectProgress } from '../../data/dummy';
import { formatShortDate } from '../../utils/format';

const MAX_AVATARS = 4;

/**
 * ProjectCard — 案件一覧の 1 カード。
 * クリックで /projects/:id に遷移。
 */
export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const assignees = assigneesOfProject(project);
  const progress = projectProgress(project.id);
  const visible = assignees.slice(0, MAX_AVATARS);
  const remaining = assignees.length - visible.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/projects/${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/projects/${project.id}`);
        }
      }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: S.m,
        boxShadow: C.shadow1,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: S.s,
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
      {/* タイトル + バッジ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: S.s }}>
        <div style={{
          flex: 1,
          minWidth: 0,
          fontSize: '1rem',
          fontWeight: 700,
          color: C.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {project.name}
        </div>
        <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
      </div>

      {/* 説明 */}
      {project.description && (
        <div style={{
          fontSize: '0.857rem',
          color: C.textSub,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {project.description}
        </div>
      )}

      {/* 期間 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        color: C.textSub,
      }}>
        <Calendar size={12} color={C.textMuted} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatShortDate(project.start_date)} → {formatShortDate(project.end_date)}
        </span>
      </div>

      {/* プログレスバー */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '0.75rem', color: C.textMuted, fontWeight: 700 }}>進捗</span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: progress === 100 ? C.success : C.text,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {progress}%
          </span>
        </div>
        <div style={{
          height: '6px',
          background: C.bgSub,
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 ? C.success : C.accent,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* フッター：担当者・優先度 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: S.xs,
        borderTop: `1px dashed ${C.border}`,
      }}>
        {assignees.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {visible.map((a, i) => (
              <div key={a.id} style={{
                marginLeft: i === 0 ? 0 : '-6px',
                border: `2px solid ${C.surface}`,
                borderRadius: '50%',
              }} title={a.full_name}>
                <Avatar name={a.full_name} size={24} />
              </div>
            ))}
            {remaining > 0 && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: C.bgSub,
                color: C.textSub,
                fontSize: '0.7rem',
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
        ) : (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: C.textMuted,
            fontSize: '0.75rem',
          }}>
            <UsersIcon size={12} />
            担当者未設定
          </span>
        )}
        {project.priority && (
          <Badge variant={priorityVariant(project.priority)}>優先度：{project.priority}</Badge>
        )}
      </div>
    </div>
  );
}
