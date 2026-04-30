import React from 'react';
import { MessageSquare, AtSign } from 'lucide-react';
import { C, S } from '../../styles/tokens';

/**
 * CommentsPlaceholder — タスクコメント機能の将来枠（v1.5 で予約）。
 *
 * Q3=C：「@メンション」だけ将来対応用にプレースホルダーを置いておく。
 * フェーズ 2 で実装する想定。今は無効化された入力欄と説明文。
 */
export default function CommentsPlaceholder() {
  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: '6px',
      background: C.surface,
      padding: S.m,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
        marginBottom: S.s,
      }}>
        <MessageSquare size={14} color={C.textMuted} />
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: C.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          コメント
        </span>
        <span style={{
          fontSize: '0.7rem',
          padding: '2px 6px',
          borderRadius: '3px',
          background: C.bgSub,
          color: C.textSub,
          fontWeight: 700,
        }}>
          フェーズ 2 で実装
        </span>
      </div>

      {/* 無効化された入力欄プレビュー */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: S.s,
        padding: S.s,
        border: `1px dashed ${C.border}`,
        borderRadius: '6px',
        background: C.bg,
        opacity: 0.65,
        cursor: 'not-allowed',
      }}>
        <AtSign size={14} color={C.textMuted} style={{ marginTop: '4px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.857rem',
            color: C.textMuted,
            fontStyle: 'italic',
          }}>
            ここにコメントを入力（@ でメンション）
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: C.textMuted,
            marginTop: '4px',
          }}>
            タスクのコメント・履歴・メンション通知は今後実装予定です
          </div>
        </div>
      </div>
    </div>
  );
}
