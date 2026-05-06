# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-07  
**仕様書バージョン**: v1.6  
**引き継ぎ書バージョン**: v14

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：本番稼働中。v14 ではウィンドウ幅に応じた **UI 自動レスポンシブ対応** を全面適用。狭い画面でもボタン・タイトル・モーダル・テーブルが崩れずに自動調整される。

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
| v11 補修 | profiles メール同期 / SPA 404 解消 | ✅ |
| v12 運用改善 | 自動再読込 / 所属編集 / カスケード削除 | ✅ |
| v13 UI 改善 | 通知ベル / サイドバー所属部署 / 部署メンバー管理 | ✅ |
| **v14 UI 改善** | **ウィンドウ幅に応じた UI 自動レスポンシブ対応** | ✅ |
| 次回 | プロフィール画像を Appwrite Storage アップロードに置き換え | 🔲 **次回着手** |
| 将来 | スケジュール CRUD UI / コメント機能 / メール通知 / PWA など | 🔲 |

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
| 公開 URL | https://alterhabit999-web.github.io/aimz |

### 認証ユーザー

| ID | 用途 | 認証情報 |
|----|------|---------|
| `u1` | 山田 太郎・**管理者**（あなた専用） | Console で手動作成、実メール |
| `u2`〜`u5` | 開発確認用（メンバー） | `*@example.com` / `Aimz2026!` |

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
npm run setup:appwrite          # スキーマ + Bucket を冪等同期
npm run seed:appwrite           # ダミーデータ全投入
npm run seed:auth-users         # u2〜u5 を再作成 / パスワードリセット
npm run sync:profile-emails     # Auth のメールを profiles に同期
npm run cleanup:orphans         # 孤立データの検出（ドライラン）
npm run cleanup:orphans -- --apply  # 実際に削除
```

### 4-3. 部署メンバー管理（v13 機能）

1. u1（管理者）で `/admin/departments` を開く
2. 部署行の「**メンバー**」ボタンをクリック
3. モーダル上部のフォームでメンバーを追加（ユーザー + チーム + ロール）
4. メンバー一覧の「×」で部署から除外（その部署の全チーム所属を一括解除）

### 4-4. 新メンバー受け入れフロー

1. u1（管理者）で `/admin/users` → 招待リンク発行
2. リンクを本人に共有
3. 本人がリンクから氏名 + パスワード設定 → 自動ログイン
4. **u1 で `/admin/departments` の「メンバー」から該当部署のチームに加入**
   - もしくは `/admin/users` の編集モーダルから所属チームを設定

### 4-5. レスポンシブ動作確認（v14 機能）

ブラウザの開発者ツール（`Cmd+Shift+M`）で幅を **400px / 600px / 900px** など変更：

- 幅 ≥ 900px：通常の密度・フォントサイズ
- 幅 < 900px：操作ボタンがアイコンのみに、タイトル縮小、テーブル padding 圧縮、サイドバー初期非表示、モーダルがビューポート内に収まる

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v14 時点）

```
src/
├── App.jsx
├── App.css                             v14：レスポンシブ用メディアクエリを追加
├── styles/tokens.js
├── data/dummy.js                       一部ヘルパーが残存
├── contexts/AuthContext.jsx
├── utils/format.js
├── hooks/
│   ├── useReloadOnFocus.js
│   └── useIsCompact.js                 v14 新規（< 900px 判定）
├── api/                                Appwrite アクセス層
├── components/
│   ├── ui/
│   │   ├── Button.jsx                  v14：iconOnly prop 追加
│   │   ├── Modal.jsx                   v14：レスポンシブ化
│   │   └── …
│   ├── layout/                         AppShell / Sidebar / Header / RequireAuth
│   ├── dashboard/
│   ├── teams/
│   ├── projects/
│   │   └── ProjectHeader.jsx           v14：h1 を clamp 化
│   ├── tasks/
│   ├── departments/
│   │   ├── DepartmentFormModal.jsx
│   │   └── DepartmentMembersModal.jsx
│   └── users/
└── pages/                              v14：全 h1 を clamp 化、ヘッダーバーに flexWrap

scripts/                                運用スクリプト一式
public/                                 SPA リダイレクト含む
```

### 5-2. レスポンシブ設計の方針（v14）

**判定基準**：window 幅 < 900px を「コンパクト」とする（`useIsCompact()`）。

**JS 側で切り替えるもの**：
- ボタンの `iconOnly` 化（操作列）
- ヘッダー大ボタンの `size="sm"` 化
- メイン領域の padding（`S.l` → `S.s`）
- サイドバーの初期表示（コンパクト時は閉じた状態でスタート）
- モーダルの padding / `maxWidth: min(width, calc(100vw - margin))`

**CSS 側（メディアクエリ）で切り替えるもの**：
- `body { font-size: 15px }` を < 900px で適用
- `table th/td { padding: 6px 8px !important }` で圧縮

**clamp() で連続的に変化するもの**：
- 全ページ・モーダルの h1：`clamp(1.05rem, 4vw, 1.5rem)` / `clamp(1rem, 3vw, 1.2rem)`
- 適用箇所：DashboardPage / TeamsPage / ProjectsPage / NotificationsPage / ProfilePage / UsersPage / AdminDepartmentsPage / AdminDashboardPage / ProjectHeader / Modal

**flexWrap で折り返すもの**：
- 各ページのヘッダーバー（タイトル + アクション）
- モーダルのフッター（ボタン群）

### 5-3. 部署メンバー管理の派生ロジック（v13）

```js
// その部署のチーム ID
const deptTeamIds = teams.filter(t => t.department_id === dept.id).map(t => t.id);
// その部署のメンバーシップ
const deptMemberships = teamMembers.filter(m => deptTeamIds.includes(m.team_id));
// メンバー（ユーザー単位、重複除去）
const userIds = [...new Set(deptMemberships.map(m => m.user_id))];
```

部署からの除外：
```js
// その部署のすべてのチームから当該ユーザーを外す
for (const team of deptTeams) {
  await removeMember(team.id, userId);
}
```

### 5-4. 自動再読込（v12〜）

全ページ + AppShell で `useReloadOnFocus(reload)` を呼ぶ。タブ切替・フォーカス時に reload。

---

## 6. 機能一覧（v14 時点）

### ✅ 実装済み

- 認証（Appwrite Auth + 招待トークン消化 + パスワード変更）
- ダッシュボード（5 ウィジェット、自動再読込）
- チーム管理（CRUD + メンバーシップ + リーダー権限）
- 案件管理（チーム別グルーピング、検索、フィルター、CRUD、カスケード削除）
- タスク管理（CRUD + 小タスク差分同期 + 進捗率）
- ガント（バードラッグで日程変更、今日線）
- カンバン DnD（カラム間 + 並び替え）
- ファイル（Appwrite Storage 連携）
- 通知（一覧 + 既読化、右上ベルから遷移）
- マイページ（プロフィール編集 + パスワード変更）
- 管理者ダッシュボード（チーム進捗・メンバー負荷・期限超過）
- ユーザー管理(招待・編集（所属含む）・停止・削除)
- 部署管理（CRUD + 部署メンバー管理）
- プロジェクトステータス自動同期
- SPA ルーティング（GitHub Pages 対応）
- 全画面の自動再読込（フォーカス時）
- サイドバー所属部署の実 DB 化
- **ウィンドウ幅に応じた UI 自動レスポンシブ対応（v14）**

### ⏸ 未実装 / 将来拡張

- **プロフィール画像のアップロード（次回最優先）**
  現状は URL テキスト入力。Appwrite Storage 連携でファイル選択 → アップロード → URL 自動設定にしたい
- スケジュール CRUD UI（表示は実装済み、作成/編集/削除モーダル未実装）
- タスクのコメント機能（仕様書フェーズ 2）
- メール通知 / Slack / PWA / CSV エクスポート（仕様書フェーズ 2）
- profiles 削除時の Auth 連動削除

---

## 7. 今回のセッションで行った変更（v14）

### A. ボタンのレスポンシブ化（< 900px で iconOnly モード）

**内容**：操作列の複数ボタン（編集・削除・メンバー等）が狭い画面で崩れていたため、ボタン自体をアイコンのみに切り替える機構を導入。

**詳細**：
- `src/hooks/useIsCompact.js`（新規）：`window.innerWidth < 900` で `true`。`resize` イベントで追従
- `src/components/ui/Button.jsx`：
  - `iconOnly` prop を追加
  - `iconOnly=true` のときアイコンのみ表示 + tooltip（`title` 属性 / `aria-label`）
  - 寸法は `sm` で 32x30、`md` で 38x36 の正方形
  - `children`（テキスト）はホバー時の tooltip / アクセシビリティのための fallback として保持
- `src/pages/admin/UsersPage.jsx`：UserRow の編集 / 削除を `iconOnly` に
- `src/pages/admin/AdminDepartmentsPage.jsx`：DepartmentRow のメンバー / 編集 / 削除を `iconOnly` に
- ヘッダー大ボタン（招待 / 部署作成 / 案件作成 / チーム作成）を `isCompact` 時に `size="sm"` に縮小
- 各テーブルコンテナの `overflow: 'hidden'` を `'auto'` に変更し、最小幅が確保できないときは横スクロール

### B. ボタン以外の UI もレスポンシブ化

**内容**：見出し・モーダル・メイン領域 padding・サイドバー・テーブルセル padding なども自動調整。

**詳細**：
- `src/App.css`：`@media (max-width: 899px)` で
  - `table th, table td { padding: 6px 8px !important }` でセル padding を圧縮
  - `body { font-size: 15px }` で本文サイズを縮小
- `src/components/ui/Modal.jsx`：
  - `isCompact` 時に padding を `S.s/S.m` に圧縮
  - `maxWidth: min(width, calc(100vw - margin))` でビューポート超過を確実に防ぐ
  - タイトル `fontSize: clamp(1rem, 3vw, 1.2rem)`、長い時は省略（ellipsis）
  - フッター `flexWrap: wrap` でボタンが折り返せる
- `src/components/layout/AppShell.jsx`：
  - メイン領域の padding を `isCompact` 時 `S.s` に
  - 起動時に `isCompact` ならサイドバー初期非表示（`useState(!isCompact)`）
- `src/components/projects/ProjectHeader.jsx`、各ページの h1：
  - `fontSize: '1.5rem'` → `clamp(1.05rem, 4vw, 1.5rem)` で連続的に縮小
- 各ページのヘッダーバー（タイトル + アクション）：
  - `flexWrap: 'wrap'` を追加し、狭いときはタイトルとアクションが折り返す

### ⏸ 中断中（次回着手）

- **プロフィール画像を Appwrite Storage へのアップロードに置き換え**
  - 現状の `/profile` の「アバター画像 URL」は URL 直接入力テキスト
  - 次回の実装：
    1. ファイル選択 UI（`<input type="file" accept="image/*">` + ドラッグ&ドロップ）
    2. クライアントで簡易プレビュー
    3. `storage.createFile(BUCKET_ID, ID.unique(), file)` でアップロード
    4. アップロード成功後、`getFileView(BUCKET_ID, fileId)` の URL を `profiles.avatar_url` に保存
    5. 既存の avatar が Storage にあれば差し替え時に旧ファイルを削除
    6. Bucket は既存（`69f1465f0003ebde6dc6`）を流用するか、専用 `avatars` Bucket を新設するかは判断ポイント
    7. ファイルサイズ・拡張子のクライアントバリデーション（5 MB、png/jpg/webp 等）

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | プロフィール画像が URL テキスト入力 | **高（次回）** | Appwrite Storage アップロードに置き換え |
| 2 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 3 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 4 | dummy.js が一部残存 | 低 | 必要時に整理 |

## 9. 解消済みの問題

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | u1 のメールがダミーのまま | v11 |
| ✅ | リロード / 直接 URL アクセスで 404 | v11 |
| ✅ | 全ページの最新情報反映が手動リロード必要 | v12 |
| ✅ | ユーザー管理から所属を変更できなかった | v12 |
| ✅ | 案件削除で配下タスク・スケジュールが孤立 | v12 |
| ✅ | 右上の通知アイコンがクリック不可 | v13 |
| ✅ | サイドバーの所属部署が dummy のまま | v13 |
| ✅ | 部署単位でメンバーを管理できなかった | v13 |
| ✅ | ウィンドウを狭くするとボタン・モーダル・タイトルが崩れた | v14 |

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v14.md と docs/AimZ_spec_v1.6.md を確認してください。次は **プロフィール画像を Appwrite Storage へのアップロードに置き換え** からお願いします。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v12 | 2026-04-29〜05-04 | 設計・実装・PHASE 4-5 完了・運用改善 |
| v13 | 2026-05-04 | 3 件の UI / 運用修正：通知ベルのリンク化、サイドバー所属部署の実 DB 化、部署管理から部署メンバー管理機能（C 案）を追加。仕様書を v1.5 に更新 |
| **v14** | **2026-05-07** | **ウィンドウ幅に応じた UI 自動レスポンシブ対応**。`useIsCompact` フック新設、Button に `iconOnly` prop 追加、Modal をビューポート超過防止、全 h1 を `clamp()` 化、メイン領域 padding 圧縮、ヘッダーバー `flexWrap`、テーブルセル padding 圧縮（CSS）、サイドバー初期非表示（コンパクト時）。仕様書を v1.6 に更新 |
