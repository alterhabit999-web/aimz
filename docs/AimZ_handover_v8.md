# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-02  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v8

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：PHASE 3（DB 連携）大詰め。13 コレクションのうち主要 12 個（schedules + participants、notifications、invitations 含む）を実 DB 化完了。残るは `project_files`（Storage 連携）と、ダッシュボードの集計系・マイページ・管理者ダッシュボード。認証はまだダミーログインのまま。

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
| PHASE 3 | tasks + subtasks 実 DB 化（タスク CRUD・進捗率） | ✅ 完了（v7） |
| PHASE 3 | schedules + schedule_participants 実 DB 化（TodayScheduleWidget） | ✅ 完了（v8） |
| PHASE 3 | notifications + invitations 実 DB 化（`/notifications` + 招待モーダル） | ✅ 完了（v8） |
| PHASE 3 | project_files 実 DB 化（Storage 連携） | 🔲 **次回着手** |
| PHASE 3 | ダッシュボード残ウィジェット（UpcomingTasks / MyTasks / ProjectsProgress） | 🔲 未着手 |
| PHASE 3 | マイページ（`/profile`）の実 DB 化 | 🔲 未着手 |
| PHASE 3 | 管理者ダッシュボード（`/admin`）の集計実 DB 化 | 🔲 未着手 |
| PHASE 3 | カンバン DnD・ガント本実装 | 🔲 未着手 |
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

### 実装ステータス（v8 時点）

#### ✅ 実 DB 化済み

- **`/admin/users`**：profiles（5 人）— 一覧・編集・有効/停止・削除
- **`/admin/departments`**：departments（3 部署）— CRUD
- **`/teams`**：teams + team_members — 一覧・作成・編集・削除（差分同期）
- **`/projects`**：projects + project_assignees — 一覧・作成・編集・削除
- **`/projects/:id`**：projects + assignees + tasks 集約 — ヘッダー・進捗率
- **タスク CRUD**：tasks + subtasks — 親 + 小タスクをモーダルで一括保存（差分同期）
  - ガント / カンバン / タスク一覧 すべてのタブで TaskDetailModal を共有
  - 進捗率：手動 or 小タスク完了率の自動計算
- **`/notifications`**：notifications — 一覧 / フィルター / 既読化 / 全部既読 / クリック遷移
- **ダッシュボード「本日のスケジュール」**：schedules + schedule_participants
- **ダッシュボード「お知らせ」**：notifications
- **招待モーダル**：invitations — トークン発行・expires_at（7 日）保存

#### ⏸ まだダミー依存

- **ダッシュボードの残ウィジェット**：
  - `UpcomingTasksWidget`（期限が近いタスク）
  - `MyTasksWidget`（自分の担当タスク）
  - `ProjectsProgressWidget`（案件進捗サマリー）
- **マイページ** `/profile` — `myDepartments` / `myTeams` / `isTeamLeader` がダミー
- **管理者ダッシュボード** `/admin` — `teamProjectSummary` / `memberWorkloads` / `overdueTasks`
- **案件詳細「ファイル」タブ** — プレースホルダー（次回実装）
- **カンバンの DnD**・**ガントの本実装**
- 編集系で残っているもの：
  - **スケジュール CRUD モーダル**（表示は実 DB 化済みだが作成・編集・削除 UI は未実装）

#### ⚠ 開発中の暫定設定

- **コレクション権限を `Role.any()` で開放**（読み書き誰でも可）。
  ダミーログインで動かすための暫定。**PHASE 4（認証導入）時に `Role.users()` + 個別ポリシーに必ず戻す**こと。
  関連：`scripts/setup-appwrite.js` の `DEV_OPEN_PERMISSIONS`。

---

## 4. アーキテクチャ：DB 層と運用スクリプト

### 4-1. ディレクトリ構成（追加分）

```
~/Documents/App/aimz/
├── scripts/
│   ├── schema.js              13 コレクションのスキーマ定義
│   ├── setup-appwrite.js      コレクション + 属性 + インデックスを冪等作成
│   ├── seed-data.js           ダミーデータの投入用定義
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
        ├── subtasks.js
        ├── schedules.js
        ├── schedule-participants.js
        ├── notifications.js
        └── invitations.js
```

### 4-2. 運用コマンド

```bash
# コレクション作成 / 同期（属性追加・permissions 更新）
npm run setup:appwrite

# シード投入（全部）
npm run seed:appwrite

# シード投入（特定のテーブルだけ）
npm run seed:appwrite -- profiles
npm run seed:appwrite -- schedules schedule_participants
```

### 4-3. API 層の規約

すべてのモジュールで踏襲：

1. **戻り値は `{ ...doc, id: doc.$id }` に正規化**（UI 互換）
2. **日付フィールドは双方向変換**
   - 日付（date）：`'YYYY-MM-DD'` ⇄ ISO8601
   - 日時（datetime）：ローカル文字列 ⇄ UTC ISO8601（`new Date(s).toISOString()`）
3. **中間テーブルは合成 docId で冪等化**
   - team_members：`${team_id}_${user_id}`
   - project_assignees / schedule_participants：`${parent}__${user_id}`
4. **一括同期 API を提供**
   - `setTeamMembers` / `setAssignees` / `setSubtasksForTask` / `setParticipants`
5. **カスケード削除のヘルパー**
   - `deleteAllForTeam` / `deleteAllForProject` / `deleteAllSubtasksForTask` / `deleteAllParticipantsForSchedule`
6. **listByUser 系の名前衝突に注意**
   - `listMembershipsByUser`（team-members）/ `listAssignmentsByUser`（project-assignees）/ `listSchedulesByUser`（schedule-participants）

### 4-4. UI 層の規約

子コンポーネント（TeamCard / ProjectCard / TaskDetailModal 等）は **dummy.js への直接依存を排し、props 駆動** に統一。ページ側で Promise.all → useMemo で派生データを組み立て、子に整形済みオブジェクトを渡す。

---

## 5. 次回やること（再開手順）

### STEP 1：project_files + Storage 連携（最優先）

これで PHASE 3 の中核（13 コレクションすべて）が完了する。

**実装範囲：**

1. `src/api/project-files.js`：
   - `listFilesByProject(projectId)`
   - `uploadProjectFile(projectId, file, uploadedBy)` ─ Storage に upload → file_id を取得 → project_files に登録
   - `deleteProjectFile(id, fileId)` ─ project_files 削除 + Storage 削除
   - `getFileViewUrl(fileId)` ─ ダウンロード/プレビュー用 URL
2. `src/components/projects/tabs/FilesTab.jsx`：
   - ドロップゾーン UI で `<input type="file">` + drop イベント
   - アップロード後のリスト表示（ファイル名・サイズ・アップロード者・日付）
   - ダウンロード / 削除アクション
   - 50MB 制限のクライアント側バリデーション
3. **Storage Bucket の権限確認**：
   - Bucket ID `69f1465f0003ebde6dc6` の permissions も `Role.any()` に開放されているか要確認（コレクションと同じく開発中暫定）。
   - 必要なら Console で手動設定 or スクリプト化。
4. **Storage 経由 URL の扱い**：
   - `storage.getFileView(bucketId, fileId)` で URL 取得
   - `storage.getFileDownload(bucketId, fileId)` でダウンロード URL

参考：仕様書 3-7「ファイル管理」、5「project_files」テーブル定義。

### STEP 2：ダッシュボード残ウィジェットの実 DB 化

`UpcomingTasksWidget` / `MyTasksWidget` / `ProjectsProgressWidget` を `listTasks` ベースに切替：

- 自分の `assignee_id === user.id` のタスクをフィルタ
- ステータス別グルーピング、期限ソート、進捗計算は既存ロジックを移植

### STEP 3：マイページの実 DB 化

`myDepartments` / `myTeams` / `isTeamLeader` を、Appwrite から取得した `teamMembers` + `teams` + `departments` で再現。  
プロフィール編集を `updateProfile()` に接続。

### STEP 4：管理者ダッシュボードの集計実 DB 化

- 全チーム進捗：`teamProjectSummary` を実 DB 集計
- メンバー別タスク負荷：`memberWorkloads`
- 期限超過タスク：`overdueTasks`

### STEP 5（任意）：スケジュール CRUD モーダルの追加

「+予定」ボタンをダッシュボードまたは案件詳細に置き、`CreateScheduleModal` を作る。  
（現状の表示だけでも UX は成立しているので、後回しでも可）

### STEP 6：認証本実装（PHASE 4）+ 権限ポリシー（RLS）

- Appwrite Auth で実ログイン
- `AuthContext.jsx` のダミーログインをフォールバック扱いに
- コレクション権限を `Role.any()` から `Role.users()` + 細かい所有権チェックへ
- 招待トークン → アカウント作成フロー（既に invitations コレクションで token + expires_at を保存済み）

### STEP 7：GitHub Pages デプロイ（PHASE 5）

---

## 6. 開発中の TIPS / 注意点

- **`Role.any()` の暫定**：必ず PHASE 4 で `Role.users()` に戻すこと（`scripts/setup-appwrite.js`）。
- **`npm run setup:appwrite` は冪等**：何度実行しても安全。新しい属性 / インデックスを追加した場合は再実行で同期される。
- **シードの再投入**：upsert 動作。同じ ID で再投入可能。notifications だけは ID 自動採番なので、`seedNotifications` 内でいったん全件削除してから投入する設計。
- **dummy.js の扱い**：完全削除はまだ。ダミー依存箇所（ダッシュボード残・マイページ・管理者ダッシュボード）が解消されてから整理する。
- **通知の `related_type`**：schema に追加済み（v8）。`'task'` または `'project'` を保存。タスクの場合は親案件 ID を `getTask` で解決して遷移する。
- **`$createdAt` の扱い**：notifications では `$createdAt` を `created_at` として正規化して UI 互換性を維持。

---

## 7. 主要ファイル変更履歴（v8）

| ファイル | 変更 |
|---------|------|
| `scripts/schema.js` | notifications.related_type 属性を追加 |
| `scripts/seed-data.js` | SCHEDULES / SCHEDULE_PARTICIPANTS / NOTIFICATIONS を追加 |
| `scripts/seed.js` | seedSchedules / seedScheduleParticipants / seedNotifications |
| `src/api/schedules.js` | 新規（list/listByProject/listOnDate/get/CRUD） |
| `src/api/schedule-participants.js` | 新規（中間テーブル管理） |
| `src/api/notifications.js` | 新規（list/create/markRead/markAllRead/delete） |
| `src/api/invitations.js` | 新規（list/getByToken/create/markUsed/delete + token 生成） |
| `src/api/index.js` | schedules / schedule-participants / notifications / invitations を export |
| `src/components/dashboard/TodayScheduleWidget.jsx` | 実 DB 化、参加人数表示を追加 |
| `src/components/dashboard/NotificationsWidget.jsx` | 実 DB 化 |
| `src/pages/NotificationsPage.jsx` | 実 DB 化、楽観更新、再試行ボタン |
| `src/components/users/InviteUserModal.jsx` | createInvitation で実 DB に保存 |

---

## 8. 次回セッションの再開方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v8.md と docs/AimZ_spec_v1.4.md を確認してください。次は **project_files の実 DB 化（Appwrite Storage 連携）** からお願いします。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v5 | 2026-04-29〜30 | 設計・UI 実装 |
| v6 | 2026-04-30 | PHASE 2 UI 完了 |
| v7 | 2026-05-02 | PHASE 3 進行中：5/8 機能群を実 DB 化（profiles / departments / teams / projects / tasks） |
| v8 | 2026-05-02 | PHASE 3 進行：7/8 機能群を実 DB 化。schedules + participants（TodayScheduleWidget）、notifications + invitations（通知ページ + ダッシュボード + 招待モーダル）を完了。残るは project_files（Storage）と集計系・マイページ・管理者ダッシュボード。 |
