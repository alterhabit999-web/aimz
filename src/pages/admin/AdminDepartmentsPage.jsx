import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DepartmentFormModal from '../../components/departments/DepartmentFormModal';
import { DUMMY_DEPARTMENTS, teamsByDepartment } from '../../data/dummy';

/**
 * AdminDepartmentsPage — 部署管理（Admin のみ）。
 *
 *   - 部署一覧をテーブル表示
 *   - 作成 / 編集 / 削除（モーダル）
 *
 * 削除時の挙動：配下にチームがある場合は警告で止める想定。
 * 現状はダミーなので alert + console.log。
 */
export default function AdminDepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleCreate = (data) => {
    console.log('部署作成（ダミー）:', data);
    alert(`部署「${data.name}」を作成しました（※ダミー、まだ DB に保存されません）`);
  };
  const handleEdit = (data) => {
    console.log('部署編集（ダミー）:', data);
    alert(`部署「${data.name}」を更新しました（※ダミー）`);
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    console.log('部署削除（ダミー）:', deleteTarget);
    alert(`部署「${deleteTarget.name}」を削除しました（※ダミー）`);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: S.m,
        marginBottom: S.l,
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: 0 }}>
            部署管理
          </h1>
          <p style={{ color: C.textSub, fontSize: '0.857rem', marginTop: S.xs, marginBottom: 0 }}>
            部署の作成・編集・削除を行います（管理者のみ）
          </p>
        </div>
        <Button Icon={Plus} onClick={() => setCreateOpen(true)}>
          部署を作成
        </Button>
      </div>

      {/* テーブル */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: C.shadow1,
      }}>
        {DUMMY_DEPARTMENTS.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.857rem' }}>
            <thead>
              <tr style={{ background: C.bgSub }}>
                <Th>部署名</Th>
                <Th>説明</Th>
                <Th align="right">チーム数</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_DEPARTMENTS.map(dept => (
                <DepartmentRow
                  key={dept.id}
                  department={dept}
                  onEdit={() => setEditTarget(dept)}
                  onDelete={() => setDeleteTarget(dept)}
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

function DepartmentRow({ department, onEdit, onDelete }) {
  const teams = teamsByDepartment(department.id);
  const teamCount = teams.length;

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
        <div style={{ display: 'inline-flex', gap: S.xs }}>
          <Button variant="secondary" size="sm" Icon={Pencil} onClick={onEdit}>
            編集
          </Button>
          <Button variant="danger" size="sm" Icon={Trash2} onClick={onDelete}>
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
