# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-12  
**仕様書バージョン**: v2.3  
**引き継ぎ書バージョン**: v21

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB）+ GitHub Pages  
**現在の状態**：本番稼働中。v21 は v19 で残っていた既知問題のうち、**「ユーザー削除時の Auth 連動削除」を運用ルール + ソフト削除統一で解決**した。Document-level Security 移行は方針整理して将来対応。

1. **ユーザー削除をソフト削除（停止）に統一**：profile を残し is_active=false + 所属解除
2. **停止中ユーザーのログイン拒否**：login / セッション復元 / セッション中いずれの経路でも拒否
3. **運用ルール化**：Auth ユーザーの完全削除は Console での手動操作

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| 〜v18 | 設計・実装・PHASE 4-5 完了・運用改善（詳細は v18 引き継ぎ書） | ✅ |
| v19 | 招待廃止・メール変更・ファビコン・メンション・本日タスク・予定 CRUD UI | ✅ |
| v20 | ガントチャートに予定を表示 | ✅ |
| **v21 既知問題対応** | **ハード削除 → ソフト削除統一 / 停止ユーザーログイン拒否** | ✅ |
| 中断中 | なし | — |
| 将来 | 予定の 30 分前リマインダー（Appwrite Functions）/ Document-level Security / Auth 連動削除（Appwrite Functions 化） | 🔲 |

---

## 3. 構成情報

v19・v20 から **変更なし**。コレクション数 14、環境変数運用も同じ。
詳細は v20 引き継ぎ書 §3 を参照。

---

## 4. 運用ガイド

### 4-1〜4-9. 既存項目

v19・v20 から **変更なし**。

### 4-10. ユーザーの停止 / 完全削除（v21 で運用ルール化）

#### A. ユーザーを停止する（通常の運用）
1. 管理者で `/admin/users` を開く
2. 対象ユーザー行の「**停止**」ボタン（Ban アイコン、赤）をクリック
3. 確認ダイアログで内容を確認 → 「停止する」
4. 効果：
   - 本人はログインできなくなる
   - 所属チームから自動的に外れる（タスクの担当などは履歴として残る）
   - 過去のコメント・タスク・予定などのデータは保持
5. 停止を取り消す場合は「編集」ボタン → 「有効」に戻す

#### B. ユーザーを完全に削除する（Auth 含む、再登録が必要なとき）
1. 上記 A で先に停止しておく
2. Appwrite Console → Auth → Users
3. 該当ユーザーを検索して **「Delete」** を実行
4. これでメールアドレスが解放され、同じメールで再登録可能になる

> 注意：Auth を先に削除すると profile が残ったまま参照先が不在になります。必ず先にアプリ側で「停止」してから Console で Auth を削除してください。

> **Appwrite Functions 化（将来対応）**：管理者がアプリ上のワンクリックで Auth まで削除できるようにするには、サーバー側 Function で `users.delete()` を実行する仕組みが必要。コスト比から現状は Console での手動運用を採用。

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v21 時点の差分）

```
src/
├── contexts/
│   └── AuthContext.jsx              v21：login / session restore で is_active チェック
├── components/layout/
│   └── RequireAuth.jsx              v21：セッション中に停止されたら自動 logout
├── pages/
│   ├── LoginPage.jsx                v21：account_inactive エラーを日本語化
│   └── admin/
│       └── UsersPage.jsx            v21：削除→停止に変更、handleSoftDelete + ConfirmDialog 刷新
```

### 5-2. 停止ユーザーの遮断フロー（v21）

```
[ユーザーがログインを試行]
   ↓
account.createEmailPasswordSession(email, password)
   ↓
account.get()
   ↓
buildUser(me) → profile.is_active を読み込む
   ↓
  is_active === false なら：
    → account.deleteSession('current')
    → throw new Error('このアカウントは停止されています…') with code='account_inactive'
  else:
    → setUser(merged) で通常ログイン
```

```
[セッション復元時（ページ再読込）]
   ↓
account.get() 成功
   ↓
buildUser(me)
   ↓
  is_active === false なら：
    → deleteSession + setUser(null)
    → 結果として未ログイン状態として扱われ /login へリダイレクト
```

```
[セッション中に管理者から停止された場合]
   ↓
useReloadOnFocus などで profile が更新される
   ↓
AuthContext.refresh() で merged.is_active=false に
   ↓
RequireAuth の useEffect が検知 → logout()
   ↓
/login へリダイレクト
```

### 5-3. ソフト削除の挙動（v21）

`UsersPage.handleSoftDelete`：
```js
await updateProfile(targetId, { is_active: false });
await setUserMemberships(targetId, []);  // チーム所属を全解除
```

profile レコード自体は残存。「停止中」フィルタで表示可能。「編集」モーダルから `is_active` を `true` に戻せば再有効化できる。

---

## 6. 機能一覧（v21 時点）

### ✅ 実装済み（v20 からの追加分のみ）

- **ユーザー停止（ソフト削除）**：is_active=false + チーム所属解除（v21）
- **停止ユーザーのログイン拒否**：login / セッション復元 / 在席中いずれも遮断（v21）

その他は v20 から変更なし。

---

## 7. 今回のセッションで行った変更（v21）

### A. AuthContext：is_active=false の遮断

[src/contexts/AuthContext.jsx](../src/contexts/AuthContext.jsx)
- `login()`：buildUser 後に is_active=false なら deleteSession + 'account_inactive' エラー
- 起動時セッション復元：同様に拒否し、setUser(null)

### B. RequireAuth：セッション中に停止された場合の自動ログアウト

[src/components/layout/RequireAuth.jsx](../src/components/layout/RequireAuth.jsx)
- `useEffect` で `user?.is_active === false` を検知 → `logout()` を呼ぶ
- 待ち時間中は何もレンダしない（白画面ではなく null 返却）

### C. UsersPage：ハード削除 → ソフト削除

[src/pages/admin/UsersPage.jsx](../src/pages/admin/UsersPage.jsx)
- 「削除」ボタン（Trash2 / danger）を「停止」ボタン（Ban / danger）に変更
- 既に停止中のユーザーには表示しない
- 確認ダイアログを「アカウントを停止」に変更：
  - ログイン不可・所属解除・履歴は残る・停止取消の方法を箇条書きで明示
  - Appwrite Console での Auth 完全削除手順を警告枠で表示
- `handleSoftDelete`：`updateProfile({is_active:false})` + `setUserMemberships([])`
- 旧 `deleteProfile` import を撤去

### D. LoginPage：エラーメッセージ日本語化

[src/pages/LoginPage.jsx](../src/pages/LoginPage.jsx)
- `err.code === 'account_inactive'` を判定して「このアカウントは停止されています…」を表示

### E. Document-level Security 移行は将来対応で確定

検討結果：
- 社内クローズド利用の現状では実害なし
- 既存データ全件に permissions を付与する移行スクリプトが必要
- Appwrite Teams または Labels で管理者を表現する設計が必要
- Phase 別（comments → project_files → tasks → notifications）の段階的移行を推奨
- 採用判断は外部公開 / 監査要件発生時に再評価

---

## 8. 既知の問題 / 改善候補

| # | 内容 | 優先度 | 対応案 |
|---|------|------|------|
| 1 | 予定開始 30 分前の通知（v19 で見送り） | 中 | Appwrite Functions + cron 実装 |
| 2 | **ユーザー削除の Auth 連動が手動運用** | 中 | Appwrite Functions で `users.delete()` を実装 |
| 3 | コメント・ファイル・タスク・予定の編集 / 削除はクライアント側でのみ権限保護 | 中 | Document-level Security に段階移行（Phase 1: comments から） |
| 4 | `invitations` コレクションが残存（不使用） | 低 | Console から手動削除可 |
| 5 | 巨大ページコンポーネント（GanttTab 等） | 低 | 責務分割 |
| 6 | メール自動送信は未対応 | 中 | Appwrite Functions + SMTP |

---

## 9. 解消済みの問題（v21 追加分）

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | **ユーザー削除時に Auth が残り、削除済のはずのユーザーがログインできる** | **v21**（ソフト削除 + ログイン拒否で実害解消、Auth は Console で手動削除） |
| ✅ | **同じメールアドレスで再登録すると古い profile と衝突する可能性** | **v21**（停止運用に変更したためアプリ上で再登録は基本発生しない。再登録が必要な場合は Console で旧 Auth を削除する手順を明文化） |

（v20 までの解消済み項目は v20 引き継ぎ書を参照）

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v21.md と docs/AimZ_spec_v2.3.md を確認してください。」

中断中の作業はありません。次フェーズ候補：
- 予定開始 30 分前の通知（Appwrite Functions）
- ユーザー Auth 完全削除の自動化（Appwrite Functions）
- Document-level Security 移行（Phase 1: comments から）

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v18 | 2026-04-29〜05-09 | 設計・実装・運用改善・プロフィール画像 base64・useReloadOnFocus 真因修正等 |
| v19 | 2026-05-11 | 招待廃止→管理者直接作成 / メール変更 / ファビコン / コメントメンション+通知 / 本日タスク表示 / 予定 CRUD UI。仕様書 v2.1 |
| v20 | 2026-05-11 | ガントチャートに予定（schedules）を表示。仕様書 v2.2 |
| **v21** | **2026-05-12** | **ユーザー削除をソフト削除（停止）に統一 / 停止ユーザーのログイン拒否 / Auth 完全削除は Console 手動運用に。Document-level Security 移行は将来対応として方針整理。仕様書 v2.3** |
