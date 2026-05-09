/**
 * expand-avatar-url-size.js — profiles.avatar_url のサイズ拡張（v18）
 *
 * 旧：size=500（URL 想定）
 * 新：size=200000（base64 data URI を直接保存できる十分なサイズ）
 *
 * 256×256 / JPEG quality 0.85 のアバター画像で実測 15〜30KB なので余裕あり。
 *
 * 使い方：
 *   node scripts/expand-avatar-url-size.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Client, Databases } = require('node-appwrite');

const ENDPOINT     = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID   = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID  = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const API_KEY      = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('✗ 必要な環境変数が不足しています');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function main() {
  console.log('▶ profiles.avatar_url を size=200000 に拡張');
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log(`  project  = ${PROJECT_ID}`);
  console.log(`  database = ${DATABASE_ID}\n`);

  try {
    // updateStringAttribute(databaseId, collectionId, key, required, xdefault, size, newKey?)
    await databases.updateStringAttribute(
      DATABASE_ID,
      'profiles',
      'avatar_url',
      false,    // required
      null,     // default
      200000,   // size（拡張）
    );
    console.log('✓ 変更成功：profiles.avatar_url の size が 200000 になりました');
  } catch (err) {
    console.error('✗ 変更エラー:', err?.message || err);
    if (err?.message?.includes('not allowed')) {
      console.error('  → Appwrite Console で手動変更してください：');
      console.error('     Databases → profiles → Attributes → avatar_url → Size を 200000 に');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
