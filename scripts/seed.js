/**
 * seed.js — Appwrite にダミーデータを投入する
 *
 * 使い方：
 *   npm run seed:appwrite               # すべてのコレクションを投入
 *   npm run seed:appwrite -- profiles   # profiles のみ
 *
 * 動作：
 *   - 既存ドキュメント（同 ID）は upsert（update or create）
 *   - 失敗してもなるべく続行する（ログだけ残す）
 */

require('dotenv').config();
const { Client, Databases } = require('node-appwrite');
const seed = require('./seed-data');

const ENDPOINT    = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID  = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const API_KEY     = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('❌ .env に REACT_APP_APPWRITE_* と APPWRITE_API_KEY を設定してください');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function upsert(collectionId, docId, data) {
  try {
    // まず作成を試行
    await databases.createDocument(DATABASE_ID, collectionId, docId, data);
    return 'created';
  } catch (err) {
    if (err?.code === 409) {
      // 既存 → 更新
      try {
        await databases.updateDocument(DATABASE_ID, collectionId, docId, data);
        return 'updated';
      } catch (e2) {
        console.error(`  ✗ update ${collectionId}/${docId}:`, e2?.message);
        return 'error';
      }
    }
    console.error(`  ✗ create ${collectionId}/${docId}:`, err?.message);
    return 'error';
  }
}

// ─────────── 各テーブル ───────────
async function seedProfiles() {
  console.log(`◆ profiles (${seed.PROFILES.length} rows)`);
  for (const p of seed.PROFILES) {
    const { id, ...data } = p;
    const r = await upsert('profiles', id, {
      ...data,
      is_active: true,
    });
    console.log(`  ${r === 'created' ? '✓' : r === 'updated' ? '↻' : '✗'} ${id} ${data.full_name}`);
  }
}

async function seedDepartments() {
  console.log(`◆ departments (${seed.DEPARTMENTS.length} rows)`);
  for (const d of seed.DEPARTMENTS) {
    const { id, ...data } = d;
    const r = await upsert('departments', id, data);
    console.log(`  ${r === 'created' ? '✓' : r === 'updated' ? '↻' : '✗'} ${id} ${data.name}`);
  }
}

async function seedTeams() {
  console.log(`◆ teams (${seed.TEAMS.length} rows)`);
  for (const t of seed.TEAMS) {
    const { id, ...data } = t;
    const r = await upsert('teams', id, data);
    console.log(`  ${r === 'created' ? '✓' : r === 'updated' ? '↻' : '✗'} ${id} ${data.name}`);
  }
}

async function seedTeamMembers() {
  console.log(`◆ team_members (${seed.TEAM_MEMBERS.length} rows)`);
  for (const tm of seed.TEAM_MEMBERS) {
    const id = `${tm.team_id}_${tm.user_id}`;
    const r = await upsert('team_members', id, tm);
    console.log(`  ${r === 'created' ? '✓' : r === 'updated' ? '↻' : '✗'} ${id} (${tm.role})`);
  }
}

// ─────────── メイン ───────────
const TABLES = {
  profiles:      seedProfiles,
  departments:   seedDepartments,
  teams:         seedTeams,
  team_members:  seedTeamMembers,
};

async function main() {
  console.log(`▶ seed-appwrite`);
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log(`  database = ${DATABASE_ID}\n`);

  // 引数で指定されたテーブルだけ実行（無ければ全部）
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(TABLES);

  for (const t of targets) {
    if (!TABLES[t]) {
      console.warn(`  ⚠ unknown target: ${t}（skip）`);
      continue;
    }
    await TABLES[t]();
    console.log('');
  }

  console.log('✅ seed 完了');
}

main().catch(err => {
  console.error('\n❌ エラー:', err?.message || err);
  process.exit(1);
});
