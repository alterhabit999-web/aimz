/**
 * fix-invitations-permissions.js — invitations コレクションの read を公開する
 *
 * 招待リンクを踏むユーザーは未ログイン状態のため、Role.users() の read 権限では
 * トークン検証時に弾かれてしまう。
 *   → read のみ Role.any() に開放（PHASE 4 で users() に絞った例外）
 *   → create / update / delete は引き続き Role.users()
 *
 * 必要な API キー スコープ：collections.read / collections.write
 *
 * 使い方：
 *   npm run fix:invitations-permissions
 */

require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

const ENDPOINT    = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID  = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const API_KEY     = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('❌ .env を確認してください');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function main() {
  console.log('▶ fix-invitations-permissions');
  console.log('  対象：invitations コレクション\n');

  const permissions = [
    Permission.read(Role.any()),         // ← 公開（未ログインでもトークン検証可能に）
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  try {
    const col = await databases.getCollection(DATABASE_ID, 'invitations');
    await databases.updateCollection(
      DATABASE_ID,
      'invitations',
      col.name || 'Invitations',
      permissions,
      col.documentSecurity ?? false,
      col.enabled ?? true,
    );
    console.log('  ✓ invitations の permissions を更新');
    console.log('    - read:   Role.any()  ← 公開');
    console.log('    - create: Role.users()');
    console.log('    - update: Role.users()');
    console.log('    - delete: Role.users()');
    console.log('\n✅ 完了');
  } catch (err) {
    console.error('❌ エラー:', err?.message);
    if (err?.code === 401 && /missing scopes/.test(err.message)) {
      console.error('\nAPI キーに `collections.read` および `collections.write` スコープを追加してください。');
    }
    process.exit(1);
  }
}

main();
