import { useEffect, useState } from 'react';

/**
 * useIsCompact — ウィンドウ幅が狭い時に true を返すフック。
 *
 * 業務アプリで操作ボタン列が多いテーブル等で「ボタンを iconOnly に切り替える」用途を想定。
 *
 * デフォルトの境界：900px。
 * サイドバー開いた状態（220px 占有）で内容領域 ≈ 680px となる地点。
 *
 * SSR 環境では false を返す（hydration 後に再計算）。
 */
export default function useIsCompact(breakpoint = 900) {
  const get = () => (typeof window !== 'undefined' && window.innerWidth < breakpoint);
  const [isCompact, setIsCompact] = useState(get);

  useEffect(() => {
    const onResize = () => setIsCompact(get());
    window.addEventListener('resize', onResize);
    // 初回チェック（hydration 後）
    onResize();
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);

  return isCompact;
}
