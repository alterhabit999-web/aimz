# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-09  
**仕様書バージョン**: v1.9  
**引き継ぎ書バージョン**: v17

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：本番稼働中。v17 で個人視点の動線（マイタスク / マイスケジュール）と案件コメントを追加：

1. **`/tasks` マイタスク一覧**：自分担当の親タスク + 小タスクを案件単位でグルーピング表示・編集
2. **`/schedule` マイスケジュール**：月カレンダーで自分の予定 + 担当タスク期限を表示
3. **タスク作成のエントリポイントを追加**：`/tasks` と `/schedule` から新規タスクを作成可能
4. **案件未設定タスクのサポート**：`tasks.project_id` を任意属性に変更
5. **案件詳細にコメントタブ**：投稿 / 編集 / 削除（投稿者本人 or 管理者のみ）
6. **タスクモーダル内のコメント枠を撤去**（v1.5 で予約していたフェーズ 2 プレースホルダー）
7. **UI 細部修正**：ヘッダー右上アバター / サイドバー下部ユーザー枠を `/profile` へのリンク化、IME 変換中の Enter 誤発火対策

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0〜2 | 設計・UI 全画面実装 | ✅ |
| PHASE 3 | 13 コレクション + Storage を実 DB 化 | ✅ |
| PHASE 4 | Appwrite Auth + 招待 + 権限 + ダミー撤去 | ✅ |
| PHASE 5 | GitHub Pages デプロイ | ✅ |
| v11〜v15 | 運用改善・UI 改善・プロフィール画像 / 招待運用機能 / ErrorBoundary | ✅ |
| v16 不具合修正 | チーム追加 36 字超過解消 / サイドバー再配置 / .env 運用確立 / favicon 抑制 | ✅ |
| **v17 機能追加** | **マイタスク / マイスケジュール / タスク追加導線 / 案件未設定タスク / 案件コメント / アバター→マイページ / IME Enter ガード** | ✅ |
| 中断中 | プロフィール画像のクリック選択／ドロップ反映バグ（v15 オリジナルに巻き戻し済み） | ⏸ 次セッションで再着手 |
| 将来 | スケジュール CRUD UI / Appwrite Functions メール通知 / PWA など | 🔲 |

---

## 3. 構成情報

### Appwrite

| 項目 | 値 |
|------|------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69f144ba0005896bc8c3` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6`（案件ファイル + アバター共用） |
| Web Platform | `localhost` / `alterhabit999-web.github.io` |
| **コレクション数** | **14**（v17 で `comments` 追加） |

### コレクション一覧（v17 時点）

`profiles` / `departments` / `teams` / `team_members` / `projects` / `project_assignees` /
`tasks` / `subtasks` / `schedules` / `schedule_participants` / `project_files` /
`notifications` / `invitations` / **`comments`**（v17 追加）

### コレクション権限

| コレクション | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| その他全 13 個（comments 含む） | Role.users() | Role.users() | Role.users() | Role.users() |
| **invitations** | **Role.any()** ⭐ | Role.users() | Role.users() | Role.users() |

### 既存属性の変更（v17）

| コレクション | 属性 | 変更 |
|---|---|---|
| **tasks** | `project_id` | required: true → **false**（案件未設定タスクをサポート） |

> v17 のコレクション作成 / 属性変更は `npm run setup:appwrite` および
> `npm run migrate:task-project-optional` で実行済み（API キーに
> `collections.read/write`、`attributes.read/write` 等のスコープが付与された）。

### GitHub

| 項目 | 値 |
|------|------|
| リポジトリ | https://github.com/alterhabit999-web/aimz |
| 公開 URL | https://alterhabit999-web.github.io/aimz |

### 環境変数の運用（v16 で確立）

| ファイル | 内容 | git 管理 |
|---|---|---|
| `.env` | `REACT_APP_*`（Project ID / Endpoint / Database ID / Bucket ID） | ✅ |
| `.env.local` | `APPWRITE_API_KEY` | ❌ `.gitignore` |

---

## 4. 運用ガイド

### 4-1. ローカル開発・デプロイ

```bash
cd ~/Documents/App/aimz
npm start                       # http://localhost:3000

git add . && git commit -m "..."
git push origin main
npm run deploy                  # GitHub Pages へ
```

### 4-2. Appwrite 同期コマンド

```bash
npm run setup:appwrite              # スキーマ + Bucket を冪等同期（comments 含む）
npm run migrate:task-project-optional  # tasks.project_id を required=false に切替
npm run seed:appwrite               # ダミーデータ全投入
npm run seed:auth-users             # u2〜u5 を再作成 / パスワードリセット
npm run sync:profile-emails         # Auth のメールを profiles に同期
npm run cleanup:orphans             # 孤立データの検出（ドライラン）
npm run fix:invitations-permissions # invitations.read を Role.any() に
```

### 4-3〜4-6. 各種運用フロー

部署メンバー管理 / 新メンバー受け入れ / 招待履歴 / プロフィール画像 — **v15・v16 から変更なし**。
詳細は v16 引き継ぎ書を参照。

### 4-7. マイタスク・マイスケジュール（v17 新規）

- **`/tasks`**：右上「タスクを追加」ボタンで TaskDetailModal を開く。案件は任意（— 案件未設定 —）
- **`/schedule`**：右上「タスクを追加」または日セルクリック → 詳細モーダルの「この日にタスクを追加」（期限プリセット）

### 4-8. 案件コメント（v17 新規）

- 案件詳細 → タブ末尾の「**コメント**」
- 投稿は authenticated ユーザーなら誰でも可
- **編集・削除は投稿者本人 or 管理者のみ**（クライアント側で判定）
- ⌘ / Ctrl + Enter で投稿
- 案件削除時にコメントもカスケード削除

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v17 時点の差分）

```
src/
├── api/
│   ├── ...
│   ├── tasks.js                       v17：listTasksByAssignee / project_id 任意化対応
│   ├── subtasks.js                    v17：listSubtasksByAssignee 追加
│   └── comments.js                    v17 新規（案件コメント）
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                v17：タスク一覧 / スケジュール追加 + ユーザー枠を /profile リンク化
│   │   └── Header.jsx                 v17：右上アバターを /profile リンク化
│   ├── tasks/
│   │   ├── TaskDetailModal.jsx        v17：project / projects 両プロップ対応、案件ピッカー追加、IME 安全・コメント枠撤去
│   │   ├── SubtaskList.jsx            v17：IME Enter 誤発火ガード
│   │   └── （CommentsPlaceholder.jsx は撤去）
│   └── projects/tabs/
│       ├── ...
│       └── CommentsTab.jsx            v17 新規（案件コメント）
└── pages/
    ├── ...
    ├── MyTasksPage.jsx                v17 新規（/tasks）
    └── MySchedulePage.jsx             v17 新規（/schedule）

scripts/
├── ...
├── schema.js                          v17：comments 追加 + tasks.project_id を required=false に
└── update-task-project-optional.js    v17 新規（既存属性の必須解除ワンショット）
```

### 5-2. /tasks マイタスクの派生ロジック

```js
// 自分担当の親タスク
const parents = await listTasksByAssignee(user.id);
// 自分担当の小タスク（親が他人担当でも拾う）
const subtasks = await listSubtasksByAssignee(user.id);

// 親タスクが手元に無い小タスクの親を別途 getTask で補完
const owned = new Set(parents.map(t => t.id));
const missingParentIds = [...new Set(subtasks.map(s => s.task_id))].filter(id => !owned.has(id));
const fetchedParents = await Promise.all(missingParentIds.map(id => getTask(id)));

// 案件単位でグルーピング（project_id が null は「案件未設定」の特別グループに集約）
```

### 5-3. /schedule マイスケジュールの派生ロジック

```js
// 自分が参加しているスケジュール ID を取得
const myParticipations = await listSchedulesByUser(user.id);
const myScheduleIds = new Set(myParticipations.map(p => p.schedule_id));
// 全スケジュールから「参加 or 自分が created_by」のものに絞る
const mySchedules = (await listSchedules()).filter(s =>
  myScheduleIds.has(s.id) || s.created_by === user.id
);
// 自分担当タスクは listTasksByAssignee で取得
// 月グリッドは buildMonthGrid(year, month) で前後月を含めた 6×7 セルに展開
```

### 5-4. TaskDetailModal の案件ピッカー（v17）

```jsx
// 親が project を固定するケース（案件詳細から開く）
<TaskDetailModal project={project} ... />

// 案件未指定で開くケース（/tasks や /schedule から）：projects リストを渡す
<TaskDetailModal projects={allProjects} ... />
```

- `project` が渡されればピッカーは出さない（互換維持）
- `projects` が渡されればピッカーを表示、初期値 = `initial?.project_id || ''`
- 案件未指定時は assignee 候補を全 profiles にフォールバック
- create モードでも `initial` が部分的に渡されていれば defaults として採用（スケジュールから日付プリセット用途）

### 5-5. CommentsTab の権限判定（v17）

```js
const canModify = (comment) =>
  user?.is_admin || comment.user_id === user?.id;
```

サーバー側はコレクション権限で全認証ユーザーに `update/delete` を許可しているため、
クライアント側のガードのみ。**v18 以降で document-level security に移行したい場合**は、
コメント作成時に `permissions` を `[Permission.update(Role.user(user.id)), ...]` で設定する。

### 5-6. IME Enter 誤発火ガード（v17）

```js
onKeyDown={(e) => {
  if (e.nativeEvent.isComposing || e.keyCode === 229) return;  // 変換中は無視
  if (e.key === 'Enter') { ... }
}}
```

`SubtaskList`（追加 / インライン編集）と `CommentsTab`（⌘ / Ctrl+Enter 投稿）に適用。

---

## 6. 機能一覧（v17 時点）

### ✅ 実装済み

- 認証（Appwrite Auth + 招待トークン消化 + パスワード変更）
- ダッシュボード（5 ウィジェット、自動再読込）
- チーム管理 / 案件管理 / タスク管理（CRUD + 小タスク差分同期 + 進捗率）
- ガント / カンバン DnD
- ファイル（Appwrite Storage）
- 通知 / マイページ / 管理者ダッシュボード / ユーザー管理 / 部署管理
- プロジェクトステータス自動同期 / SPA ルーティング / 自動再読込 / レスポンシブ
- プロフィール画像 Storage 連携（v15）
- 招待運用機能（v15）
- ErrorBoundary（v15）
- チーム追加 36 字 docId 超過修正（v16）
- サイドバー：通知最上段（v16）
- **`/tasks` マイタスク一覧（v17）**
- **`/schedule` マイスケジュール（v17）**
- **タスク作成導線：マイタスク / マイスケジュールから（v17）**
- **案件未設定タスクのサポート（v17）**
- **案件コメント（v17）**：投稿 / 編集 / 削除（投稿者 or 管理者のみ）
- **アバターおよびユーザー枠 → マイページリンク化（v17）**
- **IME Enter 誤発火対策（v17）**

### ⏸ 未実装 / 中断中

- **プロフィール画像のクリック選択／ドロップ反映バグ**（次セッションで再着手）
- スケジュール CRUD UI（月カレンダーには表示済みだが、新規作成/編集/削除モーダル未実装）
- Appwrite Functions メール自動送信
- Slack 通知連携 / PWA / CSV エクスポート
- profiles 削除時の Auth 連動削除
- avatars 専用 Bucket への切替（プランアップグレード後）

---

## 7. 今回のセッションで行った変更（v17）

### A. マイタスク一覧 `/tasks`

新規ページ：[src/pages/MyTasksPage.jsx](../src/pages/MyTasksPage.jsx)

- 自分担当の**親タスク**と**小タスク**を案件単位でグルーピング表示
- ステータスフィルター（すべて / 進行中・未着手 / 完了）
- 親タスク行クリック → TaskDetailModal で編集（小タスク追加・削除を含む）
- 小タスクはチェックボックスでその場で完了切替、行クリックで親タスクモーダルが開く
- 「タスクを追加」ボタン → 案件ピッカー付きの新規作成モーダル（v17 後半で追加）
- 「案件未設定」グループは末尾表示（v17 後半で対応）
- 各案件カードに「案件を開く」ボタン

### B. マイスケジュール `/schedule`

新規ページ：[src/pages/MySchedulePage.jsx](../src/pages/MySchedulePage.jsx)

- 月カレンダー（日曜始まり、6 週ぶん）を内製で実装
- 自分が参加 or 作成のスケジュール（青）と、自分担当タスクの期限（オレンジ）を色分け表示
- 日セルクリックで詳細モーダル（時刻・場所・案件リンク・メモ）
- 「タスクを追加」ボタン（ページ右上）と「この日にタスクを追加」（日詳細フッター）の 2 経路

### C. 案件未設定タスクのサポート

- `scripts/schema.js`：`tasks.project_id` を `required: false` に変更
- `scripts/update-task-project-optional.js`（新規）：既存属性を必須解除するワンショット
- TaskDetailModal：`projects` プロップを受け取り、案件未固定時に「— 案件未設定 —」付きピッカーを表示
- 案件未設定時の assignee 候補は全 profiles
- /tasks は「案件未設定」グループを末尾表示
- DashboardPage の `to={'/projects/${task.project_id}'}` リンクは null なら `/tasks` へフォールバック

### D. 案件コメント機能

- 新規コレクション：`comments`（project_id / user_id / body、required 全部 true）
- API：[src/api/comments.js](../src/api/comments.js)（list / create / update / delete / cascadeDelete）
- 新規タブ：[src/components/projects/tabs/CommentsTab.jsx](../src/components/projects/tabs/CommentsTab.jsx)
- ProjectDetailPage の TABS 末尾に「コメント」を追加、削除時にカスケード削除呼び出し
- TaskDetailModal の `CommentsPlaceholder` 撤去・ファイル削除

### E. UI 微修正

- Header：右上アバターを `<NavLink to="/profile">` でラップ
- Sidebar：下部ユーザー情報枠を `<NavLink to="/profile">` でラップ
- SubtaskList：追加入力 / インライン編集の `onKeyDown` で `e.nativeEvent.isComposing || e.keyCode === 229` を判定し、変換中の Enter で誤発火しないように
- CommentsTab：同様の IME ガードを Cmd/Ctrl+Enter ハンドラに追加

### ⏸ 中断中（v16 から継続）

- **プロフィール画像のクリック選択／ドロップ反映バグ**：v16 引き継ぎ書 §7 末尾参照。
  次セッションでブラウザ名・バージョン確認 + シークレットウィンドウ再現確認から再着手。

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | プロフィール画像のクリック選択／ドロップ反映バグ | **高** | §7 中断項参照 |
| 2 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 3 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` |
| 4 | コメントの編集 / 削除はクライアント側のみで権限保護 | 中 | 将来：document-level security に切替 |
| 5 | dummy.js が一部残存 | 低 | 必要時に整理 |
| 6 | avatars 専用 Bucket 未分離（Free プラン上限） | 低 | プランアップ時に切替 |
| 7 | メール自動送信は未対応 | 中 | Appwrite Functions + SMTP |
| 8 | project_assignees / schedule_participants の docId は合成キーのまま | 中 | 36 字超過の事故が出たら team_members と同じく ID.unique() 化 |

---

## 9. 解消済みの問題（v17 追加分のみ）

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | 自分のタスク・小タスクを横断的に確認・編集する画面が無い | v17 |
| ✅ | 自分の予定 + タスク期限をカレンダー表示する画面が無い | v17 |
| ✅ | 案件に紐づかない個人タスクを作れない（必須属性） | v17 |
| ✅ | タスクへのコメント機能がプレースホルダーのまま | v17（案件単位のコメントに切替） |
| ✅ | ヘッダーアバター・サイドバーのユーザー枠をクリックしても無反応 | v17 |
| ✅ | 小タスク追加で日本語変換確定の Enter が誤って小タスクを作る | v17 |

（v16 までの解消済み項目は v16 引き継ぎ書を参照）

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v17.md と docs/AimZ_spec_v1.9.md を確認してください。
> 中断中のプロフィール画像クリック選択／ドロップ反映バグから再着手します。
> まずブラウザ名とバージョン、シークレットウィンドウでの再現可否を確認させてください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v15 | 2026-04-29〜05-07 | 設計・実装・PHASE 4-5 完了・運用改善・プロフィール画像 / 招待運用機能 / ErrorBoundary |
| v16 | 2026-05-09 | チーム追加 36 字超過解消 / サイドバー再配置 / `.env` 運用確立 / favicon 抑制。仕様書 v1.8 |
| **v17** | **2026-05-09** | **マイタスク（`/tasks`）/ マイスケジュール（`/schedule`）追加。案件詳細にコメントタブ追加（タスクモーダル内のコメント枠は撤去）。`tasks.project_id` を任意化し案件未設定タスクをサポート。タスク作成導線をマイタスク / マイスケジュールに追加。ヘッダーアバター + サイドバーのユーザー枠を `/profile` リンク化。IME 変換 Enter 誤発火ガード。仕様書 v1.9** |
