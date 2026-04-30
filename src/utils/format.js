/**
 * format.js — 日付・時刻のフォーマット用ユーティリティ。
 */

// '2026-04-29T10:00:00' → '10:00'
export const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// '2026-04-29' → '4/29 (水)'
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;
};

// '2026-04-29' → '2026年4月29日 (水)'
export const formatLongDate = (dateStr) => {
  if (!dateStr) return '';
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${weekday})`;
};

// 期限までの残り日数を「あと3日」「期限超過」「今日」などに変換
export const formatDueRelative = (days) => {
  if (days === null || days === undefined) return '';
  if (days < 0)  return `${Math.abs(days)}日超過`;
  if (days === 0) return '今日';
  if (days === 1) return 'あと1日';
  return `あと${days}日`;
};

// 通知の作成日時 → '今' / '5分前' / '2時間前' / '昨日' / '4/27' などの相対表現
export const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const created = new Date(isoString).getTime();
  const now = Date.now();
  const diffMin = Math.floor((now - created) / 60000);

  if (diffMin < 1)    return '今';
  if (diffMin < 60)   return `${diffMin}分前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)    return `${diffHr}時間前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1)  return '昨日';
  if (diffDay < 7)    return `${diffDay}日前`;
  return formatShortDate(isoString.slice(0, 10));
};
