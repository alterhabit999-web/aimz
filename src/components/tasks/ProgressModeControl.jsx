import React from 'react';
import { Sparkles, Hand } from 'lucide-react';
import { C, S } from '../../styles/tokens';

/**
 * ProgressModeControl — 進捗率の入力方式トグル + スライダー/数値入力。
 *
 * Props:
 *   mode: 'auto' | 'manual'
 *   manualValue: number       手動値（manual モード時に表示・編集）
 *   autoValue: number         自動計算値（auto モード時に表示）
 *   subtaskCount: number      auto モード時のヒント表示用
 *   onModeChange: (mode) => void
 *   onManualChange: (value) => void
 */
export default function ProgressModeControl({
  mode,
  manualValue = 0,
  autoValue = 0,
  subtaskCount = 0,
  onModeChange,
  onManualChange,
}) {
  const value = mode === 'auto' ? autoValue : manualValue;
  const isManual = mode === 'manual';

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      background: C.surface,
      padding: S.s,
    }}>
      {/* モード切替 */}
      <div style={{
        display: 'flex',
        gap: '2px',
        background: C.bgSub,
        borderRadius: '6px',
        padding: '2px',
        marginBottom: S.s,
      }}>
        <ModeBtn
          active={mode === 'manual'}
          onClick={() => onModeChange?.('manual')}
          Icon={Hand}
          label="手動入力"
        />
        <ModeBtn
          active={mode === 'auto'}
          onClick={() => onModeChange?.('auto')}
          Icon={Sparkles}
          label="小タスクから自動"
        />
      </div>

      {/* スライダー + 数値表示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.s,
      }}>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => isManual && onManualChange?.(Number(e.target.value))}
          disabled={!isManual}
          style={{
            flex: 1,
            accentColor: C.accent,
            cursor: isManual ? 'pointer' : 'not-allowed',
            opacity: isManual ? 1 : 0.7,
          }}
        />
        <div style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: value === 100 ? C.success : C.text,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '52px',
          textAlign: 'right',
        }}>
          {value}%
        </div>
      </div>

      {/* ヒント */}
      <div style={{
        marginTop: S.xs,
        fontSize: '0.7rem',
        color: C.textMuted,
      }}>
        {isManual
          ? 'スライダーで進捗率を直接指定します'
          : subtaskCount === 0
            ? '小タスクを追加すると自動計算されます'
            : `小タスク ${subtaskCount} 件の完了率から自動計算されています`}
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px 10px',
        background: active ? C.surface : 'transparent',
        color: active ? C.accent : C.textSub,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 700,
        fontFamily: 'inherit',
        boxShadow: active ? C.shadow1 : 'none',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
