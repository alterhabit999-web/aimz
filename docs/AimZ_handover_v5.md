# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-04-30  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v5

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：UI 主要画面（ダッシュボード / チーム / 案件一覧 / 案件詳細 / 部署管理）の骨格実装が完了。タスク CRUD は次回着手。Appwrite DB 連携は未着手（全 CRUD はダミー動作）。

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
| PHASE 2 | UI 実装：タスク詳細モーダル + タスク CRUD | 🔲 次回着手 |
| PHASE 2 | UI 実装：カンバン D&D 本実装 | 🔲 未着手 |
| PHASE 2 | UI 実装：ガントチャート本実装 | 🔲 未着手 |
| PHASE 2 | UI 実装：通知・マイページ・管理者ダッシュボード・ユーザー管理 | 🔲 未着手 |
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

### 主要機能（v1.4 時点の実装ステータス）

- ✅ ダッシュボード（5 ウィジェット）
- ✅ チーム画面（チーム一覧 + メンバー一覧、縦並び）
- ✅ 案件一覧（チーム別グルーピング、検索、ステータスフィルター）
- ✅ 案件詳細（ヘッダー + 4 タブ枠、編集/削除）
- ✅ 部署管理（管理者用、CRUD）
- ⏸ ガントチャート本体（簡易表のみ）
- ⏸ カンバンボード本体（カラム表示のみ、DnD なし）
- ⏸ タスク詳細モーダル / タスク CRUD（次回着手）
- ⏸ ファイル管理（プレースホルダー）
- ⏸ アプリ内通知ページ
- ⏸ マイページ
- ⏸ 管理者ダッシュボード / ユーザー管理

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

### 現在のファイル構成（v1.4 / v5 時点）

主要ディレクトリのみ抜粋。詳細は仕様書 v1.4 のセクション 8 を参照。

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
│   └── departments/                    DepartmentFormModal
└── pages/
    ├── LoginPage.jsx                   ✅
    ├── DashboardPage.jsx               ✅
    ├── TeamsPage.jsx                   ✅
    ├── ProjectsPage.jsx                ✅
    ├── ProjectDetailPage.jsx           ✅
    ├── NotificationsPage.jsx           ⏸
    ├── ProfilePage.jsx                 ⏸
    ├── NotFoundPage.jsx                ✅
    └── admin/
        ├── AdminDashboardPage.jsx      ⏸
        ├── UsersPage.jsx               ⏸
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

## 6. 今回のセッションで行ったこと

### 構想ヒアリング → 仕様確定（部署 / チーム / 案件）
**内容**：4 観点（A: 部署・チーム画面 / B: 案件一覧 / C: 案件詳細 / D: 新規作成 UI）でヒアリングを実施。  
**確定事項**：
- 複数部署所属を許容
- **チームリーダーロール新設**（チーム作成権限を付与）
- チーム画面は縦並び（チーム一覧 + メンバー一覧、両方常時表示）
- 案件一覧はチーム別グルーピング、サイドバーでダッシュボード直下
- 案件詳細のデフォルトタブはガント、ヘッダー項目・アクション位置は推奨案で実装
- 全作成 UI はモーダル、入力は最初から詳細項目まで全展開

### 仕様書 v1.2 → v1.3 → v1.4 への 2 段階更新
**v1.3 の主な変更**：
- ロール定義に **Team Leader** 追加（`team_members.role` カラム新設）
- 権限マトリクスを 4 ロール用に更新
- サイドバー仕様再設計（部署表示・項目順・チーム項目・部署管理リンク）
- 新規セクション 3-11（チーム画面）/ 3-14（新規作成 UI）追加
- ルート `/admin/departments` 追加

**v1.4 の主な変更**：
- 案件一覧・案件詳細・部署管理の実装ステータスを ✅ に更新
- **`project_assignees` 中間テーブル**を新規追加（複数担当者対応）
- 新規セクション 3-12（案件一覧画面）/ 3-13（案件詳細画面）追加
- ファイル構成図を最新化（`projects/`, `departments/`, `tabs/` フォルダ追記）
- `ConfirmDialog` コンポーネントをデザインシステムに追記

### コード実装 STEP 1〜5：チーム機能
**実装内容**：
- ダミーデータ更新：`team_members.role` 追加、`u1` を複数部署（営業 + 開発）所属に変更、リーダー設定
- ヘルパー追加：`myDepartments` / `myTeamIds` / `myTeams` / `visibleTeams` / `visibleMembers` / `membersOfTeam` / `teamMembershipsOf` / `isTeamLeader` / `isLeaderOf` / `canCreateTeam` / `canEditTeam` / `isMemberOf`
- サイドバー再構成：ロゴ直下に「営業部 / 開発部」表示、項目順「ダッシュボード→案件一覧→チーム→通知」、Admin セクションに「部署管理」追加
- ルート更新：`/departments` → `/teams` リダイレクト、`/admin/departments` 新設
- 共通 UI：`Modal.jsx`（Esc/バックドロップで閉じる、Portal）、`FormField.jsx`（label + input/select/textarea 共通スタイル + アイコン付きセレクト）
- `CreateTeamModal.jsx`：チーム名・部署・説明・リーダー（複数）・メンバー（複数）を一画面で入力。チェックボックス式の `UserMultiSelect` 内蔵
- `TeamCard.jsx`：チーム名・部署名・メンバー数・リーダー名・メンバーアバター列
- `MembersTable.jsx`：氏名・所属・ロール・メールのテーブル + 検索フィルター
- `TeamsPage.jsx`：縦並び 2 セクション（チーム一覧（部署別グルーピング） + メンバー一覧）、「チーム作成」ボタン（権限チェック付き）

### コード実装 STEP 6〜10：案件・部署機能
**実装内容**：
- ダミーデータ更新：`project.assignee_ids` 追加（複数担当者）
- ヘルパー追加：`canCreateProject` / `canEditProject` / `assigneesOfProject` / `teamMembersForProject`
- 共通 UI：`ConfirmDialog.jsx`（警告アイコン + メッセージ + Secondary/Danger ボタン）
- `ProjectCard.jsx`：ホバーで枠線アクセント色＋シャドウ強化、進捗バー、担当者アバター列、優先度バッジ
- `ProjectFormModal.jsx`：作成・編集兼用。案件名・説明・チーム・ステータス・優先度・期間・担当者を一画面入力。日付検証付き。編集時は担当チームのみ disabled
- `ProjectsPage.jsx`：チーム別グルーピング、検索、ステータスフィルター（チップ）、所属バッジ、件数表示、Empty State
- `ProjectHeader.jsx`：パンくず（一覧へ戻る）、案件名・ステータス・優先度バッジ、説明、メタ情報グリッド（所属・期間・担当者）、進捗バー、編集ボタン + その他メニュー（削除）
- タブコンポーネント 4 種：
  - `GanttTab.jsx`：簡易表（タスクを期間・進捗で並べる、注意書きで「本実装は別フェーズ」）
  - `KanbanTab.jsx`：4 カラム表示（未着手/進行中/完了/保留）、DnD なし
  - `TaskListTab.jsx`：タスクテーブル（小タスク完了数も表示）
  - `FilesTab.jsx`：ドロップゾーン仮 UI（Storage 連携時に本実装）
- `ProjectDetailPage.jsx`：ヘッダー + タブナビ + タブ本体、編集モーダル、削除確認ダイアログ。デフォルトタブは「ガント」
- `DepartmentFormModal.jsx`：部署 作成/編集（名前・説明）
- `AdminDepartmentsPage.jsx`：テーブル（名前・説明・チーム数・操作）、作成/編集/削除モーダル、Empty State

### ビルド検証
**修正したエラー**：
- `MembersTable.jsx`：未使用変数 `uniqueDepts` を削除
- `TaskListTab.jsx`：未使用 import `ICON_SM` を削除

最終的に `CI=true npm run build` で警告ゼロ・エラーゼロを確認。

### ⏸ 中断中（次回着手）
- **タスク詳細モーダル + タスク CRUD**（親タスク・小タスク管理）— 次回最優先
- すべての CRUD 操作は現在ダミー（alert + console.log）。Appwrite DB 連携時に実保存に差し替え必要

---

## 7. 次回やること（優先順位順）

### STEP 1：タスク詳細モーダル + タスク CRUD（最優先）

仕様書 3-4（親タスク）/ 3-5（小タスク）に沿って実装：

- **タスク作成モーダル**（`/projects/:id` から起動）
  - 必須：タスク名・ステータス（未着手/進行中/完了）
  - 任意：説明・開始日・期限・担当者（チームメンバーから選択）・優先度・進捗率
- **タスク詳細モーダル**（タスク一覧 / カンバンカード / ガント行クリックで起動）
  - 親タスク情報の表示・編集
  - 小タスクのチェックリスト（追加・チェック・削除）
  - 小タスクから親タスクの進捗率を自動計算するか手動入力かの切替
- **タスク削除確認**（既存 `ConfirmDialog` を使用）
- **タスク一覧タブ**：行クリックで詳細モーダル起動、+ 新規作成ボタン
- **カンバンタブ**：カードクリックで詳細モーダル起動、各カラムに + 新規ボタン
- **権限**：Admin / 該当チームのメンバーのみ作成・編集・削除可

### STEP 2：カンバンボードのドラッグ&ドロップ
- ライブラリ候補：`@dnd-kit/core`（軽量・推奨）or `react-beautiful-dnd`（メンテ停止のため非推奨）
- カラム間の移動でタスクのステータスを更新
- 同カラム内の並び替え（`order_index`）

### STEP 3：ガントチャート本体実装
- 日単位のタイムラインヘッダー（横スクロール）
- 各タスクのバー（開始日〜期限）
- 今日の縦線
- ステータス・優先度による色分け
- バーのドラッグで日程変更（フェーズ 1 か 2 かは未決定 ─ 仕様書 11 参照）

### STEP 4：その他のページ実装
- **通知ページ**（`/notifications`）：通知一覧、既読/未読フィルター
- **マイページ**（`/profile`）：氏名・アバター編集、パスワード変更
- **管理者ダッシュボード**（`/admin`）：全チーム進捗・メンバー別タスク負荷・期限超過一覧
- **ユーザー管理**（`/admin/users`）：招待・編集・停止・削除

### STEP 5：Appwrite DB コレクション作成（PHASE 3 開始）

13 個のコレクションを Appwrite コンソールで作成する：
1. profiles
2. departments
3. teams
4. team_members（role カラム必須）
5. projects
6. **project_assignees**（v1.4 追加）
7. tasks
8. subtasks
9. schedules
10. schedule_participants
11. project_files
12. notifications
13. invitations

各コレクションの権限ポリシー設定と、ダミーデータ → 実 API への差し替え。

### STEP 6：認証・招待制ログインの本実装

### STEP 7：ファイルアップロード（Appwrite Storage 連携）

### STEP 8：GitHub Pages デプロイ

---

## 8. 未決定事項

- [ ] 案件の「アーカイブ」機能の要否
- [ ] ガントチャートのタスクバードラッグ対応はフェーズ 1 か 2 か
- [ ] チームリーダーが自チームの新規メンバー招待まで可能にするか（現状は Admin のみ招待可）
- [ ] 案件詳細のヘッダー項目・アクション位置の最終確定（推奨案で実装中、フィードバック待ち）
- [ ] 案件編集時に担当チームの変更を許容するか（現状 disabled）
- [ ] タスクの進捗率：手動入力か小タスクからの自動計算か（次回ヒアリング予定）

---

## 9. 次回セッションの開始方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v5.md と docs/AimZ_spec_v1.4.md を確認してください。次は **タスク詳細モーダル + タスク CRUD** の実装からお願いします。」

ヒアリングの観点（次回最初に確認したい項目）：
- タスクの進捗率は手動入力 or 小タスクから自動計算か
- タスク作成モーダルから「+ 小タスク追加」を同画面でできるようにするか、別操作にするか
- タスク詳細モーダルでタスクのコメント機能は今回入れるか（仕様書ではフェーズ 2）

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1 | 2026-04-29 | 初版作成（仕様書完成、PHASE 0-2 まで完了） |
| v2 | 2026-04-29 | Appwrite 変更、デザインシステム確定、プロジェクトフォルダ構築完了 |
| v3 | 2026-04-29 | lucide-react 導入・絵文字廃止、DESIGN.md・仕様書・引き継ぎ書をフォルダに格納 |
| v4 | 2026-04-29 | Appwrite/.env 設定完了、GitHub リポジトリ接続、ファイル分割＋ react-router-dom 導入、ダッシュボード全 5 ウィジェット実装 |
| v5 | 2026-04-30 | 仕様書 v1.3→v1.4 更新（チームリーダーロール・`project_assignees` テーブル）、サイドバー再設計、`/teams`・`/projects`・`/projects/:id`・`/admin/departments` を実装、共通 Modal/FormField/ConfirmDialog コンポーネント追加 |
