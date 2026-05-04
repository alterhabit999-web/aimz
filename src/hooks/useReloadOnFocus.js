import { useEffect, useRef } from 'react';

/**
 * useReloadOnFocus — タブがアクティブになった時 / ウィンドウがフォーカスを取り戻した時に reload を呼ぶ。
 *
 * 用途：
 *   - 別タブで DB を更新 → 元タブに戻った時に最新化
 *   - ページを開きっぱなしで時間が経った時、フォーカス時に最新化
 *
 * チャタリング防止：直近 minIntervalMs 以内の連続発火は無視する。
 *
 * 使い方：
 *   const reload = useCallback(async () => { ... }, [...]);
 *   useEffect(() => { reload(); }, [reload]);  // 初回ロード
 *   useReloadOnFocus(reload);                  // フォーカス時に再ロード
 */
export default function useReloadOnFocus(reload, { minIntervalMs = 1500 } = {}) {
  const lastRef = useRef(0);

  useEffect(() => {
    if (typeof reload !== 'function') return;

    const trigger = () => {
      const now = Date.now();
      if (now - lastRef.current < minIntervalMs) return;
      lastRef.current = now;
      reload();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') trigger();
    };
    const onFocus = () => trigger();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload, minIntervalMs]);
}
