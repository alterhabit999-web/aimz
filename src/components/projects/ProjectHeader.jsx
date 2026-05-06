import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Pencil,
  Trash2,
  MoreHorizontal,
  Building2,
  Users as UsersIcon,
} from 'lucide-react';
import { C, S, ICON_SM, ICON_MD } from '../../styles/tokens';
import Avatar from '../ui/Avatar';
import Badge, { statusVariant, priorityVariant } from '../ui/Badge';
import Button from '../ui/Button';
import { formatShortDate } from '../../utils/format';

/**
 * ProjectHeader — 案件詳細のヘッダー。
 *   - 戻るリンク → /projects
 *   - 案件名・ステータス・優先度
 *   - 期間・所属（部署 / チーム）・担当者
 *   - 進捗バー
 *   - 編集 / 削除アクション（権限がある場合）
 *
 * Props:
 *   project, canEdit, onEdit, onDelete
 *   team?:     { id, name }                       事前解決
 *   department?: { id, name }                     事前解決
 *   assignees?: Array<{id, full_name}>            事前解決
 *   progress?: number                             タスク平均進捗
 */
export default function ProjectHeader({ project, canEdit, onEdit, onDelete, team, department, assignees = [], progress = 0 }) {
  const navigate = useNavigate();
  const dept = department;

  return (
    <div style={{ marginBottom: S.l }}>
      {/* パンくず */}
      <button
        onClick={() => navigate('/projects')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          marginLeft: '-8px',
          background: 'transparent',
          border: 'none',
          color: C.textSub,
          cursor: 'pointer',
          fontSize: '0.75rem',
          borderRadius: '4px',
          fontFamily: 'inherit',
          marginBottom: S.s,
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.bgSub}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ChevronLeft size={14} />
        案件一覧に戻る
      </button>

      {/* メインヘッダー */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: S.l,
        boxShadow: C.shadow1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: S.m,
          marginBottom: S.m,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 'clamp(1.05rem, 4vw, 1.5rem)',
              fontWeight: 700,
              color: C.text,
              margin: 0,
              marginBottom: S.xs,
              lineHeight: 1.3,
            }}>
              {project.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, flexWrap: 'wrap' }}>
              <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              {project.priority && (
                <Badge variant={priorityVariant(project.priority)}>優先度：{project.priority}</Badge>
              )}
            </div>
          </div>

          {/* アクション */}
          {canEdit && (
            <ActionMenu onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>

        {/* 説明 */}
        {project.description && (
          <p style={{
            color: C.textSub,
            fontSize: '0.857rem',
            lineHeight: 1.6,
            margin: `0 0 ${S.m}`,
            whiteSpace: 'pre-wrap',
          }}>
            {project.description}
          </p>
        )}

        {/* 詳細メタ情報 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: S.m,
          padding: `${S.m} 0`,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <MetaItem Icon={Building2} label="所属">
            <span style={{ color: C.textSub }}>{dept?.name || '—'}</span>
            <span style={{ color: C.textMuted, margin: '0 4px' }}>›</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{team?.name || '—'}</span>
          </MetaItem>

          <MetaItem Icon={Calendar} label="期間">
            <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
              {formatShortDate(project.start_date)}
              <span style={{ color: C.textMuted, margin: '0 4px' }}>→</span>
              {formatShortDate(project.end_date)}
            </span>
          </MetaItem>

          <MetaItem Icon={UsersIcon} label="担当者">
            {assignees.length === 0 ? (
              <span style={{ color: C.textMuted }}>未設定</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {assignees.slice(0, 5).map((a, i) => (
                  <div key={a.id} style={{
                    marginLeft: i === 0 ? 0 : '-6px',
                    border: `2px solid ${C.surface}`,
                    borderRadius: '50%',
                  }} title={a.full_name}>
                    <Avatar name={a.full_name} size={24} />
                  </div>
                ))}
                {assignees.length > 5 && (
                  <span style={{ color: C.textMuted, fontSize: '0.75rem', marginLeft: S.xs }}>
                    他 {assignees.length - 5} 名
                  </span>
                )}
              </div>
            )}
          </MetaItem>
        </div>

        {/* 進捗バー */}
        <div style={{ marginTop: S.m }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '6px',
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: C.textSub,
              fontWeight: 700,
            }}>
              全体進捗（タスクの平均）
            </span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: progress === 100 ? C.success : C.text,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height: '8px',
            background: C.bgSub,
            borderRadius: '4px',
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
      </div>
    </div>
  );
}

// ============================================================
// MetaItem
// ============================================================
function MetaItem({ Icon, label, children }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.7rem',
        color: C.textMuted,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '4px',
      }}>
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div style={{ fontSize: '0.857rem' }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// ActionMenu — 編集・削除のメニュー
// ============================================================
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, flexShrink: 0 }}>
      <Button variant="secondary" size="sm" Icon={Pencil} onClick={onEdit}>
        編集
      </Button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="その他のアクション"
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: '6px 8px',
            cursor: 'pointer',
            color: C.textSub,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <MoreHorizontal size={ICON_MD} />
        </button>
        {open && (
          <>
            {/* バックドロップ（クリックでメニュー閉じる） */}
            <div
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 5 }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              minWidth: '160px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              boxShadow: C.shadow2,
              zIndex: 10,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => { setOpen(false); onDelete?.(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: S.s,
                  width: '100%',
                  padding: `${S.s} ${S.m}`,
                  border: 'none',
                  background: 'transparent',
                  color: C.danger,
                  cursor: 'pointer',
                  fontSize: '0.857rem',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={ICON_SM} />
                案件を削除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
