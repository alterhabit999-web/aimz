# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-09  
**仕様書バージョン**: v1.8  
**引き継ぎ書バージョン**: v16

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：本番稼働中。v16 で以下を実施し、v15 で残存していた不具合を修正した状態：

1. **チーム追加バグの修正**（`team_members.documentId` の 36 字制限超過を解消）
2. **サイドバーのメニュー順を再調整**（通知を最上段に移動）
3. **`.env` 運用の確立**（公開値は git 管理、秘匿情報は `.env.local`）
4. **favicon 404 ノイズの抑制**
5. **プロフィール画像アップロード修正は中断**（v15 オリジナルに巻き戻し済み、次セッションで再着手）

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
| v14 UI 改善 | ウィンドウ幅に応じた UI 自動レスポンシブ対応 | ✅ |
| v15 機能拡張 | プロフィール画像 Storage 化 / 招待運用機能 / ErrorBoundary / 招待 unauthorized 修正 | ✅ |
| **v16 不具合修正** | **チーム追加 36 字超過解消 / サイドバー再配置 / .env 運用確立 / favicon 抑制** | ✅ |
| 中断中 | **プロフィール画像のクリック選択／ドロップ反映バグ**（v15 オリジナルに巻き戻し済み） | ⏸ 次セッションで再着手 |
| 将来 | スケジュール CRUD UI / コメント機能 / メール通知（Functions） / PWA など | 🔲 |

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

### コレクション権限（v16 時点・v15 から変更なし）

| コレクション | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| その他全 12 個 | Role.users() | Role.users() | Role.users() | Role.users() |
| **invitations** | **Role.any()** ⭐ | Role.users() | Role.users() | Role.users() |

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

### 環境変数の運用（v16 で確立）

| ファイル | 内容 | git 管理 |
|---|---|---|
| `.env` | `REACT_APP_*`（Project ID / Endpoint / Database ID / Bucket ID） | ✅ 管理する |
| `.env.local` | `APPWRITE_API_KEY`（setup / seed / sync 系の管理キー） | ❌ `.gitignore` |

`scripts/*.js` は冒頭で `dotenv.config({ path: '.env.local' })` → `dotenv.config()` の順に呼び、両方のファイルから読み込む。

> **worktree で作業するときの注意**：`.env.local` は git で運ばれないため、worktree を新規に作って setup-appwrite 等を回す必要があるときは `cp ../../.env.local .` を最初に実行すること。

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
npm run fix:invitations-permissions # invitations.read を Role.any() に
```

### 4-3. 部署メンバー管理（v13）

1. u1（管理者）で `/admin/departments` を開く
2. 部署行の「メンバー」ボタンをクリック
3. モーダル上部のフォームでメンバーを追加（ユーザー + チーム + ロール）
4. メンバー一覧の「×」で部署から除外（その部署の全チーム所属を一括解除）

### 4-4. 新メンバー受け入れフロー（v15）

1. u1（管理者）で `/admin/users` → 「ユーザーを招待」
2. メール + 管理者フラグ + メッセージ入力 → 「招待リンクを発行」
3. 「メーラーで招待を送る」ボタン → OS のメーラーが起動（宛先・件名・本文が自動入力）
4. 本人が受信したメールのリンクを開く → 氏名 + パスワード入力 → 自動ログイン
5. u1 で `/admin/departments` の「メンバー」から該当部署のチームに加入

### 4-5. 招待履歴の管理（v15）

`/admin/users` → ヘッダーの「招待履歴」ボタン（Mail アイコン）

| アクション | 用途 |
|-----------|------|
| コピー | 招待 URL をクリップボードへ |
| メール | mailto: で外部メーラーを起動 |
| 再発行 | 期限切れ / 紛失時に新トークン発行 |
| 取消 | 招待を削除 |

### 4-6. プロフィール画像のアップロード（v15・v16 で再着手予定）

> ⚠️ **v16 時点で「クリック選択 / ドロップが特定環境で反映されない」既知バグあり。**
> 次セッションで再着手するまでは、機能上は v15 オリジナル実装のまま稼働。
> 詳細は §7 と §8 を参照。

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v16 時点・v15 から構造変更なし）

```
src/
├── App.jsx
├── App.css
├── styles/tokens.js
├── data/dummy.js
├── contexts/AuthContext.jsx
├── utils/format.js
├── hooks/
│   ├── useReloadOnFocus.js
│   └── useIsCompact.js
├── api/
│   ├── ...（profiles / departments / teams / projects / tasks / ...）
│   ├── invitations.js
│   ├── avatars.js
│   └── team-members.js                v16：docId を ID.unique() で発行 / 既存検索はクエリ
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── AppShell.jsx
│   │   ├── Sidebar.jsx                v16：通知をナビ最上段に移動
│   │   ├── Header.jsx
│   │   ├── RequireAuth.jsx
│   │   └── ErrorBoundary.jsx
│   ├── dashboard/ teams/ projects/ tasks/ departments/ users/
└── pages/
    ├── ProfilePage.jsx                v15 オリジナルに巻き戻し（v16 で着手中断）
    └── ...

scripts/                                 v16：全スクリプトで .env.local も読むよう修正
├── ...（setup-appwrite / seed / sync / cleanup ...）
└── fix-invitations-permissions.js

public/
├── index.html                          v16：favicon 404 抑止用 <link rel="icon" href="data:,">
├── 404.html
└── （favicon.ico は意図的に未配置）
```

### 5-2. team_members の docId 設計（v16 で変更）

```js
// v15 まで（合成キー）
const id = `${teamId}_${userId}`;       // ❌ Appwrite Auth 生成 ID と組み合わせると 36 字超過
await databases.createDocument(DB_ID, COL, id, { team_id, user_id, role });

// v16 から（ID.unique() + クエリ）
async function findMembership(teamId, userId) {
  const res = await databases.listDocuments(DB_ID, COL, [
    Query.equal('team_id', teamId),
    Query.equal('user_id', userId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}
// addMember / removeMember / updateRole は findMembership の結果を使って $id でアクセス
```

旧形式の合成 docId を持つ既存ドキュメント（u1〜u5 のシード分など）も、`(team_id, user_id)` クエリで普通に発見できるためそのまま動作する。

### 5-3. サイドバー構成（v16 で変更）

```
┌──────────────────────────┐
│  📊 AimZ                  │
│  🏢 営業部 / 開発部         │
├──────────────────────────┤
│  ▸ 通知                    │ ← v16：ナビ最上段に独立配置
│                           │
│  メニュー                  │
│  ▸ ダッシュボード            │
│  ▸ 案件一覧                 │
│  ▸ チーム                   │
│                           │
│  管理者（Admin のみ）       │
│  ▸ 管理者ダッシュボード      │
│  ▸ ユーザー管理              │
│  ▸ 部署管理                  │
│                           │
│  アカウント                  │
│  ▸ マイページ                │
└──────────────────────────┘
```

### 5-4. 招待消化フロー（v15）・ErrorBoundary（v15）

v15 から変更なし。詳細は v15 引き継ぎ書を参照。

---

## 6. 機能一覧（v16 時点）

### ✅ 実装済み

- 認証（Appwrite Auth + 招待トークン消化 + パスワード変更）
- ダッシュボード（5 ウィジェット、自動再読込）
- チーム管理（CRUD + メンバーシップ + リーダー権限）
- 案件管理（チーム別グルーピング、検索、フィルター、CRUD、カスケード削除）
- タスク管理（CRUD + 小タスク差分同期 + 進捗率）
- ガント / カンバン DnD
- ファイル（Appwrite Storage）
- 通知（一覧 + 既読化、右上ベル + サイドバー最上段から遷移）
- マイページ（プロフィール編集 + パスワード変更）
- 管理者ダッシュボード
- ユーザー管理（招待・編集（所属含む）・停止・削除）
- 部署管理（CRUD + 部署メンバー管理）
- プロジェクトステータス自動同期
- SPA ルーティング（GitHub Pages）
- 全画面の自動再読込
- ウィンドウ幅レスポンシブ対応
- プロフィール画像 Storage 連携（v15、ドラッグ&ドロップ・5MB・PNG/JPG/JPEG）
- 招待運用機能（履歴 / 再発行 / 取消 / mailto）
- ErrorBoundary
- **チーム追加（v16 で 36 字超過バグ修正）**
- **サイドバー：通知最上段（v16）**

### ⏸ 未実装 / 中断中

- **プロフィール画像のクリック選択／ドロップ反映バグ**（次セッションで再着手）
- スケジュール CRUD UI（表示は実装済み、作成/編集/削除モーダル未実装）
- タスクのコメント機能
- Appwrite Functions によるメール自動送信
- Slack 通知連携 / PWA / CSV エクスポート
- profiles 削除時の Auth 連動削除
- avatars 専用 Bucket への切替（プランアップグレード後）

---

## 7. 今回のセッションで行った変更（v16）

### A. チーム追加バグ修正（`Invalid documentId param: 36 chars` エラー解消）

**問題**：新規ユーザーをチームに追加しようとすると次のエラーで失敗。

```
- [ ] 更新に失敗しました：Invalid `documentId` param: Parameter must contain at most 36 chars.
  Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore.
```

**原因**：`src/api/team-members.js` で documentId を `${teamId}_${userId}` の合成キーで発行していたが、
Appwrite Auth の userId が長く（最大 36 字）、teamId と連結すると 36 字制限を超過する。
シードユーザー `u1`〜`u5` のときは短かったため発覚していなかった。

**修正**：
- `documentId` を `ID.unique()` で発行
- 一意性は `(team_id, user_id)` のクエリで担保
- `addMember` / `removeMember` / `updateRole` は `findMembership(teamId, userId)` で既存ドキュメントを検索して `$id` を取得
- 旧形式の合成 docId を持つ既存ドキュメント（シード等）もそのまま動作

**ファイル**：[src/api/team-members.js](../src/api/team-members.js)

### B. サイドバーのナビ順を再調整

**変更**：通知をナビ最上段に移動（メニュー見出しの上）。「メニュー」見出しの下にダッシュボード／案件一覧／チームを配置。

**理由**：通知は他の業務メニューより未読対応の優先度が高いため、最上段で目に入る位置に独立配置する。

**ファイル**：[src/components/layout/Sidebar.jsx](../src/components/layout/Sidebar.jsx)

### C. `.env` 運用の確立

**問題**：worktree で作業中、worktree 側に `.env` が無いため `REACT_APP_APPWRITE_ENDPOINT` がデフォルトの `cloud.appwrite.io` にフォールバックして CORS エラーが発生した（実際のリージョンは `sgp.cloud.appwrite.io`）。

**対応**：
- `.env`（フロント公開値のみ）を git 管理対象に変更
- `APPWRITE_API_KEY` は新設の `.env.local` に分離（`.gitignore` 対象）
- `scripts/*.js` で `dotenv.config({ path: '.env.local' })` → `dotenv.config()` の順に呼んで両方読み込む

**ファイル**：
- [.env](../.env)（git 管理）
- [.env.local](../.env.local)（gitignore、各端末で個別管理）
- [.gitignore](../.gitignore)
- `scripts/setup-appwrite.js` ほか 5 本

### D. favicon 404 ノイズの抑止

**変更**：`public/index.html` に `<link rel="icon" href="data:," />` を追加し、ブラウザが `/favicon.ico` を取りに行って 404 になる Console ノイズを抑止。

**ファイル**：[public/index.html](../public/index.html)

### ⏸ 中断中：プロフィール画像のクリック選択／ドロップ反映バグ

**症状**：マイページのプロフィール画像エリアで、ファイルピッカーは開くがファイルを選択しても画面に反映されない。
ドラッグ&ドロップも特定の試行で反映されないことが報告された。

**試行した修正（すべて失敗）**：
1. ファイル拡張子ベースのバリデーションに緩和（`AVATAR_ACCEPT.includes(file.type)` の MIME チェックを補完） → 改善せず
2. dropzone を `<div onClick>` から `<label>` に変更（input をラップ） → 改善せず
3. input を label の外に出し `htmlFor` で接続（`display: none`） → 改善せず
4. input を sr-only スタイル（`position:absolute; clip:rect(0,0,0,0)`）に変更 → 一時的にドロップだけ動作（クリックは依然 NG）
5. input の `onClick={value=''}` を削除し `onChange` 内で value クリア → 全部動かなくなる
6. 診断 console.log を仕込んで現象を観測 → イベント自体が発火していない可能性

**仮説**：
- React の onChange ハンドラがバインドされていない？
- 特定ブラウザ（不明・要ヒアリング）で `display:none` の file input は label htmlFor 経由でも picker 起動しない？
- ファイルダイアログのキャンセル扱いになっている？

**現状**：v15 オリジナル実装に巻き戻し済み（commit `5b7506d`）。
ユーザー操作上は v15 と同じ振る舞い。次セッションで以下から再着手する：

1. ユーザーのブラウザ名・バージョンを聞く（**ここが最大の手掛かり**）
2. シークレットウィンドウで再現するか確認（拡張機能要因の切り分け）
3. F12 Console で `document.querySelector('#avatar-file-input')` を実行して DOM を直接確認
4. `document.querySelector('#avatar-file-input').click()` を Console から直接実行 → 反応するか

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | **プロフィール画像のクリック選択／ドロップ反映バグ**（v15 で混入、v16 では未解決） | **高** | §7 中断項参照。次セッションで再着手 |
| 2 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 3 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 4 | 招待 → アカウント作成の途中失敗時、Auth ユーザーが孤立する可能性 | 中 | 失敗時のクリーンアップ or 管理画面で孤立検出 |
| 5 | dummy.js が一部残存 | 低 | 必要時に整理 |
| 6 | avatars 専用 Bucket は未分離（Free プラン上限） | 低 | プランアップ時に `AVATAR_BUCKET_ID` を切替 |
| 7 | メール自動送信は未対応（mailto で外部メーラー起動） | 中 | Appwrite Functions + SMTP（別フェーズ） |

---

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
| ✅ | プロフィール画像が URL テキスト入力 | v15 |
| ✅ | 招待リンクで unauthorized エラー | v15 |
| ✅ | ユーザー管理画面でリロードすると白画面 | v15 |
| ✅ | 招待後の運用フロー（履歴・取消・再発行・mailto）が無かった | v15 |
| ✅ | **新規ユーザーをチームに追加すると 36 字 docId エラーで失敗** | **v16** |
| ✅ | **サイドバーで通知が下に埋もれて気付きにくい** | **v16** |
| ✅ | **worktree でビルドするとエンドポイントが間違って CORS エラー** | **v16** |
| ✅ | **favicon.ico の 404 で Console が汚れる** | **v16** |

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v16.md と docs/AimZ_spec_v1.8.md を確認してください。
> 中断中のプロフィール画像クリック選択／ドロップ反映バグから再着手します。
> まずブラウザ名とバージョン、シークレットウィンドウでの再現可否を確認させてください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v12 | 2026-04-29〜05-04 | 設計・実装・PHASE 4-5 完了・運用改善 |
| v13 | 2026-05-04 | 通知ベル / サイドバー所属部署 / 部署メンバー管理。仕様書 v1.5 |
| v14 | 2026-05-07 | ウィンドウ幅レスポンシブ対応。仕様書 v1.6 |
| v15 | 2026-05-07 | プロフィール画像 Storage アップロード / 招待運用機能完成 / ErrorBoundary / 招待 unauthorized 修正。仕様書 v1.7 |
| **v16** | **2026-05-09** | **チーム追加 36 字 docId 超過解消 / サイドバー通知最上段化 / `.env` 運用確立（公開値のみ git 管理） / favicon 404 抑止。プロフィール画像のクリック選択／ドロップ反映バグは中断（v15 オリジナルに巻き戻し）。仕様書 v1.8** |
