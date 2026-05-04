# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-04  
**仕様書バージョン**: v1.5  
**引き継ぎ書バージョン**: v13

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：本番稼働中。v13 で UI / 運用の細部を強化：通知ベルの遷移、サイドバー所属部署の実 DB 化、部署メンバー管理機能（C 案）。

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. v13 で追加・修正された内容

### 2-1. 右上の通知アイコンをリンク化（修正点 1）

**問題**：Header の Bell アイコンがクリック不可（ただの `<div>`）。

**対応**：
- `src/components/layout/Header.jsx`
- Bell を `<NavLink to="/notifications">` に変更
- アクティブ時は `accentLight` 背景で強調
- ホバー時は `bgSub` 背景

### 2-2. サイドバー上部の所属部署を実 DB 化（修正点 2）

**問題**：Sidebar が `dummy.myDepartments(user?.id)` を呼んでいたため、実 DB の最新所属が反映されなかった。

**対応**：
- `src/components/layout/AppShell.jsx`：
  - `listTeams / listDepartments / listAllTeamMembers / listNotificationsForUser` を `Promise.all` で取得
  - 自分の所属部署 + 未読通知数を派生計算して、Sidebar / Header に props で渡す
  - `useReloadOnFocus(reload)` でフォーカス時に自動最新化
- `src/components/layout/Sidebar.jsx`：
  - dummy 依存を撤去し props 駆動（`departments` を受け取る）

### 2-3. 部署メンバー管理機能（修正点 3 / C 案）

**設計判断**：仕様書 v1.4 の組織階層モデル（部署 → チーム → メンバー）は維持。
部署メンバーシップは独立して持たず、「その部署のチームに所属している全ユーザー」と定義。

**新規追加**：`src/components/departments/DepartmentMembersModal.jsx`

| 機能 | 詳細 |
|------|------|
| メンバー一覧 | 当該部署のチームに所属する全ユーザー（重複除去）。所属チーム + ロールを表示 |
| メンバー追加 | ユーザー + 加入先チーム + ロール（メンバー/リーダー）を選択 → `team_members` に追加 |
| 部署から除外 | 確認ダイアログ → 当該部署のすべてのチーム所属を一括解除 |

**配置**：`/admin/departments` の各部署行に「**メンバー**」ボタンを追加。

**追加表示**：テーブルに「メンバー数」列を追加（`teams + team_members` から派生計算）。

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

### 4-3. 部署メンバー管理（v13 新機能）

1. u1（管理者）で `/admin/departments` を開く
2. 部署行の「**メンバー**」ボタンをクリック
3. モーダル上部のフォームでメンバーを追加（ユーザー + チーム + ロール）
4. メンバー一覧の「×」で部署から除外（その部署の全チーム所属を一括解除）

### 4-4. 新メンバー受け入れフロー

1. u1（管理者）で `/admin/users` → 招待リンク発行
2. リンクを本人に共有
3. 本人がリンクから氏名 + パスワード設定 → 自動ログイン
4. **u1 で `/admin/departments` の「メンバー」から該当部署のチームに加入**（v13 推奨フロー）
   - もしくは `/admin/users` の編集モーダルから所属チームを設定

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v13 時点）

```
src/
├── App.jsx
├── styles/tokens.js
├── data/dummy.js                       一部ヘルパーが残存
├── contexts/AuthContext.jsx
├── utils/format.js
├── hooks/useReloadOnFocus.js
├── api/                                Appwrite アクセス層
├── components/
│   ├── ui/
│   ├── layout/                         AppShell / Sidebar / Header / RequireAuth
│   ├── dashboard/
│   ├── teams/
│   ├── projects/
│   ├── tasks/
│   ├── departments/
│   │   ├── DepartmentFormModal.jsx
│   │   └── DepartmentMembersModal.jsx  v13 新規
│   └── users/
└── pages/

scripts/                                運用スクリプト一式
public/                                 SPA リダイレクト含む
```

### 5-2. 部署メンバー管理の派生ロジック

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

### 5-3. 通知ベルの遷移

`Header.jsx` で `<NavLink to="/notifications">` を使用。アクティブ判定で背景色変更。`unreadCount` を AppShell から props で受け取る。

### 5-4. 自動再読込（v12〜）

全ページ + AppShell で `useReloadOnFocus(reload)` を呼ぶ。タブ切替・フォーカス時に reload。

---

## 6. 機能一覧（v13 時点）

### ✅ 実装済み

- 認証（Appwrite Auth + 招待トークン消化 + パスワード変更）
- ダッシュボード（5 ウィジェット、自動再読込）
- チーム管理（CRUD + メンバーシップ + リーダー権限）
- 案件管理（チーム別グルーピング、検索、フィルター、CRUD、カスケード削除）
- タスク管理（CRUD + 小タスク差分同期 + 進捗率）
- ガント（バードラッグで日程変更、今日線）
- カンバン DnD（カラム間 + 並び替え）
- ファイル（Appwrite Storage 連携）
- 通知（一覧 + 既読化、**右上ベルから遷移 v13**）
- マイページ（プロフィール編集 + パスワード変更）
- 管理者ダッシュボード（チーム進捗・メンバー負荷・期限超過）
- ユーザー管理（招待・編集（**所属含む**）・停止・削除）
- 部署管理（CRUD + **部署メンバー管理 v13**）
- プロジェクトステータス自動同期
- SPA ルーティング（GitHub Pages 対応）
- 全画面の自動再読込（フォーカス時）
- **サイドバー所属部署の実 DB 化（v13）**

### ⏸ 未実装 / 将来拡張

- スケジュール CRUD UI（表示は実装済み、作成/編集/削除モーダル未実装）
- タスクのコメント機能（仕様書フェーズ 2）
- メール通知 / Slack / PWA / CSV エクスポート（仕様書フェーズ 2）
- profiles 削除時の Auth 連動削除

---

## 7. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 3 | dummy.js が一部残存 | 低 | 必要時に整理 |

## 8. 解消済みの問題

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

---

## 9. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v13.md と docs/AimZ_spec_v1.5.md を確認して、〜について作業してください。」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v12 | 2026-04-29〜05-04 | 設計・実装・PHASE 4-5 完了・運用改善 |
| **v13** | **2026-05-04** | **3 件の UI / 運用修正**：通知ベルのリンク化、サイドバー所属部署の実 DB 化、部署管理から部署メンバー管理機能（C 案）を追加。仕様書を v1.5 に更新。 |
