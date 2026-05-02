/**
 * setup-appwrite.js — Appwrite コレクションを一括作成 / 同期するセットアップスクリプト
 *
 * 使い方：
 *   1. .env に APPWRITE_API_KEY を設定（Appwrite Console > 設定 > API キー で発行）
 *   2. `npm run setup:appwrite`
 *
 * 動作：
 *   - 既に同名のコレクションが存在すれば「スキップ」（属性追加は行うが破壊的変更はしない）
 *   - 既に同名の属性が存在すればスキップ
 *   - 既に同名のインデックスが存在すればスキップ
 *
 * 注意：
 *   - このスクリプトは管理操作なので、API キー（高権限）が必要
 *   - API キーには Database > collections.read / collections.write / databases.read / attributes.* / indexes.* スコープが必要
 */

require('dotenv').config();
const { Client, Databases, Storage, Permission, Role, ID } = require('node-appwrite');
const { collections } = require('./schema');

// ─── 設定 ───
const ENDPOINT          = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID        = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID       = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID;
const API_KEY           = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID) {
  console.error('❌ .env に REACT_APP_APPWRITE_ENDPOINT / PROJECT_ID / DATABASE_ID を設定してください');
  process.exit(1);
}
if (!API_KEY) {
  console.error('❌ .env に APPWRITE_API_KEY を設定してください（Appwrite Console > 設定 > API キーで発行）');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage   = new Storage(client);

// ⚠ PHASE 3 の開発中はダミー認証で動かすため、いったん「誰でも可」で開放する。
//   PHASE 4 で Appwrite Auth を導入した時点で Role.users() に絞り、
//   さらに各コレクション単位の細かい権限ポリシーを実装する。
const DEV_OPEN_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];
const COLLECTION_PERMISSIONS = DEV_OPEN_PERMISSIONS;

// ─── ユーティリティ ───
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isConflict(err) {
  return err?.code === 409 || /already exists|same id/i.test(err?.message || '');
}
function isNotFound(err) {
  return err?.code === 404;
}

// ─── コレクション作成 / 権限更新 ───
async function ensureCollection(col) {
  try {
    await databases.getCollection(DATABASE_ID, col.id);
    // 既存：permissions のみ最新方針に合わせて更新する（属性は破壊しない）
    await databases.updateCollection(
      DATABASE_ID,
      col.id,
      col.name,
      COLLECTION_PERMISSIONS,
      col.documentSecurity ?? false,
      true // enabled
    );
    console.log(`  ☑ collection: ${col.id}（既存・permissions 更新）`);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    await databases.createCollection(
      DATABASE_ID,
      col.id,
      col.name,
      COLLECTION_PERMISSIONS,
      col.documentSecurity ?? false,
      true // enabled
    );
    console.log(`  ✓ collection: ${col.id}（作成）`);
  }
}

// ─── 属性作成 ───
async function ensureAttribute(col, attr) {
  // 既存チェック
  try {
    const list = await databases.listAttributes(DATABASE_ID, col.id);
    if (list.attributes?.some(a => a.key === attr.key)) {
      console.log(`    ・ attr ${attr.key}（既存）`);
      return;
    }
  } catch (e) {
    // listAttributes が無いバージョン用フォールバック
  }

  try {
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(
          DATABASE_ID, col.id, attr.key, attr.size, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'integer':
        await databases.createIntegerAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.min ?? null, attr.max ?? null,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'float':
        await databases.createFloatAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.min ?? null, attr.max ?? null,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'boolean':
        await databases.createBooleanAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'email':
        await databases.createEmailAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'url':
        await databases.createUrlAttribute(
          DATABASE_ID, col.id, attr.key, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      case 'enum':
        await databases.createEnumAttribute(
          DATABASE_ID, col.id, attr.key, attr.elements, attr.required,
          attr.default ?? null, attr.array ?? false
        );
        break;
      default:
        throw new Error(`未対応の attribute type: ${attr.type}`);
    }
    console.log(`    ✓ attr ${attr.key}（${attr.type}）`);
  } catch (err) {
    if (isConflict(err)) {
      console.log(`    ・ attr ${attr.key}（既存・409）`);
    } else {
      throw err;
    }
  }
}

// ─── 属性が available になるまで待つ（インデックス作成前に必要） ───
async function waitAttributesAvailable(collectionId, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const list = await databases.listAttributes(DATABASE_ID, collectionId);
    const allAvailable = (list.attributes || []).every(a => a.status === 'available');
    if (allAvailable) return;
    await sleep(500);
  }
  console.warn(`  ⚠ ${collectionId}: 属性の available 待ちタイムアウト（インデックス作成は試行を継続）`);
}

// ─── インデックス作成 ───
async function ensureIndex(col, idx) {
  try {
    const list = await databases.listIndexes(DATABASE_ID, col.id);
    if (list.indexes?.some(i => i.key === idx.key)) {
      console.log(`    ・ idx ${idx.key}（既存）`);
      return;
    }
  } catch (e) {
    // ignore and try create
  }

  try {
    await databases.createIndex(
      DATABASE_ID, col.id, idx.key, idx.type, idx.attributes,
      idx.orders ?? undefined
    );
    console.log(`    ✓ idx ${idx.key}（${idx.type}）`);
  } catch (err) {
    if (isConflict(err)) {
      console.log(`    ・ idx ${idx.key}（既存・409）`);
    } else {
      throw err;
    }
  }
}

// ─── Storage Bucket の権限同期 ───
async function ensureStorageBucket() {
  if (!STORAGE_BUCKET_ID) {
    console.log('  ☑ STORAGE_BUCKET_ID 未設定（skip）');
    return;
  }
  console.log(`◆ storage bucket: ${STORAGE_BUCKET_ID}`);
  try {
    const bucket = await storage.getBucket(STORAGE_BUCKET_ID);
    // 開発中：ファイルアップロード/参照を全員に開放
    await storage.updateBucket(
      STORAGE_BUCKET_ID,
      bucket.name || 'AimZ Files',
      DEV_OPEN_PERMISSIONS,
      bucket.fileSecurity ?? false,
      bucket.enabled ?? true,
      // 50 MB 上限（仕様書 3-7）
      50 * 1024 * 1024,
      // 許可拡張子（仕様書 3-7）
      ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
      bucket.compression ?? 'none',
      bucket.encryption ?? true,
      bucket.antivirus ?? true,
    );
    console.log('  ☑ permissions / 制限を更新');
  } catch (err) {
    if (err?.code === 404) {
      console.log('  ⚠ bucket が見つかりません。Appwrite Console で先に作成してください。');
    } else {
      console.error('  ✗ bucket 更新エラー:', err?.message);
    }
  }
}

// ─── メイン ───
async function main() {
  console.log(`▶ setup-appwrite (${collections.length} collections)`);
  console.log(`  endpoint = ${ENDPOINT}`);
  console.log(`  project  = ${PROJECT_ID}`);
  console.log(`  database = ${DATABASE_ID}\n`);

  for (const col of collections) {
    console.log(`◆ ${col.id}`);
    await ensureCollection(col);
    for (const attr of col.attributes) {
      await ensureAttribute(col, attr);
    }
    if (col.indexes?.length) {
      await waitAttributesAvailable(col.id);
      for (const idx of col.indexes) {
        await ensureIndex(col, idx);
      }
    }
    console.log('');
  }

  await ensureStorageBucket();
  console.log('');

  console.log('✅ Appwrite セットアップ完了');
}

main().catch(err => {
  console.error('\n❌ エラー:', err?.message || err);
  if (err?.response) console.error(err.response);
  process.exit(1);
});
