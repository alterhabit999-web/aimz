/**
 * sync-profile-emails.js — profiles の email を Appwrite Auth のメールに合わせて同期する
 *
 * 用途：
 *   - 招待フロー以前に手動で作ったユーザー（u1 など）は、Auth と profiles で
 *     メールが食い違うことがある。
 *   - このスクリプトで Auth 側のメールを正として profiles を上書きする。
 *
 * 動作：
 *   - 全 Auth ユーザーを取得
 *   - 各ユーザーについて profiles を取得
 *   - profiles.email !== Auth.email のときだけ updateDocument で同期
 *   - profiles に該当レコードが無いユーザー（招待消化前など）はスキップ
 *
 * 使い方：
 *   npm run sync:profile-emails
 */

require('dotenv').config();
const { Client, Users, Databases } = require('node-appwrite');

const ENDPOINT    = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID  = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const API_KEY     = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('❌ .env の設定を確認してください');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const users     = new Users(client);
const databases = new Databases(client);

async function main() {
  console.log('▶ sync-profile-emails');
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log('');

  // 全 Auth ユーザーを取得
  const list = await users.list();
  console.log(`Auth users: ${list.total} 件`);

  let updated = 0;
  let unchanged = 0;
  let missing = 0;

  for (const u of list.users) {
    let profile;
    try {
      profile = await databases.getDocument(DATABASE_ID, 'profiles', u.$id);
    } catch (err) {
      if (err?.code === 404) {
        console.log(`  ⚠ ${u.$id} <${u.email}>：profiles に存在しない（招待未消化？）`);
        missing++;
        continue;
      }
      throw err;
    }

    if (profile.email === u.email) {
      console.log(`  ・ ${u.$id} <${u.email}>：一致（更新不要）`);
      unchanged++;
      continue;
    }

    try {
      await databases.updateDocument(DATABASE_ID, 'profiles', u.$id, {
        email: u.email,
      });
      console.log(`  ✓ ${u.$id}：${profile.email}  →  ${u.email}`);
      updated++;
    } catch (err) {
      console.error(`  ✗ ${u.$id}:`, err?.message);
    }
  }

  console.log('');
  console.log(`✅ 完了：更新 ${updated} / 変更なし ${unchanged} / プロフィール未作成 ${missing}`);
}

main().catch(err => {
  console.error('\n❌ エラー:', err?.message || err);
  process.exit(1);
});
