/**
 * tokens.js — デザインシステムの定数
 *
 * SmartHR Design System ベースのカラー・スペーシングを一元管理。
 * すべてのコンポーネントは C / S を import して使う。
 *
 * 詳細仕様: ./DESIGN.md
 */

// ============================================================
// カラーパレット
// ============================================================
export const C = {
  // 背景
  bg:          '#f8f7f6',   // ページ全体の背景（Stone 01）
  bgSub:       '#edebe8',   // サイドバー・テーブルヘッダー背景（Stone 02）
  surface:     '#ffffff',   // カード・入力欄・コンポーネントの背景

  // アクセント
  accent:      '#0077c7',   // ボタン・アクティブ・フォーカス（Product Main）
  accentLight: '#e8f4fb',   // アクセントの薄い版（選択状態の背景など）
  brand:       '#00c4cc',   // ブランドカラー（ロゴ・チャート用。UIには使わない）

  // ステータスカラー
  success:     '#4bb47d',
  successBg:   '#edfaf3',
  warning:     '#ffcc17',
  warningBg:   '#fffbea',
  danger:      '#e01e5a',
  dangerBg:    '#fdeef4',
  orange:      '#ff9900',
  orangeBg:    '#fff5e6',

  // テキスト
  text:        '#23221e',   // 本文・見出し
  textSub:     '#706d65',   // サブテキスト・ラベル
  textMuted:   '#aaa69f',   // 補助テキスト
  textDisabled:'#c1bdb7',   // 無効状態
  textLink:    '#0071c1',   // テキストリンク

  // ボーダー・シャドウ
  border:      '#d6d3d0',
  borderFocus: '#0077c7',
  shadow1:     '0 2px 4px rgba(0,0,0,0.1)',
  shadow2:     '0 4px 8px rgba(0,0,0,0.15)',
};

// ============================================================
// スペーシング（8px ベース）
// ============================================================
export const S = {
  xs:  '4px',
  s:   '8px',
  m:   '16px',
  l:   '24px',
  xl:  '32px',
  xxl: '40px',
};

// ============================================================
// アイコンサイズ
// ============================================================
export const ICON_SM = 16;
export const ICON_MD = 18;
export const ICON_LG = 22;
