# AimZ 引き継ぎ書

**作成日**: 2026-04-29
**更新日**: 2026-04-29
**仕様書バージョン**: v1.2
**引き継ぎ書バージョン**: v4

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React 18 + react-router-dom v7 + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages
**現在の状態**：プロジェクトフォルダ構築・GitHub 接続・Appwrite 接続情報設定済み。
ダッシュボード（5 ウィジェット）実装完了。
他ページはプレースホルダー、Appwrite コレクションは未作成。

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0-1 | アプリ概要・ヒアリング | ✅ 完了 |
| PHASE 0-2 | 仕様書作成（AimZ_spec.md） | ✅ 完了（v1.2） |
| PHASE 0-3 | デザインシステム確定（SmartHR ベース） | ✅ 完了 |
| PHASE 0-4 | デザインシステムをコードに反映 | ✅ 完了（tokens.js に分離） |
| PHASE 1 | プロジェクトフォルダ構築（~/Documents/App/aimz） | ✅ 完了 |
| PHASE 1 | アイコンライブラリ導入（lucide-react）・絵文字を廃止 | ✅ 完了 |
| PHASE 1 | DESIGN.md・仕様書・引き継ぎ書をプロジェクトフォルダに格納 | ✅ 完了 |
| PHASE 1 | npm install（依存パッケージ取得） | ✅ 完了 |
| PHASE 1 | GitHub リポジトリ作成・接続・push | ✅ 完了 |
| PHASE 1 | Appwrite アカウント・プロジェクト作成 | ✅ 完了 |
| PHASE 1 | Appwrite Database / Storage バケット作成 | ✅ 完了 |
| PHASE 1 | `.env` に Appwrite 接続情報を設定 | ✅ 完了 |
| PHASE 2 | react-router-dom v7 導入・ルーティング構築 | ✅ 完了 |
| PHASE 2 | App.jsx を機能別フォルダにファイル分割 | ✅ 完了 |
| PHASE 2 | AuthContext（Appwrite Auth + ダミーログイン併用）実装 | ✅ 完了 |
| PHASE 2 | 共通 UI コンポーネント実装（Card / Avatar / Badge / Button / 他） | ✅ 完了 |
| PHASE 2 | レイアウト実装（AppShell / Sidebar / Header / RequireAuth） | ✅ 完了 |
| PHASE 2 | ダッシュボード（5 ウィジェット）実装 | ✅ 完了 |
| PHASE 2 | 部署・チーム一覧 / 案件一覧 / 案件詳細 等の本実装 | 🔲 未着手（次回） |
| PHASE 2 | カンバンボード | 🔲 未着手 |
| PHASE 2 | ガントチャート | 🔲 未着手 |
| PHASE 2 | タスク詳細モーダル | 🔲 未着手 |
| PHASE 2 | 通知ページ・マイページ・管理者画面 | 🔲 未着手 |
| PHASE 3 | Appwrite コレクション作成（12 個）+ 権限設定 | 🔲 未着手 |
| PHASE 3 | UI からの DB 読み書き実装（ダミーデータ → 実データ） | 🔲 未着手 |
| PHASE 4 | 認証（招待制ログイン）・招待メール送信フロー | 🔲 未着手 |
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

### 組織階層

```
部署（Department）
  └── チーム（Team）
        └── 案件（Project）
              ├── 親タスク（Task）→ 小タスク（Subtask）
              └── スケジュール（Schedule）
```

### 権限設計

| ロール | できること |
|--------|-----------|
| Admin | 全操作（部署・チーム管理、ユーザー招待/削除、全案件の閲覧/編集） |
| チームメンバー | 自チームの案件・タスクの CRUD |
| 同部署メンバー（他チーム） | 他チームの案件・タスクの閲覧のみ |

### 主要機能

- ダッシュボード（今日のスケジュール、期限迫るタスク、プロジェクト進捗、お知らせ、自分のタスク）
- ガントチャート（日単位、案件ごと）
- カンバンボード（案件ごと、ドラッグ＆ドロップ）
- ファイル管理（案件紐付け、50MB まで、PNG / JPG / PDF / Word / Excel）
- アプリ内通知（タスクアサイン・期限リマインド）
- 管理者ダッシュボード（全チーム進捗率、メンバー別タスク負荷）

### 技術スタック

| 項目 | 内容 |
|------|------|
| フロントエンド | React 18（create-react-app） |
| ルーティング | react-router-dom v7 |
| DB / 認証 | Appwrite Cloud（Singapore リージョン） |
| ファイル保存 | Appwrite Storage |
| ホスティング | GitHub Pages |
| デザイン | SmartHR Design System ベース |
| アイコン | lucide-react |

### Appwrite 接続情報（`.env` に設定済み・Git 除外）

| 項目 | 値 |
|------|---|
| Project ID | `69f144ba0005896bc8c3` |
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6` |

### GitHub

| 項目 | 値 |
|------|---|
| ユーザー名 | `alterhabit999-web` |
| リポジトリ | https://github.com/alterhabit999-web/aimz |
| 公開予定 URL | https://alterhabit999-web.github.io/aimz |

### テーブル一覧（仕様書より、Appwrite 側未作成）

`profiles` / `departments` / `teams` / `team_members` /
`projects` / `tasks` / `subtasks` / `schedules` / `schedule_participants` /
`project_files` / `notifications` / `invitations`

> 詳細な SQL 定義は `AimZ_spec_v1.2.md` のセクション 5 を参照。

### URL ルート設計（react-router-dom）

| URL | ページ | 認証 |
|-----|------|------|
| `/login` | ログイン画面 | 不要 |
| `/dashboard` | ダッシュボード | 必須 |
| `/departments` | 部署・チーム一覧 | 必須 |
| `/projects` | 案件一覧 | 必須 |
| `/projects/:projectId` | 案件詳細 | 必須 |
| `/notifications` | 通知 | 必須 |
| `/profile` | マイページ | 必須 |
| `/admin` | 管理者ダッシュボード | 必須＋Admin |
| `/admin/users` | ユーザー管理 | 必須＋Admin |
| `*` | 404 | — |

---

## 4. 開発環境

- **プロジェクト場所**：`~/Documents/App/aimz`
- **開発ツール**：Claude Code（コード編集）＋ Mac ターミナル
- **ローカル確認**：`npm start` → `http://localhost:3000`
- **公開 URL**：`https://alterhabit999-web.github.io/aimz`（GitHub Pages 設定後）
- **Appwrite**：Singapore リージョン・接続情報は `.env` に記入済み

**現在のファイル構成（v1.2 時点）**：

```
~/Documents/App/aimz/
├── public/index.html                       游ゴシック @font-face 設定済み
├── src/
│   ├── App.jsx                             ルーティング設定
│   ├── App.css / index.js / appwrite.js
│   ├── styles/tokens.js                    デザイントークン
│   ├── data/dummy.js                       ダミーデータ＋集計ヘルパー
│   ├── contexts/AuthContext.jsx            認証状態
│   ├── utils/format.js                     日付・時刻フォーマット
│   ├── components/
│   │   ├── ui/                             Card / Avatar / Badge / Button / SectionLabel / PlaceholderPage
│   │   ├── layout/                         AppShell / Sidebar / Header / RequireAuth
│   │   └── dashboard/                      ウィジェット 5 種
│   └── pages/
│       ├── LoginPage.jsx                   ✅ 実装
│       ├── DashboardPage.jsx               ✅ 実装
│       ├── DepartmentsPage.jsx             ⏸ プレースホルダー
│       ├── ProjectsPage.jsx                ⏸ プレースホルダー
│       ├── ProjectDetailPage.jsx           ⏸ プレースホルダー
│       ├── NotificationsPage.jsx           ⏸ プレースホルダー
│       ├── ProfilePage.jsx                 ⏸ プレースホルダー
│       ├── NotFoundPage.jsx                ✅ 実装
│       └── admin/
│           ├── AdminDashboardPage.jsx      ⏸ プレースホルダー
│           └── UsersPage.jsx               ⏸ プレースホルダー
├── docs/
│   ├── AimZ_spec_v1.2.md
│   └── AimZ_handover_v4.md
├── DESIGN.md / .env / .env.example / .gitignore
├── package.json / package-lock.json
└── 開発の始め方.md
```

---

## 5. 開発フロー（Claude Code 使用時）

```bash
# ローカル確認
cd ~/Documents/App/aimz
npm start
# http://localhost:3000 が開く

# 開発初期は「ダミーログイン（管理者）」ボタンで UI 確認可能
#  Appwrite 実ユーザー作成後はメール＋パスワードに切り替わる

# 変更を GitHub に保存
git add .
git commit -m "変更内容のメモ"
git push origin main

# 本番デプロイ（GitHub Pages）
npm run deploy
```

---

## 6. 今回（v4）のセッションで行ったこと

### Appwrite Cloud のセットアップ（ユーザー作業 + Claude）
- Appwrite アカウント・プロジェクト「AimZ」作成（Singapore リージョン）
- Database 作成・Storage バケット作成
- `.env` ファイルを新規作成し、4 つの値を設定
  - Project ID / Endpoint / Database ID / Storage Bucket ID
- `.env` は `.gitignore` で除外済み

### GitHub リポジトリ接続
- `package.json` の `homepage` を `https://alterhabit999-web.github.io/aimz` に更新
- `git init` → 初回コミット（13 ファイル、`.env` と `node_modules` は除外）
- リモート接続 → `main` ブランチへ push 完了

### 大規模リファクタリング：ファイル分割
**目的**：1 ファイル 497 行になっていた `App.jsx` を機能別フォルダに分離。
**結果**：保守性向上 + 各機能の責務が明確に。
- `src/styles/tokens.js`：デザイントークン（C / S / ICON_*）を一元化
- `src/data/dummy.js`：開発用ダミーデータ＋集計ヘルパー（仕様書のテーブル設計に準拠）
- `src/contexts/AuthContext.jsx`：認証状態管理
- `src/utils/format.js`：日付・時刻フォーマット
- `src/components/ui/`：共通 UI 部品 6 種
- `src/components/layout/`：レイアウト 4 種
- `src/components/dashboard/`：ダッシュボードウィジェット 5 種
- `src/pages/`：各画面 9 種＋ admin 配下 2 種

### react-router-dom v7 導入
- `npm install react-router-dom`
- ルート設計（11 ルート）：上記「URL ルート設計」表参照
- `RequireAuth` コンポーネントで認証必須 / Admin 専用ガード実装
- `BrowserRouter` の `basename` に `process.env.PUBLIC_URL` を設定（GitHub Pages の `/aimz` 配下対応）

### 認証コンテキスト（AuthContext）実装
- 起動時に Appwrite セッションをチェック → 自動ログイン
- `login(email, password)` 関数：Appwrite Email + Password 認証
- `loginAsDummy(userId)` 関数：開発初期用、Appwrite 実ユーザーがなくても UI 確認可能
- `logout()` 関数：Appwrite セッション削除＋状態クリア
- ログイン中ユーザーは仕様書の `profiles` 形式に変換して保持

### 共通 UI コンポーネント実装
- `Card.jsx`：角丸・薄シャドウのコンテナ。タイトル＋アイコン＋アクション領域対応
- `Avatar.jsx`：画像 or イニシャル表示
- `SectionLabel.jsx`：サイドバーのセクション小見出し
- `Badge.jsx`：ステータス・優先度バッジ。`statusVariant`・`priorityVariant` ヘルパー付き
- `Button.jsx`：primary / secondary / danger / ghost、sm / md サイズ対応
- `PlaceholderPage.jsx`：未実装ページの仮表示

### レイアウト実装
- `AppShell.jsx`：サイドバー＋ヘッダーの枠組み（`<Outlet />` で各ページを表示）
- `Sidebar.jsx`：`NavLink` でアクティブ判定。Admin メニューは条件分岐で表示
- `Header.jsx`：サイドバー開閉・通知ベル（未読数バッジ付き）・アバター
- `RequireAuth.jsx`：未ログインなら `/login` リダイレクト、Admin 専用は `/dashboard` リダイレクト

### ダッシュボード（5 ウィジェット）実装
仕様書 3-10 のウィジェットをすべて実装：

1. **TodayScheduleWidget**：今日の予定をタイムライン表示。場所アイコン付き
2. **UpcomingTasksWidget**：期限超過 + 7 日以内のタスク。期限超過は赤、3 日以内はオレンジで強調
3. **MyTasksWidget**：自分のタスクをステータス別グルーピング（進行中/未着手/完了）。完了は取り消し線
4. **ProjectsProgressWidget**：チームの案件をプログレスバー付きで表示（タスクの平均進捗率）
5. **NotificationsWidget**：通知一覧。未読は青背景＋左ボーダー、未読件数バッジ

その他の工夫：
- 挨拶（時間帯別：おはようございます / こんにちは / こんばんは）
- 日付ヘッダー「2026年4月29日 (水)」
- 各タスク行にホバーエフェクト（背景色変化）
- 案件詳細ページへのリンク（`/projects/:id`）
- 空状態メッセージ（「予定はありません」「期限が迫るタスクはありません」など）
- レスポンシブグリッド（`auto-fit minmax(360px, 1fr)`）

### ダミーデータの調整
ダッシュボードのウィジェットを populated 状態で確認できるよう、自分（u1）のタスクの期限を一部今日近辺に調整：
- `tk10`「API 設計レビュー」を新規追加（2 日前に期限超過、優先度高）
- `tk3`「フロントエンド実装」期限を 5/2（3 日後）に変更
- `tk6`「技術選定」期限を 5/5（6 日後）に変更

### ビルド検証
- `CI=true npm run build` を実行 → 警告ゼロ・エラーゼロでコンパイル成功を確認
- `build/` ディレクトリは検証後に削除（`.gitignore` 対象）

### ⏸ 中断中のタスク（次回着手）
- 部署・チーム一覧 → 案件一覧 → 案件詳細 の本実装
  - **次回はユーザーから新しいアイデアのヒアリングからスタート予定**
- カンバンボード（ドラッグ＆ドロップ）
- ガントチャート
- タスク詳細モーダル（親タスク＋小タスク）
- 通知ページ（フル実装）・マイページ・管理者画面
- Appwrite コレクション 12 個の作成と権限設定
- ダミーデータ → 実 DB 読み書きの切り替え

---

## 7. 次回やること（優先順位順）

### STEP 1：部署・チーム → 案件一覧 → 案件詳細 の構想ヒアリング 🆕
ユーザーが構想・アイデアを持っている。以下の観点を **改めてヒアリング** してから実装に入る：

- **部署・チーム画面の使われ方**
  - 一覧の見せ方（部署ごとにツリーで折り畳み？カード並び？）
  - チームをクリックしたら何が表示される？（案件一覧へ？それともチーム詳細を挟む？）
  - チームメンバー一覧はどこで見たい？

- **案件一覧画面の使われ方**
  - すべての閲覧可能案件をフラットに見せる？チーム別にグルーピング？
  - 検索・フィルター（ステータス / 担当者 / 期限）の必要性
  - 「自分が関わる案件」「閲覧のみ可能な他チーム案件」の見分け方
  - 案件カードの表示項目（進捗率？担当者アバター？）

- **案件詳細画面の構成**
  - 仕様書ではタブ構成（ガント / カンバン / タスク一覧 / ファイル）だが、デフォルトはどれを開く？
  - ヘッダーに表示する項目（案件名・期間・担当者・進捗）の優先度
  - 「編集」「削除」「アーカイブ」などのアクション配置

- **新規作成フロー**
  - 部署・チーム・案件・タスクの作成 UI（モーダル？別画面？）
  - 必須項目以外をどこまで初期表示するか

### STEP 2：上記ヒアリング後、UI 実装
1. 部署・チーム一覧ページ実装
2. 案件一覧ページ実装
3. 案件詳細ページ実装（タブ枠を先に作る）
4. タスク一覧タブ → タスク詳細モーダル → 小タスク管理
5. カンバンボード（ドラッグ＆ドロップ）
6. ガントチャート（日単位バー、今日線、ステータス色分け）
7. ファイルタブ（アップロード・一覧・削除）
8. 通知ページ・マイページ・管理者画面

### STEP 3：Appwrite DB 連携
- Appwrite コンソールで 12 コレクション作成（仕様書 5 参照）
- 各コレクションの権限ポリシー設定
- ダミーデータ（`src/data/dummy.js`）を実 DB 読み書きに置き換え
- リアルタイム購読の検討（Appwrite Realtime）

### STEP 4：認証フロー本実装
- ログイン画面のダミーログインボタンを撤去
- 招待トークン → サインアップフロー実装
- 管理者画面からの招待メール送信

### STEP 5：GitHub Pages デプロイ
- `npm run deploy` で公開
- Appwrite ダッシュボードで本番ドメイン（`alterhabit999-web.github.io`）を許可リストに追加

---

## 8. 未決定事項

- [ ] 部署・チーム・案件・タスクの画面構成（次回ヒアリング予定）
- [ ] チームへのロール追加（例：チームリーダー権限）の要否
- [ ] 案件の「アーカイブ」機能の要否
- [ ] ガントチャートのドラッグ日程変更はフェーズ 1 か 2 か
- [ ] カンバンの「保留」カラムをカスタマイズ可能にするか

---

## 9. 次回セッションの開始方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/App/aimz` フォルダを開く
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover_v4.md と docs/AimZ_spec_v1.2.md を確認してください。次は部署・チーム → 案件一覧 → 案件詳細の構想ヒアリングからお願いします。」

Claude 側は引き継ぎ書 v4 を読み次第、ヒアリング項目（本書 STEP 1）を元に質問を投げる。

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1 | 2026-04-29 | 初版作成（仕様書完成、PHASE 0-2 まで完了） |
| v2 | 2026-04-29 | Appwrite 変更、デザインシステム確定、プロジェクトフォルダ構築完了 |
| v3 | 2026-04-29 | lucide-react 導入・絵文字廃止、DESIGN.md・仕様書・引き継ぎ書をフォルダに格納 |
| v4 | 2026-04-29 | Appwrite / GitHub 接続完了、react-router-dom v7 導入、ファイル分割（components / pages / contexts / styles / data / utils）、AuthContext・共通 UI 部品・レイアウト実装、ダッシュボード全 5 ウィジェット実装。次回は案件系画面の構想ヒアリングから |
