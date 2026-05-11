# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-11  
**仕様書バージョン**: v2.1  
**引き継ぎ書バージョン**: v19

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB）+ GitHub Pages  
**現在の状態**：本番稼働中。v19 で運用上の重要な障害（招待リンク不可）を解消し、欲しかった機能群を一気に揃えた：

1. **招待リンク方式を廃止 → 管理者によるユーザー直接作成方式に変更**（運用上の "not authorized" エラー解消）
2. **マイページにメールアドレス変更機能**
3. **ファビコン設定**（SVG ロゴ）
4. **コメントタブにメンション機能 + 通知**（`@` サジェスト + ハイライト + 通知）
5. **ダッシュボード「本日のスケジュール」→「本日の予定・タスク」に拡張**
6. **スケジュール CRUD UI 完成**（マイスケジュール / 案件詳細の両方から起動可能）

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| PHASE 0〜2 | 設計・UI 全画面実装 | ✅ |
| PHASE 3 | 13 → 14 コレクション + Storage を実 DB 化 | ✅ |
| PHASE 4 | Appwrite Auth + 招待 + 権限 + ダミー撤去 | ✅ |
| PHASE 5 | GitHub Pages デプロイ | ✅ |
| v11〜v15 | 運用改善・UI 改善・プロフィール画像（v15）・招待運用機能 / ErrorBoundary | ✅ |
| v16 不具合修正 | チーム追加 36 字超過解消 / サイドバー再配置 / .env 運用確立 | ✅ |
| v17 機能追加 | マイタスク / マイスケジュール（カレンダー表示） / 案件未設定タスク / 案件コメント | ✅ |
| v18 内部品質 + 真因修正 | プロフィール画像 base64 化 / useReloadOnFocus 真因修正 / docId 統一 / dummy.js 撤去 | ✅ |
| **v19 機能追加 + 不具合解消** | **招待廃止→直接作成 / メール変更 / ファビコン / コメントメンション+通知 / ダッシュ本日タスク / 予定 CRUD** | ✅ |
| 中断中 | なし | — |
| 将来 | 予定の 30 分前リマインダー（Appwrite Functions）/ Document-level Security / PWA など | 🔲 |

---

## 3. 構成情報

### Appwrite

| 項目 | 値 |
|------|------|
| Endpoint | `https://sgp.cloud.appwrite.io/v1` |
| Project ID | `69f144ba0005896bc8c3` |
| Database ID | `69f14627000c793e5a36` |
| Storage Bucket ID | `69f1465f0003ebde6dc6`（案件ファイル専用） |
| Web Platform | `localhost` / `alterhabit999-web.github.io` |
| コレクション数 | 14（`invitations` は v19 でアプリから不参照に） |

### コレクション一覧（v19 時点）

`profiles` / `departments` / `teams` / `team_members` / `projects` / `project_assignees` /
`tasks` / `subtasks` / `schedules` / `schedule_participants` / `project_files` /
`notifications` / `invitations` ⚠️ / `comments`

> ⚠️ `invitations` は v19 でアプリから読み書きされなくなった。過去履歴として残存。将来 Console から削除可能。

### コレクション権限

| コレクション | Read | Create | Update | Delete |
|---|---|---|---|---|
| その他全 13 個 | Role.users() | Role.users() | Role.users() | Role.users() |
| `invitations` | Role.any() ⭐（v15〜の遺物、害はないがアプリは使わない） | Role.users() | Role.users() | Role.users() |

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
npm run migrate:avatar-url-size        # profiles.avatar_url の size を 200000 に拡張（実行済み）
npm run seed:appwrite                  # ダミーデータ全投入
npm run seed:auth-users                # u2〜u5 を再作成 / パスワードリセット
npm run sync:profile-emails            # Auth のメールを profiles に同期
npm run cleanup:orphans                # 孤立データの検出（ドライラン）
npm run fix:invitations-permissions    # invitations.read を Role.any() に（v19 では実質不要）
```

### 4-3. 新メンバー受け入れフロー（v19 で大幅刷新）

1. 管理者で `/admin/users` → 右上「**ユーザーを作成**」ボタン
2. 氏名 / メールアドレス / 初期パスワード（自動生成可・🔄 で再生成可）/ 管理者フラグを入力
3. 「アカウントを作成」 → 完了画面で **メール + 初期パスワード**が表示される
4. 「ログイン情報をまとめてコピー」で本人にメール / Slack 等で共有
5. **完了画面を閉じると初期パスワードは二度と表示されない**ので閉じる前に必ずコピー
6. 本人はログイン後にマイページからパスワード変更可能
7. 部署メンバー追加は `/admin/departments` の「メンバー」から該当部署のチームに加入

### 4-4. メールアドレス変更（v19 新規）

1. 本人がマイページを開く
2. 「メールアドレス変更」カードに新しいメール + 現在のパスワード（本人確認）を入力
3. 「メールアドレスを変更」 → Auth とプロフィール両方が更新

### 4-5. 部署メンバー管理（v13 / v18 から変更なし）

詳細は v18 引き継ぎ書を参照。

### 4-6. 予定の作成（v19 新規）

**マイスケジュールから**：
- `/schedule` 右上「予定を追加」
- 日セルクリック → 詳細モーダル下部「この日に予定を追加」（その日 09:00〜10:00 を初期値）

**案件詳細から**：
- 案件詳細 → タブ「予定」 → 「予定を追加」（案件はプリセット済み）

入力項目：タイトル / 案件（任意） / 開始終了日時 / 場所 / メモ / 参加者（複数可）

権限：作成は誰でも可、編集・削除は**作成者本人 or 管理者のみ**。

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v19 時点の差分）

```
src/
├── api/
│   ├── ...
│   ├── （invitations.js は v19 で削除）
│   └── notifications.js              v19：type='mention' を運用追加
├── components/
│   ├── users/
│   │   ├── CreateUserModal.jsx       v19 新規（旧 InviteUserModal の置換）
│   │   ├── EditUserModal.jsx
│   │   └── （InviteUserModal.jsx / InvitationsModal.jsx は v19 で削除）
│   ├── schedules/
│   │   └── ScheduleFormModal.jsx     v19 新規（予定の作成・編集・削除）
│   └── projects/tabs/
│       ├── ...
│       ├── CommentsTab.jsx           v19：MentionTextarea + 通知作成
│       ├── MentionTextarea.jsx       v19 新規（@サジェスト・抽出・ハイライト用）
│       └── SchedulesTab.jsx          v19 新規（案件詳細「予定」タブ）
├── pages/
│   ├── ProfilePage.jsx               v19：EmailChanger 追加
│   ├── MySchedulePage.jsx            v19：予定モーダル連携
│   ├── NotificationsPage.jsx         v19：'mention' 通知タイプ追加
│   ├── admin/UsersPage.jsx           v19：CreateUserModal 連携、招待履歴撤去
│   └── （InvitationAcceptPage.jsx は v19 で削除）
├── components/dashboard/
│   └── TodayScheduleWidget.jsx       v19：本日のアクティブ担当タスクも表示
└── App.jsx                           v19：/invitations/:token ルート削除

public/
├── favicon.svg                       v19 新規（AimZ ロゴ）
└── index.html                        v19：<link rel="icon"> を SVG に
```

### 5-2. ユーザー直接作成フロー（v19）

```
管理者: /admin/users → 「ユーザーを作成」
   ↓
CreateUserModal で入力（氏名 / メール / 初期パス / is_admin）
   ↓
ID.unique() で userId 採番
   ↓
account.create(userId, email, password, name)   ← 管理者セッションは維持
   ↓
createProfile({ userId, full_name, email, is_admin })
   ↓
完了画面で初期パスを表示（コピー可）
   ↓
管理者が本人に共有 → 本人ログイン → マイページでパスワード変更
```

### 5-3. メンション処理（v19）

```
[投稿フォーム]
ユーザーが "@" を入力 → MentionTextarea が profile サジェスト表示
   ↓ 選択
本文に "@<full_name> " が挿入される
   ↓ 投稿
[handlePost]
extractMentionedIds(body, profiles) で本文走査
   - "@<full_name>" を最長一致で profile を解決
   - 自分宛は除外
   ↓
各メンション対象に createNotification({
  type: 'mention',
  title: '<author> があなたをコメントでメンションしました',
  body: '[<project>] <snippet>',
  related_type: 'project',
  related_id: project.id,
})
   ↓
NotificationsPage で AtSign アイコン付き「メンション」タイプで表示
   ↓ クリック
案件詳細へ遷移
```

編集時：編集前の本文に含まれていた既存メンション ID を Set に入れ、編集後にあり、かつ Set に無いものだけが新規通知対象（重複防止）。

### 5-4. ダッシュボード「本日の予定・タスク」（v19 で拡張）

```
上段「予定」（既存）：schedules.start_at が今日 0:00〜翌 0:00 の予定
下段「本日アクティブな担当タスク」（v19 新規）：
  - assignee_id === user.id
  - status !== '完了'
  - start_date ≤ 今日 ≤ due_date（YYYY-MM-DD 文字列比較）
  - sort：優先度 高→低 → 期限近い順
  - 「本日が期限」のタスクはオレンジで強調
```

### 5-5. 予定モーダル（v19 新規）

```
ScheduleFormModal の責務：
  - create / edit / delete を一体化
  - project：親が固定（案件詳細から開く）と未固定（マイスケジュールから開く）の両方をサポート
  - 参加者：チェックボックスで複数選択 → schedule_participants を差分同期
  - 編集・削除権限：created_by === currentUser.id || is_admin
  - 削除：ConfirmDialog 経由、deleteAllParticipantsForSchedule + deleteSchedule
  - 開始時刻は datetime-local で入力（ローカル時刻 → ISO 化して保存）
```

---

## 6. 機能一覧（v19 時点）

### ✅ 実装済み

- 認証 / 直接ユーザー作成 / メール変更 / パスワード変更
- ダッシュボード 5 ウィジェット（本日の予定・タスク含む）
- チーム / 案件 / タスク / 小タスク / ガント / カンバン / ファイル
- マイタスク（v17）/ マイスケジュール（v17）
- 案件コメント（v17）+ メンション + 通知（v19）
- 予定 CRUD（v19）：マイスケジュール / 案件詳細の両方
- 通知 / マイページ / 管理者ダッシュボード / ユーザー管理 / 部署管理
- レスポンシブ / ErrorBoundary / プロフィール画像 base64（v18）
- ファビコン（v19）

### 🔲 将来

- **予定開始 30 分前の通知**（Appwrite Functions 必要）
- Appwrite Functions メール自動送信
- Document-level Security への移行（コメント・ファイル・タスクの編集 / 削除をサーバー強制）
- Slack 通知連携 / PWA / CSV エクスポート
- profiles 削除時の Auth 連動削除
- `invitations` コレクションの完全廃棄（Console から手動削除）

---

## 7. 今回のセッションで行った変更（v19）

### A. 招待リンク廃止 / 管理者直接作成（優先度大）

**背景**：従来の招待トークン → リンク → ユーザーが踏んでアカウント作成フローで
「The current user is not authorized to perform the requested action」エラーが
運用環境で頻発していたため、招待方式そのものを廃止。

**変更**：
- 新規：[src/components/users/CreateUserModal.jsx](../src/components/users/CreateUserModal.jsx)
  * 氏名 / メール / 初期パスワード（自動生成 12 字、🔄 で再生成可）/ 管理者フラグ
  * `account.create()` + `createProfile()` を同期実行（管理者セッションは維持）
  * 完了画面で初期パスワードを表示、コピー / まとめてコピー可
- 撤去：
  * `src/components/users/InviteUserModal.jsx`
  * `src/components/users/InvitationsModal.jsx`
  * `src/pages/InvitationAcceptPage.jsx`
  * `src/api/invitations.js`
- 更新：
  * `src/pages/admin/UsersPage.jsx`：招待・履歴ボタンを「ユーザーを作成」一本に
  * `src/App.jsx`：`/invitations/:token` ルート削除
  * `src/pages/LoginPage.jsx`：フッター案内文を「アカウントは管理者が作成します」に

### B. マイページのメールアドレス変更（EmailChanger）

[src/pages/ProfilePage.jsx](../src/pages/ProfilePage.jsx) に追加：
- `account.updateEmail(newEmail, password)` で Auth 側を更新
- `updateProfile(id, { email })` で profiles を同期
- 本人確認のため現在のパスワード入力必須
- エラーメッセージを日本語化（重複・パスワード違い・セッション切れ）

### C. ファビコン

- 新規：[public/favicon.svg](../public/favicon.svg)（accent #0077c7 背景 + 白い棒グラフ）
- 更新：[public/index.html](../public/index.html)：`<link rel="icon">` を SVG ファイル参照に

### D. 案件コメントのメンション機能 + 通知

- 新規：[src/components/projects/tabs/MentionTextarea.jsx](../src/components/projects/tabs/MentionTextarea.jsx)
  * `@` または `＠` でサジェスト開始、半角空白までを query として profile を絞り込み
  * ↑↓ で選択、Enter / Tab / クリックで確定（`@<full_name>` + 半角空白を挿入）
  * Esc で閉じる、IME 変換中の Enter は無視
  * `extractMentionedIds(body, profiles)` で本文走査・最長一致で profile を解決
  * `renderMentionTokens(body, profiles)` で表示用にハイライトトークン化
- 更新：[CommentsTab.jsx](../src/components/projects/tabs/CommentsTab.jsx)
  * 投稿フォームを MentionTextarea に置換
  * コメント表示で `@<full_name>` を accent カラーでハイライト（CommentBody）
  * 投稿時：メンション対象に `type='mention'` の通知作成（自分宛は除外）
  * 編集時：新たに増えたメンションのみ通知（重複防止）
- 更新：[NotificationsPage.jsx](../src/pages/NotificationsPage.jsx)
  * TYPE_ICON / TYPE_LABEL に `mention` (AtSign アイコン) 追加
  * FILTERS に「メンション」を追加

### E. ダッシュボード本日ウィジェットの拡張

[src/components/dashboard/TodayScheduleWidget.jsx](../src/components/dashboard/TodayScheduleWidget.jsx)
- ウィジェット名を「本日のスケジュール」→「本日の予定・タスク」に変更
- 上段：今日の schedules（既存）
- 下段：本日アクティブな担当タスク（assignee=自分 ∧ start_date ≤ 今日 ≤ due_date ∧ status≠完了）
  * 優先度の高い順、次に期限の近い順
  * 「本日が期限」のタスクはオレンジで強調
  * クリックで該当案件 or `/tasks` へ遷移

### F. スケジュール CRUD UI 完成

- 新規：[src/components/schedules/ScheduleFormModal.jsx](../src/components/schedules/ScheduleFormModal.jsx)
  * 作成・編集・削除を一体化
  * project：親が固定 / 未固定の両モード対応（ピッカー表示切替）
  * 参加者：全 profiles から複数選択、`setParticipants` で差分同期
  * 編集・削除権限：作成者本人 or 管理者
  * 削除時のカスケード：`deleteAllParticipantsForSchedule` + `deleteSchedule`
- 新規：[src/components/projects/tabs/SchedulesTab.jsx](../src/components/projects/tabs/SchedulesTab.jsx)
  * 案件詳細の新タブ（「タスク一覧」と「ファイル」の間に配置）
  * 当該案件の予定を時系列で表示、行クリックで編集
- 更新：[MySchedulePage.jsx](../src/pages/MySchedulePage.jsx)
  * 右上「予定を追加」ボタン
  * 日詳細モーダルに「この日に予定を追加」（その日 09:00〜10:00 を初期値）
  * 日詳細の予定行クリック → 編集モーダル
- 更新：[ProjectDetailPage.jsx](../src/pages/ProjectDetailPage.jsx)
  * TABS に `{ id: 'schedules', label: '予定', Icon: Calendar }` を追加

### G. 通知 30 分前リマインダー（v19 では見送り）

検討した上で**実装見送り**：
- 純粋な静的 SPA（GitHub Pages）のため、サーバー側 cron が無い
- クライアント側ポーリングだとアプリを開いていないと通知が飛ばない
- 真の解決には Appwrite Functions（cron）が必要 → 別フェーズで対応
- 引き継ぎ書 §6「将来」に明記

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | **予定開始 30 分前の通知**（v19 で見送り） | 中 | Appwrite Functions + cron 実装 |
| 2 | profiles 削除時に Auth ユーザーが残る | 中 | UsersPage の削除フローに `users.delete` |
| 3 | コメント・ファイル・タスク・予定の編集 / 削除はクライアント側でのみ権限保護 | 中 | Document-level Security に移行 |
| 4 | `invitations` コレクションが残存（不使用） | 低 | Console から手動削除可 |
| 5 | 巨大ページコンポーネント（GanttTab 624 行 等） | 低 | 責務分割 |
| 6 | メール自動送信は未対応 | 中 | Appwrite Functions + SMTP |

---

## 9. 解消済みの問題（v19 追加分のみ）

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | **招待リンクで "not authorized" エラー多発** | **v19**（招待方式廃止） |
| ✅ | **マイページからメールアドレスを変更できない** | **v19** |
| ✅ | **ファビコンが未設定（青背景のみ）** | **v19** |
| ✅ | **コメントでユーザーをメンションできない** | **v19** |
| ✅ | **ダッシュボード「本日の予定」にタスクが表示されない** | **v19** |
| ✅ | **予定（schedules）を画面から作成・編集・削除できない** | **v19** |

（v18 までの解消済み項目は v18 引き継ぎ書を参照）

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v19.md と docs/AimZ_spec_v2.1.md を確認してください。」

中断中の作業はありません。次フェーズの候補：
- 予定の 30 分前リマインダー通知（Appwrite Functions）
- Document-level Security 移行
- profiles 削除時の Auth 連動削除

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v15 | 2026-04-29〜05-07 | 設計・実装・PHASE 4-5 完了・運用改善 |
| v16 | 2026-05-09 | チーム追加 36 字超過解消 / サイドバー再配置 / `.env` 運用確立。仕様書 v1.8 |
| v17 | 2026-05-09 | マイタスク / マイスケジュール / 案件未設定タスク / コメントタブ。仕様書 v1.9 |
| v18 | 2026-05-09 | プロフィール画像 base64 化 / useReloadOnFocus 真因修正 / docId 統一 / dummy.js 撤去。仕様書 v2.0 |
| **v19** | **2026-05-11** | **招待廃止→管理者直接作成 / メール変更 / ファビコン / コメントメンション+通知 / 本日タスク表示 / 予定 CRUD UI 完成。仕様書 v2.1** |
