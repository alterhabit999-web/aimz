# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-02  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v7

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：PHASE 3（DB 連携）進行中。13 コレクションを Appwrite に作成済み、5/8 機能群が実 DB 化済み。残りはスケジュール・通知・招待・ファイル。認証はまだダミーログインのまま。

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0〜2 | 設計・UI 全画面実装 | ✅ 完了（v1〜v6） |
| PHASE 3 | Appwrite DB コレクション作成（13 個） | ✅ 完了（v7） |
| PHASE 3 | 共通基盤：API 層 + セットアップ/シードスクリプト | ✅ 完了（v7） |
| PHASE 3 | profiles 実 DB 化（`/admin/users`） | ✅ 完了（v7） |
| PHASE 3 | departments 実 DB 化（`/admin/departments`） | ✅ 完了（v7） |
| PHASE 3 | teams + team_members 実 DB 化（`/teams`） | ✅ 完了（v7） |
| PHASE 3 | projects + project_assignees 実 DB 化（`/projects`・詳細） | ✅ 完了（v7） |
| PHASE 3 | tasks + subtasks 実 DB 化（タスク CRUD・進捗率復活） | ✅ 完了（v7） |
| PHASE 3 | schedules + schedule_participants 実 DB 化 | 🔲 **次回着手** |
| PHASE 3 | notifications + invitations 実 DB 化 | 🔲 未着手 |
| PHASE 3 | project_files 実 DB 化（Storage 連携） | 🔲 未着手 |
| PHASE 3 | ダッシュボード（5 ウィジェット）の実 DB 化 | 🔲 未着手 |
| PHASE 3 | RLS（権限）ポリシーの本実装 | 🔲 未着手 |
| PHASE 4 | 認証（招待制ログイン本実装） | 🔲 未着手 |
| PHASE 5 | GitHub Pages デプロイ | 🔲 未着手 |

---

## 3. 確定済み事項

### アプリ情報

| 項目 | 内容 |
|------|------|
| アプリ名 | AimZ（エイムズ） |
| GitHub | https://github.com/alterhabit999-web/aimz |
| Appwrite Endpoint | `https://sgp.cloud.appwrite.io/v1`（Singapore） |
| Appwrite Project ID | `69f144ba0005896bc8c3` |
| Appwrite Database ID | `69f14627000c793e5a36` |
| Appwrite Storage Bucket ID | `69f1465f0003ebde6dc6` |

### 組織階層 / 権限設計

仕様書 v1.4 と同じ。Admin / Team Leader / Member / 同部署メンバー（他チーム）の 4 ロール。

### 実装ステータス（v7 時点）

#### ✅ 実 DB 化済み

- **`/admin/users`**：profiles（5 人）— 一覧・編集・有効/停止・削除
- **`/admin/departments`**：departments（3 部署）— CRUD
- **`/teams`**：teams + team_members — 一覧・作成・編集（リーダー / メンバー編成同期）・削除
- **`/projects`**：projects + project_assignees — チーム別グルーピング・検索・フィルター・作成
- **`/projects/:id`**：projects + assignees + tasks の集約 — ヘッダー編集・削除・進捗率
- **タスク CRUD**：tasks + subtasks — 親 + 小タスクをモーダルで一括保存（差分同期）
  - ガント / カンバン / タスク一覧 すべてのタブで同じ TaskDetailModal を使用
  - 進捗率：手動 or 小タスク完了率の自動計算（モード切替）

#### ⏸ まだダミー依存

- **ダッシュボード**（5 ウィジェット）— 全体的にダミーデータ参照
- **通知ページ** `/notifications` — DUMMY_NOTIFICATIONS
- **マイページ** `/profile` — myDepartments / myTeams 等のダミーヘルパー
- **管理者ダッシュボード** `/admin` — チーム進捗・期限超過・メンバー負荷
- **ユーザー管理の招待モーダル** — `InviteUserModal` は console.log のみ
- **案件詳細「ファイル」タブ** — プレースホルダー
- **カンバンの DnD・ガントの本実装**

#### ⚠ 開発中の暫定設定

- **コレクション権限を `Role.any()` で開放**しています（読み書き誰でも可）。
  ダミーログインだと Appwrite Auth セッションが無いため、`Role.users()` だと弾かれてしまうため。
  **PHASE 4（認証導入）時に `Role.users()` + 個別ポリシーに必ず戻す**こと。
  関連ファイル：`scripts/setup-appwrite.js` の `DEV_OPEN_PERMISSIONS`。

---

## 4. アーキテクチャ：DB 層と運用スクリプト

PHASE 3 で導入した仕組み。次回からの実装でも同じパターンを踏襲する。

### 4-1. ディレクトリ構成（追加分）

```
~/Documents/App/aimz/
├── scripts/
│   ├── schema.js              13 コレクションのスキーマ定義
│   ├── setup-appwrite.js      コレクション + 属性 + インデックスを冪等作成
│   ├── seed-data.js           ダミーデータの投入用定義（dummy.js と同じ ID 体系）
│   └── seed.js                npm run seed:appwrite で投入
└── src/
    └── api/
        ├── index.js
        ├── collections.js
        ├── profiles.js
        ├── departments.js
        ├── teams.js
        ├── team-members.js
        ├── projects.js
        ├── project-assignees.js
        ├── tasks.js
        └── subtasks.js
```

### 4-2. 運用コマンド

```bash
# コレクション作成 / 同期（属性追加・permissions 更新）
npm run setup:appwrite

# シード投入（全部）
npm run seed:appwrite

# シード投入（特定のテーブルだけ）
npm run seed:appwrite -- profiles
npm run seed:appwrite -- profiles departments teams team_members
```

`.env` に以下を含めること（`APPWRITE_API_KEY` はサーバ操作用、Console > Settings > API Keys で発行）：

```
REACT_APP_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=69f144ba0005896bc8c3
REACT_APP_APPWRITE_DATABASE_ID=69f14627000c793e5a36
REACT_APP_APPWRITE_STORAGE_BUCKET_ID=69f1465f0003ebde6dc6
APPWRITE_API_KEY=...（このセッションで発行済み。スコープ：databases / collections / attributes / indexes / documents の read+write）
```

### 4-3. API 層の設計方針

すべてのモジュールが共通で踏襲する規約：

1. **戻り値は `{ ...doc, id: doc.$id }` に正規化**
   - UI 側は dummy.js 由来の `id` プロパティを参照するコードが多いため互換性を担保。
2. **日付フィールドは双方向変換**
   - Appwrite の `datetime` 型 ⇄ UI 用 `'YYYY-MM-DD'`。
   - `toIso(s)` / `toDate(s)` の小ヘルパーを各モジュールに定義。
3. **中間テーブルは合成 docId で冪等化**
   - team_members：`${team_id}_${user_id}`
   - project_assignees：`${project_id}__${user_id}`（"_" 衝突回避で "__"）
4. **一括同期 API を提供**
   - `setTeamMembers(teamId, members)` / `setAssignees(projectId, userIds)` / `setSubtasksForTask(taskId, subtasks)`
   - 差分（追加 / 削除 / 更新）を内部で吸収する。
5. **カスケード削除のヘルパー**
   - `deleteAllForTeam` / `deleteAllForProject` / `deleteAllSubtasksForTask` を呼び出して整合性を保つ。
6. **listByUser 系の名前衝突に注意**
   - team-members は `listMembershipsByUser`、project-assignees は `listAssignmentsByUser` と機能名で区別済み。

### 4-4. UI 層の設計方針

子コンポーネント（TeamCard / ProjectCard / ProjectHeader / ProjectFormModal / TaskDetailModal / SubtaskList 等）は **dummy.js への直接依存を排し、props 駆動** に統一済み。

- ページ側で API を一括ロード（`Promise.all`）
- 派生データ（assignees / progress / memberships 等）を `useMemo` で組み立て
- 子に整形済みオブジェクトを渡す

これにより「ダミー or 実 DB」をページ側だけで切り替えられる構造になっている。

---

## 5. 次回やること（再開手順）

### STEP 1：schedules + schedule_participants（最優先）

要領は projects / project_assignees とまったく同じ：

1. `src/api/schedules.js` を作成（list/get/create/update/delete）
   - `start_at` / `end_at` は `datetime` 型なので、UI が時刻まで含む場合は `toLocalIso(s)` のような変換を考慮（ただし dummy では `'2026-04-29T10:00:00'` のような形式）
2. `src/api/schedule-participants.js`（中間テーブル管理、`setParticipants(scheduleId, userIds)`）
3. `scripts/seed-data.js` に `SCHEDULES` / `SCHEDULE_PARTICIPANTS` を追加し、`scripts/seed.js` で投入
4. UI は **`/dashboard` の TodayScheduleWidget** が主な利用箇所。実 DB 化のついでにダッシュボードのウィジェット 1 つを実 DB に切替。
5. スケジュール CRUD のモーダルは現状未実装（作る or プレースホルダーのままにするか要判断）

### STEP 2：notifications + invitations

- notifications：`/notifications` ページ + ダッシュボードのお知らせウィジェット。`is_read` 更新・全件既読化。
- invitations：`InviteUserModal` で発行 → token を保存 → 招待リンク発行。実際のトークン消化は PHASE 4。

### STEP 3：project_files

- Appwrite Storage との連携。Bucket ID は `.env` に設定済み（`69f1465f0003ebde6dc6`）。
- `FilesTab` を実装：ドラッグ&ドロップで `storage.createFile` → `project_files` に file_id を保存。

### STEP 4：ダッシュボード全体の実 DB 化

5 つのウィジェット（TodayScheduleWidget / UpcomingTasksWidget / MyTasksWidget / ProjectsProgressWidget / NotificationsWidget）を順次切替。

### STEP 5：管理者ダッシュボード（`/admin`）の実 DB 化

`teamProjectSummary` / `memberWorkloads` / `overdueTasks` をダミーから実 DB 集計へ。

### STEP 6：マイページ（`/profile`）の実 DB 化

`myDepartments` / `myTeams` / `isTeamLeader` を `team_members` 経由で再実装。

### STEP 7：認証本実装（PHASE 4）+ 権限ポリシー（RLS）

- Appwrite Auth で実ログイン
- `AuthContext.jsx` のダミーログインをフォールバック扱いに
- コレクション権限を `Role.any()` から `Role.users()` + 細かい所有権チェックへ
- 招待トークン → アカウント作成フロー

---

## 6. 開発中の TIPS / 注意点

- **`Role.any()` の暫定**：必ず PHASE 4 で `Role.users()` に戻すこと（`scripts/setup-appwrite.js`）。
- **`npm run setup:appwrite` は冪等**：何度実行しても安全。新しい属性 / インデックスを追加した場合は再実行で同期される。
- **シードの再投入**：`upsert` 動作なので、既存ドキュメントは内容更新される。同じ ID で再投入可能。
- **dummy.js の扱い**：完全削除はまだしていない。ダミー依存箇所が残っているため、最終的に PHASE 4 完了後に整理する。
- **チームメンバーの ID 規約**：`${team_id}_${user_id}` の形式。Appwrite docId 規約（a-z A-Z 0-9 . - _）にマッチする ID のみ。
- **ProjectAssignees の ID**：`__` （アンダースコア 2 つ）で区切り。userId にアンダースコアが含まれる場合への保険。

---

## 7. ファイル変更履歴（v7）

| ファイル | 変更 |
|---------|------|
| `package.json` | `setup:appwrite` / `seed:appwrite` script 追加。devDependencies に node-appwrite, dotenv |
| `.env.example` | `APPWRITE_API_KEY` 欄追加 |
| `scripts/schema.js` | 13 コレクションのスキーマ定義（新規） |
| `scripts/setup-appwrite.js` | 一括作成スクリプト（新規） |
| `scripts/seed-data.js` | profiles / departments / teams / team_members / projects / project_assignees / tasks / subtasks |
| `scripts/seed.js` | シード投入スクリプト（新規） |
| `src/api/` | 全 10 ファイル新規（profiles / departments / teams / team-members / projects / project-assignees / tasks / subtasks / collections / index） |
| `src/pages/admin/UsersPage.jsx` | 実 DB 化 |
| `src/pages/admin/AdminDepartmentsPage.jsx` | 実 DB 化 |
| `src/pages/TeamsPage.jsx` | 実 DB 化（編集 / 削除も含む） |
| `src/pages/ProjectsPage.jsx` | 実 DB 化 |
| `src/pages/ProjectDetailPage.jsx` | 実 DB 化 |
| `src/components/teams/TeamCard.jsx` | dummy 依存を撤去、props 駆動に。アクションボタンと人数表示の重なり修正 |
| `src/components/teams/MembersTable.jsx` | dummy 依存撤去、`member.memberships` props で受け取る |
| `src/components/teams/CreateTeamModal.jsx` | 作成・編集兼用に拡張、props 駆動化 |
| `src/components/projects/ProjectCard.jsx` | props 駆動 |
| `src/components/projects/ProjectHeader.jsx` | props 駆動 |
| `src/components/projects/ProjectFormModal.jsx` | props 駆動、async 化 |
| `src/components/projects/tabs/TaskListTab.jsx` | 実 DB CRUD |
| `src/components/projects/tabs/KanbanTab.jsx` | 実 DB CRUD |
| `src/components/projects/tabs/GanttTab.jsx` | 実 DB CRUD |
| `src/components/tasks/TaskDetailModal.jsx` | dummy 依存撤去、props 駆動、async 化 |
| `src/components/tasks/SubtaskList.jsx` | dummy 依存撤去（profileById props） |

---

## 8. 次回セッションの再開方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v7.md と docs/AimZ_spec_v1.4.md を確認してください。次は **schedules + schedule_participants の実 DB 化** からお願いします。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v5 | 2026-04-29〜30 | 設計・UI 実装 |
| v6 | 2026-04-30 | PHASE 2 UI 完了 |
| v7 | 2026-05-02 | PHASE 3 進行中：13 コレクション作成 + API 層整備 + 5/8 機能群を実 DB 化（profiles / departments / teams / projects / tasks）。残りはスケジュール・通知・招待・ファイル・ダッシュボード集計と認証本実装。 |
