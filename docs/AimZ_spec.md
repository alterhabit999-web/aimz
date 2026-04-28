# AimZ 仕様書

**バージョン**: v1.1  
**作成日**: 2026-04-29  
**更新日**: 2026-04-29  
**ステータス**: 設計中

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

### 2-2. ロール定義

| ロール | 説明 |
|--------|------|
| **Admin（管理者）** | システム全体を管理できる最上位権限。招待も担当 |
| **Member（メンバー）** | チームに所属し、案件を操作できる一般ユーザー |

### 2-3. 権限マトリクス

| 操作 | Admin | チームメンバー | 同部署メンバー（他チーム） |
|------|-------|----------------|--------------------------|
| 部署・チームの作成・編集・削除 | ✅ | ❌ | ❌ |
| ユーザーの招待・削除 | ✅ | ❌ | ❌ |
| チームメンバーの設定 | ✅ | ❌ | ❌ |
| 全案件・タスクの閲覧 | ✅ | 自チームのみ✅ | 同部署は読取のみ✅ |
| 全案件・タスクの作成・編集・削除 | ✅ | 自チームのみ✅ | ❌ |
| ファイルのアップロード・削除 | ✅ | 自チームのみ✅ | ❌ |
| 管理者ダッシュボード閲覧 | ✅ | ❌ | ❌ |

---

## 3. 機能定義

### 3-1. 認証・ユーザー管理

| # | 機能 | 詳細 |
|---|------|------|
| 1 | 招待制登録 | 管理者がメールアドレスを入力して招待リンクを送信 |
| 2 | ログイン | メール＋パスワード（Appwrite Auth） |
| 3 | プロフィール編集 | 氏名・アバター画像の変更 |
| 4 | パスワード変更 | ログイン後にマイページから変更 |

### 3-2. 組織管理（Admin のみ）

| # | 機能 | 詳細 |
|---|------|------|
| 1 | 部署 CRUD | 部署の作成・編集・削除 |
| 2 | チーム CRUD | チームの作成・編集・削除（部署に紐付け） |
| 3 | チームメンバー設定 | ユーザーをチームに追加・除外 |
| 4 | ユーザー管理 | 招待・アカウント停止・削除 |

### 3-3. 案件（プロジェクト）管理

| # | 項目名 | 入力形式 | 必須 | 説明 |
|---|--------|----------|------|------|
| 1 | 案件名 | テキスト | 必須 | プロジェクト名 |
| 2 | 説明 | テキストエリア | 任意 | 案件の概要・背景 |
| 3 | ステータス | 選択（未着手 / 進行中 / 完了 / 保留） | 必須 | 進捗ステータス |
| 4 | 開始日 | 日付 | 必須 | ガントチャートの開始点 |
| 5 | 終了日（期限） | 日付 | 必須 | ガントチャートの終了点 |
| 6 | 担当者 | チームメンバーから選択（複数可） | 任意 | 案件担当者 |
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

### 3-9. カンバンボード

| # | 仕様 | 詳細 |
|---|------|------|
| 1 | カラム | 未着手 / 進行中 / 完了 / 保留（カスタマイズ可検討） |
| 2 | 対象 | 案件ごとのタスクをカード表示 |
| 3 | 操作 | ドラッグ＆ドロップでカラム移動 |
| 4 | カード情報 | タスク名・担当者アバター・期限・優先度バッジ |

### 3-10. ダッシュボード（トップ画面）

| # | ウィジェット | 詳細 |
|---|-------------|------|
| 1 | 本日のスケジュール | 今日の予定をタイムライン形式で表示 |
| 2 | 期限が迫るタスク | 3 日以内・1 週間以内の期限タスクをリスト表示 |
| 3 | 自分の担当タスク一覧 | ステータス別にグルーピング |
| 4 | プロジェクト進捗サマリー | 自チームの案件の進捗率をカード表示 |
| 5 | お知らせ（通知） | アプリ内通知の一覧（未読バッジ表示） |

### 3-11. 管理者ダッシュボード（Admin のみ）

| # | ウィジェット | 詳細 |
|---|-------------|------|
| 1 | 全チーム進捗率 | チームごとの案件完了率を棒グラフ or カード表示 |
| 2 | メンバー別タスク負荷 | 誰がどの程度タスクを抱えているかをヒートマップ or リスト表示 |
| 3 | 期限超過タスク一覧 | 全チームの期限超過タスクを一覧 |
| 4 | ユーザー管理 | メンバー一覧・招待・削除 |

### 3-12. アプリ内通知

| # | 通知トリガー | 詳細 |
|---|-------------|------|
| 1 | タスクのアサイン | 自分にタスクが割り当てられたとき |
| 2 | 期限リマインド | 期限 3 日前・当日に通知 |
| 3 | コメント（将来） | タスクにコメントがついたとき（フェーズ 2） |

---

## 4. 画面構成

### 4-1. 画面一覧

| 画面名 | 種別 | 役割 |
|--------|------|------|
| ログイン画面 | 起動時 | メール＋パスワードでの認証 |
| ダッシュボード | メイン（ホーム） | 今日の予定・期限タスク・通知 |
| 部署一覧 | サイドナビ | 所属部署・チームへのナビゲーション |
| チーム詳細 | 遷移先 | チームの案件一覧 |
| 案件詳細 | 遷移先 | ガントチャート / カンバン / ファイル / タスク一覧 |
| タスク詳細 | モーダル or 別画面 | 親タスク詳細・小タスク一覧 |
| Admin 画面 | サイドナビ（Admin のみ） | 組織管理・メンバー管理・全体ダッシュボード |
| マイページ | サイドナビ | プロフィール・パスワード変更 |

### 4-2. 画面遷移フロー

```
ログイン画面
  └─→ ダッシュボード（ホーム）
        ├─→ 部署一覧
        │     └─→ チーム詳細
        │           └─→ 案件詳細
        │                 ├─→ ガントチャートタブ
        │                 ├─→ カンバンボードタブ
        │                 ├─→ タスク一覧タブ
        │                 │     └─→ タスク詳細（モーダル）
        │                 │           └─→ 小タスク管理
        │                 └─→ ファイルタブ
        ├─→ Admin 画面（Admin のみ）
        │     ├─→ 組織管理（部署・チーム）
        │     ├─→ メンバー管理・招待
        │     └─→ 全体進捗ダッシュボード
        └─→ マイページ
```

### 4-3. 各画面詳細

#### ダッシュボード（ホーム）
- 左サイドバー：部署 → チームのツリーナビゲーション（折りたたみ可）
- メインエリア上部：本日のタイムライン（スケジュール）
- メインエリア中部：期限が迫るタスクカード
- メインエリア下部：担当プロジェクト進捗サマリー

#### 案件詳細
- ヘッダー：案件名・ステータス・期間・担当者
- タブ切り替え：ガントチャート / カンバン / タスク一覧 / ファイル
- ガントチャートタブ：タスクバーを横スクロール、今日線付き
- カンバンタブ：ドラッグ＆ドロップ対応カラム
- ファイルタブ：ドロップゾーン＋ファイル一覧

---

## 5. データ設計（Appwrite）

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `profiles` | ユーザープロフィール |
| `departments` | 部署 |
| `teams` | チーム |
| `team_members` | チームメンバー中間テーブル |
| `projects` | 案件（プロジェクト） |
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

```sql
create table team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
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

-- ② departments / teams：認証済みユーザーは全閲覧可能
--    作成・編集・削除は Admin のみ（アプリ側で制御 + RLS）

-- ③ projects / tasks / subtasks / schedules：
--    SELECT：同じ部署のユーザーが閲覧可能
--    INSERT/UPDATE/DELETE：そのチームのメンバーのみ

-- ④ notifications：自分のものだけ操作可能

-- ⑤ project_files：
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
| フロントエンド | React（create-react-app） |
| バックエンド/DB | Appwrite Cloud（Auth + DB + Storage + Realtime） |
| ホスティング | GitHub Pages |
| スタイリング | インラインスタイル ＋ App.css（最小限） |

**Appwrite を選んだ理由**：Supabase に最も近い OSS 代替。無料クラウド枠あり。PostgreSQL ベースの DB、Auth、Storage、リアルタイム機能をすべて備える。

### フェーズ 2（将来）

- PWA 対応（ホーム画面追加・オフライン表示）
- メール通知
- Slack 連携

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

### 禁止事項
- ブランドカラー `#00c4cc` をテキスト・ボタン等 UI 操作要素に使わない
- 純粋なグレー（`#808080` 等）を使わない → Stone 系ウォームグレーを使う
- 游ゴシックを `@font-face` なしで `font-weight: 400` 指定しない（Windows で細く表示される）

---

## 8. 開発・運用環境

### 構成

| 項目 | 内容 |
|------|------|
| 公開 URL | GitHub Pages で設定後に確定 |
| コード管理 | GitHub（リポジトリ名: `aimz` 推奨） |
| データ / 認証 / ストレージ | Appwrite Cloud（https://cloud.appwrite.io） |
| ホスティング | GitHub Pages |
| 開発ツール | Claude Code（コード編集）＋ Mac ターミナル |
| ローカルフォルダ | `~/Documents/App/aimz`（構築済み） |

### ファイル構成（初期構築済み）

```
~/Documents/App/aimz/
├── public/
│   └── index.html           （游ゴシック @font-face 設定済み）
├── src/
│   ├── App.jsx              メインコード（デザインシステム定数 C・S 定義済み）
│   ├── App.css              グローバルスタイル
│   ├── index.js             React エントリポイント
│   ├── appwrite.js          Appwrite クライアント初期化
│   └── components/          再利用 UI コンポーネント（開発時に追加）
│       ├── GanttChart.jsx   （開発時に作成）
│       ├── KanbanBoard.jsx  （開発時に作成）
│       └── ...
├── .env                     Appwrite 接続情報（Git 除外・.gitignore 設定済み）
├── .env.example             .env のテンプレート
├── .gitignore               設定済み
├── package.json             依存パッケージ・デプロイスクリプト設定済み
└── 開発の始め方.md           初回セットアップ手順
```

---

## 9. 開発フロー（Claude Code 使用時）

```bash
# 1. ローカル確認
cd ~/Documents/App/aimz
npm start

# 2. 変更を保存
git add .
git commit -m "機能名: 変更内容のメモ"
git push origin main

# 3. デプロイ
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

- [ ] デザインシステム詳細（DESIGN.md 受領後に確定）
- [ ] GitHub リポジトリ名
- [ ] Appwrite プロジェクト ID・エンドポイント
- [ ] チームへのロール追加（例：チームリーダー権限）の要否
- [ ] 案件の「アーカイブ」機能の要否
- [ ] ガントチャートのタスクバードラッグ対応はフェーズ 1 か 2 か

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1.0 | 2026-04-29 | 初版作成（ヒアリングをもとに設計） |
| v1.1 | 2026-04-29 | バックエンドを Supabase → Appwrite に変更、デザインシステム（SmartHR）確定、プロジェクトフォルダ構築完了 |
