# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-03  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v10（全 PHASE 完了 / 本番公開）

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：**全 PHASE 完了 / 本番公開済み**。Appwrite Auth で実ログイン、招待トークン消化フロー、コレクション + Bucket 権限を `Role.users()` に絞り、GitHub Pages にデプロイ完了。

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0 | 仕様策定・デザインシステム | ✅ |
| PHASE 1 | プロジェクト構築・GitHub・Appwrite 接続 | ✅ |
| PHASE 2 | UI 実装（全画面・モーダル・コンポーネント） | ✅ |
| PHASE 2 拡張 | カンバン DnD（@dnd-kit）/ ガント本実装（バードラッグ） | ✅ |
| PHASE 3 | 13 コレクション + Storage を実 DB 化 | ✅ |
| PHASE 3 拡張 | プロジェクトステータスの自動同期 | ✅ |
| PHASE 4 Step A | Appwrite Auth 連携 + AuthContext で profiles 統合 | ✅ |
| PHASE 4 Step B | 招待トークン消化（`/invitations/:token`） | ✅ |
| PHASE 4 Step C | パスワード変更を `account.updatePassword` に接続 | ✅ |
| PHASE 4 Step D | コレクション + Bucket を `Role.users()` に絞る | ✅ |
| PHASE 4 Step E | ダミーログイン撤去 | ✅ |
| PHASE 5 | GitHub Pages デプロイ | ✅ |

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
| 公開ブランチ | `gh-pages`（ビルド成果物・自動生成） |
| 公開 URL | https://alterhabit999-web.github.io/aimz |

### 認証ユーザー（運用開始時）

| ID | 用途 | 認証情報 |
|----|------|---------|
| `u1` | 山田 太郎・**管理者**（あなた専用） | Console で手動作成。メール/パスワードはあなたが設定 |
| `u2` | 佐藤 花子（メンバー） | `sato@example.com` / `Aimz2026!`（開発確認用） |
| `u3` | 鈴木 一郎（メンバー） | `suzuki@example.com` / `Aimz2026!` |
| `u4` | 田中 美咲（メンバー） | `tanaka@example.com` / `Aimz2026!` |
| `u5` | 高橋 健（メンバー） | `takahashi@example.com` / `Aimz2026!` |

> u2〜u5 は **開発確認用** なので、本格運用前に削除 or パスワード変更すること（u1 から `/admin/users` で管理可能）。

### 共通開発パスワード

`Aimz2026!`（u2〜u5 のみ）

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
git push origin main            # main を更新
npm run deploy                  # ビルド → gh-pages ブランチに push
```

GitHub Pages は 1〜3 分で反映される。

### 4-3. Appwrite スキーマ変更時

```bash
# scripts/schema.js を編集 → 同期
npm run setup:appwrite          # 冪等。既存属性は触らない
```

### 4-4. シードデータの再投入

```bash
npm run seed:appwrite                       # 全テーブル
npm run seed:appwrite -- profiles teams     # 個別
```

### 4-5. テスト用 Auth ユーザーの再作成

```bash
npm run seed:auth-users         # u2〜u5 を再作成 / パスワードリセット
```

### 4-6. 新メンバーの追加（実運用フロー）

1. u1（管理者）でログイン → `/admin/users`
2. **ユーザーを招待** → メール + 管理者フラグ + メッセージ
3. 表示された招待リンクを本人にメール等で共有
4. 本人がリンクを開く → 氏名 + パスワード設定 → 自動ログイン
5. `/teams` から該当チームに本人を追加（リーダー権限が必要）

### 4-7. メンバーの削除

- `/admin/users` → 該当ユーザーの **削除** ボタン
- ⚠ `profiles` の削除のみ。**Appwrite Auth ユーザーは別途 Console から削除**する必要がある（次の改善候補）

---

## 5. 機能一覧（v1.4 仕様準拠）

### ✅ 実装済み

- **認証**：Appwrite Auth（メール+パスワード）/ 招待トークン / パスワード変更
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

### ⏸ 未実装 / 将来拡張

- **スケジュール CRUD UI**：表示は実装済み。作成/編集/削除モーダルは未実装
- **タスクのコメント機能**（仕様書フェーズ 2）
- **メール通知**（仕様書フェーズ 2）
- **Slack 通知連携**（仕様書フェーズ 2）
- **PWA 対応**（仕様書フェーズ 2）
- **CSV エクスポート**（仕様書フェーズ 2）
- **Appwrite Auth ユーザー削除の連動**（profiles 削除時に Auth も削除）
- **SPA ルーティング**：`/projects/p1` 等を直接開くと 404 になる場合あり（GitHub Pages 制約）
   → `public/404.html` でリダイレクトする手法で対応可能
- **ダッシュボードの所属表示**（サイドバー）：実 DB に切替する箇所が残っていれば追って対応
- **dummy.js の完全削除**：少数ヘルパーが残存。動作には影響なし

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
│   ├── ui/                 共通 UI（Modal, Button, Card, etc.）
│   ├── layout/             AppShell, Sidebar, Header, RequireAuth
│   ├── dashboard/          5 ウィジェット
│   ├── teams/              TeamCard, MembersTable, CreateTeamModal
│   ├── projects/           ProjectCard, ProjectFormModal, ProjectHeader, tabs/
│   ├── tasks/              TaskDetailModal, SubtaskList, ProgressModeControl
│   ├── departments/        DepartmentFormModal
│   └── users/              InviteUserModal, EditUserModal
├── pages/
│   ├── LoginPage.jsx
│   ├── InvitationAcceptPage.jsx          PHASE 4
│   ├── DashboardPage.jsx
│   ├── TeamsPage.jsx / ProjectsPage.jsx / ProjectDetailPage.jsx
│   ├── NotificationsPage.jsx / ProfilePage.jsx
│   ├── NotFoundPage.jsx
│   └── admin/
│       ├── AdminDashboardPage.jsx
│       ├── UsersPage.jsx
│       └── AdminDepartmentsPage.jsx

scripts/
├── schema.js               13 コレクション定義
├── setup-appwrite.js       コレクション + 属性 + インデックス + Bucket 権限を冪等同期
├── seed-data.js            ダミーデータ
├── seed.js                 シード投入
└── seed-auth-users.js      Auth ユーザー一括作成
```

### 6-2. API 層の規約

- 戻り値は `{ ...doc, id: doc.$id }` に正規化
- 日付は `'YYYY-MM-DD'` ⇄ ISO8601 で双方向変換
- 中間テーブルは合成 docId で冪等化
- 一括同期 API：`setTeamMembers` / `setAssignees` / `setSubtasksForTask` / `setParticipants`
- カスケード削除ヘルパー
- `listByUser` 系の名前衝突回避（`listMembershipsByUser` / `listAssignmentsByUser` 等）

### 6-3. UI 層の規約

子コンポーネントは props 駆動。ページで Promise.all → useMemo で派生データ → 子に渡す。

### 6-4. 権限

- すべてのコレクション + Storage Bucket：**`Role.users()`**（認証済みのみ）
- ダッシュボード等での「管理者専用」表示は `user.is_admin` で UI 制御

---

## 7. セキュリティ運用上の注意

### `.env` の管理

`.env` には以下が含まれる：
- `REACT_APP_APPWRITE_*`（クライアント用、公開されても問題ない）
- **`APPWRITE_API_KEY`**（**サーバ管理用、絶対に公開してはいけない**）

`.gitignore` で除外済み。誤って commit されないよう注意。

### API キーのスコープ

現状の API キーには以下を含む：
- databases / collections / attributes / indexes / documents（read+write）
- users（read+write）
- buckets / files（read+write）

**運用時はスコープを最小化**することを推奨。`scripts/seed-auth-users.js` 等を実行しない場合は users スコープ削除可能。

### 共通パスワードの撤去

開発確認用の `Aimz2026!` は **本番で残してはいけない**。  
u2〜u5 を本番ユーザーに切り替えた段階で削除 or パスワード変更すること。

### Appwrite Auth ユーザー削除

profiles の削除では Auth ユーザーは消えない。完全に削除するには Appwrite Console から手動削除する必要がある。
（将来：`scripts/delete-auth-user.js` 的なヘルパーを作るか、UsersPage の削除フローに組み込む）

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成しダッシュボード or 案件詳細に追加 |
| 2 | SPA 直接 URL アクセスで 404 になる場合あり | 中 | `public/404.html` でルートリダイレクト or `HashRouter` に切替 |
| 3 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む（要 server SDK） |
| 4 | dummy.js が一部残存 | 低 | 必要時に整理 |
| 5 | サイドバーのプロフィール画像即時反映 | 低 | refresh は実装済み。画面起動直後の同期確認 |
| 6 | カンバン DnD のキーボード操作の練度 | 低 | 既に sortableKeyboardCoordinates 実装済み、UX 確認のみ |

---

## 9. 次回セッションの再開方法

特に追加機能や改善が無ければ、これで開発完了です。  
何か変更したい場合は、Claude Code を開き：

> 「AimZ の開発を続けます。docs/AimZ_handover_v10.md を確認して、〜について作業してください。」

例：
- スケジュール CRUD モーダルを追加したい
- ダッシュボードのレイアウトを変えたい
- 新しい機能を追加したい
- 〇〇画面のここを修正したい

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v9 | 2026-04-29〜05-03 | 設計・実装・PHASE 3 完了 |
| v10 | 2026-05-03 | **PHASE 4 + 5 完了 / 本番公開**。Appwrite Auth 接続、招待トークン消化、パスワード変更、権限を Role.users() に、ダミーログイン撤去、GitHub Pages デプロイ。 |
