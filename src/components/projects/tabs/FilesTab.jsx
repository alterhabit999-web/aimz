import React from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { C, S } from '../../../styles/tokens';

/**
 * FilesTab — ファイルタブ（プレースホルダー）。
 * Appwrite Storage 連携時に本実装。
 */
export default function FilesTab() {
  return (
    <div>
      {/* ドロップゾーン（仮） */}
      <div style={{
        background: C.surface,
        border: `2px dashed ${C.border}`,
        borderRadius: '8px',
        padding: S.xxl,
        textAlign: 'center',
        cursor: 'not-allowed',
        opacity: 0.7,
      }}>
        <UploadCloud size={36} color={C.textMuted} strokeWidth={1.5} />
        <h3 style={{ color: C.text, fontSize: '1rem', fontWeight: 700, margin: `${S.s} 0 ${S.xs}` }}>
          ここにファイルをドロップ
        </h3>
        <p style={{ color: C.textSub, fontSize: '0.857rem', margin: 0 }}>
          PNG / JPG / PDF / Word / Excel（最大 50MB）
        </p>
      </div>

      <div style={{
        marginTop: S.l,
        padding: S.l,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        textAlign: 'center',
        color: C.textMuted,
        fontSize: '0.857rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S.s,
      }}>
        <FileText size={16} />
        ファイル管理は Appwrite Storage 連携時に実装します
      </div>
    </div>
  );
}
