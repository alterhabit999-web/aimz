/**
 * seed-auth-users.js — 開発確認用の Appwrite Auth ユーザーを一括作成
 *
 * - u1 は本物のメール + パスワードで Console で手動作成済み（あなた専用）
 * - u2〜u5 はこのスクリプトで作成（dummy.js と同じメール + 共通パスワード）
 *
 * 使い方：
 *   npm run seed:auth-users
 *
 * 必要な API キー スコープ：users.read / users.write
 *
 * 共通パスワード：Aimz2026!
 *   ログイン画面で u2〜u5 の動作確認をする際に使う。
 *   PHASE 5（本番デプロイ）前にこのスクリプトを実行しないようにすること。
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { Client, Users } = require('node-appwrite');

const ENDPOINT   = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const API_KEY    = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ .env に REACT_APP_APPWRITE_ENDPOINT / PROJECT_ID / APPWRITE_API_KEY を設定してください');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const users = new Users(client);

// 共通パスワード（開発確認用）
const PASSWORD = 'Aimz2026!';

// u1 はあなた専用なので除外
const AUTH_USERS = [
  { id: 'u2', email: 'sato@example.com',      name: '佐藤 花子' },
  { id: 'u3', email: 'suzuki@example.com',    name: '鈴木 一郎' },
  { id: 'u4', email: 'tanaka@example.com',    name: '田中 美咲' },
  { id: 'u5', email: 'takahashi@example.com', name: '高橋 健'   },
];

async function main() {
  console.log(`▶ seed-auth-users (${AUTH_USERS.length} users)`);
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log(`  共通パスワード：${PASSWORD}`);
  console.log('');

  for (const u of AUTH_USERS) {
    try {
      // create(userId, email, phone?, password?, name?)
      await users.create(u.id, u.email, undefined, PASSWORD, u.name);
      console.log(`  ✓ ${u.id} ${u.name} <${u.email}>`);
    } catch (err) {
      if (err?.code === 409) {
        // 既に存在する場合 → パスワードを更新（再実行可能にする）
        try {
          await users.updatePassword(u.id, PASSWORD);
          console.log(`  ↻ ${u.id} ${u.name} <${u.email}>（既存・パスワード更新）`);
        } catch (e2) {
          console.error(`  ✗ ${u.id}:`, e2?.message);
        }
      } else {
        console.error(`  ✗ ${u.id}:`, err?.message);
      }
    }
  }

  console.log('');
  console.log('✅ 完了。ログイン画面で次のメールアドレス + パスワードで動作確認できます：');
  for (const u of AUTH_USERS) {
    console.log(`   ${u.email}  /  ${PASSWORD}`);
  }
}

main().catch(err => {
  console.error('\n❌ エラー:', err?.message || err);
  process.exit(1);
});
