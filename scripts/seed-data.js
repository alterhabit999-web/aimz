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

module.exports = {
  PROFILES,
};
