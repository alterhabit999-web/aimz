# AimZ 仕様書

**バージョン**: v2.1  
**作成日**: 2026-04-29  
**更新日**: 2026-05-11  
**ステータス**: 本番稼働中

> v2.0 → v2.1 の差分：
>   - 3-2 ユーザー管理：**招待リンク方式を廃止**。管理者が `/admin/users` から「ユーザーを作成」モーダルで
>     氏名・メール・初期パスワード・管理者フラグを直接入力 → `account.create()` + `createProfile()` で
>     Auth ユーザーと profile を同時作成 → 初期パスワードを本人に共有する運用に変更
>   - 3-1 マイページ：**メールアドレス変更機能**を新規追加（EmailChanger）。`account.updateEmail()` +
>     profiles.email を同期更新、本人確認のため現在のパスワード入力必須
>   - **ファビコン設定**：AimZ ロゴ風 SVG (`public/favicon.svg`) を新規追加
>   - 3-24 案件コメント：**メンション機能 + 通知**を追加
>     * `@` で profile サジェスト → 確定で `@<full_name>` 挿入
>     * 投稿・編集時にメンション対象に `type='mention'` の通知を作成
>     * コメント表示で `@<full_name>` をアクセントカラーでハイライト
>   - 3-10-1 ダッシュボード本日ウィジェット：**「本日のスケジュール」→「本日の予定・タスク」に拡張**
>     * 上段：今日の schedules（既存）
>     * 下段：**本日アクティブな担当タスク**（assignee=自分 ∧ start_date ≤ 今日 ≤ due_date ∧ status≠完了）
>   - 3-23 スケジュール CRUD：**ScheduleFormModal を新規実装**（作成・編集・削除・参加者管理）
>     * `/schedule` 右上「予定を追加」ボタン + 日詳細「この日に予定を追加」
>     * 案件詳細に「予定」タブ（**SchedulesTab**）を追加
>     * 編集・削除権限は作成者本人 or 管理者のみ
>   - 5 データ設計：**`invitations` コレクションは過去履歴のため残存**（アプリから参照しない）
>   - 既知の問題：スケジュール CRUD UI 未実装 → **解消済みに移動**
>   - 既知の問題：「予定開始 30 分前の通知」は Appwrite Functions 必要なため**将来対応**として明記
>
> v1.9 → v2.0 の差分：
>   - 3-1 プロフィール画像：**Storage アップロード方式を廃止**し、Canvas リサイズ + base64 data URI 直接保存方式に再設計
>     * 画像は 256×256 にセンタークロップ → JPEG quality 0.85 で base64 化（実測 15〜30KB）
>     * `profiles.avatar_url` のサイズを 500 → 200000 に拡張（migration 実行済み）
>     * `<input type="file">` を動的生成して `.click()` する方式に変更（label / htmlFor 経由の落とし穴を構造的に回避）
>     * `src/api/avatars.js` / `AVATAR_BUCKET_ID` を撤去
>   - 3-19 自動再読込：**初回ロードのみフルローディング表示、以降はバックグラウンド更新**を仕様化
>     （v15〜v17 でアバターアップロードが反映されなかった真因。フォーカス再取得時に setLoading(true) で
>      ProfileEditor が unmount され、編集中の state が破棄されていた）
>   - 5 データ設計：`project_assignees` / `schedule_participants` の documentId を ID.unique() に統一
>   - 6 内部品質：dummy.js（PHASE 4 完了後に未使用化していたダミーデータ）を撤去
>   - 既知の問題から「プロフィール画像のクリック選択 / ドロップが反映されない」を解消済みに移動
>
> v1.8 → v1.9 の差分：
>   - 3-22 マイタスク一覧（`/tasks`）を新規追加：自分担当の親タスク + 小タスクを案件単位でグルーピング表示・編集
>   - 3-23 マイスケジュール（`/schedule`）を新規追加：月カレンダーで自分の予定 + 担当タスクの期限を表示、日クリックでその日の詳細＋タスク追加
>   - 3-24 案件コメント（CommentsTab）を新規追加：案件詳細のタブとして実装、投稿/編集/削除（投稿者 or 管理者のみ）
>   - 3-1 タスク：`tasks.project_id` を任意属性に変更（**案件未設定タスク**をサポート、TaskDetailModal に案件ピッカー追加）
>   - 4-2 サイドバー構成にタスク一覧 / スケジュールを追加（メニュー見出しの下、ダッシュボード→案件一覧→タスク一覧→スケジュール→チームの順）
>   - 5 データ設計：`comments` コレクション（project_id / user_id / body）を追加
>   - ヘッダーアバター / サイドバー下部のユーザー情報をマイページへのリンクとする UI 規約を追記
>   - IME 変換中の Enter で誤発火しない実装規約（小タスク追加 / コメント投稿）を追記
>   - タスクモーダル内のコメント枠（フェーズ 2 予告プレースホルダー）を撤去
>
> v1.7 → v1.8 の差分：
>   - 4-2 サイドバー構成：**通知**をナビ最上段に移動（メニュー見出しの上に独立配置）
>   - 5 データ設計：`team_members.documentId` を `ID.unique()` で発行する仕様に変更
>     （合成キー `${teamId}_${userId}` は Appwrite Auth 生成 ID と組み合わせると 36 字制限を超過するため）
>   - 9 運用：`.env` を REACT_APP_* のみ git 管理、秘匿情報（APPWRITE_API_KEY 等）は `.env.local` に分離する方針を明記
>   - 既知の不具合に「プロフィール画像のクリック選択 / ドロップが特定環境で反映されない」を追加（次フェーズで再着手）
>
> v1.6 → v1.7 の差分：
>   - 3-1 認証・ユーザー管理：プロフィール画像のアップロード仕様を追記
>   - 3-2 組織管理：ユーザー招待の運用機能（履歴一覧 / コピー / mailto / 再発行 / 取消）を追記
>   - 3-21 エラーハンドリング（ErrorBoundary）を新規追加
>   - 5 データ設計：invitations.read のみ Role.any() に開放する例外を明記
>   - 7 デザインシステム：プロフィール画像のドロップゾーン、招待履歴モーダル等の UI を追記
>
> v1.5 → v1.6 の差分：
>   - 3-20 レスポンシブ仕様を新規追加（v14 で実装）
>   - ウィンドウ幅に応じた UI 自動調整の振る舞いを仕様化
>
> v1.4 → v1.5 の差分：
>   - 全 PHASE 完了の実装ステータスを反映
>   - 部署メンバー管理仕様を追加（3-2 / 3-17 / 4-1）
>   - 全画面のフォーカス時自動再読込（v12 で実装）を仕様化

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
| 1 | 招待制登録 | 管理者がメールアドレスを入力して招待リンクを発行 → 本人が `/invitations/:token` で氏名・パスワードを設定してアカウント作成 |
| 2 | ログイン | メール＋パスワード（Appwrite Auth） |
| 3 | プロフィール編集 | 氏名・**アバター画像のアップロード**（v1.7） |
| 4 | パスワード変更 | ログイン後にマイページから変更 |
| 5 | **プロフィール画像アップロード**（v1.7） | Appwrite Storage に PNG / JPG / JPEG（最大 5 MB）をアップロード。クリック / ドラッグ&ドロップ対応。古い画像は自動削除 |

### 3-2. 組織管理

| # | 機能 | 担当ロール | 詳細 |
|---|------|-----------|------|
| 1 | 部署 CRUD | Admin | 部署の作成・編集・削除（`/admin/departments`） |
| 2 | **部署メンバー管理** | **Admin** | **部署のメンバー一覧・追加・除外（`/admin/departments` の「メンバー」モーダル、v1.5 で追加）** |
| 3 | チーム作成 | Admin / Team Leader | チームの新規作成（`/teams` のモーダル） |
| 4 | チーム編集・削除 | Admin / 該当チームの Leader | チーム情報の更新・削除 |
| 5 | チームメンバー設定 | Admin / 該当チームの Leader | メンバーの追加・除外、リーダー指定 |
| 6 | ユーザー管理 | Admin | 招待・所属編集・アカウント停止・削除（`/admin/users`） |
| 7 | ユーザー所属編集 | Admin | 各ユーザーの所属チーム + ロールを部署別 UI で編集（v1.5 で追加） |
| 8 | **招待履歴管理**（v1.7） | Admin | `/admin/users` の「招待履歴」モーダルから、発行済み招待の一覧表示・コピー・mailto: 起動・**再発行**・**取消**が可能 |

> **部署メンバーの定義**（v1.5）：「その部署のいずれかのチームに所属しているユーザー」とする。
> 部署独立のメンバーシップ（チームに所属せず部署のみに所属）は持たない。
> 部署からの除外は「その部署のすべてのチーム所属を一括解除」と定義する。

> **招待運用機能**（v1.7）：
> - 招待モーダルから発行直後に「メーラーで招待を送る」（mailto:）でメール本文を自動生成
> - 招待履歴は **未使用 / 期限切れ / 使用済み** の 3 セクションで表示
> - 期限切れの招待は **再発行** で 7 日延長可能（旧 URL は無効化される）
> - 使用済みになると履歴に残り、不要なら削除可能
> - メール自動送信は将来的に Appwrite Functions で対応予定（現状は外部メーラー起動）

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
| ガントタブ | 日単位タスクバー、今日線、バードラッグで日程変更 | ✅ v1.5（本実装） |
| カンバンタブ | DnD 対応カラム（@dnd-kit、カラム間移動 + 並び替え） | ✅ v1.5（本実装） |
| タスク一覧タブ | テーブル表示 | ✅ v1.4 |
| ファイルタブ | ドロップゾーン + 一覧 + ダウンロード/削除 | ✅ v1.5（Storage 連携） |

> **案件削除時のカスケード**（v1.5）：案件を削除すると、配下のタスク・サブタスク・スケジュール・参加者・ファイル（Storage 含む）・担当者がすべて連動して削除される。

### 3-14. 管理者ダッシュボード（Admin のみ）

| # | ウィジェット | 詳細 | 実装 |
|---|-------------|------|------|
| 1 | 全チーム進捗率 | チームごとの案件完了率をプログレスバー表示 | ✅ v1.5 |
| 2 | メンバー別タスク負荷 | 未完了タスク数のヒートバー、期限超過件数 | ✅ v1.5 |
| 3 | 期限超過タスク一覧 | 全チームの期限超過タスクを一覧 | ✅ v1.5 |
| 4 | ユーザー管理 | 招待・編集（所属含む）・停止・削除（`/admin/users`） | ✅ v1.5 |
| 5 | 部署管理 | 部署の CRUD + 部署メンバー管理（`/admin/departments`） | ✅ v1.5 |

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
| タスク | `/projects/:id` のモーダル | Admin / 該当チームのメンバー | ✅ v1.5（小タスク + 進捗率モード切替対応） |
| ユーザー招待 | `/admin/users` の招待モーダル | Admin | ✅ v1.5（invitations コレクションに保存、`/invitations/:token` で消化） |

### 3-17. 部署メンバー管理（v1.5 で追加）

`/admin/departments` の各部署行から「メンバー」ボタンで開くモーダルで操作。

| 機能 | 詳細 |
|------|------|
| メンバー一覧 | 部署のいずれかのチームに所属する全ユーザー（重複除去）。各人の所属チーム + ロール（リーダー/メンバー）を表示 |
| メンバー追加 | 未所属ユーザー + 加入先チーム（その部署のチーム） + ロールを選択 → `team_members` に追加 |
| 部署から除外 | そのユーザーの「この部署のすべてのチーム所属」を一括解除（他部署のチーム所属は保持） |

> **注意**：部署メンバーシップは `team_members → teams → departments` の結合で導出する派生データ。
> DB スキーマ（`profiles` / `departments` / `teams` / `team_members`）は v1.4 から変更なし。

### 3-18. 通知ベル（v1.5 で動作化）

| 機能 | 詳細 |
|------|------|
| 通知ベル | アプリ右上に常時表示。未読件数バッジ付き |
| クリック | `/notifications` ページへ遷移 |
| 未読バッジ | 未読数を赤色で表示。9 件超は「9+」 |

### 3-19. 画面の自動再読込（v1.5 で実装）

すべてのページで、以下のイベント時に自動でデータを再取得：
- タブが visible になった（別タブから戻った）
- ウィンドウがフォーカスを取り戻した

スロットル：1500ms 以内の連続発火は無視。  
実装：`src/hooks/useReloadOnFocus.js`。

### 3-20. レスポンシブ仕様（v1.6 で実装）

ウィンドウ幅に応じて UI が自動調整される。

| 判定 | 基準 |
|------|------|
| **コンパクト（狭い）** | `window.innerWidth < 900px` |
| **通常（広い）** | `window.innerWidth >= 900px` |

判定ロジックは `src/hooks/useIsCompact.js` で集約され、`resize` イベントに追従する。

#### 3-20-1. JS 側で切り替えるもの

| 項目 | 通常 | コンパクト |
|------|------|----------|
| 操作列のボタン（編集 / 削除 / メンバー 等） | テキスト + アイコン | **アイコンのみ + tooltip** |
| ヘッダー大ボタン（招待 / 部署作成 / 案件作成 / チーム作成） | size="md" | **size="sm"** |
| メイン領域の padding | `S.l` (24px) | **`S.s` (8px)** |
| サイドバーの初期表示 | 開いた状態 | **閉じた状態でスタート**（メニューボタンで開閉可） |
| モーダルの padding | `S.l` / `S.m` | 圧縮（`S.m` / `S.s`） |
| モーダルの maxWidth | 指定値 | **`min(指定値, calc(100vw - 16px))`** |

#### 3-20-2. CSS（メディアクエリ）で切り替えるもの

`@media (max-width: 899px)` で：

- `body { font-size: 15px }`（通常は 16px）
- `table th, table td { padding: 6px 8px !important }`（セル padding を圧縮）

#### 3-20-3. clamp() で連続的に変化するもの

| 項目 | 値 |
|------|------|
| 全ページのページタイトル `h1` | `clamp(1.05rem, 4vw, 1.5rem)` |
| `ProjectHeader` の案件名 | `clamp(1.05rem, 4vw, 1.5rem)` |
| `Modal` のタイトル | `clamp(1rem, 3vw, 1.2rem)` |

#### 3-20-4. flexWrap で折り返すもの

| 項目 | 動作 |
|------|------|
| 各ページのヘッダーバー（タイトル + アクション） | 狭いとき**タイトルの下にアクションが折り返す** |
| モーダルのフッター（ボタン群） | ボタンが折り返せる |
| テーブルコンテナ | 内容が広いとき**横スクロール** |

#### 3-20-5. ボタンの iconOnly モード

`Button.jsx` に `iconOnly` prop を追加。`true` のとき：
- アイコンのみ表示、`children` は `aria-label` / `title` の fallback として保持
- 寸法は `sm` で 32x30、`md` で 38x36 の正方形
- ホバーで tooltip 表示

#### 3-20-6. 適用画面

レスポンシブ対応済み画面：
- `/dashboard`（5 ウィジェットの auto-fit grid）
- `/projects`、`/projects/:id`、ガント / カンバン / タスク一覧 / ファイル
- `/teams`
- `/notifications`、`/profile`
- `/admin`、`/admin/users`、`/admin/departments`
- 全モーダル

### 3-21. エラーハンドリング（v1.7 で実装）

未捕捉の JavaScript 例外による白画面を回避するため、`AppShell` の `<main>` 配下を
`ErrorBoundary` で wrap する。

| 観点 | 内容 |
|------|------|
| 配置 | `src/components/layout/ErrorBoundary.jsx`（class component） |
| 捕捉範囲 | ログイン後の全ページ（`<Outlet />`） |
| 表示 | 「画面の表示中に問題が発生しました」見出し + エラー詳細（`<details>` で折りたたみ）+ ページ再読込 / トップに戻る ボタン |
| 用途 | 想定外の null 参照や API 形式変更等で個別画面が死んでも、サイドバー / ヘッダーは生かす |

> **null safety 補強**：profiles.full_name 等が null でも `(value || '').toLowerCase()` のように防御。
> 招待消化が途中で失敗するとプロフィールに欠損が生じる可能性があるため、
> ユーザー一覧やメンバーテーブルでは null 安全に文字列処理する。

---

## 4. 画面構成

### 4-1. 画面一覧

| 画面名 | 種別 | URL | 役割 | 実装 |
|--------|------|-----|------|------|
| ログイン画面 | 起動時 | `/login` | メール＋パスワードでの認証（Appwrite Auth） | ✅ v1.5 |
| 招待消化 | 公開 | `/invitations/:token` | 招待リンクからアカウント作成 | ✅ v1.5 |
| ダッシュボード | メイン（ホーム） | `/dashboard` | 5 ウィジェット（自動再読込） | ✅ v1.5 |
| 案件一覧 | サイドナビ | `/projects` | 閲覧可能な全案件をチーム別グルーピング | ✅ v1.4 |
| 案件詳細 | 遷移先 | `/projects/:projectId` | ガント / カンバン / ファイル / タスク一覧 | ✅ v1.5 |
| チーム | サイドナビ | `/teams` | チーム一覧 + メンバー一覧（縦並び） | ✅ v1.3 |
| 通知 | サイドナビ | `/notifications` | アプリ内通知 | ✅ v1.5 |
| マイページ | サイドナビ | `/profile` | プロフィール・パスワード変更 | ✅ v1.5 |
| 管理者ダッシュボード | サイドナビ（Admin のみ） | `/admin` | 全体ダッシュボード | ✅ v1.5 |
| ユーザー管理 | サイドナビ（Admin のみ） | `/admin/users` | 招待・所属編集・メンバー管理 | ✅ v1.5 |
| 部署管理 | サイドナビ（Admin のみ） | `/admin/departments` | 部署 CRUD + 部署メンバー管理 | ✅ v1.5 |
| タスク詳細 | モーダル | （案件詳細から） | 親タスク詳細・小タスク一覧・コメント枠 | ✅ v1.5 |
| 404 | フォールバック | `*` | ページが見つからない | ✅ |

### 4-2. サイドバー構成（v1.9 でメニューを再構成）

```
┌──────────────────────────┐
│  📊 AimZ                  │ ロゴ
│  🏢 営業部 / 開発部         │ 所属部署（小さく、複数あれば併記）
├──────────────────────────┤
│  ▸ 通知                    │ ← ナビ最上段（独立、見出し無し）
│                           │
│  メニュー                  │
│  ▸ ダッシュボード            │
│  ▸ 案件一覧                 │
│  ▸ タスク一覧                │ ← v1.9 追加（自分担当のタスク・小タスク）
│  ▸ スケジュール              │ ← v1.9 追加（月カレンダー）
│  ▸ チーム                   │
│                           │
│  管理者（Admin のみ表示）   │
│  ▸ 管理者ダッシュボード      │
│  ▸ ユーザー管理              │
│  ▸ 部署管理                  │
│                           │
│  アカウント                  │
│  ▸ マイページ                │
├──────────────────────────┤
│  👤 山田太郎 管理者 ›       │ ← v1.9：クリックで /profile へ
└──────────────────────────┘
```

> v1.8 変更：通知は他の業務メニューより**未読対応の優先度が高い**ため、ナビ最上段
> （メニュー見出しの上）に独立配置する。
>
> v1.9 変更：個人視点の業務動線として「タスク一覧」「スケジュール」をメニューに追加。
> サイドバー下部のユーザー情報枠とヘッダー右上アバターはどちらも `/profile` への
> リンクとする（クリックでマイページへ遷移）。

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
  avatar_url text,                  -- v2.0：base64 data URI を直接保存（Appwrite では string size=200000）
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

> **v2.0 変更**：`avatar_url` は v1.5〜v1.9 では Storage URL（`https://sgp.cloud.appwrite.io/...`）を保存していたが、
> v2.0 から base64 data URI（`data:image/jpeg;base64,...`）を直接保存する方針に変更。
> 256×256 にリサイズした JPEG quality 0.85 で実測 15〜30KB、Appwrite の string 属性 size=200000 に十分収まる。
> 旧 Storage URL を持つレコードはそのまま `<img src="...">` で表示できるため移行不要（互換）。

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

### tasks（v1.9 で `project_id` を任意属性化）

```sql
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,  -- v1.9：required false
  ...（その他は v1.4 と同じ）
);
```

> v1.9 変更：個人タスク・横断タスクをサポートするため `project_id` を任意化。
> `null` の場合 `/tasks` 画面で「案件未設定」グループとして集約表示する。
> ダッシュボードのタスク一覧から開くリンクは `project_id` が無ければ `/tasks` へ飛ばす。

---

### team_members（チームメンバー中間テーブル）

**v1.3：`role` カラムを追加。`leader` は新規ロール。**
**v1.8：`documentId` を `ID.unique()` で発行。一意性は `(team_id, user_id)` のクエリで担保。**

```sql
create table team_members (
  id uuid default gen_random_uuid() primary key,  -- ← Appwrite では ID.unique()
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','member')),
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);
```

> **v1.8 変更理由**：v15 までは documentId を `${teamId}_${userId}` の合成キーで発行していたが、
> Appwrite Auth が生成する userId が長く、合成すると Appwrite の docId 36 字制限を超過して
> 「Invalid `documentId` param」エラーが発生していた。
> `addMember` / `removeMember` / `updateRole` は `(team_id, user_id)` のクエリで既存ドキュメントを
> 検索するように変更（旧形式の短い合成 docId を持つ既存データもそのまま動作）。

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

### comments（案件コメント、v1.9 で新設）

```sql
create table comments (
  id uuid default gen_random_uuid() primary key,  -- Appwrite では ID.unique()
  project_id uuid references projects(id) on delete cascade,  -- v1.9：必須
  user_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),  -- Appwrite の $createdAt を使う
  updated_at timestamptz default now()   -- Appwrite の $updatedAt を使う
);
```

- 投稿は `Role.users()` で全員可
- **編集 / 削除は投稿者本人 or 管理者のみ**（クライアント側で判定）
- 案件削除時にカスケード削除（`deleteAllCommentsForProject`）
- 編集後は `$updatedAt !== $createdAt` を見て「（編集済み）」表示

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

### 現在の Appwrite 権限（v1.7 時点の実運用）

PHASE 4（v10）で全コレクション + Storage Bucket を `Role.users()` に絞った。  
ただし v1.7 で **invitations.read のみ `Role.any()` に開放**する例外を設けた。

| コレクション | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| profiles / departments / teams / team_members | Role.users() | Role.users() | Role.users() | Role.users() |
| projects / project_assignees / tasks / subtasks | Role.users() | Role.users() | Role.users() | Role.users() |
| schedules / schedule_participants / notifications | Role.users() | Role.users() | Role.users() | Role.users() |
| project_files | Role.users() | Role.users() | Role.users() | Role.users() |
| **invitations** | **Role.any()** ⭐（v1.7） | Role.users() | Role.users() | Role.users() |
| Storage Bucket（案件ファイル + アバター共用） | Role.users() | Role.users() | Role.users() | Role.users() |

> **invitations.read の例外**：招待リンクを踏んだユーザーは未ログイン状態でトークン検証を行う必要がある。
> このため `getInvitationByToken` が成立するよう Read のみ `Role.any()` に開放している。
> Create / Update / Delete は引き続き認証済みユーザーのみが行える（管理者権限の判定はクライアント側 UI で実施）。

---

### RLS ポリシー設計方針（将来：document-level security に移行する場合の指針）

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

### 環境変数の運用（v1.8 で方針確立）

| ファイル | 内容 | git 管理 |
|---|---|---|
| `.env` | `REACT_APP_*`（Project ID / Endpoint / Database ID / Bucket ID）— ビルド時にバンドルへ埋め込まれ、ブラウザ DevTools で誰でも参照可能な値 | ✅ 管理する |
| `.env.local` | `APPWRITE_API_KEY`（setup / seed / sync 系スクリプトのサーバー側管理キー）— 漏洩すると DB 全削除等が可能な機密情報 | ❌ `.gitignore` |

> `.env` を git 管理から外していたため、worktree でビルドした際にエンドポイントが
> デフォルトの `cloud.appwrite.io` にフォールバックして CORS エラーになる事故が発生した（v15→v16 移行時）。
> 公開値のみは git 管理にすることでこの事故を防ぎ、秘匿情報は `.env.local` に分離する。
> `scripts/*.js` は `dotenv.config({ path: '.env.local' })` を先に呼ぶことで両方のファイルから読み込む。

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
| v1.5 | 2026-05-04 | 全 PHASE 完了の実装ステータスを反映。3-17 部署メンバー管理（C 案）追加、3-18 通知ベル（クリックで遷移）、3-19 画面の自動再読込を仕様化。3-2 組織管理にユーザー所属編集を追記。案件削除時のカスケード削除を仕様化。タスク CRUD・カンバン DnD・ガント本実装・ファイル管理・通知・マイページ・管理者ダッシュボード・認証本実装が ✅ に。 |
| v1.6 | 2026-05-07 | 3-20 レスポンシブ仕様を新規追加。ウィンドウ幅 < 900px の「コンパクトモード」での UI 自動調整（操作ボタンの iconOnly 化、メイン領域 padding 圧縮、サイドバー初期非表示、モーダルのビューポート超過防止、テーブルセル padding 圧縮、見出しの `clamp()` 化、ヘッダーバー / モーダルフッターの `flexWrap` 折り返し）を仕様化。 |
| v1.7 | 2026-05-07 | プロフィール画像のアップロード（3-1 / 7）、招待運用機能（3-2 招待履歴・コピー・mailto・再発行・取消）、3-21 エラーハンドリング（ErrorBoundary）を新規追加。データ設計セクションに「現在の Appwrite 権限」表を追加し、invitations.read を `Role.any()` に開放する例外を明記。 |
| v1.8 | 2026-05-09 | 4-2 サイドバー：通知をナビ最上段に変更。5 データ設計：`team_members.documentId` を `ID.unique()` で発行する仕様に変更（合成キーの 36 字制限超過を解消）。8 開発・運用環境：`.env`（公開値のみ git 管理）と `.env.local`（秘匿情報）の分離方針を明記。プロフィール画像のクリック選択／ドロップ反映バグは特定環境で再現するため次フェーズで再着手（v15 オリジナル実装に巻き戻し）。 |
| v1.9 | 2026-05-09 | **マイタスク（`/tasks`）/ マイスケジュール（`/schedule`）**を新規追加。**案件詳細にコメントタブ**を追加（投稿者 or 管理者のみ編集 / 削除）。タスクモーダル内のコメント枠（フェーズ 2 予告）を撤去。`tasks.project_id` を**任意属性**に変更し「案件未設定タスク」をサポート（TaskDetailModal に案件ピッカー追加）。サイドバーのメニュー欄にタスク一覧 / スケジュール追加。ヘッダー右上アバターとサイドバー下部のユーザー情報を `/profile` へのリンクに変更。`comments` コレクション新設。IME 変換中の Enter で誤発火しないキー判定規約を追記。 |
| v2.0 | 2026-05-09 | **プロフィール画像を base64 data URI 方式に再設計**：Storage アップロードを廃止、Canvas で 256×256 にリサイズ → JPEG quality 0.85 → `profiles.avatar_url`（size 500→200000）に直接保存。`<input>` を動的生成して `.click()` する方式で React レンダリング由来の onChange 不発火問題を構造的に回避。**自動再読込の規約変更**：初回ロードのみフルローディング、以降はバックグラウンド更新（フォーカス再取得時の `setLoading(true)` で ProfileEditor が unmount され、編集中ファイル state が破棄されていた v15〜v17 の真因を解消）。**`project_assignees` / `schedule_participants` の docId を ID.unique() に統一**（合成キーの 36 字超過リスク回避）。dummy.js（PHASE 4 完了後に未使用化）を撤去。サイレント catch（`catch (_) {}`）に診断ログ追加。 |
| v2.1 | 2026-05-11 | **招待リンク方式を廃止し、管理者によるユーザー直接作成方式に変更**（"not authorized" エラー多発のため）。**マイページにメールアドレス変更機能**を追加（account.updateEmail + profiles 同期）。**ファビコン設定**（SVG ロゴ）。**コメントタブにメンション機能 + 通知**：`@` サジェスト → 確定で `@<full_name>` 挿入、メンション対象に通知作成、表示はハイライト。**ダッシュボード「本日のスケジュール」を「本日の予定・タスク」に拡張**：自分担当のアクティブタスク（start_date ≤ 今日 ≤ due_date ∧ status≠完了）を併記。**スケジュール CRUD UI 完成**：ScheduleFormModal で作成・編集・削除・参加者管理、`/schedule` と案件詳細の「予定」タブの両方から起動可能。30 分前リマインダー通知は Appwrite Functions 必要のため将来対応。 |
