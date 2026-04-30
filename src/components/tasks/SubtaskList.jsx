import React, { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { C, S, ICON_SM } from '../../styles/tokens';
import Avatar from '../ui/Avatar';
import { findUser } from '../../data/dummy';
import { formatShortDate } from '../../utils/format';
import { inputStyle } from '../ui/FormField';

/**
 * SubtaskList — 親タスク内の小タスクチェックリスト。
 *
 * Q2=A：チェックリスト形式 + 末尾に「+ 追加」入力欄を常時表示。
 *
 * Props:
 *   subtasks: array
 *   onChange: (newList) => void   ─ 親に新しい配列を返す
 *   readOnly: boolean             ─ true で操作不可
 */
let nextLocalId = 9999;
const newId = () => `st-local-${++nextLocalId}`;

export default function SubtaskList({ subtasks = [], onChange, readOnly = false }) {
  const [draftName, setDraftName] = useState('');

  const addSubtask = () => {
    const name = draftName.trim();
    if (!name) return;
    onChange([
      ...subtasks,
      {
        id: newId(),
        name,
        is_completed: false,
        assignee_id: null,
        due_date: null,
      },
    ]);
    setDraftName('');
  };

  const toggleCompleted = (id) => {
    onChange(subtasks.map(s =>
      s.id === id ? { ...s, is_completed: !s.is_completed } : s
    ));
  };

  const removeSubtask = (id) => {
    onChange(subtasks.filter(s => s.id !== id));
  };

  const updateName = (id, name) => {
    onChange(subtasks.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleAddKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      background: C.surface,
      overflow: 'hidden',
    }}>
      {/* 既存の小タスク */}
      {subtasks.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {subtasks.map(s => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              onToggle={() => toggleCompleted(s.id)}
              onRemove={() => removeSubtask(s.id)}
              onRename={(name) => updateName(s.id, name)}
              readOnly={readOnly}
            />
          ))}
        </ul>
      )}

      {/* 末尾の追加入力欄 */}
      {!readOnly && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: S.s,
          padding: `${S.xs} ${S.s}`,
          borderTop: subtasks.length > 0 ? `1px solid ${C.border}` : 'none',
          background: C.bg,
        }}>
          <Plus size={ICON_SM} color={C.textMuted} />
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onKeyDown={handleAddKey}
            placeholder="新しい小タスクを追加…（Enter で確定）"
            style={{
              ...inputStyle,
              border: 'none',
              background: 'transparent',
              padding: '4px 0',
              fontSize: '0.857rem',
            }}
          />
          {draftName.trim() && (
            <button
              type="button"
              onClick={addSubtask}
              style={{
                padding: '4px 10px',
                background: C.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              追加
            </button>
          )}
        </div>
      )}

      {/* 空状態 */}
      {subtasks.length === 0 && readOnly && (
        <div style={{
          padding: S.m,
          color: C.textMuted,
          fontSize: '0.857rem',
          textAlign: 'center',
        }}>
          小タスクはありません
        </div>
      )}
    </div>
  );
}

// ============================================================
// SubtaskRow
// ============================================================
function SubtaskRow({ subtask, onToggle, onRemove, onRename, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subtask.name);
  const assignee = subtask.assignee_id ? findUser(subtask.assignee_id) : null;

  const finishEdit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== subtask.name) onRename(trimmed);
    else setName(subtask.name);
    setEditing(false);
  };

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
        padding: `${S.xs} ${S.s}`,
        borderBottom: `1px solid ${C.border}`,
        background: subtask.is_completed ? C.bg : C.surface,
      }}
    >
      <GripVertical size={14} color={C.textMuted} style={{ flexShrink: 0, cursor: 'grab', opacity: 0.5 }} />

      <input
        type="checkbox"
        checked={!!subtask.is_completed}
        onChange={onToggle}
        disabled={readOnly}
        style={{ accentColor: C.accent, cursor: readOnly ? 'not-allowed' : 'pointer' }}
      />

      {editing ? (
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); finishEdit(); }
            if (e.key === 'Escape') { setName(subtask.name); setEditing(false); }
          }}
          autoFocus
          style={{
            flex: 1,
            border: `1px solid ${C.borderFocus}`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.857rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => !readOnly && setEditing(true)}
          style={{
            flex: 1,
            fontSize: '0.857rem',
            color: subtask.is_completed ? C.textMuted : C.text,
            textDecoration: subtask.is_completed ? 'line-through' : 'none',
            cursor: readOnly ? 'default' : 'text',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
          title={readOnly ? '' : 'クリックして編集'}
        >
          {subtask.name}
        </span>
      )}

      {/* 期限 */}
      {subtask.due_date && (
        <span style={{
          fontSize: '0.7rem',
          color: C.textMuted,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {formatShortDate(subtask.due_date)}
        </span>
      )}

      {/* 担当者 */}
      {assignee && (
        <div title={assignee.full_name} style={{ flexShrink: 0 }}>
          <Avatar name={assignee.full_name} size={20} />
        </div>
      )}

      {/* 削除 */}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="小タスクを削除"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.textMuted,
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            flexShrink: 0,
            opacity: 0.6,
            transition: 'opacity 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.color = C.danger;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = 0.6;
            e.currentTarget.style.color = C.textMuted;
          }}
        >
          <X size={14} />
        </button>
      )}
    </li>
  );
}

