import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { C, S } from '../../styles/tokens';
import Card from '../ui/Card';
import Badge, { statusVariant } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { myProjects, projectProgress } from '../../data/dummy';
import { formatShortDate } from '../../utils/format';

/**
 * ProjectsProgressWidget — 自分のチームの案件進捗サマリー。
 * 仕様 3-10-4。
 */
export default function ProjectsProgressWidget() {
  const { user } = useAuth();
  const projects = myProjects(user?.id);

  return (
    <Card title="担当プロジェクト" Icon={FolderOpen}>
      {projects.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: '0.857rem', textAlign: 'center', padding: `${S.l} 0`, margin: 0 }}>
          所属チームの案件はありません
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: S.s }}>
          {projects.map(p => <ProjectRow key={p.id} project={p} />)}
        </ul>
      )}
    </Card>
  );
}

function ProjectRow({ project }) {
  const progress = projectProgress(project.id);

  return (
    <li>
      <Link
        to={`/projects/${project.id}`}
        style={{
          display: 'block',
          padding: S.s,
          borderRadius: '6px',
          textDecoration: 'none',
          color: 'inherit',
          background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.bg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          marginBottom: S.xs,
        }}>
          <div style={{
            flex: 1,
            minWidth: 0,
            fontSize: '0.857rem',
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

        {/* プログレスバー */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
        }}>
          <div style={{
            flex: 1,
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
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: progress === 100 ? C.success : C.textSub,
            fontVariantNumeric: 'tabular-nums',
            minWidth: '36px',
            textAlign: 'right',
          }}>
            {progress}%
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: S.s,
          marginTop: '4px',
          fontSize: '0.75rem',
          color: C.textMuted,
        }}>
          <span>{formatShortDate(project.start_date)}</span>
          <span>→</span>
          <span>{formatShortDate(project.end_date)}</span>
        </div>
      </Link>
    </li>
  );
}
