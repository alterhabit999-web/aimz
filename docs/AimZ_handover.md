# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-04-29  
**仕様書バージョン**: v1.1  
**引き継ぎ書バージョン**: v3

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。  
部署 → チーム → 案件（プロジェクト）→ タスク の階層でデータを管理し、  
ガントチャート・カンバンボード・ダッシュボードで進捗を可視化する。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：仕様書・デザインシステム確定、プロジェクトフォルダ構築済み、Appwrite セットアップ待ち

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0-1 | アプリ概要・ヒアリング | ✅ 完了 |
| PHASE 0-2 | 仕様書作成（AimZ_spec.md） | ✅ 完了 |
| PHASE 0-3 | デザインシステム確定（SmartHR ベース） | ✅ 完了 |
| PHASE 0-4 | デザインシステムをコードに反映（App.jsx） | ✅ 完了 |
| PHASE 1 | プロジェクトフォルダ構築（~/Documents/App/aimz） | ✅ 完了（npm install は未実行） |
| PHASE 1 | アイコンライブラリ導入（lucide-react）・絵文字を廃止 | ✅ 完了 |
| PHASE 1 | DESIGN.md をプロジェクトフォルダに格納 | ✅ 完了 |
| PHASE 1 | 仕様書・引き継ぎ書をプロジェクトフォルダに格納 | ✅ 完了 |
| PHASE 1 | GitHub リポジトリ作成・接続 | 🔲 未着手 |
| PHASE 1 | Appwrite プロジェクト作成・.env 設定 | 🔲 未着手 |
| PHASE 2 | UI 実装 | 🔲 未着手 |
| PHASE 3 | Supabase DB 連携 | 🔲 未着手 |
| PHASE 4 | 認証（招待制ログイン） | 🔲 未着手 |
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

- ダッシュボード（今日のスケジュール、期限迫るタスク、プロジェクト進捗）
- ガントチャート（日単位、案件ごと）
- カンバンボード（案件ごと、ドラッグ＆ドロップ）
- ファイル管理（案件紐付け、50MB まで、PNG / JPG / PDF / Word / Excel）
- アプリ内通知（タスクアサイン・期限リマインド）
- 管理者ダッシュボード（全チーム進捗率、メンバー別タスク負荷）

### 技術スタック

| 項目 | 内容 |
|------|------|
| フロントエンド | React（create-react-app） |
| DB / 認証 | Appwrite Cloud（https://cloud.appwrite.io） |
| ファイル保存 | Appwrite Storage |
| ホスティング | GitHub Pages |
| デザイン | SmartHR Design System ベース |

### テーブル一覧（仕様書より）

`profiles` / `departments` / `teams` / `team_members` /  
`projects` / `tasks` / `subtasks` / `schedules` / `schedule_participants` /  
`project_files` / `notifications` / `invitations`

> 詳細な SQL 定義は `AimZ_spec.md` のセクション 5 を参照。

---

## 4. 開発環境（開発開始時に設定）

- **プロジェクト場所**：`~/Documents/App/aimz`（構築済み ✅）
- **開発ツール**：Claude Code（コード編集）＋ Mac ターミナル
- **ローカル確認**：`npm install` 実行後 → `npm start` → `http://localhost:3000`
- **公開 URL**：GitHub Pages 設定後に確定
- **Appwrite**：プロジェクト作成後に `.env` に設定する

**初期ファイル（作成済み）**：

| ファイル | 内容 |
|---------|------|
| `src/App.jsx` | デザインシステム定数（C・S）・lucide-react アイコン使用・ダッシュボード＆ログイン骨格 |
| `src/appwrite.js` | Appwrite クライアント設定（.env から読み込み） |
| `src/index.js` | React エントリポイント |
| `src/App.css` | グローバルスタイル（游ゴシック・スクロールバー） |
| `public/index.html` | 游ゴシック @font-face 設定済み |
| `DESIGN.md` | SmartHR デザインシステム仕様書 |
| `docs/AimZ_spec.md` | アプリ仕様書 v1.1 |
| `docs/AimZ_handover.md` | 引き継ぎ書 v3（本ファイル） |
| `.env.example` | 環境変数テンプレート |
| `.gitignore` | node_modules・build・.env を除外 |
| `package.json` | react・appwrite・lucide-react・gh-pages 設定済み |
| `開発の始め方.md` | 初回セットアップ手順 |

---

## 5. 開発フロー（Claude Code 使用時）

```bash
# ローカル確認
cd ~/Documents/aimz
npm start

# 変更をGitHubに保存
git add .
git commit -m "変更内容のメモ"
git push origin main

# 本番デプロイ
npm run deploy
```

---

## 6. 今回のセッションで行ったこと

### 仕様書の作成（PHASE 0-1 / 0-2 完了）
ヒアリングをもとに `docs/AimZ_spec.md` を作成。  
組織階層・権限設計・全機能定義・画面構成・DB テーブル設計まで完成。

### デザインシステム確定・コード反映（PHASE 0-3 / 0-4 完了）
DESIGN.md（SmartHR Design System ベース）を受領し、仕様書・コードに反映。  
`src/App.jsx` にカラー定数 `C`・スペーシング定数 `S` として組み込み済み。

### バックエンド変更
Supabase（無料枠終了）→ **Appwrite Cloud** に変更。仕様書・引き継ぎ書の全 Supabase 表記を更新。

### プロジェクトフォルダ構築（PHASE 1 一部完了）
`~/Documents/App/aimz/` に全初期ファイルを作成。

### アイコンライブラリ導入・絵文字廃止
`lucide-react` を導入し、UI 内の絵文字をすべてアイコン（SVG）に置き換え。  
`package.json` に `lucide-react: ^0.383.0` を追加済み。

### ドキュメントのプロジェクトフォルダへの格納
仕様書・引き継ぎ書を `~/Documents/App/aimz/docs/` に格納。  
Claude Code セッションでそのまま参照できる状態になった。

**まだ実行していないこと**：`npm install`（ユーザーがターミナルで実行する必要あり）

---

## 7. 次回やること（優先順位順）

### STEP 1：npm install を実行する（ユーザー作業）
```bash
cd ~/Documents/App/aimz
npm install
```
完了後に `npm start` でブラウザが開き、SmartHR デザインの骨格画面が確認できる。

### STEP 2：GitHub リポジトリを作成して接続する（ユーザー作業）
1. github.com で `aimz` リポジトリを Public で作成
2. `package.json` の `homepage` を自分の GitHub ユーザー名で書き換える
3. ターミナルで以下を実行：
```bash
cd ~/Documents/App/aimz
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/ユーザー名/aimz.git
git push -u origin main
```

### STEP 3：Appwrite プロジェクトを作成する（ユーザー作業）
1. https://cloud.appwrite.io でアカウント作成
2. 新規プロジェクト作成（名前: AimZ）
3. `.env.example` をコピーして `.env` を作成し、プロジェクト ID を記入

### STEP 4：PHASE 2 UI 実装（Claude Code で進める）
- ログイン画面の本実装
- サイドバー・ヘッダーの完成
- ダッシュボードの各ウィジェット実装
- ガントチャート・カンバンボードは専用コンポーネントとして分離

### STEP 5：PHASE 3 Appwrite DB 連携
- Appwrite コンソールでコレクション（テーブル相当）を作成
- 権限ポリシー設定
- データの読み書き実装

### STEP 6：PHASE 4 招待制認証
- Appwrite Auth でメール招待フローを実装
- 管理者が招待メールを送る管理画面を実装

---

## 8. 未決定事項

- [x] デザインシステム詳細（SmartHR ベースで確定済み）
- [ ] GitHub リポジトリ名（`aimz` 推奨）・接続
- [ ] Appwrite プロジェクト ID・.env 設定
- [ ] ガントチャートのドラッグ日程変更はフェーズ 1 に含めるか
- [ ] チームリーダーロールの要否
- [ ] 案件の「アーカイブ」機能の要否

---

## 9. 次回セッションの開始方法

**Claude Code で続きから始める場合：**

1. Claude Code を開く
2. `~/Documents/aimz` フォルダを開く（または作業フォルダを選択）
3. 以下を貼り付けて送信：

> 「AimZ の開発を続けます。docs/AimZ_handover.md（v3）と docs/AimZ_spec.md（v1.1）を確認してください。」

**DESIGN.md を受け取っていない場合は先にそちらを共有してもらうこと。**

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1 | 2026-04-29 | 初版作成（仕様書完成、PHASE 0-2 まで完了） |
| v2 | 2026-04-29 | Appwrite 変更、デザインシステム確定、プロジェクトフォルダ構築完了 |
| v3 | 2026-04-29 | lucide-react 導入・絵文字廃止、DESIGN.md・仕様書・引き継ぎ書をフォルダに格納 |
