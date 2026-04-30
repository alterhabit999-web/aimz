# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-04-30  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v6

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：PHASE 2 の全 UI 画面実装が完了。すべてのページ・モーダル・CRUD 操作が動作（ダミーデータ）。Appwrite DB 連携は未着手。次フェーズは Appwrite コレクション構築（PHASE 3）。

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0-1 | アプリ概要・ヒアリング | ✅ 完了 |
| PHASE 0-2 | 仕様書作成（AimZ_spec.md） | ✅ 完了 |
| PHASE 0-3 | デザインシステム確定（SmartHR ベース） | ✅ 完了 |
| PHASE 0-4 | デザインシステムをコードに反映 | ✅ 完了 |
| PHASE 1 | プロジェクトフォルダ構築 | ✅ 完了 |
| PHASE 1 | アイコンライブラリ導入（lucide-react）・絵文字を廃止 | ✅ 完了 |
| PHASE 1 | DESIGN.md・仕様書・引き継ぎ書をプロジェクトフォルダに格納 | ✅ 完了 |
| PHASE 1 | GitHub リポジトリ作成・接続 | ✅ 完了（v4） |
| PHASE 1 | Appwrite プロジェクト作成・.env 設定 | ✅ 完了（v4） |
| PHASE 2 | UI 実装：ファイル分割・ルーティング導入 | ✅ 完了（v4） |
| PHASE 2 | UI 実装：ダッシュボード全 5 ウィジェット | ✅ 完了（v4） |
| PHASE 2 | 構想ヒアリング（部署/チーム/案件一覧/案件詳細） | ✅ 完了（v5） |
| PHASE 2 | 仕様書 v1.3：チームリーダーロール・サイドバー再設計 | ✅ 完了（v5） |
| PHASE 2 | UI 実装：`/teams` 画面（チーム一覧 + メンバー一覧） | ✅ 完了（v5） |
| PHASE 2 | UI 実装：チーム作成モーダル | ✅ 完了（v5） |
| PHASE 2 | UI 実装：`/projects` 案件一覧（チーム別グルーピング） | ✅ 完了（v5） |
| PHASE 2 | UI 実装：`/projects/:id` 案件詳細（ヘッダー + 4 タブ枠） | ✅ 完了（v5） |
| PHASE 2 | UI 実装：案件作成・編集・削除モーダル | ✅ 完了（v5） |
| PHASE 2 | UI 実装：`/admin/departments` 部署管理 | ✅ 完了（v5） |
| PHASE 2 | 仕様書 v1.4：実装ステータス反映・`project_assignees` テーブル追加 | ✅ 完了（v5） |
| PHASE 2 | UI 実装：タスク詳細モーダル + タスク CRUD | ✅ 完了（v6） |
| PHASE 2 | UI 実装：通知ページ（`/notifications`） | ✅ 完了（v6） |
| PHASE 2 | UI 実装：マイページ（`/profile`） | ✅ 完了（v6） |
| PHASE 2 | UI 実装：管理者ダッシュボード（`/admin`） | ✅ 完了（v6） |
| PHASE 2 | UI 実装：ユーザー管理（`/admin/users`） | ✅ 完了（v6） |
| PHASE 2 | UI 実装：カンバン D&D 本実装 | 🔲 未着手 |
| PHASE 2 | UI 実装：ガントチャート本実装 | 🔲 未着手 |
| PHASE 2 | UI 実装：ファイルアップロード（Appwrite Storage 連携） | 🔲 未着手 |
| PHASE 3 | Appwrite DB コレクション作成（13 個） | 🔲 未着手 |
| PHASE 3 | RLS（権限）ポリシー設定 | 🔲 未着手 |
| PHASE 3 | データの読み書き実装（ダミー → 実 DB に差し替え） | 🔲 未着手 |
| PHASE 4 | 認証（招待制ログイン本実装） | 🔲 未着手 |
| PHASE 5 | GitHub Pages デプロイ | 🔲 未着手 |

---

## 3. 確定済み事項

### アプリ情報

| 項目 | 内容 |
|------|------|
| アプリ名 | AimZ（エイムズ） |
| コンセプト | 案件・タスクを可視化する社内プロジェクト管理ツール |
| 主要ユーザー | 社内メンバー（招待制） |
| 主要デバイス | PC（Web ブラウザ） |
| 認証方式 | 招待制（管理者がメールで招待、メール＋パスワードでログイン） |
| GitHub | https://github.com/alterhabit999-web/aimz |
| Appwrite Endpoint | `https://sgp.cloud.appwrite.io/v1`（Singapore） |
| Appwrite Project ID | `69f144ba0005896bc8c3` |
| Appwrite Database ID | `69f14627000c793e5a36` |
| Appwrite Storage Bucket ID | `69f1465f0003ebde6dc6` |

### 組織階層

```
部署（Department）
  └── チーム（Team）
        └── 案件（Project）
              ├── 親タスク（Task）→ 小タスク（Subtask）
              └── スケジュール（Schedule）
```

ユーザーは複数部署・複数チームに所属可能（v1.3）。

### 権限設計（v1.3 で更新）

| ロール | できること |
|--------|-----------|
| Admin | 全操作（部署・チーム管理、ユーザー招待/削除、全案件の閲覧/編集） |
| **Team Leader** | チーム作成、自チームの編集・メンバー管理 |
| Member | 自チームの案件・タスクの CRUD |
| 同部署メンバー（他チーム） | 他チームの案件・タスクの閲覧のみ |

### 主要機能（v6 時点の実装ステータス）

- ✅ ダッシュボード（5 ウィジェット）
- ✅ チーム画面（チーム一覧 + メンバー一覧、縦並び）
- ✅ 案件一覧（チーム別グルーピング、検索、ステータスフィルター）
- ✅ 案件詳細（ヘッダー + 4 タブ枠、編集/削除）
- ✅ タスク詳細モーダル（作成/編集/削除、小タスク、進捗率切替）
- ✅ 部署管理（管理者用、CRUD）
- ✅ 管理者ダッシュボード（全チーム進捗・メンバー負荷・期限超過）
- ✅ ユーザー管理（招待・編集・停止・削除）
- ✅ 通知ページ（フィルター・既読管理）
- ✅ マイページ（プロフィール編集・パスワード変更）
- ⏸ ガントチャート本体（簡易表のみ）
- ⏸ カンバンボード本体（カラム表示のみ、DnD なし）
- ⏸ ファイル管理（プレースホルダー）

### 技術スタック

| 項目 | 内容 |
|------|------|
| フロントエンド | React 18（create-react-app） |
| ルーティング | react-router-dom v7 |
| DB / 認証 | Appwrite Cloud |
| ファイル保存 | Appwrite Storage |
| ホスティング | GitHub Pages |
| デザイン | SmartHR Design System ベース |
| アイコン | lucide-react |

### テーブル一覧（v1.4 で 13 個）

`profiles` / `departments` / `teams` / `team_members`（role 付） /  
`projects` / **`project_assignees`**（v1.4 追加） / `tasks` / `subtasks` /  
`schedules` / `schedule_participants` / `project_files` / `notifications` / `invitations`

> 詳細な SQL 定義は `AimZ_spec_v1.4.md` のセクション 5 を参照。

---

## 4. 開発環境

- **プロジェクト場所**：`~/Documents/App/aimz`
- **開発ツール**：Claude Code（コード編集）＋ Mac ターミナル
- **ローカル確認**：`npm start` → `http://localhost:3000`
- **ダミーログイン**：実 Appwrite ユーザー未作成でも、ログイン画面の「ダミーログイン（管理者）」ボタンで UI 確認可能（u1 = 山田太郎・管理者・複数部署所属）
- **GitHub**：`git push origin main` で同期

### 現在のファイル構成（v1.4 / v6 時点）

```
src/
├── App.jsx
├── styles/tokens.js
├── data/dummy.js                       ダミー全データ＋集計＋権限ヘルパー
├── contexts/AuthContext.jsx
├── utils/format.js
├── components/
│   ├── ui/                             Card / Avatar / Badge / Button / Modal / FormField / ConfirmDialog / SectionLabel / PlaceholderPage
│   ├── layout/                         AppShell / Sidebar / Header / RequireAuth
│   ├── dashboard/                      5 ウィジェット
│   ├── teams/                          TeamCard / MembersTable / CreateTeamModal
│   ├── projects/                       ProjectCard / ProjectFormModal / ProjectHeader / tabs/[Gantt|Kanban|TaskList|Files]Tab
│   ├── tasks/                          TaskDetailModal / SubtaskList / ProgressModeControl / CommentsPlaceholder
│   ├── departments/                    DepartmentFormModal
│   └── users/                          InviteUserModal / EditUserModal
└── pages/
    ├── LoginPage.jsx                   ✅
    ├── DashboardPage.jsx               ✅
    ├── TeamsPage.jsx                   ✅
    ├── ProjectsPage.jsx                ✅
    ├── ProjectDetailPage.jsx           ✅
    ├── NotificationsPage.jsx           ✅
    ├── ProfilePage.jsx                 ✅
    ├── NotFoundPage.jsx                ✅
    └── admin/
        ├── AdminDashboardPage.jsx      ✅
        ├── UsersPage.jsx               ✅
        └── AdminDepartmentsPage.jsx    ✅
```

---

## 5. 開発フロー（Claude Code 使用時）

```bash
# ローカル確認
cd ~/Documents/App/aimz
npm start

# 変更を GitHub に保存
git add .
git commit -m "変更内容のメモ"
git push origin main

# 本番デプロイ（GitHub Pages）
npm run deploy
```

---

## 6. 今回のセッションで行ったこと（v6）

### PHASE 2 UI 全画面実装の完了

前セッション（v5）の継続として、残りの未実装ページ・モーダルをすべて実装。

**タスク詳細モーダル + タスク CRUD（`components/tasks/`）**
- `TaskDetailModal.jsx`：作成/編集モーダル一体型。タスク名・説明・ステータス・優先度・担当者・期間・進捗率・小タスクをすべて 1 画面で管理。
- `SubtaskList.jsx`：小タスクチェックリスト（Enter で追加、チェックで完了、× で削除）。
- `ProgressModeControl.jsx`：「手動入力」と「小タスクから自動計算」をトグル切替。
- `CommentsPlaceholder.jsx`：コメント欄プレースホルダー（フェーズ 2 で実装予定）。
- `GanttTab.jsx`・`KanbanTab.jsx`・`TaskListTab.jsx` に TaskDetailModal を接続。

**通知ページ（`/notifications`）**
- 通知タイプ（タスクアサイン・期限リマインダー・コメント・完了）別アイコン
- フィルター：すべて / 未読 / タイプ別
- クリックで関連案件・タスクへ遷移
- 既読化（ローカル状態）/ 全部既読ボタン

**マイページ（`/profile`）**
- プロフィールカード（氏名・メール・ロールバッジ・所属部署/チーム）
- プロフィール編集（氏名・アバター URL）
- パスワード変更（現在 + 新 + 確認、フォームバリデーション）
- ログアウトボタン

**管理者ダッシュボード（`/admin`）**
- 上段：サマリー数値カード（部署数 / チーム数 / ユーザー数 / 期限超過タスク数）
- 中段：全チーム進捗率（プログレスバー） / メンバー別タスク負荷（ヒートバー）
- 下段：期限超過タスク一覧（担当者・優先度バッジ・超過日数）
- 末尾：管理画面へのショートカットカード

**ユーザー管理（`/admin/users`）**
- ユーザー一覧テーブル（氏名 / メール / ロール / 所属チーム / 状態 / 操作）
- 検索フィルター（氏名・メール）+ タブフィルター（すべて / 管理者 / リーダー / 有効 / 停止中）
- `InviteUserModal.jsx`：メールアドレス + 権限 + 招待メッセージ → 招待リンク発行 → コピー
- `EditUserModal.jsx`：氏名 / 管理者フラグ / アカウント状態（有効/停止）を編集
- 削除確認ダイアログ（`ConfirmDialog` を再利用）

---

## 7. 次回やること（優先順位順）

### STEP 1：Appwrite DB コレクション作成（PHASE 3 開始）

13 個のコレクションを Appwrite コンソールで作成する：

1. `profiles`
2. `departments`
3. `teams`
4. `team_members`（`role` カラム必須：`leader` / `member`）
5. `projects`
6. `project_assignees`（`project_id` + `user_id` の中間テーブル）
7. `tasks`（`progress_mode`・`progress_rate` カラム含む）
8. `subtasks`
9. `schedules`
10. `schedule_participants`
11. `project_files`
12. `notifications`
13. `invitations`

各コレクションの権限ポリシー設定と、ダミーデータ → 実 API への差し替え。

> 詳細な属性定義・Appwrite 設定手順は `AimZ_spec_v1.4.md` のセクション 5 を参照。

### STEP 2：認証・招待制ログインの本実装（PHASE 4）

- Appwrite Auth を使ったログイン / ログアウト
- `AuthContext.jsx` のダミー認証 → 実 Appwrite 認証に差し替え
- 招待トークン検証 → パスワード設定 → アカウント作成フロー

### STEP 3：データ読み書き実装（ダミー → 実 Appwrite SDK）

各ページの `handleSubmit` / `handleDelete` の `console.log + alert` を、  
Appwrite SDK の `databases.createDocument` / `updateDocument` / `deleteDocument` に差し替える。  
`src/data/dummy.js` 内のヘルパーを順次 Appwrite Queries に移行。

### STEP 4：カンバンボードのドラッグ&ドロップ（オプション）

- ライブラリ候補：`@dnd-kit/core`（軽量・推奨）
- カラム間の移動でタスクのステータスを更新
- 同カラム内の並び替え（`order_index`）

### STEP 5：ガントチャート本体実装（オプション）

- 日単位のタイムラインヘッダー（横スクロール）
- 各タスクのバー（開始日〜期限）
- 今日の縦線

### STEP 6：GitHub Pages デプロイ（PHASE 5）

---

## 8. 未決定事項

- [ ] 案件の「アーカイブ」機能の要否
- [ ] ガントチャートのタスクバードラッグ対応はフェーズ 1 か 2 か
- [ ] チームリーダーが自チームの新規メンバー招待まで可能にするか（現状は Admin のみ招待可）
- [ ] 案件詳細のヘッダー項目・アクション位置の最終確定（推奨案で実装中）
- [ ] 案件編集時に担当チームの変更を許容するか（現状 disabled）

---

## 9. 次回セッションの開始方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v6.md と docs/AimZ_spec_v1.4.md を確認してください。次は **Appwrite DB コレクション作成（PHASE 3）** の実装からお願いします。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1 | 2026-04-29 | 初版作成（仕様書完成、PHASE 0-2 まで完了） |
| v2 | 2026-04-29 | Appwrite 変更、デザインシステム確定、プロジェクトフォルダ構築完了 |
| v3 | 2026-04-29 | lucide-react 導入・絵文字廃止、DESIGN.md・仕様書・引き継ぎ書をフォルダに格納 |
| v4 | 2026-04-29 | Appwrite/.env 設定完了、GitHub リポジトリ接続、ファイル分割＋ react-router-dom 導入、ダッシュボード全 5 ウィジェット実装 |
| v5 | 2026-04-30 | 仕様書 v1.3→v1.4 更新（チームリーダーロール・`project_assignees` テーブル）、サイドバー再設計、`/teams`・`/projects`・`/projects/:id`・`/admin/departments` を実装 |
| v6 | 2026-04-30 | タスク詳細モーダル CRUD・通知・マイページ・管理者ダッシュボード・ユーザー管理を実装し PHASE 2 UI をすべて完了 |
