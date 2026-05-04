# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-04  
**仕様書バージョン**: v1.4  
**引き継ぎ書バージョン**: v12（運用改善：自動再読込 / 所属編集 / カスケード削除）

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：**全 PHASE 完了 / 本番公開済み**。v12 では運用改善を 3 件実施：
1. 全ページにフォーカス時自動再読込（最新情報反映）
2. ユーザー管理から所属（部署/チーム/ロール）を編集可能に
3. 案件削除時のカスケードを完全化 + 既存孤立データを一掃

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. v12 で追加された機能・修正

### 2-1. 全ページの最新情報自動反映

**問題**：画面を開きっぱなしのまま別タブ / 別ユーザーが DB を変更しても、こちら側に反映されない。

**対応**：`src/hooks/useReloadOnFocus.js` を新設し、各ページの `reload` 関数を呼ぶようにした。

- `document.visibilitychange`（タブが visible になった時）
- `window.focus`（ウィンドウがフォーカスを取り戻した時）

スロットル：1500ms 以内の連続発火は無視。

**適用箇所**：
- 全ページ（Dashboard / Teams / Projects / ProjectDetail / Notifications / Profile / Admin系）
- 案件詳細の全タブ（Gantt / Kanban / TaskList / Files）
- ダッシュボードの個別ロード ウィジェット（TodayScheduleWidget / NotificationsWidget）

### 2-2. ユーザー管理から所属（チーム/ロール）を編集

**機能**：管理者が `/admin/users` の「編集」モーダルから、各ユーザーのチーム所属とロールを変更可能に。

**UI**：
- 部署別にチーム一覧
- 各チームについて **未所属 / メンバー / リーダー** の 3 択ピッカー

**実装**：
- `src/api/team-members.js` に `setUserMemberships(userId, memberships)` を追加（差分同期）
- `EditUserModal` に所属管理セクション追加
- `UsersPage` で teams / departments / teamMembers を取得 + 編集保存時に同期

### 2-3. 案件削除時のカスケード完全化

**問題**：案件を削除しても配下タスク・サブタスク・スケジュールが孤立して残っていた。

**対応**：`ProjectDetailPage.handleDelete` を強化：
1. 配下タスク取得 → 各タスクの subtasks 削除 + task 削除
2. 配下スケジュール取得 → 各スケジュールの participants 削除 + schedule 削除
3. project_files（Storage 実体含む）削除
4. project_assignees 削除
5. 案件本体を削除

**既存データのクリーンアップ**：
- `scripts/cleanup-orphans.js` を新設
- ドライラン → `--apply` で実行
- 検出対象：tasks / subtasks / project_assignees / schedules / schedule_participants / project_files

**実行結果**：
- tasks: 11 件削除
- subtasks: 6 件削除
- schedules: 5 件削除
- schedule_participants: 11 件削除

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
| デフォルトブランチ | `main` |
| 公開ブランチ | `gh-pages`（自動生成） |
| 公開 URL | https://alterhabit999-web.github.io/aimz |

### 認証ユーザー

| ID | 用途 | 認証情報 |
|----|------|---------|
| `u1` | 山田 太郎・**管理者**（あなた専用） | Console で手動作成、実メール |
| `u2`〜`u5` | 開発確認用（メンバー） | `*@example.com` / `Aimz2026!` |

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

### 4-3. Appwrite スキーマ変更時

```bash
npm run setup:appwrite          # 冪等同期
```

### 4-4. シードデータ再投入

```bash
npm run seed:appwrite                       # 全テーブル
npm run seed:appwrite -- profiles teams     # 個別

# profiles 再投入後は Auth と乖離するので：
npm run sync:profile-emails
```

### 4-5. テスト用 Auth ユーザー再作成

```bash
npm run seed:auth-users         # u2〜u5 を再作成 / パスワードリセット
```

### 4-6. 孤立データのクリーンアップ（v12 新規）

親が削除されて取り残されたタスク・サブタスク等を検出・削除。

```bash
npm run cleanup:orphans              # ドライラン（候補表示のみ）
npm run cleanup:orphans -- --apply   # 実際に削除
```

### 4-7. プロフィールメールの同期

```bash
npm run sync:profile-emails     # Auth のメールを profiles に反映
```

### 4-8. 新メンバーの追加（実運用フロー）

1. u1（管理者）でログイン → `/admin/users`
2. **ユーザーを招待** → メール + 管理者フラグ + メッセージ
3. 招待リンクを本人にメールで共有
4. 本人がリンクを開く → 氏名 + パスワード設定 → 自動ログイン
5. **`/admin/users` の「編集」から所属チームを設定**（v12 で追加）

### 4-9. メンバーの削除

- `/admin/users` → 該当ユーザーの **削除** ボタン
  - profiles 削除 + 配下の team_members も削除
- ⚠ Appwrite Auth ユーザーは別途 Console から手動削除する必要あり

---

## 5. 機能一覧

### ✅ 実装済み

- **認証**：Appwrite Auth + 招待トークン消化 + パスワード変更
- **ダッシュボード**：5 ウィジェット + 自動再読込
- **チーム管理**：CRUD + メンバーシップ + リーダー権限
- **案件管理**：チーム別グルーピング、検索、フィルター、CRUD、**カスケード削除**
- **タスク管理**：CRUD + 小タスク差分同期 + 進捗率（手動/自動）
- **ガント**：日単位タイムライン + バードラッグで日程変更
- **カンバン DnD**：@dnd-kit でカラム間移動 + 並び替え
- **ファイル**：Appwrite Storage 連携
- **通知**：一覧 + フィルター + 既読化
- **マイページ**：プロフィール編集、パスワード変更
- **管理者ダッシュボード**：チーム進捗、メンバー負荷、期限超過
- **ユーザー管理**：一覧、招待、編集（**所属編集 v12**）、停止、削除
- **部署管理**：CRUD
- **プロジェクトステータス自動同期**：タスクが進行/完了 → 案件「進行中」化
- **SPA ルーティング**：直接 URL アクセス・リロード対応
- **画面の自動再読込（v12）**：フォーカス時に最新化

### ⏸ 未実装 / 将来拡張

- **スケジュール CRUD UI**：表示は実装済み、作成/編集/削除モーダル未実装
- **タスクのコメント機能**（仕様書フェーズ 2）
- **メール通知 / Slack / PWA / CSV エクスポート**（仕様書フェーズ 2）
- **profiles 削除時の Auth 連動削除**：Console から手動が必要

---

## 6. アーキテクチャまとめ

### 6-1. ディレクトリ（v12 時点）

```
src/
├── App.jsx
├── styles/tokens.js
├── data/dummy.js                       一部ヘルパーが残存
├── contexts/AuthContext.jsx
├── utils/format.js
├── hooks/
│   └── useReloadOnFocus.js            v12 新規：フォーカス時の自動再読込
├── api/                                Appwrite アクセス層
│   ├── index.js / collections.js
│   ├── profiles.js / departments.js
│   ├── teams.js / team-members.js     v12: setUserMemberships 追加
│   ├── projects.js / project-assignees.js
│   ├── tasks.js / subtasks.js
│   ├── schedules.js / schedule-participants.js
│   ├── notifications.js / invitations.js
│   └── project-files.js
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/                      自動再読込対応
│   ├── teams/
│   ├── projects/                       tabs/* 自動再読込対応
│   ├── tasks/
│   ├── departments/
│   └── users/                          EditUserModal v12 拡張
├── pages/
│   ├── LoginPage.jsx
│   ├── InvitationAcceptPage.jsx
│   ├── DashboardPage.jsx
│   ├── TeamsPage.jsx / ProjectsPage.jsx / ProjectDetailPage.jsx
│   ├── NotificationsPage.jsx / ProfilePage.jsx
│   ├── NotFoundPage.jsx
│   └── admin/
│       ├── AdminDashboardPage.jsx
│       ├── UsersPage.jsx               v12: 所属編集対応
│       └── AdminDepartmentsPage.jsx

public/
├── index.html              SPA リダイレクト復元
└── 404.html                spa-github-pages 方式

scripts/
├── schema.js
├── setup-appwrite.js       コレクション + Bucket 同期
├── seed-data.js
├── seed.js
├── seed-auth-users.js
├── sync-profile-emails.js
└── cleanup-orphans.js       v12 新規：孤立データの検出・削除
```

### 6-2. 自動再読込フック（v12）

```js
import useReloadOnFocus from '../hooks/useReloadOnFocus';

function MyPage() {
  const reload = useCallback(async () => { ... }, [...]);
  useEffect(() => { reload(); }, [reload]);  // 初回ロード
  useReloadOnFocus(reload);                  // フォーカス時に再ロード
  // ...
}
```

新規ページ・コンポーネントを追加する際もこのパターンを踏襲する。

### 6-3. API 層の規約

- 戻り値は `{ ...doc, id: doc.$id }` に正規化
- 日付は `'YYYY-MM-DD'` ⇄ ISO8601 で双方向変換
- 中間テーブルは合成 docId で冪等化
- 一括同期 API：`setTeamMembers` / `setUserMemberships`（v12） / `setAssignees` / `setSubtasksForTask` / `setParticipants`
- カスケード削除ヘルパー
- 孤立データは `cleanup-orphans.js` で検出・削除可能

### 6-4. UI 層の規約

子コンポーネントは props 駆動。ページで Promise.all → useMemo で派生データ → 子に渡す。

### 6-5. 権限

- すべてのコレクション + Storage Bucket：`Role.users()`（認証済みのみ）
- 「管理者専用」表示は `user.is_admin` で UI 制御

---

## 7. セキュリティ運用上の注意

- `.env` の `APPWRITE_API_KEY` は絶対に公開しない（`.gitignore` で除外済み）
- API キーのスコープ：databases / collections / attributes / indexes / documents / users / buckets / files（read+write）
- 共通パスワード `Aimz2026!` は本番運用時に削除 or 変更必須
- profiles 削除では Auth ユーザーは消えない（Console から手動削除が必要）

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 3 | dummy.js が一部残存 | 低 | 必要時に整理 |

## 9. 解消済みの問題

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | u1 のメールがダミーのまま | v11（`sync-profile-emails.js`） |
| ✅ | リロード / 直接 URL アクセスで 404 | v11（spa-github-pages 方式） |
| ✅ | 全ページの最新情報反映が手動リロード必要 | v12（`useReloadOnFocus`） |
| ✅ | ユーザー管理から所属を変更できなかった | v12（EditUserModal 拡張） |
| ✅ | 案件削除で配下タスク・スケジュールが孤立 | v12（カスケード強化 + cleanup スクリプト） |

---

## 10. 次回セッションの再開方法

何か変更したい場合は Claude Code を開き：

> 「AimZ の開発を続けます。docs/AimZ_handover_v12.md を確認して、〜について作業してください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v9 | 2026-04-29〜05-03 | 設計・実装・PHASE 3 完了 |
| v10 | 2026-05-03 | PHASE 4 + 5 完了 / 本番公開 |
| v11 | 2026-05-03 | profiles メール同期 + SPA 404 解消 |
| **v12** | **2026-05-04** | **3 件の運用改善**：全ページのフォーカス時自動再読込（`useReloadOnFocus`）、ユーザー管理から所属編集可能に、案件削除のカスケード完全化 + 孤立データの一斉クリーンアップ。 |
