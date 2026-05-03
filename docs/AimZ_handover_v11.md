# AimZ 引き継ぎ書（最終版）

**作成日**: 2026-04-29  
**更新日**: 2026-05-03  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v11（全 PHASE 完了 / 本番公開 / 既知問題 2 件解消）

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：**全 PHASE 完了 / 本番公開済み / SPA ルーティング 404 解消済み / プロフィール email 同期済み**。

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0 | 仕様策定・デザインシステム | ✅ |
| PHASE 1 | プロジェクト構築・GitHub・Appwrite 接続 | ✅ |
| PHASE 2 | UI 全画面・カンバン DnD・ガント本実装 | ✅ |
| PHASE 3 | 13 コレクション + Storage を実 DB 化 | ✅ |
| PHASE 4 | Appwrite Auth + 招待 + 権限 + ダミー撤去 | ✅ |
| PHASE 5 | GitHub Pages デプロイ | ✅ |
| 補修 | 既知問題：profiles の email 同期スクリプト | ✅ |
| 補修 | 既知問題：SPA 直接アクセス時の 404 解消 | ✅ |

---

## 3. 構成情報

### Appwrite

| 項目 | 値 |
|------|------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69f144ba0005896bc8c3` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6` |
| Web Platform | `localhost` / `alterhabit999-web.github.io` |

### GitHub

| 項目 | 値 |
|------|------|
| リポジトリ | https://github.com/alterhabit999-web/aimz |
| デフォルトブランチ | `main`（コード） |
| 公開ブランチ | `gh-pages`（自動生成） |
| 公開 URL | https://alterhabit999-web.github.io/aimz |

### 認証ユーザー（運用開始時）

| ID | 用途 | 認証情報 |
|----|------|---------|
| `u1` | 山田 太郎・**管理者**（あなた専用） | Console で手動作成。実メール / パスワードはあなたが設定 |
| `u2` | 佐藤 花子（メンバー） | `sato@example.com` / `Aimz2026!`（開発確認用） |
| `u3` | 鈴木 一郎（メンバー） | `suzuki@example.com` / `Aimz2026!` |
| `u4` | 田中 美咲（メンバー） | `tanaka@example.com` / `Aimz2026!` |
| `u5` | 高橋 健（メンバー） | `takahashi@example.com` / `Aimz2026!` |

> u2〜u5 は **開発確認用**。本格運用前に削除 or パスワード変更すること。

---

## 4. 運用ガイド

### 4-1. ローカル開発

```bash
cd ~/Documents/App/aimz
npm start                       # http://localhost:3000
```

### 4-2. デプロイ（再公開）

```bash
git add . && git commit -m "..."
git push origin main
npm run deploy                  # ビルド → gh-pages へ
```

GitHub Pages は 1〜3 分で反映。

### 4-3. Appwrite スキーマ変更時

```bash
npm run setup:appwrite          # 冪等。既存属性は触らない
```

### 4-4. シードデータ再投入

```bash
npm run seed:appwrite                       # 全テーブル
npm run seed:appwrite -- profiles teams     # 個別

# profiles を再投入したら、u1 のメールが Auth と乖離するので：
npm run sync:profile-emails                 # Auth のメールに同期
```

### 4-5. テスト用 Auth ユーザーの再作成

```bash
npm run seed:auth-users         # u2〜u5 を再作成 / パスワードリセット
```

### 4-6. 新メンバーの追加（実運用フロー）

1. u1（管理者）でログイン → `/admin/users`
2. **ユーザーを招待** → メール + 管理者フラグ + メッセージ
3. 招待リンクを本人にメールで共有
4. 本人がリンクを開く → 氏名 + パスワード設定 → 自動ログイン
5. `/teams` から該当チームに本人を追加

### 4-7. メンバーの削除

- `/admin/users` → 該当ユーザーの **削除** ボタン（profiles から削除）
- ⚠ Appwrite Auth ユーザーは別途 Console から削除する必要あり

### 4-8. プロフィールメールの同期

```bash
# Auth 側のメールを正として profiles を更新
npm run sync:profile-emails
```

実行が必要なタイミング：
- profiles のシード再投入後
- ユーザーが Console から自身のメールアドレスを変更した時

---

## 5. 機能一覧

### ✅ 実装済み

- **認証**：Appwrite Auth（メール+パスワード）/ 招待トークン消化 / パスワード変更
- **ダッシュボード**：5 ウィジェット（本日の予定 / 期限 / 自分のタスク / 進捗 / 通知）
- **チーム**：一覧 + メンバー一覧、CRUD（リーダー権限）
- **案件**：一覧（チーム別グルーピング）、検索、ステータスフィルター、CRUD
- **案件詳細**：ヘッダー + 4 タブ（ガント/カンバン/タスク一覧/ファイル）、編集/削除
- **タスク**：作成/編集/削除、小タスク差分同期、進捗率（手動/自動）
- **ガント**：日単位タイムライン、今日線、バードラッグで日程変更
- **カンバン DnD**：@dnd-kit でカラム間移動 + 並び替え
- **ファイル**：Appwrite Storage 連携（アップロード / DL / 削除、50MB / 拡張子制限）
- **通知**：通知一覧、フィルター、既読化、全部既読
- **マイページ**：プロフィール編集、パスワード変更
- **管理者ダッシュボード**：チーム進捗、メンバー負荷、期限超過
- **ユーザー管理**：一覧、招待、編集、停止、削除
- **部署管理**：CRUD
- **プロジェクトステータス自動同期**：タスクが進行/完了 → 案件「進行中」化
- **SPA ルーティング**：直接 URL アクセス・リロードで 404 にならない（spa-github-pages 方式）

### ⏸ 未実装 / 将来拡張

- **スケジュール CRUD UI**：表示は実装済み、作成/編集/削除モーダル未実装
- **タスクのコメント機能**（仕様書フェーズ 2）
- **メール通知**（仕様書フェーズ 2）
- **Slack 通知連携**（仕様書フェーズ 2）
- **PWA 対応**（仕様書フェーズ 2）
- **CSV エクスポート**（仕様書フェーズ 2）
- **profiles 削除時の Auth 連動削除**

---

## 6. アーキテクチャまとめ

### 6-1. ディレクトリ

```
src/
├── App.jsx                 ルーティング
├── styles/tokens.js        デザイントークン
├── data/dummy.js           ダミーデータ（一部ヘルパーが残存）
├── contexts/AuthContext.jsx
├── utils/format.js
├── api/                    Appwrite データアクセス層
│   ├── index.js / collections.js
│   ├── profiles.js / departments.js
│   ├── teams.js / team-members.js
│   ├── projects.js / project-assignees.js
│   ├── tasks.js / subtasks.js
│   ├── schedules.js / schedule-participants.js
│   ├── notifications.js / invitations.js
│   └── project-files.js
├── components/
│   ├── ui/                 共通 UI
│   ├── layout/             AppShell, Sidebar, Header, RequireAuth
│   ├── dashboard/          5 ウィジェット
│   ├── teams/              TeamCard, MembersTable, CreateTeamModal
│   ├── projects/           ProjectCard, ProjectFormModal, tabs/
│   ├── tasks/              TaskDetailModal, SubtaskList, ProgressModeControl
│   ├── departments/        DepartmentFormModal
│   └── users/              InviteUserModal, EditUserModal
├── pages/
│   ├── LoginPage.jsx
│   ├── InvitationAcceptPage.jsx        PHASE 4
│   ├── DashboardPage.jsx
│   ├── TeamsPage.jsx / ProjectsPage.jsx / ProjectDetailPage.jsx
│   ├── NotificationsPage.jsx / ProfilePage.jsx
│   ├── NotFoundPage.jsx
│   └── admin/
│       ├── AdminDashboardPage.jsx
│       ├── UsersPage.jsx
│       └── AdminDepartmentsPage.jsx

public/
├── index.html              SPA リダイレクト復元スクリプトを含む
└── 404.html                spa-github-pages 方式のリダイレクト

scripts/
├── schema.js               13 コレクション定義
├── setup-appwrite.js       コレクション + Bucket 権限を冪等同期
├── seed-data.js            ダミーデータ
├── seed.js                 シード投入
├── seed-auth-users.js      Auth テストユーザー一括作成
└── sync-profile-emails.js  Auth のメールを profiles に同期
```

### 6-2. API 層の規約

- 戻り値は `{ ...doc, id: doc.$id }` に正規化
- 日付は `'YYYY-MM-DD'` ⇄ ISO8601 で双方向変換
- 中間テーブルは合成 docId で冪等化
- 一括同期 API：`setTeamMembers` / `setAssignees` / `setSubtasksForTask` / `setParticipants`
- カスケード削除ヘルパー
- `listByUser` 系の名前衝突回避

### 6-3. UI 層の規約

子コンポーネントは props 駆動。ページで Promise.all → useMemo で派生データ → 子に渡す。

### 6-4. 権限

- すべてのコレクション + Storage Bucket：**`Role.users()`**（認証済みのみ）
- 「管理者専用」表示は `user.is_admin` で UI 制御

### 6-5. SPA ルーティング（GitHub Pages 対応）

- `public/404.html`：404 時にクエリ文字列に元のパスを格納してルートにリダイレクト
- `public/index.html` 内の `<script>`：起動直後にクエリから本来のパスを復元
- 仕組み：`/aimz/projects/p1` → `/aimz/?/projects/p1` → `/aimz/projects/p1`（履歴 API で書き換え）

---

## 7. セキュリティ運用上の注意

### `.env` の管理

- `REACT_APP_APPWRITE_*`：クライアント用（公開可）
- **`APPWRITE_API_KEY`**：**サーバ管理用、絶対に公開禁止**（`.gitignore` で除外済み）

### API キーのスコープ

現状の API キーには：
- databases / collections / attributes / indexes / documents（read+write）
- users（read+write）
- buckets / files（read+write）

運用時はスコープを最小化することを推奨。スクリプト未使用なら不要なスコープは削除。

### 共通パスワードの撤去

- `Aimz2026!`（u2〜u5 用）は本番運用時に削除 or 変更必須

### Appwrite Auth ユーザー削除

profiles の削除では Auth ユーザーは消えない。完全削除は Console から手動。

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 3 | dummy.js が一部残存 | 低 | 必要時に整理 |
| 4 | サイドバーのプロフィール画像即時反映 | 低 | refresh は実装済み、UX 確認のみ |

---

## 9. 解消済みの問題（v11）

| # | 問題 | 解消方法 |
|---|------|---------|
| ✅ | u1 のメールがダミーのまま | `scripts/sync-profile-emails.js` 追加 + 実行 |
| ✅ | リロード / 直接 URL アクセスで 404 | `public/404.html` + `index.html` の復元 script |

---

## 10. 次回セッションの再開方法

何か変更したい場合は Claude Code を開き：

> 「AimZ の開発を続けます。docs/AimZ_handover_v11.md を確認して、〜について作業してください。」

例：
- スケジュール CRUD モーダルを追加したい
- 〇〇画面のここを修正したい
- 新機能を追加したい

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v9 | 2026-04-29〜05-03 | 設計・実装・PHASE 3 完了 |
| v10 | 2026-05-03 | PHASE 4 + 5 完了 / 本番公開 |
| **v11** | **2026-05-03** | **既知問題 2 件を解消（profiles メール同期 / SPA 404）。これで実運用可能な状態。** |
