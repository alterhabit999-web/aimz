# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-09  
**仕様書バージョン**: v2.0  
**引き継ぎ書バージョン**: v18

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB）+ GitHub Pages  
**現在の状態**：本番稼働中。v18 で **v15〜v17 で残存していた「アバター画像が反映されない」バグを真因から解消**し、
あわせてコードレビュー指摘事項（潜在的な docId 36 字超過リスク・サイレント failure・dummy.js 残骸）を清掃した状態：

1. **プロフィール画像を base64 data URI 方式に再設計**（Storage アップロードを廃止）
2. **自動再読込の真因バグを修正**：初回ロードのみフルローディング、以降はバックグラウンド更新
3. **`project_assignees` / `schedule_participants` の docId を `ID.unique()` に統一**（合成キーの 36 字超過リスク回避）
4. **dummy.js を撤去**（PHASE 4 完了後に未使用化していた 444 行のダミーデータ）
5. **サイレント catch にログを追加**（`catch (_) {}` の握り潰しを可視化）

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
| v11〜v15 | 運用改善・UI 改善・プロフィール画像（v15）・招待運用機能 / ErrorBoundary | ✅ |
| v16 不具合修正 | チーム追加 36 字超過解消 / サイドバー再配置 / .env 運用確立 / favicon 抑制 | ✅ |
| v17 機能追加 | マイタスク / マイスケジュール / 案件未設定タスク / 案件コメント / アバター→マイページ / IME ガード | ✅ |
| **v18 内部品質 + 真因修正** | **プロフィール画像 base64 化・useReloadOnFocus 真因修正・docId 統一・dummy.js 撤去** | ✅ |
| 中断中 | なし | — |
| 将来 | スケジュール CRUD UI / Document-level Security / Appwrite Functions メール通知 / PWA など | 🔲 |

---

## 3. 構成情報

### Appwrite

| 項目 | 値 |
|------|------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69f144ba0005896bc8c3` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6`（**案件ファイル専用**、v18 でアバターは Storage から完全離脱） |
| Web Platform | `localhost` / `alterhabit999-web.github.io` |
| コレクション数 | 14（v17 で `comments` 追加） |

### コレクション一覧（v18 時点・v17 から構造変更なし）

`profiles` / `departments` / `teams` / `team_members` / `projects` / `project_assignees` /
`tasks` / `subtasks` / `schedules` / `schedule_participants` / `project_files` /
`notifications` / `invitations` / `comments`

### 既存属性の変更（v18）

| コレクション | 属性 | 変更 |
|---|---|---|
| **profiles** | `avatar_url` | size: 500 → **200000**（base64 data URI を直接保存） |

`npm run migrate:avatar-url-size` で実行済み。

### docId 戦略（v18 で統一完了）

中間テーブルはすべて `ID.unique()` で発行し、一意性は属性クエリで担保する方針に統一：

| コレクション | v17 まで | v18 |
|---|---|---|
| `team_members` | ID.unique()（v16 で対応済） | （変更なし） |
| **`project_assignees`** | **合成キー `${projectId}__${userId}`** | **ID.unique()** |
| **`schedule_participants`** | **合成キー `${scheduleId}__${userId}`** | **ID.unique()** |

旧形式の合成 docId を持つ既存ドキュメントもクエリで発見できるためゼロダウンタイム移行。

### 環境変数の運用（v16 で確立）

| ファイル | 内容 | git 管理 |
|---|---|---|
| `.env` | `REACT_APP_*` | ✅ |
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
npm run setup:appwrite                 # スキーマ + Bucket を冪等同期
npm run migrate:task-project-optional  # tasks.project_id を required=false に切替（実行済み）
npm run migrate:avatar-url-size        # profiles.avatar_url の size を 200000 に拡張（実行済み、v18 新規）
npm run seed:appwrite                  # ダミーデータ全投入
npm run seed:auth-users                # u2〜u5 を再作成 / パスワードリセット
npm run sync:profile-emails            # Auth のメールを profiles に同期
npm run cleanup:orphans                # 孤立データの検出（ドライラン）
npm run fix:invitations-permissions    # invitations.read を Role.any() に
```

### 4-3〜4-8. 各種運用フロー

部署メンバー管理 / 新メンバー受け入れ / 招待履歴 / マイタスク・マイスケジュール / コメント — **v17 から変更なし**。

### 4-9. プロフィール画像（v18 で再設計）

1. サイドバー「マイページ」 → 「プロフィール編集」
2. 「画像を選択」ボタン or ドロップゾーンに PNG / JPG / JPEG（5MB 以下）をドラッグ&ドロップ
3. 自動的に **256×256 にリサイズ + JPEG 化** → プレビュー表示
4. 「保存する」 → `profiles.avatar_url` に **base64 data URI** として保存（実測 15〜30KB）
5. サイドバー / ヘッダーのアバターも自動更新

旧 v15〜v17 で Storage URL を保存していた既存レコードは `<img src="...">` でそのまま表示できる（互換）。

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v18 時点の差分）

```
src/
├── api/
│   ├── ...
│   ├── project-assignees.js          v18：docId を ID.unique() に統一
│   ├── schedule-participants.js      v18：docId を ID.unique() に統一
│   ├── comments.js                   v17 新規（カスケード削除のサイレント catch をログ化）
│   ├── subtasks.js                   v18：サイレント catch をログ化
│   └── （avatars.js は v18 で削除）
├── appwrite.js                        v18：AVATAR_BUCKET_ID 撤去
├── pages/
│   └── ProfilePage.jsx               v18：reload を初回フル / 以降バックグラウンド化、ProfileEditor を base64 方式に
├── utils/
│   └── avatarImage.js                v18 新規（pickImageFile / processImageToDataUri / validateImageFile）
└── components/
    ├── ...
    └── departments/
        └── DepartmentMembersModal.jsx  v18：サイレント catch をログ化

scripts/
├── ...
├── schema.js                          v18：profiles.avatar_url size 200000、comments を含む 14 コレクション
└── expand-avatar-url-size.js         v18 新規（avatar_url を size=200000 に拡張するワンショット）

（src/data/dummy.js は v18 で削除、src/data ディレクトリも空のため削除）
```

### 5-2. プロフィール画像の保存フロー（v18）

```
[ファイル選択 or ドロップ]
       ↓
   ingestFile(file)
       ↓
   validateImageFile：拡張子 + サイズ（5MB 上限）
       ↓
   processImageToDataUri：
     - new Image()  + URL.createObjectURL で読み込み
     - canvas（256×256）に短辺基準センタークロップで描画
     - imageSmoothingQuality: 'high'
     - canvas.toDataURL('image/jpeg', 0.85)
   → "data:image/jpeg;base64,..." (15〜30KB)
       ↓
   setPendingDataUri（プレビュー）
       ↓
[保存ボタン]
       ↓
   updateProfile(id, { avatar_url: dataUri })
       ↓
   AuthContext.refresh() でサイドバーにも反映
```

`<input type="file">` は **`document.createElement('input')` で動的生成 → `.click()`** で起動。
DOM に input 要素を残さないため、React レンダリング・label htmlFor・display:none 由来の落とし穴を構造的に回避。

### 5-3. v15〜v17 の真因と v18 修正（重要）

**症状**：プロフィール画像でファイルを選んでもプレビューに反映されない。診断ログを画面に出すと、ファイル選択直後に診断ログ自体が消える（state 全消し）。

**真因**：
```
[ユーザーが「画像を選択」クリック]
   ↓
[file picker が開く] ← この瞬間 window が blur
   ↓
[ユーザーがファイル選択して picker を閉じる]
   ↓
[window が再 focus]
   ↓
[useReloadOnFocus が発火 → reload() 呼び出し]
   ↓
[reload 内で setLoading(true)]
   ↓
[ProfilePage が「読み込み中…」分岐に切替]
   ↓
[ProfileEditor が unmount] ← state 全消し！
   ↓
[reload 完了 → setLoading(false)]
   ↓
[ProfileEditor が再 mount（別 instance）] ← 元の選択ファイル情報なし
```

**v18 修正**：
```js
const initialLoadRef = useRef(true);
const reload = useCallback(async () => {
  if (!user?.id) return;
  if (initialLoadRef.current) setLoading(true);  // ← 初回のみ
  // ... fetch ...
  setLoading(false);
  initialLoadRef.current = false;
}, [user?.id]);
```

これでフォーカス時 reload は loading 分岐に入らず、ProfileEditor が unmount されない。
他のページ（マイタスク等）も同様のリスクがあるが、現状は編集中の永続 state を持っていないため緊急性なし。

### 5-4. その他

マイタスク・スケジュール・コメント・サイドバー・IME ガード等は **v17 から変更なし**。

---

## 6. 機能一覧（v18 時点）

### ✅ 実装済み

- 認証 / 招待 / パスワード変更
- ダッシュボード（5 ウィジェット）/ チーム / 案件 / タスク / 小タスク / ガント / カンバン / ファイル
- 通知 / マイページ / 管理者ダッシュボード / ユーザー管理 / 部署管理
- レスポンシブ / 自動再読込 / SPA ルーティング / ErrorBoundary
- マイタスク（v17）/ マイスケジュール（v17）/ 案件コメント（v17）/ 案件未設定タスク（v17）
- **プロフィール画像 base64 方式（v18）**
- **`useReloadOnFocus` 由来の unmount バグ修正（v18）**
- **docId 戦略の統一（v18）**

### ⏸ 中断中：なし

### 🔲 将来

- スケジュール CRUD UI（月カレンダー上の表示は実装済み、新規作成 / 編集 / 削除モーダルは未実装）
- Appwrite Functions メール自動送信
- Slack 通知連携 / PWA / CSV エクスポート
- Document-level Security への移行（コメント・ファイル・タスクの編集 / 削除をクライアント判定 → サーバー強制）
- profiles 削除時の Auth 連動削除

---

## 7. 今回のセッションで行った変更（v18）

### A. コードレビュー：潜在的バグ・冗長コード撤去

並走したエージェント 2 体（セキュリティ / コード品質）の指摘から、機能・デザイン変更を伴わない安全な範囲のみ対応：

- `src/api/project-assignees.js` / `schedule-participants.js`：合成キー docId → `ID.unique()` 化
  - team_members（v16）と同じパターン。長 ID 同士で 36 字超過する潜在事故を未然防止
  - 旧合成 docId のレコードもクエリで発見できるためゼロダウンタイム
- `src/api/comments.js` / `subtasks.js` / `components/departments/DepartmentMembersModal.jsx`：
  - `catch (_) {}` を `catch (err) { console.warn(...) }` に置換（4 箇所）
- `src/data/dummy.js`（444 行）を削除：
  - grep で import 0 件を確認、`src/data` ディレクトリも空のため削除
- `scripts/seed-data.js` / `src/api/profiles.js` / `src/api/team-members.js` のコメント中の dummy.js 参照を最新仕様に書き換え

> 見送り項目（機能変更リスクのため別 PR で対応）：
> - Document-level Security 移行（権限の Role.users() からドキュメント単位への移行）
> - 招待トークン検証のサーバーサイド化（Appwrite Functions）
> - 巨大ページコンポーネント（ProfilePage 630 行 / GanttTab 624 行）の責務分割
> - inline style の CSS module 化
> - a11y aria 属性の網羅追加

### B. プロフィール画像の再構築（v18 メイン）

**v15〜v17 で「クリック選択 / ドロップしても反映されない」症状が再現していた問題を真因から解消**。

設計変更：
1. **Storage アップロード方式を廃止** → base64 data URI 直接保存
2. **`<input>` を動的生成 → `.click()`** で起動（label / htmlFor 経由の落とし穴を回避）
3. **Canvas で 256×256 リサイズ + JPEG quality 0.85**（実測 15〜30KB）
4. **`profiles.avatar_url` size 拡張**（500 → 200000）

実装：
- `src/utils/avatarImage.js`（新規）：
  * `pickImageFile()`：動的 input + Promise で File を返す
  * `processImageToDataUri(file)`：Canvas でリサイズ → JPEG data URI
  * `validateImageFile(file)`：拡張子 + サイズチェック
- `src/pages/ProfilePage.jsx`：ProfileEditor を base64 方式に書き換え
- `src/api/avatars.js`（撤去）
- `src/appwrite.js`：`AVATAR_BUCKET_ID` 定数撤去
- `scripts/schema.js`：`profiles.avatar_url` の size を 200000 に
- `scripts/expand-avatar-url-size.js`（新規）：既存属性を size=200000 に拡張するワンショット

### C. 真因修正：useReloadOnFocus による unmount

ファイルダイアログ閉じる → window 再フォーカス → `useReloadOnFocus` 発火 → `reload()` 内 `setLoading(true)` → ページがローディング分岐に切替 → **ProfileEditor が unmount** → 編集中 state 破棄、という流れが v15〜v17 を通じてアバターアップロード失敗の真因だった。

修正：`reload()` を「初回のみ全画面ローディング、以降はバックグラウンド更新」に変更（`initialLoadRef`）。

```js
const initialLoadRef = useRef(true);
const reload = useCallback(async () => {
  if (initialLoadRef.current) setLoading(true);  // ← 初回のみ
  // ...
  initialLoadRef.current = false;
}, [user?.id]);
```

### D. 診断プロセスの教訓

問題切り分けに **画面上に出す診断ログ（sessionStorage 永続化）** を仕込んだことで、unmount → remount が起きていることが視覚的に確認できた。Console ログだけでは「ログが消える＝ログ未発火」と「ログが消える＝state リセット」の区別が難しい。

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | スケジュール CRUD UI 未実装 | 中 | `CreateScheduleModal` を作成 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` |
| 3 | コメント・ファイル・タスクの編集 / 削除はクライアント側でのみ権限チェック | 中 | Document-level Security に移行 |
| 4 | 招待 invitations.read = Role.any() でフルスキャンによるメール列挙が可能 | 中 | サーバーサイド API 化（Appwrite Functions） |
| 5 | 巨大ページコンポーネント（ProfilePage / GanttTab / AdminDashboard） | 低 | 責務分割 |
| 6 | inline style 569 箇所 | 低 | CSS module 化 |
| 7 | a11y aria 属性の不足 | 低 | 統一フェーズで対応 |
| 8 | メール自動送信は未対応（mailto で外部メーラー） | 中 | Appwrite Functions + SMTP |

---

## 9. 解消済みの問題（v18 追加分のみ）

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | **プロフィール画像のクリック選択 / ドロップが反映されない**（v15 で混入、v16・v17 で再着手失敗） | **v18** |
| ✅ | **`useReloadOnFocus` がページを unmount させる潜在問題** | **v18** |
| ✅ | **`project_assignees` / `schedule_participants` の合成キー docId による 36 字超過リスク** | **v18** |
| ✅ | **dummy.js（444 行）が PHASE 4 完了後も残存** | **v18** |
| ✅ | **削除カスケード処理のサイレント failure（catch (_) {}）** | **v18** |

（v17 までの解消済み項目は v17 引き継ぎ書を参照）

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v18.md と docs/AimZ_spec_v2.0.md を確認してください。」

中断中の作業はありません。次フェーズの候補：
- スケジュール CRUD UI 実装
- Document-level Security 移行プラン策定
- 巨大ページコンポーネントの責務分割

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v15 | 2026-04-29〜05-07 | 設計・実装・PHASE 4-5 完了・運用改善・プロフィール画像 v1（Storage） |
| v16 | 2026-05-09 | チーム追加 36 字超過解消 / サイドバー再配置 / `.env` 運用確立。仕様書 v1.8 |
| v17 | 2026-05-09 | マイタスク / マイスケジュール / 案件未設定タスク / コメントタブ / アバター → /profile / IME ガード。仕様書 v1.9 |
| **v18** | **2026-05-09** | **プロフィール画像 base64 方式に再設計（Storage 廃止）。useReloadOnFocus 真因バグ修正。docId 戦略を ID.unique() に統一。dummy.js 撤去。サイレント catch にログ追加。仕様書 v2.0** |
