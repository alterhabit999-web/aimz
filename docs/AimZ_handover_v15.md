# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-07  
**仕様書バージョン**: v1.7  
**引き継ぎ書バージョン**: v15

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB / Storage）+ GitHub Pages  
**現在の状態**：本番稼働中。v15 で以下を実装し、運用開始準備が整った状態：
1. **プロフィール画像のアップロード**（Appwrite Storage 連携、URL 入力欄を撤去）
2. **招待機能の運用機能完成**（履歴一覧 / 再発行 / 取消 / mailto）
3. **クラッシュ時のエラー画面**（ErrorBoundary）と null safety 補強
4. **招待リンクの unauthorized エラー解消**（処理順序見直し + invitations.read 権限調整）

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
| **v15 機能拡張** | **プロフィール画像 Storage 化 / 招待運用機能 / ErrorBoundary / 招待 unauthorized 修正** | ✅ |
| 将来 | スケジュール CRUD UI / コメント機能 / メール通知（Functions） / PWA など | 🔲 |

---

## 3. 構成情報

### Appwrite

| 項目 | 値 |
|------|------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69f144ba0005896bc8c3` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6`（案件ファイル + アバター共用、v15） |
| Web Platform | `localhost` / `alterhabit999-web.github.io` |

### コレクション権限（v15 時点）

| コレクション | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| その他全 12 個 | Role.users() | Role.users() | Role.users() | Role.users() |
| **invitations** | **Role.any()** ⭐ | Role.users() | Role.users() | Role.users() |

> invitations の read だけ未ログインに公開している理由：招待リンクを踏んだ未ログインユーザーがトークン検証できる必要があるため（PHASE 4 例外）。

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
npm run fix:invitations-permissions # invitations.read を Role.any() に（v15）
                                # ※ Console で手動設定済みなら通常は不要
```

### 4-3. 部署メンバー管理（v13）

1. u1（管理者）で `/admin/departments` を開く
2. 部署行の「**メンバー**」ボタンをクリック
3. モーダル上部のフォームでメンバーを追加（ユーザー + チーム + ロール）
4. メンバー一覧の「×」で部署から除外（その部署の全チーム所属を一括解除）

### 4-4. 新メンバー受け入れフロー（v15 で運用機能完成）

1. u1（管理者）で `/admin/users` → 「**ユーザーを招待**」
2. メール + 管理者フラグ + メッセージ入力 → 「招待リンクを発行」
3. **「メーラーで招待を送る」** ボタン → OS のメーラーが起動（宛先・件名・本文が自動入力）
4. 本人が受信したメールのリンクを開く → 氏名 + パスワード入力 → 自動ログイン
5. u1 で `/admin/departments` の「メンバー」から該当部署のチームに加入

### 4-5. 招待履歴の管理（v15 新機能）

`/admin/users` → ヘッダーの「**招待履歴**」ボタン（Mail アイコン）

| アクション | 用途 |
|-----------|------|
| **コピー** | 招待 URL をクリップボードへ |
| **メール** | mailto: で外部メーラーを起動（本文に URL 自動セット） |
| **再発行** | 期限切れ / 紛失時に新トークン発行（旧 URL は無効化、期限 7 日延長） |
| **取消** | 招待を削除（発行済み URL は無効化） |

ステータス別グルーピング：
- 🔵 **未使用（送付可能）**
- 🟡 **期限切れ（要再発行）**
- 🟢 **使用済み**

### 4-6. プロフィール画像のアップロード（v15 新機能）

1. サイドバー「マイページ」 → 「プロフィール編集」
2. 画像領域をクリック / ドラッグ&ドロップで PNG / JPG / JPEG（最大 5 MB）を選択
3. プレビュー確認 → 「保存」
4. アップロード成功 → サイドバーのアバターも自動更新（古いファイルは Storage から自動削除）
5. 「画像を削除」で現在の画像を削除可

### 4-7. レスポンシブ動作確認（v14）

ブラウザの開発者ツール（`Cmd+Shift+M`）で幅を **400px / 600px / 900px** など変更：

- 幅 ≥ 900px：通常の密度・フォントサイズ
- 幅 < 900px：操作ボタンがアイコンのみに、タイトル縮小、テーブル padding 圧縮、サイドバー初期非表示、モーダルがビューポート内に収まる

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v15 時点）

```
src/
├── App.jsx
├── App.css                             v14：レスポンシブ用メディアクエリ
├── styles/tokens.js
├── data/dummy.js                       一部ヘルパーが残存
├── contexts/AuthContext.jsx
├── utils/format.js
├── hooks/
│   ├── useReloadOnFocus.js
│   └── useIsCompact.js
├── api/                                Appwrite アクセス層
│   ├── ...（profiles / departments / teams / projects / tasks / ...）
│   ├── invitations.js                  v15：reissueInvitation / invitationStatus 追加
│   └── avatars.js                      v15 新規
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── AppShell.jsx                v15：ErrorBoundary を <main> に被せる
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── RequireAuth.jsx
│   │   └── ErrorBoundary.jsx           v15 新規
│   ├── dashboard/
│   ├── teams/
│   ├── projects/
│   ├── tasks/
│   ├── departments/
│   │   ├── DepartmentFormModal.jsx
│   │   └── DepartmentMembersModal.jsx
│   └── users/
│       ├── EditUserModal.jsx
│       ├── InviteUserModal.jsx         v15：mailto ボタン追加
│       └── InvitationsModal.jsx        v15 新規
└── pages/
    ├── ProfilePage.jsx                 v15：ProfileEditor を Storage 連携に置換
    └── ...

scripts/
├── ...（setup-appwrite / seed / sync / cleanup ...）
└── fix-invitations-permissions.js     v15 新規

public/                                 SPA リダイレクト含む
```

### 5-2. プロフィール画像のアップロードフロー（v15）

```
[選択]   File を保持、URL.createObjectURL でローカルプレビュー
   ↓
[保存]   storage.createFile(BUCKET, ID.unique(), file)
            ↓
         storage.getFileView(BUCKET, fileId).toString()  → URL 取得
            ↓
         updateProfile(profile.id, { avatar_url: nextUrl })
            ↓
         旧アバターが Storage 由来（bucketId が AVATAR_BUCKET_ID）なら deleteFile
            ↓
         AuthContext.refresh() → サイドバーにも反映
```

`AVATAR_BUCKET_ID = STORAGE_BUCKET_ID`（Free プラン制限のため共用、v15）。  
将来 Appwrite Cloud のプランをアップグレードしたら `avatars` 専用 Bucket に切り替え可能（`src/appwrite.js` の定数を変えるだけ、API 層の interface は変えなくて良い）。

### 5-3. 招待消化フロー（v15 で順序修正）

```
[未ログイン]
1. /invitations/:token にアクセス
2. getInvitationByToken(token)              ← invitations.read = Role.any() 必要
   - 検証：存在 / is_used / expires_at
3. 氏名 + パスワード入力 → 送信
4. account.create(userId, email, password, name)
5. login(email, password)                   ← セッション確立（先に！）
[ログイン後]
6. createProfile({ userId, full_name, email, is_admin })  ← profiles.create = users
7. markInvitationUsed(invitation.id)         ← invitations.update = users
8. AuthContext.refresh()                     ← profiles の is_admin 等を反映
9. /dashboard へ
```

各ステップに `phase` 名を付けて、エラー時にどこで失敗したか可視化する。

### 5-4. ErrorBoundary（v15）

`src/components/layout/ErrorBoundary.jsx` を `AppShell` の `<main>` に被せる。  
クラッシュ時：白画面ではなく**エラー詳細 + 再読込ボタン + トップに戻るボタン**を表示。  
`details` で `error.message + stack` を展開可能（管理者へのバグレポートが取りやすくなる）。

### 5-5. 部署メンバー管理の派生ロジック（v13）

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

### 5-6. 自動再読込（v12〜）

全ページ + AppShell で `useReloadOnFocus(reload)` を呼ぶ。タブ切替・フォーカス時に reload。

---

## 6. 機能一覧（v15 時点）

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
- ユーザー管理（招待・編集（所属含む）・停止・削除）
- 部署管理（CRUD + 部署メンバー管理）
- プロジェクトステータス自動同期
- SPA ルーティング（GitHub Pages 対応）
- 全画面の自動再読込（フォーカス時）
- サイドバー所属部署の実 DB 化
- ウィンドウ幅に応じた UI 自動レスポンシブ対応
- **プロフィール画像のアップロード（v15）**：Storage 連携、ドラッグ&ドロップ、5MB / PNG・JPG・JPEG、古いファイル自動削除
- **招待機能の運用機能（v15）**：履歴一覧 / コピー / mailto / 再発行 / 取消 / ステータス（未使用 / 期限切れ / 使用済み）
- **クラッシュ時のエラー画面（v15）**：ErrorBoundary で白画面回避

### ⏸ 未実装 / 将来拡張

- スケジュール CRUD UI（表示は実装済み、作成/編集/削除モーダル未実装）
- タスクのコメント機能（仕様書フェーズ 2）
- **Appwrite Functions によるメール自動送信**（現状は mailto で外部メーラー起動）
- Slack 通知連携 / PWA 化 / CSV エクスポート（仕様書フェーズ 2）
- profiles 削除時の Auth 連動削除
- avatars 専用 Bucket への切替（プランアップグレード後）

---

## 7. 今回のセッションで行った変更（v15）

### A. プロフィール画像を Appwrite Storage アップロードに置き換え

**内容**：マイページのアバター URL テキスト入力を撤去し、ファイル選択 + Storage アップロードに統一。

**詳細**：
- `src/api/avatars.js`（新規）：
  * `uploadAvatar(file)`：5MB / PNG・JPG・JPEG をクライアント側でバリデーション → `storage.createFile` → URL 取得
  * `deleteAvatarByUrl(url)`：Storage 由来 URL からファイル ID を抽出して削除（外部 URL は触らない）
  * `isStorageAvatar(url)` / `extractFileId(url)`：URL 解析ヘルパー
- `src/appwrite.js`：`AVATAR_BUCKET_ID = STORAGE_BUCKET_ID` を export（共用）
- `src/api/index.js`：avatars を export
- `src/pages/ProfilePage.jsx` の `ProfileEditor`：
  * URL 入力欄を撤去（Q2=A）
  * ドロップゾーン UI（クリック / ドラッグ&ドロップ）+ プレビュー
  * 「画像を削除」「選択をキャンセル」「削除を取り消す」アクション
  * 保存時に古いアバター（Storage 由来）を自動削除して孤立を防ぐ
- `scripts/setup-appwrite.js`：`ensureBucket` を汎用化（将来の avatars 専用 Bucket への切替に備え）

**注意**：Appwrite Cloud Free プランの Bucket 上限のため、現状は案件ファイル用と共用。
許可拡張子は **PNG / JPG / JPEG**（既存 Bucket が webp 不許可のため）。

### B. 招待機能の運用機能を完成

**内容**：招待リンクを発行するだけでなく、その後の運用（送付・取消・再発行）が一通り可能に。

**詳細**：
- `src/components/users/InvitationsModal.jsx`（新規）：
  * 招待履歴一覧（未使用 / 期限切れ / 使用済み の 3 セクション）
  * 各招待行で：URL コピー / mailto: 起動 / 再発行 / 取消
  * mailto: 本文には招待 URL + 招待メッセージ + 期限 を自動セット
- `src/api/invitations.js`：
  * `reissueInvitation(id, { expiresInDays })`：トークン再発行
  * `invitationStatus(invitation)`：`'active' | 'expired' | 'used'` を返す
- `src/components/users/InviteUserModal.jsx`：発行直後画面に「メーラーで招待を送る」ボタン追加
- `src/pages/admin/UsersPage.jsx`：ヘッダーに「招待履歴」ボタン追加（Mail アイコン）

### C. 招待リンクで「The current user is not authorized」エラーを解消

**問題**：PHASE 4 で全コレクション権限を `Role.users()` に絞ったため、未ログインユーザーが招待リンクを踏むと `invitations.read` で弾かれていた。

**原因**：
1. `invitations.read` が `Role.users()` だった（未ログインで弾かれる）
2. `InvitationAcceptPage` の処理順序が `account.create` → `createProfile`（未ログイン状態）→ ... と、ログイン前に profiles.create を呼んでいた

**修正内容**：
1. **Appwrite Console で invitations の Read を `Role.any()` に開放**（手動設定）
   - 補助スクリプト：`scripts/fix-invitations-permissions.js`（API キーに `collections.read/write` があれば実行可能）
2. **`InvitationAcceptPage` の処理順序を変更**：
   - 旧：`account.create` → `createProfile` → `markInvitationUsed` → `login`
   - 新：`account.create` → **`login`** → `createProfile` → `markInvitationUsed` → `refresh`
3. エラーメッセージを `phase` 別に具体化（「権限エラー（プロフィール作成）：…」など）

### D. ユーザー管理画面でリロードすると白くなる問題を修正

**問題**：`/admin/users` で `Cmd+R` リロードすると画面が真っ白になることがあった。

**原因**：`u.full_name` が null の profiles レコードがあった場合、フィルタ処理の `u.full_name.toLowerCase()` で TypeError → React がキャッチできず白画面に。

**修正内容**：
- `src/pages/admin/UsersPage.jsx`：`(u.full_name || '').toLowerCase()` で null safety
- `src/components/teams/MembersTable.jsx`：同様の修正
- `src/components/layout/ErrorBoundary.jsx`（新規）：
  * 子のクラッシュを `getDerivedStateFromError` で捕捉
  * 白画面の代わりに「画面の表示中に問題が発生しました」+ エラー詳細（`details` で展開）+ 再読込 / トップに戻るボタンを表示
- `src/components/layout/AppShell.jsx`：`<main>` の `<Outlet />` を `<ErrorBoundary>` で wrap

これにより以後どこかでクラッシュしても白画面にならず、原因が画面上で確認できる。

### ⏸ 中断中（次回着手）

- 特になし（招待機能は基本動作 + 運用機能まで完成）

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` を組み込む |
| 3 | 招待 → アカウント作成の途中失敗時、Auth ユーザーが孤立する可能性 | 中 | 失敗時のクリーンアップ or 管理画面で孤立検出 |
| 4 | dummy.js が一部残存 | 低 | 必要時に整理 |
| 5 | avatars 専用 Bucket は未分離（Free プラン上限） | 低 | プランアップ時に `AVATAR_BUCKET_ID` を切替 |
| 6 | メール自動送信は未対応（mailto で外部メーラー起動） | 中 | Appwrite Functions + SMTP 設定で自動化可能（別フェーズ） |

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

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v15.md と docs/AimZ_spec_v1.7.md を確認してください。〜」

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v12 | 2026-04-29〜05-04 | 設計・実装・PHASE 4-5 完了・運用改善 |
| v13 | 2026-05-04 | 通知ベル / サイドバー所属部署 / 部署メンバー管理（C 案）。仕様書 v1.5 |
| v14 | 2026-05-07 | ウィンドウ幅に応じた UI 自動レスポンシブ対応。仕様書 v1.6 |
| **v15** | **2026-05-07** | **プロフィール画像 Storage アップロード**、**招待機能の運用機能完成**（履歴一覧 / 再発行 / 取消 / mailto）、**ErrorBoundary 導入**、**招待 unauthorized エラー解消**（処理順序見直し + invitations.read を Role.any() に開放）、**null safety 補強**（白画面回避）。仕様書 v1.7 |
