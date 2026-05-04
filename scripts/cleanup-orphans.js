/**
 * cleanup-orphans.js — 親が削除されて孤立しているドキュメントを検出・削除する
 *
 * 検出対象：
 *   - tasks       ：project が存在しないもの
 *   - subtasks    ：task が存在しないもの
 *   - project_assignees：project が存在しないもの
 *   - schedules   ：project_id が指定されていて project が無いもの
 *   - schedule_participants：schedule が存在しないもの
 *   - project_files：project が存在しないもの（Storage 側の実体は残るので注意）
 *
 * 使い方：
 *   npm run cleanup:orphans              # ドライラン（削除候補を表示するだけ）
 *   npm run cleanup:orphans -- --apply   # 実際に削除
 */

require('dotenv').config();
const { Client, Databases, Storage, Query } = require('node-appwrite');

const ENDPOINT          = process.env.REACT_APP_APPWRITE_ENDPOINT;
const PROJECT_ID        = process.env.REACT_APP_APPWRITE_PROJECT_ID;
const DATABASE_ID       = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID;
const API_KEY           = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
  console.error('❌ .env を確認してください');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage   = new Storage(client);

// 全ドキュメントを取得（ページング）
async function listAll(collectionId) {
  const all = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);
    all.push(...res.documents);
    if (res.documents.length < limit) break;
    offset += limit;
  }
  return all;
}

async function deleteIfApply(collectionId, docId, label) {
  if (APPLY) {
    try {
      await databases.deleteDocument(DATABASE_ID, collectionId, docId);
      console.log(`  ✓ deleted: ${label}`);
    } catch (err) {
      console.error(`  ✗ delete失敗 ${label}:`, err?.message);
    }
  } else {
    console.log(`  · 候補: ${label}`);
  }
}

async function main() {
  console.log(`▶ cleanup-orphans  ${APPLY ? '(APPLY)' : '(DRY RUN — 削除しません。--apply で実行)'}`);
  console.log(`  database = ${DATABASE_ID}\n`);

  const [
    projects, tasks, subtasks, assignees,
    schedules, scheduleParticipants, projectFiles,
  ] = await Promise.all([
    listAll('projects'),
    listAll('tasks'),
    listAll('subtasks'),
    listAll('project_assignees'),
    listAll('schedules'),
    listAll('schedule_participants'),
    listAll('project_files'),
  ]);

  const projectIds  = new Set(projects.map(p => p.$id));
  const taskIds     = new Set(tasks.map(t => t.$id));
  const scheduleIds = new Set(schedules.map(s => s.$id));

  console.log(`現状: projects=${projects.length} tasks=${tasks.length} subtasks=${subtasks.length}` +
              ` assignees=${assignees.length} schedules=${schedules.length}` +
              ` schedule_participants=${scheduleParticipants.length}` +
              ` project_files=${projectFiles.length}\n`);

  // ─── tasks（project が無い） ───
  const orphanTasks = tasks.filter(t => !projectIds.has(t.project_id));
  console.log(`◆ orphan tasks: ${orphanTasks.length}`);
  for (const t of orphanTasks) {
    await deleteIfApply('tasks', t.$id, `tasks/${t.$id} (name=${t.name}, project=${t.project_id})`);
  }
  // 削除した tasks の id は subtasks の親が無くなる扱いにするため、taskIds から除外
  if (APPLY) {
    for (const t of orphanTasks) taskIds.delete(t.$id);
  }

  // ─── subtasks（task が無い） ───
  const orphanSubtasks = subtasks.filter(s => !taskIds.has(s.task_id));
  console.log(`\n◆ orphan subtasks: ${orphanSubtasks.length}`);
  for (const s of orphanSubtasks) {
    await deleteIfApply('subtasks', s.$id, `subtasks/${s.$id} (name=${s.name}, task=${s.task_id})`);
  }

  // ─── project_assignees（project が無い） ───
  const orphanAssignees = assignees.filter(a => !projectIds.has(a.project_id));
  console.log(`\n◆ orphan project_assignees: ${orphanAssignees.length}`);
  for (const a of orphanAssignees) {
    await deleteIfApply('project_assignees', a.$id, `project_assignees/${a.$id} (project=${a.project_id})`);
  }

  // ─── schedules（project_id 指定があるが project が無い） ───
  const orphanSchedules = schedules.filter(s => s.project_id && !projectIds.has(s.project_id));
  console.log(`\n◆ orphan schedules: ${orphanSchedules.length}`);
  for (const s of orphanSchedules) {
    await deleteIfApply('schedules', s.$id, `schedules/${s.$id} (title=${s.title}, project=${s.project_id})`);
    if (APPLY) scheduleIds.delete(s.$id);
  }

  // ─── schedule_participants（schedule が無い） ───
  const orphanParticipants = scheduleParticipants.filter(p => !scheduleIds.has(p.schedule_id));
  console.log(`\n◆ orphan schedule_participants: ${orphanParticipants.length}`);
  for (const p of orphanParticipants) {
    await deleteIfApply('schedule_participants', p.$id, `schedule_participants/${p.$id} (schedule=${p.schedule_id})`);
  }

  // ─── project_files（project が無い） ───
  const orphanFiles = projectFiles.filter(f => !projectIds.has(f.project_id));
  console.log(`\n◆ orphan project_files: ${orphanFiles.length}`);
  for (const f of orphanFiles) {
    await deleteIfApply('project_files', f.$id, `project_files/${f.$id} (name=${f.file_name}, project=${f.project_id})`);
    // Storage 側も削除
    if (APPLY && f.file_id) {
      try {
        await storage.deleteFile(STORAGE_BUCKET_ID, f.file_id);
        console.log(`    storage:${f.file_id} も削除`);
      } catch (e) {
        if (e?.code !== 404) console.warn(`    storage 削除失敗:`, e?.message);
      }
    }
  }

  console.log('\n' + (APPLY ? '✅ 削除完了' : 'ℹ️  ドライラン完了。実際に削除するには --apply を付けて実行：'));
  if (!APPLY) console.log('   npm run cleanup:orphans -- --apply');
}

main().catch(err => {
  console.error('\n❌ エラー:', err?.message || err);
  process.exit(1);
});
