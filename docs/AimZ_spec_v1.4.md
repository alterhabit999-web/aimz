# AimZ 仕様書

**バージョン**: v1.4  
**作成日**: 2026-04-29  
**更新日**: 2026-04-29  
**ステータス**: 開発中

---

## 1. プロダクト概要

### アプリ名
**AimZ（エイムズ）**

### コンセプト
「Aim（目標）から Z（ゴール）まで」── 案件・タスク・スケジュールを一元管理し、
チームの進捗を可視化する社内向けプロジェクト管理 Web アプリ。

### ターゲットユーザー
- 社内メンバー（招待制）
- PC メイン使用を想定（レスポンシブ対応はモバイル表示程度）

### 目標
- フェーズ 1：部署 → チーム → 案件 → タスクの階層管理、ガントチャート・カンバンボード実装 → 開発中
- フェーズ 2：通知強化・PWA 対応・外部連携（Slack 等）

---

## 2. 組織階層と権限設計

### 2-1. 組織階層

```
会社
└── 部署（Department）
    └── チーム（Team）
        └── 案件 / プロジェクト（Project）
            ├── 親タスク（Task）
            │   └── 小タスク（Subtask）
            └── スケジュール（Schedule）
```

ユーザーは **複数の部署・複数のチームに所属可能**。  
（profile → team_members → teams → departments の関係で多対多を実現）

### 2-2. ロール定義

| ロール | 説明 | 設定箇所 |
|--------|------|---------|
| **Admin（管理者）** | システム全体を管理できる最上位権限。招待・部署管理を担当 | `profiles.is_admin = true` |
| **Team Leader（チームリーダー）** | チームの代表者。**v1.3 で新設** | `team_members.role = 'leader'` |
| **Member（メンバー）** | チームに所属し案件を操作できる一般ユーザー | `team_members.role = 'member'` |

### 2-3. 権限マトリクス

| 操作 | Admin | チームリーダー | チームメンバー | 同部署メンバー（他チーム） |
|------|-------|---------------|----------------|--------------------------|
| 部署の作成・編集・削除 | ✅ | ❌ | ❌ | ❌ |
| **チームの作成** | ✅ | **✅** | ❌ | ❌ |
| 自チームの編集・削除 | ✅ | ✅（自分が leader のチーム） | ❌ | ❌ |
| チームメンバーの追加・除外 | ✅ | ✅（自分が leader のチーム） | ❌ | ❌ |
| ユーザーの招待・削除 | ✅ | ❌ | ❌ | ❌ |
| 全案件・タスクの閲覧 | ✅ | 自チームのみ✅ | 自チームのみ✅ | 同部署は読取のみ✅ |
| 全案件・タスクの作成・編集・削除 | ✅ | 自チームのみ✅ | 自チームのみ✅ | ❌ |
| ファイルのアップロード・削除 | ✅ | 自チームのみ✅ | 自チームのみ✅ | ❌ |
| 管理者ダッシュボード閲覧 | ✅ | ❌ | ❌ | ❌ |

> **チームリーダー権限の判定**：そのユーザーがいずれかのチームで `team_members.role = 'leader'` を持っていれば、新規チーム作成権限が発生する。  
> 個別チームに対する編集権限は、当該チームの leader 行を持つ場合のみ発生。

---

## 3. 機能定義

### 3-1. 認証・ユーザー管理

| # | 機能 | 詳細 |
|---|------|------|
| 1 | 招待制登録 | 管理者がメールアドレスを入力して招待リンクを送信 |
| 2 | ログイン | メール＋パスワード（Appwrite Auth） |
| 3 | プロフィール編集 | 氏名・アバター画像の変更 |
| 4 | パスワード変更 | ログイン後にマイページから変更 |

### 3-2. 組織管理

| # | 機能 | 担当ロール | 詳細 |
|---|------|-----------|------|
| 1 | 部署 CRUD | Admin | 部署の作成・編集・削除（`/admin/departments`） |
| 2 | チーム作成 | Admin / Team Leader | チームの新規作成（`/teams` のモーダル） |
| 3 | チーム編集・削除 | Admin / 該当チームの Leader | チーム情報の更新・削除 |
| 4 | チームメンバー設定 | Admin / 該当チームの Leader | メンバーの追加・除外、リーダー指定 |
| 5 | ユーザー管理 | Admin | 招待・アカウント停止・削除（`/admin/users`） |

### 3-3. 案件（プロジェクト）管理

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | 案件名 | テキスト | 必須 | プロジェクト名 |
| 2 | 説明 | テキストエリア | 任意 | 案件の概要・背景 |
| 3 | ステータス | 選択（未着手 / 進行中 / 完了 / 保留） | 必須 | 進捗ステータス |
| 4 | 開始日 | 日付 | 必須 | ガントチャートの開始点 |
| 5 | 終了日（期限） | 日付 | 必須 | ガントチャートの終了点 |
| 6 | 担当者 | チームメンバーから選択（複数可、`project_assignees` テーブルで管理） | 任意 | 案件担当者 |
| 7 | 優先度 | 選択（高 / 中 / 低） | 任意 | — |

### 3-4. タスク管理（親タスク）

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | タスク名 | テキスト | 必須 | — |
| 2 | 説明 | テキストエリア | 任意 | — |
| 3 | ステータス | 選択（未着手 / 進行中 / 完了） | 必須 | — |
| 4 | 開始日 | 日付 | 任意 | — |
| 5 | 期限 | 日付 | 任意 | ダッシュボードで期限警告に使用 |
| 6 | 担当者 | チームメンバーから選択 | 任意 | — |
| 7 | 優先度 | 選択（高 / 中 / 低） | 任意 | — |
| 8 | 進捗率 | 数値（0〜100%） | 任意 | 手動入力または小タスクから自動計算 |

### 3-5. 小タスク管理

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | タスク名 | テキスト | 必須 | — |
| 2 | ステータス | チェックボックス（完了 / 未完了） | 必須 | — |
| 3 | 担当者 | チームメンバーから選択 | 任意 | — |
| 4 | 期限 | 日付 | 任意 | — |

### 3-6. スケジュール管理

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | タイトル | テキスト | 必須 | — |
| 2 | 開始日時 | 日時 | 必須 | — |
| 3 | 終了日時 | 日時 | 必須 | — |
| 4 | 場所・URL | テキスト | 任意 | 会議室名や URL |
| 5 | 参加者 | チームメンバーから選択（複数可） | 任意 | — |
| 6 | メモ | テキストエリア | 任意 | — |

### 3-7. ファイル管理

| # | 機能 | 詳細 |
|---|------|------|
| 1 | ファイルアップロード | 案件ごとにファイルを紐付け。PNG / JPG / PDF / Word / Excel 対応 |
| 2 | ファイル一覧表示 | 案件詳細画面にファイルタブを設置 |
| 3 | ファイル削除 | アップロードした本人または Admin が削除可能 |
| 4 | サイズ制限 | 1 ファイル最大 50MB（Appwrite Storage 使用） |

### 3-8. ガントチャート

| # | 仕様 | 詳細 |
|---|------|------|
| 1 | 表示単位 | 日単位 |
| 2 | 対象 | 案件ごとに表示（タスクのバーを横並び） |
| 3 | 操作 | バーのドラッグで日程変更（フェーズ 2 でも可） |
| 4 | 色分け | ステータスや優先度で色分け |
| 5 | 今日線 | 本日の日付に縦線を表示 |
| 6 | 案件詳細のデフォルトタブ | **ガントチャート**（v1.3 で確定） |

### 3-9. カンバンボード

| # | 仕様 | 詳細 |
|---|------|------|
| 1 | カラム | 未着手 / 進行中 / 完了 / 保留（カスタマイズ可検討） |
| 2 | 対象 | 案件ごとのタスクをカード表示 |
| 3 | 操作 | ドラッグ＆ドロップでカラム移動 |
| 4 | カード情報 | タスク名・担当者アバター・期限・優先度バッジ |

### 3-10. ダッシュボード（トップ画面）

| # | ウィジェット | 詳細 | 実装 |
|---|-------------|------|------|
| 1 | 本日のスケジュール | 今日の予定をタイムライン形式で表示 | ✅ v1.2 |
| 2 | 期限が迫るタスク | 3 日以内・1 週間以内の期限タスクをリスト表示 | ✅ v1.2 |
| 3 | 自分の担当タスク一覧 | ステータス別にグルーピング | ✅ v1.2 |
| 4 | プロジェクト進捗サマリー | 自チームの案件の進捗率をカード表示 | ✅ v1.2 |
| 5 | お知らせ（通知） | アプリ内通知の一覧（未読バッジ表示） | ✅ v1.2 |

### 3-11. チーム画面（`/teams`、v1.3 で新設）

縦並びの 2 セクション構成。両方を常時表示。

| セクション | 内容 | 実装 |
|----------|------|------|
| **チーム一覧** | 所属部署内のチームをカード表示。部署別にグルーピング | ✅ v1.3 |
| **メンバー一覧** | 所属部署内のメンバーをテーブル表示。氏名・所属チーム・ロール・メール。検索フィルター付き | ✅ v1.3 |

ヘッダー右に「チーム作成」ボタン（Admin / Team Leader のみ表示）。  
チームカードには：チーム名、所属部署、メンバー数、リーダー名、メンバーアバター列。

### 3-12. 案件一覧画面（`/projects`、v1.4 で実装完了）

| 項目 | 内容 | 実装 |
|------|------|------|
| **チーム別グルーピング** | 部署 / チーム見出し付き、所属チームには「所属」バッジ | ✅ v1.4 |
| **検索バー** | 案件名・説明をリアルタイム検索 | ✅ v1.4 |
| **ステータスフィルター** | すべて / 未着手 / 進行中 / 完了 / 保留 | ✅ v1.4 |
| **案件カード** | 名前 / ステータス / 期間 / 進捗バー / 担当者アバター列 / 優先度バッジ。クリックで詳細へ | ✅ v1.4 |
| **作成ボタン** | 「+ 案件を作成」（Admin / 自チームメンバーのみ表示） | ✅ v1.4 |

### 3-13. 案件詳細画面（`/projects/:projectId`、v1.4 で実装完了）

| 項目 | 内容 | 実装 |
|------|------|------|
| **ヘッダー** | パンくず / 案件名 / ステータス・優先度バッジ / 説明 / 所属（部署/チーム）/ 期間 / 担当者アバター / 進捗バー | ✅ v1.4 |
| **アクション** | 編集ボタン + その他メニュー（削除）。権限がある場合のみ表示 | ✅ v1.4 |
| **タブ** | ガント / カンバン / タスク一覧 / ファイル。デフォルトはガント | ✅ v1.4（タブ枠） |
| ガントタブ | 日単位タスクバー、今日線 | ⏸ 簡易表のみ（本実装は別フェーズ） |
| カンバンタブ | DnD 対応カラム | ⏸ カラム表示のみ（DnD は別フェーズ） |
| タスク一覧タブ | テーブル表示 | ✅ v1.4 |
| ファイルタブ | ドロップゾーン + 一覧 | ⏸ プレースホルダー（Storage 連携時に実装） |

### 3-14. 管理者ダッシュボード（Admin のみ）

| # | ウィジェット | 詳細 | 実装 |
|---|-------------|------|------|
| 1 | 全チーム進捗率 | チームごとの案件完了率を棒グラフ or カード表示 | ⏸ |
| 2 | メンバー別タスク負荷 | 誰がどの程度タスクを抱えているかをヒートマップ or リスト表示 | ⏸ |
| 3 | 期限超過タスク一覧 | 全チームの期限超過タスクを一覧 | ⏸ |
| 4 | ユーザー管理 | メンバー一覧・招待・削除（`/admin/users`） | ⏸ |
| 5 | 部署管理 | 部署の CRUD（`/admin/departments`） | ✅ v1.4 |

### 3-15. アプリ内通知

| # | 通知トリガー | 詳細 |
|---|-------------|------|
| 1 | タスクのアサイン | 自分にタスクが割り当てられたとき |
| 2 | 期限リマインド | 期限 3 日前・当日に通知 |
| 3 | コメント（将来） | タスクにコメントがついたとき（フェーズ 2） |

### 3-16. 新規作成 UI（v1.3 で確定）

すべての作成 UI は **モーダル** で実装。入力フォームは最初から全項目を展開表示する。

| 対象 | 場所 | 権限 | 実装 |
|------|------|------|------|
| 部署 | `/admin/departments` のモーダル | Admin のみ | ✅ v1.4 |
| チーム | `/teams` のモーダル | Admin / Team Leader | ✅ v1.3 |
| 案件 | `/projects` または `/projects/:id` のモーダル | Admin / 該当チームのメンバー | ✅ v1.4 |
| タスク | `/projects/:id` のモーダル | Admin / 該当チームのメンバー | ⏸ 次回実装 |

---

## 4. 画面構成

### 4-1. 画面一覧

| 画面名 | 種別 | URL | 役割 | 実装 |
|--------|------|-----|------|------|
| ログイン画面 | 起動時 | `/login` | メール＋パスワードでの認証 | ✅ |
| ダッシュボード | メイン（ホーム） | `/dashboard` | 今日の予定・期限タスク・通知 | ✅ |
| 案件一覧 | サイドナビ | `/projects` | 閲覧可能な全案件をチーム別グルーピング | ✅ v1.4 |
| 案件詳細 | 遷移先 | `/projects/:projectId` | ガント / カンバン / ファイル / タスク一覧 | ✅ v1.4 |
| チーム | サイドナビ | `/teams` | チーム一覧 + メンバー一覧（縦並び） | ✅ v1.3 |
| 通知 | サイドナビ | `/notifications` | アプリ内通知 | ⏸ |
| マイページ | サイドナビ | `/profile` | プロフィール・パスワード変更 | ⏸ |
| 管理者ダッシュボード | サイドナビ（Admin のみ） | `/admin` | 全体ダッシュボード | ⏸ |
| ユーザー管理 | サイドナビ（Admin のみ） | `/admin/users` | 招待・メンバー管理 | ⏸ |
| 部署管理 | サイドナビ（Admin のみ） | `/admin/departments` | 部署 CRUD | ✅ v1.4 |
| タスク詳細 | モーダル | （案件詳細から） | 親タスク詳細・小タスク一覧 | ⏸ 次回実装 |
| 404 | フォールバック | `*` | ページが見つからない | ✅ |

### 4-2. サイドバー構成（v1.3 で再設計）

```
┌──────────────────────────┐
│  📊 AimZ                  │ ロゴ
│  🏢 営業部 / 開発部         │ 所属部署（小さく、複数あれば併記）
├──────────────────────────┤
│  メニュー                  │
│  ▸ ダッシュボード            │
│  ▸ 案件一覧                 │ ← ダッシュボードの直下
│  ▸ チーム                   │
│  ▸ 通知                     │
│                           │
│  管理者（Admin のみ表示）   │
│  ▸ 管理者ダッシュボード      │
│  ▸ ユーザー管理              │
│  ▸ 部署管理                  │
│                           │
│  アカウント                  │
│  ▸ マイページ                │
├──────────────────────────┤
│  👤 山田太郎 管理者 ›       │ ユーザー情報
└──────────────────────────┘
```

### 4-3. 画面遷移フロー

```
ログイン画面（/login）
  └─→ ダッシュボード（/dashboard）
        ├─→ 案件一覧（/projects）
        │     └─→ 案件詳細（/projects/:projectId）
        │           ├─→ ガントチャートタブ（デフォルト）
        │           ├─→ カンバンボードタブ
        │           ├─→ タスク一覧タブ
        │           │     └─→ タスク詳細（モーダル、未実装）
        │           │           └─→ 小タスク管理
        │           └─→ ファイルタブ
        ├─→ チーム（/teams）
        │     ├─ チーム一覧（部署別グルーピング、カード）
        │     └─ メンバー一覧（テーブル + 検索）
        ├─→ 通知（/notifications）
        ├─→ Admin ダッシュボード（/admin、Admin のみ）
        │     ├─→ ユーザー管理（/admin/users）
        │     └─→ 部署管理（/admin/departments）
        └─→ マイページ（/profile）
```

### 4-4. 各画面詳細

#### ダッシュボード（ホーム）
- 挨拶（時間帯別）＋ 本日の日付
- 5 つのウィジェットをグリッドで配置（auto-fit minmax 360px）

#### チーム
- ヘッダー：タイトル + 「チーム作成」ボタン（Admin / Leader のみ）
- セクション 1：チーム一覧（部署別グルーピング、カード）
- セクション 2：メンバー一覧（テーブル形式、検索）
- 縦並び（タブではなく両セクションを常時表示）

#### 案件一覧（v1.4）
- ヘッダー：タイトル + 「案件を作成」ボタン
- フィルターバー：検索 + ステータスフィルター（チップ）+ 件数表示
- チーム別にグルーピング表示
- 各案件カード：名前 / ステータス / 期間 / 進捗バー / 担当者 / 優先度

#### 案件詳細（v1.4）
- パンくず → 案件一覧に戻る
- ヘッダーカード：案件名・ステータス・優先度・説明・所属（部署 › チーム）・期間・担当者・進捗バー
- 編集ボタン + その他メニュー（削除）
- タブ切替：ガント（デフォルト） / カンバン / タスク一覧 / ファイル

#### 部署管理（v1.4）
- 部署テーブル（名前 / 説明 / チーム数 / 編集・削除ボタン）
- 「部署を作成」ボタン → モーダル
- 0 件時は Empty State

---

## 5. データ設計（Appwrite）

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `profiles` | ユーザープロフィール |
| `departments` | 部署 |
| `teams` | チーム |
| `team_members` | チームメンバー中間テーブル（**v1.3 で role 追加**） |
| `projects` | 案件（プロジェクト） |
| `project_assignees` | 案件担当者中間テーブル（**v1.4 で追加**） |
| `tasks` | 親タスク |
| `subtasks` | 小タスク |
| `schedules` | スケジュール |
| `schedule_participants` | スケジュール参加者中間テーブル |
| `project_files` | ファイルメタ情報 |
| `notifications` | アプリ内通知 |
| `invitations` | 招待トークン管理 |

---

### profiles（ユーザープロフィール）

```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  avatar_url text,
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### departments（部署）

```sql
create table departments (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

### teams（チーム）

```sql
create table teams (
  id uuid default gen_random_uuid() primary key,
  department_id uuid references departments(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(department_id, name)
);
```

---

### team_members（チームメンバー中間テーブル）

**v1.3：`role` カラムを追加。`leader` は新規ロール。**

```sql
create table team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','member')),
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);
```

---

### projects（案件）

```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  name text not null,
  description text,
  status text default '未着手' check (status in ('未着手','進行中','完了','保留')),
  priority text default '中' check (priority in ('高','中','低')),
  start_date date,
  end_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### project_assignees（案件担当者中間テーブル）

**v1.4 で追加。** 案件は複数の担当者を持てるため、中間テーブルで管理する。

```sql
create table project_assignees (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  unique(project_id, user_id)
);
```

> 開発初期（ダミーデータ段階）では便宜上 `projects.assignee_ids: text[]` 形式で保持しているが、Appwrite Database 連携時にこの中間テーブルへ移行する。

---

### tasks（親タスク）

```sql
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  status text default '未着手' check (status in ('未着手','進行中','完了')),
  priority text default '中' check (priority in ('高','中','低')),
  assignee_id uuid references profiles(id),
  start_date date,
  due_date date,
  progress_rate integer default 0 check (progress_rate between 0 and 100),
  order_index integer default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### subtasks（小タスク）

```sql
create table subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  name text not null,
  is_completed boolean default false,
  assignee_id uuid references profiles(id),
  due_date date,
  order_index integer default 0,
  created_at timestamptz default now()
);
```

---

### schedules（スケジュール）

```sql
create table schedules (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  memo text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

### schedule_participants（スケジュール参加者）

```sql
create table schedule_participants (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references schedules(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(schedule_id, user_id)
);
```

---

### project_files（ファイルメタ情報）

```sql
create table project_files (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  file_name text not null,
  file_path text not null,       -- Appwrite Storage のファイル ID
  file_size integer,             -- バイト
  mime_type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

### notifications（アプリ内通知）

```sql
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,            -- 'task_assigned' | 'due_reminder' など
  title text not null,
  body text,
  related_id uuid,               -- 関連するタスク・案件の ID
  is_read boolean default false,
  created_at timestamptz default now()
);
```

---

### invitations（招待トークン管理）

```sql
create table invitations (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  token text not null unique,
  invited_by uuid references profiles(id),
  is_used boolean default false,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
```

---

### RLS ポリシー設計方針

**用語説明**：RLS（Row Level Security）とは、データベースの行単位でアクセスを制限する仕組みです。「自分が所属するチームのデータしか見られない」などの制御を、データベース側で自動的に行います。

```sql
-- ① profiles：認証済みユーザー全員が閲覧可能（名前・アバターは全員に必要）
--    更新は本人のみ
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ② departments：認証済みユーザーは閲覧可能。CRUD は Admin のみ。

-- ③ teams：閲覧は同部署のみ。
--    INSERT は Admin または Team Leader（team_members で role='leader' を持つ）。
--    UPDATE/DELETE は Admin またはそのチームの Leader。

-- ④ team_members：閲覧は同部署。
--    INSERT/UPDATE/DELETE は Admin または該当チームの Leader。

-- ⑤ projects / project_assignees / tasks / subtasks / schedules：
--    SELECT：同じ部署のユーザーが閲覧可能
--    INSERT/UPDATE/DELETE：そのチームのメンバーのみ

-- ⑥ notifications：自分のものだけ操作可能

-- ⑦ project_files：
--    SELECT：同じ部署のユーザーが閲覧可能
--    INSERT：チームメンバーのみ
--    DELETE：アップロード本人 または Admin

-- ※ Admin 判定は profiles.is_admin = true で行う
--   Admin は全テーブルへのフルアクセスを別ポリシーで許可する
```

> **注意**：詳細な RLS SQL は開発フェーズで確定させます。
> 「同じ部署かどうか」の判定は、`team_members → teams → departments` の結合で実現します。

---

## 6. 技術方針

### フェーズ 1：Webアプリ構築

| 項目 | 内容 |
|------|------|
| フロントエンド | React 18（create-react-app） |
| ルーティング | react-router-dom v7 |
| バックエンド/DB | Appwrite Cloud（Auth + DB + Storage + Realtime） |
| ホスティング | GitHub Pages |
| スタイリング | インラインスタイル ＋ App.css（最小限） |
| アイコン | lucide-react |

**Appwrite を選んだ理由**：Supabase に最も近い OSS 代替。無料クラウド枠あり。PostgreSQL ベースの DB、Auth、Storage、リアルタイム機能をすべて備える。

### フェーズ 2（将来）

- PWA 対応（ホーム画面追加・オフライン表示）
- メール通知
- Slack 連携
- カンバン D&D（@dnd-kit など）
- ガントチャートのドラッグ移動

---

## 7. デザインシステム

**ベース**：SmartHR Design System（https://smarthr.design/）

### デザインコンセプト
- **方針**：クリーンで信頼感のある業務 UI。装飾を排し、コンテンツと操作性を優先するミニマルデザイン
- **密度**：情報密度が高い業務アプリ向け。余白はあるがコンパクト
- **キーワード**：信頼性・明快・効率的・アクセシブル・ニュートラル
- **特徴**：ウォームグレー（Stone 系）基調。純粋なグレーではなく暖色寄りのトーン

### カラーパレット

| 役割 | トークン名 | カラー |
|------|-----------|--------|
| ページ背景 | Stone 01 | `#f8f7f6` |
| カード・コンポーネント背景 | White | `#ffffff` |
| テーブルヘッダー・サブ背景 | Stone 02 | `#edebe8` |
| アクセント（ボタン・アクティブ） | Product Main | `#0077c7` |
| アクセント薄い（選択状態背景） | — | `#e8f4fb` |
| ブランドカラー（ロゴ・チャートのみ） | SmartHR Blue | `#00c4cc` |
| テキスト（本文・見出し） | Text Black | `#23221e` |
| テキスト（サブ・ラベル） | Text Grey | `#706d65` |
| テキスト（無効・プレースホルダー） | Stone 03 | `#aaa69f` |
| テキスト（無効状態） | Text Disabled | `#c1bdb7` |
| テキストリンク | Text Link | `#0071c1` |
| ボーダー | Border | `#d6d3d0` |
| 成功（完了） | Chart Green | `#4bb47d` |
| 警告（期限迫る） | Warning | `#ffcc17` |
| 危険（期限超過・削除） | Danger | `#e01e5a` |
| 注目（優先度「高」等） | Orange Accent | `#ff9900` |

### シャドウ

| レベル | 値 | 用途 |
|-------|-----|------|
| shadow1 | `0 2px 4px rgba(0,0,0,0.1)` | カード・ドロップダウン |
| shadow2 | `0 4px 8px rgba(0,0,0,0.15)` | モーダル・ダイアログ |

### タイポグラフィ

**フォント**：
```css
font-family: AdjustedYuGothic, "Yu Gothic", YuGothic, "Hiragino Sans", sans-serif;
```
※ Windows で游ゴシック Medium を正しく表示するための `@font-face` マッピングが必須（`public/index.html` に設定済み）

**サイズ階層**：

| 役割 | サイズ | ウェイト | 行間 |
|------|-------|---------|------|
| ページタイトル | 2rem (32px) | 700 | 1.25 |
| セクション見出し | 1.5rem (24px) | 700 | 1.25 |
| サブ見出し | 1.2rem (19px) | 700 | 1.5 |
| 本文（標準） | 1rem (16px) | 400 | 1.5 |
| 補足テキスト | 0.857rem (14px) | 400 | 1.5 |
| キャプション | 0.75rem (12px) | 400 | 1.5 |

**スペーシング（8px ベース）**：

| トークン | 値 |
|---------|-----|
| XS | 4px |
| S | 8px |
| M | 16px |
| L | 24px |
| XL | 32px |
| XXL | 40px |

### コンポーネントスタイル

**ボタン（Primary）**：背景 `#0077c7` / テキスト `#ffffff` / 角丸 6px / フォント 16px bold / padding 8px 16px  
**ボタン（Secondary）**：背景 transparent / テキスト `#0077c7` / ボーダー 1px solid `#0077c7` / 角丸 6px  
**ボタン（Danger）**：背景 `#e01e5a` / テキスト `#ffffff` / 角丸 6px  
**入力欄**：背景 `#ffffff` / ボーダー 1px solid `#d6d3d0` / フォーカス 2px solid `#0077c7` / 角丸 6px / padding 8px 12px  
**モーダル**：背景 white / 角丸 8px / shadow2 / 中央表示 / Esc & バックドロップで閉じる  
**確認ダイアログ**：警告アイコン + メッセージ + Secondary/Danger ボタン

### 禁止事項
- ブランドカラー `#00c4cc` をテキスト・ボタン等 UI 操作要素に使わない
- 純粋なグレー（`#808080` 等）を使わない → Stone 系ウォームグレーを使う
- 游ゴシックを `@font-face` なしで `font-weight: 400` 指定しない（Windows で細く表示される）

---

## 8. 開発・運用環境

### 構成

| 項目 | 内容 |
|------|------|
| 公開 URL | `https://alterhabit999-web.github.io/aimz`（GitHub Pages デプロイ後） |
| GitHub リポジトリ | https://github.com/alterhabit999-web/aimz |
| データ / 認証 / ストレージ | Appwrite Cloud（Singapore リージョン） |
| Appwrite エンドポイント | `https://sgp.cloud.appwrite.io/v1` |
| ホスティング | GitHub Pages |
| 開発ツール | Claude Code（コード編集）＋ Mac ターミナル |
| ローカルフォルダ | `~/Documents/App/aimz`（構築済み） |

### ファイル構成（v1.4 時点）

```
~/Documents/App/aimz/
├── public/
│   └── index.html                       游ゴシック @font-face 設定済み
├── src/
│   ├── App.jsx                          ルーティング設定
│   ├── App.css                          グローバルスタイル
│   ├── index.js                         React エントリポイント
│   ├── appwrite.js                      Appwrite クライアント初期化
│   │
│   ├── styles/
│   │   └── tokens.js                    デザイントークン（C / S / ICON_*）
│   │
│   ├── data/
│   │   └── dummy.js                     開発用ダミーデータ＋集計＋権限ヘルパー
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx              認証状態（Appwrite + ダミー併用）
│   │
│   ├── utils/
│   │   └── format.js                    日付・時刻フォーマット関数
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Card.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── SectionLabel.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx                v1.3 新規
│   │   │   ├── FormField.jsx            v1.3 新規（label + input/select/textarea）
│   │   │   ├── ConfirmDialog.jsx        v1.4 新規（削除確認等）
│   │   │   └── PlaceholderPage.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.jsx
│   │   │   ├── Sidebar.jsx              v1.3 で再設計
│   │   │   ├── Header.jsx
│   │   │   └── RequireAuth.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── TodayScheduleWidget.jsx
│   │   │   ├── UpcomingTasksWidget.jsx
│   │   │   ├── MyTasksWidget.jsx
│   │   │   ├── ProjectsProgressWidget.jsx
│   │   │   └── NotificationsWidget.jsx
│   │   │
│   │   ├── teams/                       v1.3 新規
│   │   │   ├── TeamCard.jsx
│   │   │   ├── MembersTable.jsx
│   │   │   └── CreateTeamModal.jsx
│   │   │
│   │   ├── projects/                    v1.4 新規
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectFormModal.jsx     作成・編集兼用
│   │   │   ├── ProjectHeader.jsx        詳細画面ヘッダー
│   │   │   └── tabs/
│   │   │       ├── GanttTab.jsx         簡易表示
│   │   │       ├── KanbanTab.jsx        4 カラム表示（DnD なし）
│   │   │       ├── TaskListTab.jsx      テーブル表示
│   │   │       └── FilesTab.jsx         プレースホルダー
│   │   │
│   │   └── departments/                 v1.4 新規
│   │       └── DepartmentFormModal.jsx
│   │
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DashboardPage.jsx            ✅ ウィジェット 5 種実装済（v1.2）
│       ├── TeamsPage.jsx                ✅ v1.3 実装済
│       ├── ProjectsPage.jsx             ✅ v1.4 実装済
│       ├── ProjectDetailPage.jsx        ✅ v1.4 実装済（タブ枠＋編集/削除）
│       ├── NotificationsPage.jsx        ⏸ プレースホルダー
│       ├── ProfilePage.jsx              ⏸ プレースホルダー
│       ├── NotFoundPage.jsx             404
│       └── admin/
│           ├── AdminDashboardPage.jsx   ⏸ プレースホルダー
│           ├── UsersPage.jsx            ⏸ プレースホルダー
│           └── AdminDepartmentsPage.jsx ✅ v1.4 実装済
│
├── docs/
│   ├── AimZ_spec_v1.4.md                本仕様書（最新）
│   ├── AimZ_spec_v1.3.md                旧版
│   ├── AimZ_spec_v1.2.md                旧版
│   ├── AimZ_handover_v5.md              引き継ぎ書（最新）
│   └── AimZ_handover_v4.md              旧版
│
├── .env                                 Appwrite 接続情報（Git 除外）
├── .env.example
├── .gitignore
├── DESIGN.md                            SmartHR デザインシステム詳細
├── package.json
├── package-lock.json
└── 開発の始め方.md
```

### 開発用ダミーログイン

`AuthContext.jsx` で **ダミーログインモード** を併用している。  
Appwrite に実ユーザーを作成する前でも、ログイン画面の「ダミーログイン（管理者）」ボタンで UI 確認が可能。  
Appwrite 実ユーザー作成後は通常のメール＋パスワードログインに切り替わる（同じ `useAuth()` インターフェース）。

---

## 9. 開発フロー（Claude Code 使用時）

```bash
# 1. ローカル確認
cd ~/Documents/App/aimz
npm start
# ブラウザで http://localhost:3000 が開く

# 2. 変更を保存
git add .
git commit -m "機能名: 変更内容のメモ"
git push origin main

# 3. デプロイ（GitHub Pages）
npm run deploy
```

---

## 10. 将来追加機能メモ

- [ ] タスクへのコメント・メンション機能
- [ ] PWA 対応（ホーム画面追加）
- [ ] メール通知（期限リマインダー）
- [ ] Slack 通知連携
- [ ] CSV エクスポート（タスク・進捗データ）
- [ ] ガントチャートのドラッグで日程変更
- [ ] ダークモード対応

---

## 11. 未決定事項

- [ ] 案件の「アーカイブ」機能の要否
- [ ] ガントチャートのタスクバードラッグ対応はフェーズ 1 か 2 か
- [ ] チームリーダーが自チームの新規メンバー招待まで可能にするか（現状は Admin のみ招待可）
- [ ] 案件詳細のヘッダー項目・アクション位置の最終確定（現在は推奨案で実装中）
- [ ] 案件編集時に担当チームの変更を許容するか（現状 disabled）

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1.0 | 2026-04-29 | 初版作成（ヒアリングをもとに設計） |
| v1.1 | 2026-04-29 | バックエンドを Supabase → Appwrite に変更、デザインシステム（SmartHR）確定、プロジェクトフォルダ構築完了 |
| v1.2 | 2026-04-29 | react-router-dom v7 導入、ファイル分割、ダッシュボード全 5 ウィジェット実装、画面 URL 一覧追加 |
| v1.3 | 2026-04-29 | チームリーダーロール新設（`team_members.role`）、複数部署所属対応、サイドバー再設計、`/teams` 画面実装、チーム作成モーダル実装、`/admin/departments` ルート追加、共通 Modal/FormField コンポーネント追加 |
| v1.4 | 2026-04-29 | 案件一覧（`/projects`）実装（チーム別グルーピング・検索・フィルター）、案件詳細（`/projects/:projectId`）実装（ヘッダー＋4 タブ枠、デフォルトはガント、編集/削除モーダル）、部署管理（`/admin/departments`）実装、`project_assignees` テーブル設計追加、`ConfirmDialog` 共通コンポーネント追加 |
