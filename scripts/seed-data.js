/**
 * seed-data.js — Appwrite に投入するシードデータ定義
 *
 * `src/data/dummy.js` の同名定数と同じ ID 体系で揃えており、
 * 段階的に実 DB へ切り替えていく際にダミーと実 DB が混在しても
 * 矛盾が出ないようにしている。
 *
 * Node.js から require するため CommonJS で書く。
 */

// ─────────── profiles ───────────
const PROFILES = [
  { id: 'u1', full_name: '山田 太郎', email: 'yamada@example.com',    is_admin: true,  avatar_url: null },
  { id: 'u2', full_name: '佐藤 花子', email: 'sato@example.com',      is_admin: false, avatar_url: null },
  { id: 'u3', full_name: '鈴木 一郎', email: 'suzuki@example.com',    is_admin: false, avatar_url: null },
  { id: 'u4', full_name: '田中 美咲', email: 'tanaka@example.com',    is_admin: false, avatar_url: null },
  { id: 'u5', full_name: '高橋 健',   email: 'takahashi@example.com', is_admin: false, avatar_url: null },
];

// ─────────── departments ───────────
const DEPARTMENTS = [
  { id: 'd1', name: '営業部', description: '営業活動全般を担当' },
  { id: 'd2', name: '開発部', description: 'プロダクト開発を担当' },
  { id: 'd3', name: '管理部', description: '総務・人事・経理' },
];

// ─────────── teams ───────────
const TEAMS = [
  { id: 't1', department_id: 'd1', name: '法人営業',     description: '法人顧客向け営業' },
  { id: 't2', department_id: 'd1', name: '個人営業',     description: '個人顧客向け営業' },
  { id: 't3', department_id: 'd2', name: 'フロントエンド', description: 'Web フロントエンド' },
  { id: 't4', department_id: 'd2', name: 'バックエンド',   description: 'API・DB' },
  { id: 't5', department_id: 'd3', name: '総務',           description: '社内総務' },
];

// ─────────── team_members ───────────
// 中間テーブル：docId は `${team_id}_${user_id}` の形式
const TEAM_MEMBERS = [
  // 法人営業
  { team_id: 't1', user_id: 'u3', role: 'leader' },
  { team_id: 't1', user_id: 'u2', role: 'member' },
  { team_id: 't1', user_id: 'u1', role: 'member' }, // u1 はマルチ部署
  // 個人営業
  { team_id: 't2', user_id: 'u2', role: 'leader' },
  // フロントエンド
  { team_id: 't3', user_id: 'u1', role: 'leader' },
  { team_id: 't3', user_id: 'u4', role: 'member' },
  // バックエンド
  { team_id: 't4', user_id: 'u5', role: 'leader' },
  { team_id: 't4', user_id: 'u1', role: 'member' },
];

// ─────────── projects ───────────
// dummy.js の DUMMY_PROJECTS と同じ内容。assignee_ids は project_assignees に分離。
const PROJECTS = [
  {
    id: 'p1', team_id: 't3', name: '社内ポータル刷新',
    description: '老朽化した社内ポータルサイトを React で刷新する',
    status: '進行中', priority: '高',
    start_date: '2026-04-01', end_date: '2026-06-30',
  },
  {
    id: 'p2', team_id: 't3', name: 'スマホアプリ開発',
    description: 'iOS/Android 両対応のネイティブアプリ',
    status: '未着手', priority: '中',
    start_date: '2026-05-15', end_date: '2026-09-30',
  },
  {
    id: 'p3', team_id: 't1', name: '新規顧客開拓キャンペーン',
    description: 'Q2 の新規顧客獲得施策',
    status: '進行中', priority: '高',
    start_date: '2026-04-01', end_date: '2026-06-30',
  },
  {
    id: 'p4', team_id: 't4', name: 'API リファクタリング',
    description: 'レガシー API の段階的リファクタ',
    status: '保留', priority: '低',
    start_date: '2026-04-15', end_date: '2026-07-31',
  },
];

// ─────────── project_assignees ───────────
const PROJECT_ASSIGNEES = [
  { project_id: 'p1', user_id: 'u1' },
  { project_id: 'p1', user_id: 'u4' },
  { project_id: 'p2', user_id: 'u1' },
  { project_id: 'p3', user_id: 'u3' },
  { project_id: 'p3', user_id: 'u2' },
  { project_id: 'p4', user_id: 'u5' },
];

// ─────────── tasks ───────────
const TASKS = [
  // p1
  { id: 'tk1',  project_id: 'p1', name: '要件定義',         description: '機能要件・非機能要件の整理', status: '完了',   priority: '高', assignee_id: 'u1', start_date: '2026-04-01', due_date: '2026-04-15', progress_rate: 100, progress_mode: 'manual', order_index: 1 },
  { id: 'tk2',  project_id: 'p1', name: 'デザインモックアップ', description: 'Figma で各画面のモックを作成', status: '進行中', priority: '高', assignee_id: 'u4', start_date: '2026-04-10', due_date: '2026-05-05', progress_rate: 60,  progress_mode: 'auto',   order_index: 2 },
  { id: 'tk3',  project_id: 'p1', name: 'フロントエンド実装', description: 'React + デザインシステムで実装', status: '進行中', priority: '中', assignee_id: 'u1', start_date: '2026-04-20', due_date: '2026-05-02', progress_rate: 30,  progress_mode: 'auto',   order_index: 3 },
  { id: 'tk4',  project_id: 'p1', name: 'バックエンド連携',   description: '', status: '未着手', priority: '中', assignee_id: 'u5', start_date: '2026-05-15', due_date: '2026-06-20', progress_rate: 0, progress_mode: 'manual', order_index: 4 },
  { id: 'tk5',  project_id: 'p1', name: 'リリース準備',       description: '', status: '未着手', priority: '高', assignee_id: 'u1', start_date: '2026-06-15', due_date: '2026-06-30', progress_rate: 0, progress_mode: 'manual', order_index: 5 },
  { id: 'tk10', project_id: 'p1', name: 'API 設計レビュー',   description: 'エンドポイント・スキーマのレビュー', status: '進行中', priority: '高', assignee_id: 'u1', start_date: '2026-04-22', due_date: '2026-04-27', progress_rate: 70, progress_mode: 'manual', order_index: 6 },
  // p2
  { id: 'tk6',  project_id: 'p2', name: '技術選定',         description: 'RN vs ネイティブの比較検討', status: '未着手', priority: '高', assignee_id: 'u1', start_date: '2026-04-30', due_date: '2026-05-05', progress_rate: 0, progress_mode: 'manual', order_index: 1 },
  { id: 'tk7',  project_id: 'p2', name: 'プロトタイプ作成', description: '', status: '未着手', priority: '中', assignee_id: 'u4', start_date: '2026-06-01', due_date: '2026-06-30', progress_rate: 0, progress_mode: 'manual', order_index: 2 },
  // p3
  { id: 'tk8',  project_id: 'p3', name: 'ターゲットリスト作成', description: '', status: '完了',   priority: '高', assignee_id: 'u2', start_date: '2026-04-01', due_date: '2026-04-10', progress_rate: 100, progress_mode: 'manual', order_index: 1 },
  { id: 'tk9',  project_id: 'p3', name: '訪問アポ取り',         description: '', status: '進行中', priority: '高', assignee_id: 'u3', start_date: '2026-04-08', due_date: '2026-05-31', progress_rate: 50,  progress_mode: 'manual', order_index: 2 },
];

// ─────────── subtasks ───────────
const SUBTASKS = [
  { id: 'st1', task_id: 'tk2', name: 'トップページ',     is_completed: true,  assignee_id: 'u4', due_date: '2026-04-25', order_index: 1 },
  { id: 'st2', task_id: 'tk2', name: '一覧ページ',       is_completed: true,  assignee_id: 'u4', due_date: '2026-04-28', order_index: 2 },
  { id: 'st3', task_id: 'tk2', name: '詳細ページ',       is_completed: false, assignee_id: 'u4', due_date: '2026-05-02', order_index: 3 },
  { id: 'st4', task_id: 'tk2', name: '管理画面',         is_completed: false, assignee_id: 'u4', due_date: '2026-05-05', order_index: 4 },
  { id: 'st5', task_id: 'tk3', name: 'コンポーネント設計', is_completed: true,  assignee_id: 'u1', due_date: '2026-04-25', order_index: 1 },
  { id: 'st6', task_id: 'tk3', name: 'ルーティング実装',   is_completed: false, assignee_id: 'u1', due_date: '2026-05-10', order_index: 2 },
];

module.exports = {
  PROFILES,
  DEPARTMENTS,
  TEAMS,
  TEAM_MEMBERS,
  PROJECTS,
  PROJECT_ASSIGNEES,
  TASKS,
  SUBTASKS,
};
