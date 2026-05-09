/**
 * update-task-project-optional.js — tasks.project_id を required=false に変更（v17）
 *
 * 既存の必須属性を任意属性に変更するためのワンショットスクリプト。
 * `updateStringAttribute(databaseId, collectionId, key, required, default, size, newKey?)`
 *
 * 使い方：
 *   APPWRITE_API_KEY=... node scripts/update-task-project-optional.js
 *   （.env / .env.local から自動で読まれる）
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Client, Databases } = require('node-appwrite');

const ENDPOINT     = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID   = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID  = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const API_KEY      = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('✗ 必要な環境変数が不足しています：REACT_APP_APPWRITE_ENDPOINT / _PROJECT_ID / _DATABASE_ID / APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function main() {
  console.log('▶ tasks.project_id を required=false に変更');
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log(`  project  = ${PROJECT_ID}`);
  console.log(`  database = ${DATABASE_ID}\n`);

  try {
    // updateStringAttribute(databaseId, collectionId, key, required, xdefault, size, newKey?)
    await databases.updateStringAttribute(
      DATABASE_ID,
      'tasks',
      'project_id',
      false,            // required = false
      null,             // default
      36,               // size（既存と同じ）
    );
    console.log('✓ 変更成功：tasks.project_id は任意属性になりました');
  } catch (err) {
    console.error('✗ 変更エラー:', err?.message || err);
    if (err?.code === 404) {
      console.error('  → tasks.project_id 属性が見つかりません（既に削除されている？）');
    } else if (err?.message?.includes('not allowed')) {
      console.error('  → SDK 経由での変更が許可されていません。Appwrite Console で手動変更してください：');
      console.error('     Databases → tasks → Attributes → project_id → Required を OFF');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
