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

module.exports = {
  PROFILES,
  DEPARTMENTS,
  TEAMS,
  TEAM_MEMBERS,
  PROJECTS,
  PROJECT_ASSIGNEES,
};
