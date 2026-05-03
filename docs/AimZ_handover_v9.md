# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-03  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v9

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：**PHASE 3 ほぼ完了**。13 コレクション + Storage を Appwrite に実装。主要画面はすべて実 DB 化済み。**カンバン DnD・ガント本実装も完了**。残るは認証本実装（PHASE 4）と GitHub Pages デプロイ（PHASE 5）のみ。

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0〜2 | 設計・UI 全画面実装 | ✅ 完了（v1〜v6） |
| PHASE 3 | Appwrite DB コレクション作成（13 個） | ✅ 完了（v7） |
| PHASE 3 | 共通基盤：API 層 + セットアップ/シードスクリプト | ✅ 完了（v7） |
| PHASE 3 | profiles / departments / teams + members 実 DB 化 | ✅ 完了（v7） |
| PHASE 3 | projects + assignees / tasks + subtasks 実 DB 化 | ✅ 完了（v7） |
| PHASE 3 | schedules + participants 実 DB 化（TodayScheduleWidget） | ✅ 完了（v8） |
| PHASE 3 | notifications + invitations 実 DB 化 | ✅ 完了（v8） |
| PHASE 3 | project_files 実 DB 化（Storage 連携） | ✅ 完了（v9） |
| PHASE 3 | ダッシュボード残ウィジェット（Upcoming / MyTasks / Progress） | ✅ 完了（v9） |
| PHASE 3 | マイページ（`/profile`）の実 DB 化 | ✅ 完了（v9） |
| PHASE 3 | 管理者ダッシュボード（`/admin`）の集計実 DB 化 | ✅ 完了（v9） |
| **拡張** | プロジェクトステータスのタスクからの自動同期 | ✅ 完了（v9） |
| **拡張** | カンバンボードの DnD 対応（@dnd-kit） | ✅ 完了（v9） |
| **拡張** | ガントチャート本実装（表示 + ドラッグで日程変更） | ✅ 完了（v9） |
| PHASE 3 | RLS（権限）ポリシーの本実装 | 🔲 未着手 |
| PHASE 4 | 認証（招待制ログイン本実装） | 🔲 **次回着手** |
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

### 実装ステータス（v9 時点）

#### ✅ 実 DB 化済み（dummy.js 依存ゼロまたは僅少）

- **`/dashboard`**：5 ウィジェットすべて実 DB
- **`/admin`**：管理者ダッシュボード（部署/チーム/ユーザー/期限超過/負荷/進捗）
- **`/admin/users`**：profiles 一覧・編集・有効/停止・削除
- **`/admin/departments`**：departments CRUD
- **`/teams`**：teams + team_members の CRUD（差分同期）
- **`/projects`** / **`/projects/:id`**：projects + assignees + tasks 集約
- **タスク CRUD**：tasks + subtasks（差分同期）、進捗率（手動 / 自動切替）
- **カンバン DnD**：カラム間移動 + 同カラム並び替え（@dnd-kit）
- **ガント**：日単位タイムライン + 今日線 + バードラッグで日程変更
- **`/notifications`**：notifications 一覧・既読化
- **招待モーダル**：invitations にトークン保存
- **ファイル**：Storage 連携（アップロード / ダウンロード / 削除）
- **マイページ**：プロフィール編集を実 DB に接続
- **プロジェクトステータス自動同期**：タスクが進行/完了になったら案件を自動進行中化

#### ⏸ まだダミー or 未実装

- **スケジュール CRUD モーダル**：表示は実 DB 化済みだが、作成・編集・削除 UI は未実装
- **パスワード変更**：UI のみ。Appwrite Auth 接続は PHASE 4 で
- **RLS ポリシー**：開発中の `Role.any()` のまま

#### ⚠ 開発中の暫定設定

- **コレクション + Storage Bucket の権限を `Role.any()` で開放**。
  ダミーログイン環境で動かすため。
  **PHASE 4（認証導入）時に `Role.users()` + 個別ポリシーに必ず戻す**。
  関連：`scripts/setup-appwrite.js` の `DEV_OPEN_PERMISSIONS`、Appwrite Console の Bucket Permissions。

---

## 4. アーキテクチャ：DB 層 / 運用スクリプト

### 4-1. ディレクトリ構成

```
~/Documents/App/aimz/
├── scripts/
│   ├── schema.js              13 コレクション + 属性 + インデックスの定義
│   ├── setup-appwrite.js      コレクション + 属性 + インデックス + Bucket 権限を冪等同期
│   ├── seed-data.js           ダミーデータ
│   └── seed.js                npm run seed:appwrite で投入
└── src/
    └── api/
        ├── index.js / collections.js
        ├── profiles.js / departments.js
        ├── teams.js / team-members.js
        ├── projects.js / project-assignees.js
        ├── tasks.js / subtasks.js
        ├── schedules.js / schedule-participants.js
        ├── notifications.js / invitations.js
        └── project-files.js
```

### 4-2. 運用コマンド

```bash
npm run setup:appwrite              # スキーマ同期
npm run seed:appwrite               # 全シード投入
npm run seed:appwrite -- profiles   # 個別投入
npm start                           # ローカル開発
npm run build                       # 本番ビルド
npm run deploy                      # GitHub Pages（PHASE 5）
```

### 4-3. API 層の規約

1. **戻り値は `{ ...doc, id: doc.$id }` に正規化**
2. **日付の双方向変換**（`'YYYY-MM-DD'` ⇄ ISO8601 / 時刻つきも UTC ISO8601 ⇄ ローカル文字列）
3. **中間テーブルは合成 docId で冪等化**（`team_members`：`${team_id}_${user_id}`、他は `${parent}__${user_id}`）
4. **一括同期 API**（`setTeamMembers` / `setAssignees` / `setSubtasksForTask` / `setParticipants`）
5. **カスケード削除のヘルパー**（`deleteAllForTeam` / `deleteAllForProject` / `deleteAllSubtasksForTask` / `deleteAllParticipantsForSchedule` / `deleteAllFilesForProject`）
6. **listByUser 系の名前衝突回避**（`listMembershipsByUser` / `listAssignmentsByUser` / `listSchedulesByUser`）

### 4-4. UI 層の規約

子コンポーネントは **dummy.js への直接依存を排し props 駆動**。  
ページ側で `Promise.all` → `useMemo` で派生データ → 子に整形済みで渡す。

### 4-5. ステータス同期

`syncProjectStatusFromTasks(projectId)` を `tasks` の create/update/delete 後に呼ぶ：
- 「未着手」のプロジェクトでタスクが 1 つでも進行中/完了 → 自動で「進行中」に
- 「進行中」「完了」「保留」は触らない（手動設定を尊重）

呼び出し場所：`TaskListTab` / `KanbanTab`（DnD のステータス変更も含む）/ `GanttTab`。

---

## 5. 次回やること（再開手順）

### STEP 1：認証本実装（PHASE 4）─ 最優先

#### 1-1：Appwrite Auth 連携

- `AuthContext.jsx` のダミーログインを実 Appwrite Auth に差し替え
  - `account.createEmailPasswordSession(email, password)` でログイン
  - `account.get()` でセッション復元
  - `account.deleteSession('current')` でログアウト
- ログイン後に `getProfile(user.$id)` で profiles から自分のプロフィールを取得
  - もし profiles に無ければ作成（招待トークン経由でのアカウント作成フロー）

#### 1-2：招待トークン消化フロー

- ルート `/invitations/:token` を新設し、`InvitationAcceptPage` を作る
- `getInvitationByToken(token)` でトークン検証 → expires_at チェック
- パスワード設定 → `account.create(...)` で Appwrite Auth ユーザー作成
- 同 ID で `createProfile(...)`
- `markInvitationUsed(invitation.id)` で消化済みに
- 自動ログイン or ログイン画面へ

#### 1-3：パスワード変更を実装

- `/profile` の `PasswordChanger` で `account.updatePassword(newPwd, oldPwd)` を呼ぶ
- 警告メッセージを撤去

#### 1-4：開発中の暫定設定を解除

- `scripts/setup-appwrite.js` の `DEV_OPEN_PERMISSIONS` を `Role.users()` ベースに変更
- `npm run setup:appwrite` で全コレクション + Bucket の permissions を更新
- 必要に応じて、より細かい individual permissions（document-level / file-level）を実装

#### 1-5：RLS ポリシー（権限）の細部

仕様書 5「RLS ポリシー設計方針」を Appwrite の collection-level + document-level permissions に置き換える：
- profiles：認証済み全員 read、自分のみ update
- departments / teams / users 系：admin のみ書き込み、認証済み全員 read
- projects / tasks / files：チームメンバーのみ書き込み（document permissions で実現）
- notifications：自分のものだけ操作可能

### STEP 2：スケジュール CRUD モーダル（任意）

PHASE 3 で表示はできているが、作成・編集・削除 UI が無い。  
`CreateScheduleModal` をダッシュボードまたは案件詳細に追加。

### STEP 3：GitHub Pages デプロイ（PHASE 5）

```bash
npm run deploy
```

ただし、Appwrite Console で **Platform 設定**に GitHub Pages の URL を追加する必要がある：
- Settings → Platforms → Add Platform → Web
- Hostname：`alterhabit999-web.github.io`

### STEP 4：dummy.js の整理

PHASE 4 完了後、`src/data/dummy.js` で残っているダミーヘルパー（`canCreateTask` 等）を実 DB ベースに置き換え or 撤去。

---

## 6. 開発中の TIPS / 注意点

- **`Role.any()` の暫定**：必ず PHASE 4 で `Role.users()` 以上に絞ること。
- **`npm run setup:appwrite` は冪等**：何度実行しても安全。
- **`npm run seed:appwrite` は upsert**：同じ ID で再投入可能。notifications は ID 自動採番なので毎回全削除してから投入する設計。
- **API キーの buckets スコープ**：`scripts/setup-appwrite.js` で Bucket を更新しようとすると buckets スコープが必要。現状 API キーには付与されていないため、Bucket 設定は **Appwrite Console で手動** している（Permissions / 50MB / 拡張子）。PHASE 4 で API キーを再発行する場合はスコープを追加するとスクリプトで一元管理できる。
- **dummy.js の扱い**：完全削除はまだ。PHASE 4 完了後に整理。
- **AuthContext と画面の同期**：プロフィール編集後、サイドバーの user 名は AuthContext のキャッシュなので即時反映されない。PHASE 4 で AuthContext を実 Auth と統合する際にあわせて修正。

---

## 7. 主要ファイル変更履歴（v9）

| ファイル | 変更 |
|---------|------|
| `scripts/setup-appwrite.js` | Storage Bucket の権限同期（ensureStorageBucket）追加 |
| `src/api/project-files.js` | 新規（Storage 連携：upload/download/delete） |
| `src/api/projects.js` | `syncProjectStatusFromTasks` を追加 |
| `src/components/projects/tabs/FilesTab.jsx` | 本実装（ドラッグ&ドロップ + 一覧 + ダウンロード/削除） |
| `src/components/projects/tabs/KanbanTab.jsx` | @dnd-kit による DnD 実装（カラム間 + 並び替え） |
| `src/components/projects/tabs/GanttTab.jsx` | 本実装（タイムライン + バードラッグで日程変更 + 今日線） |
| `src/components/projects/tabs/TaskListTab.jsx` | `syncProjectStatusFromTasks` 呼び出しを追加 |
| `src/pages/DashboardPage.jsx` | 全データ一括ロード + 派生データを各ウィジェットに props で渡す |
| `src/components/dashboard/{UpcomingTasks,MyTasks,ProjectsProgress}Widget.jsx` | props 駆動化 |
| `src/pages/ProfilePage.jsx` | 実 DB 化、`updateProfile()` 接続 |
| `src/pages/admin/AdminDashboardPage.jsx` | 集計を実 DB から計算 |
| `package.json` | `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities` 追加 |

---

## 8. 次回セッションの再開方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v9.md と docs/AimZ_spec_v1.4.md を確認してください。次は **PHASE 4：認証本実装（Appwrite Auth 連携 + 招待トークン消化フロー）** からお願いします。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v5 | 2026-04-29〜30 | 設計・UI 実装 |
| v6 | 2026-04-30 | PHASE 2 UI 完了 |
| v7 | 2026-05-02 | PHASE 3：5/8 機能群を実 DB 化 |
| v8 | 2026-05-02 | PHASE 3：7/8 機能群を実 DB 化（schedules / notifications / invitations） |
| v9 | 2026-05-03 | PHASE 3 ほぼ完了（project_files / 集計系すべて実 DB）。PHASE 2 の積み残し（カンバン DnD・ガント本実装）も完了。プロジェクトステータスの自動同期も実装。残るは PHASE 4（認証）と PHASE 5（デプロイ）。 |
