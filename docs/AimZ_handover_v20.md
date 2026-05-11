# AimZ 引き継ぎ書

**作成日**: 2026-04-29  
**更新日**: 2026-05-11  
**仕様書バージョン**: v2.2  
**引き継ぎ書バージョン**: v20

---

## 1. プロジェクト概要

**AimZ（エイムズ）** ── 社内向けプロジェクト管理 Web アプリ。

**技術スタック**：React + Appwrite Cloud（Auth / DB）+ GitHub Pages  
**現在の状態**：本番稼働中。v20 は v19 の小幅拡張：

- **ガントチャートに予定（schedules）も表示**：タスク + 予定を同じタイムラインで俯瞰できる

### 公開 URL

**https://alterhabit999-web.github.io/aimz**

---

## 2. 作業サマリー

| ステップ | 内容 | 状態 |
|---------|------|------|
| 〜v18 | 設計・実装・PHASE 4-5 完了・運用改善（詳細は v18 引き継ぎ書） | ✅ |
| v19 | 招待廃止・メール変更・ファビコン・メンション・本日タスク・予定 CRUD UI | ✅ |
| **v20 ガント拡張** | **ガントチャートに予定を表示** | ✅ |
| 中断中 | なし | — |
| 将来 | 予定の 30 分前リマインダー（Appwrite Functions）/ Document-level Security / PWA など | 🔲 |

---

## 3. 構成情報

v19 から **変更なし**。コレクション数 14、環境変数運用も同じ。
詳細は v19 引き継ぎ書 §3 を参照。

---

## 4. 運用ガイド

v19 から **変更なし**。詳細は v19 引き継ぎ書 §4 を参照。

---

## 5. アーキテクチャ

### 5-1. ディレクトリ（v20 時点の差分）

```
src/components/projects/tabs/
└── GanttTab.jsx               v20：予定セクション + ScheduleRow を追加
```

その他の構造は v19 から変更なし。

### 5-2. ガントチャートにおける予定の扱い（v20 新規）

```
┌─────────────────────────────────────────┐
│ ヘッダー：タスク列 | 日付ラベル        │
├─────────────────────────────────────────┤
│ タスク行 1（ステータス色のソリッドバー）│ ← 既存
│ タスク行 2                             │ ← 既存
│ タスク行 3                             │ ← 既存
├─────────────────────────────────────────┤
│ ▸ 予定（セクション区切り、v20 新規）   │
├─────────────────────────────────────────┤
│ 予定行 1（斜線パターン + accent 枠線）  │ ← v20 新規
│ 予定行 2                                │
└─────────────────────────────────────────┘
```

- **タイムライン自動拡張**：`project.start_date / end_date` + タスク日付 + 予定日付の全範囲を含むよう両端を動的に決定
- **バー描画**：`start_at.slice(0, 10)` ～ `end_at.slice(0, 10)` の日付範囲。時刻情報は左固定列に `HH:mm – HH:mm` で表記
- **ドラッグ不可**：時刻があるので日単位ドラッグだとズレるため、編集は ScheduleFormModal 経由のみ
- **クリック**：行 / バーいずれも `ScheduleFormModal` (edit mode) を起動。参加者 ID は `loadScheduleParticipantIds(scheduleId)` で取得して `_participantIds` に入れて渡す

---

## 6. 機能一覧（v20 時点）

### ✅ 実装済み（v19 からの追加分のみ）

- **ガントチャートに予定（schedules）を表示（v20）**

その他は v19 から変更なし。

---

## 7. 今回のセッションで行った変更（v20）

### A. GanttTab で schedules も取得

[src/components/projects/tabs/GanttTab.jsx](../src/components/projects/tabs/GanttTab.jsx)

- `listSchedulesByProject(project.id)` を `reload` で取得し、`schedules` state に保持
- タイムライン算出を「project + tasks + schedules の全候補から両端を取る」方式に変更
  - 案件期間外の予定でも見えるよう自動拡張

### B. GanttChart 内に「予定」セクションを追加

タスク行群の直後に：
- **区切り行**：左固定列に「予定」ラベル + Calendar アイコン、右側は薄い帯
- **予定行ループ**：1 行ごとに左固定列（タイトル + `HH:mm – HH:mm`）と `<ScheduleRow>`（バー）

### C. ScheduleRow（バー）の追加

- 範囲：`start_at` の日付 〜 `end_at` の日付（タイムライン外はクリップ）
- スタイル：
  ```css
  background: repeating-linear-gradient(45deg, accentLight, accentLight 6px, surface 6px, surface 10px);
  border: 2px solid accent;
  ```
  → 斜線パターンでタスクのソリッドバーと一目で区別
- ドラッグハンドル無し（クリックのみ）

### D. クリックで ScheduleFormModal を起動

```js
const openScheduleEdit = async (schedule) => {
  const ids = await loadScheduleParticipantIds(schedule.id);
  setScheduleModalInitial({ ...schedule, _participantIds: ids });
  setScheduleModalOpen(true);
};
```

`ScheduleFormModal` を `mode="edit"` で渡す。保存後は `reload()` で再描画。

### E. 今日線の高さ調整

タスク + 区切り + 予定の全高を貫くよう変更：
```js
height: tasks.length * ROW_HEIGHT
      + (dividerRows ? (ROW_HEIGHT - 8) : 0)
      + schedules.length * ROW_HEIGHT
```

---

## 8. 既知の問題 / 改善候補

v19 から **変更なし**。詳細は v19 引き継ぎ書 §8 を参照。

ガント関連で新規に検討の余地があるもの：
- ガント上で予定をドラッグ移動できるようにする（時刻保持に課題）
- 予定セクションの折りたたみ機能
- 予定バーに参加者アバターをサムネイル表示

---

## 9. 解消済みの問題（v20 追加分）

| # | 問題 | 解消バージョン |
|---|------|--------------|
| ✅ | **ガントチャートでは予定が見えなかった**（タスクのみ表示） | **v20** |

（v19 までの解消済み項目は v19 引き継ぎ書を参照）

---

## 10. 次回セッションの再開方法

> 「AimZ の開発を続けます。docs/AimZ_handover_v20.md と docs/AimZ_spec_v2.2.md を確認してください。」

中断中の作業はありません。次フェーズ候補（v19 から引き継ぎ）：
- 予定の 30 分前リマインダー通知（Appwrite Functions）
- Document-level Security 移行
- profiles 削除時の Auth 連動削除

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1〜v18 | 2026-04-29〜05-09 | 設計・実装・運用改善・プロフィール画像 base64・useReloadOnFocus 真因修正等 |
| v19 | 2026-05-11 | 招待廃止→管理者直接作成 / メール変更 / ファビコン / コメントメンション+通知 / 本日タスク表示 / 予定 CRUD UI。仕様書 v2.1 |
| **v20** | **2026-05-11** | **ガントチャートに予定（schedules）を表示。クリックで編集モーダル起動。仕様書 v2.2** |
