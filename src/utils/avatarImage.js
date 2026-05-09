/**
 * utils/avatarImage.js — プロフィール画像のピック / リサイズ / data URI 化（v18）
 *
 * 設計思想：
 *   - <input type="file"> を DOM に残さず、毎回動的に生成・破棄して .click() する。
 *     → React のレンダリング・ラベル htmlFor・display:none 等の落とし穴を全部回避。
 *   - 画像は Canvas で 256×256 にセンタークロップ → JPEG quality 0.85 で base64 化
 *     → 実測 15〜30KB、profile.avatar_url（200000 文字）に余裕で収まる。
 *   - ドラッグ&ドロップとクリックの両方で同じ processFile() を通す。
 */

export const AVATAR_MAX_FILE_BYTES = 5 * 1024 * 1024; // 入力側の上限（5MB）
export const AVATAR_OUTPUT_SIZE    = 256;             // 出力辺長
export const AVATAR_OUTPUT_QUALITY = 0.85;            // JPEG 品質
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const ALLOWED_MIMES      = ['image/png', 'image/jpeg'];

/** ファイルが画像として許容されるか（拡張子優先、MIME はゆるめ） */
export function validateImageFile(file) {
  if (!file) return { ok: false, error: 'ファイルが選択されていません' };
  if (file.size > AVATAR_MAX_FILE_BYTES) {
    return { ok: false, error: `ファイルサイズは ${(AVATAR_MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB 以下にしてください` };
  }
  const ext = (file.name?.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
  const okExt = ALLOWED_EXTENSIONS.includes(ext);
  const okMime = !file.type || ALLOWED_MIMES.includes(file.type);
  if (!okExt || !okMime) {
    return { ok: false, error: 'PNG / JPG / JPEG のみアップロードできます' };
  }
  return { ok: true };
}

/**
 * ファイルピッカーを起動する。
 * <input type="file"> を動的に生成して .click() するため、DOM に残らない。
 * 戻り値：選択された File（キャンセル時は null）
 *
 * 注意：
 *   - 必ずユーザーのクリックハンドラの直接の同期処理として呼ぶこと
 *     （非同期跨ぎだと user activation を失って picker が開かないブラウザがある）
 */
export function pickImageFile() {
  console.log('[avatar] pickImageFile: start');
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED_MIMES.join(',');
    console.log('[avatar] pickImageFile: input created', input);

    let resolved = false;
    const settle = (file, source) => {
      if (resolved) {
        console.log('[avatar] settle ignored (already resolved):', source);
        return;
      }
      resolved = true;
      console.log('[avatar] settle:', source, 'file=', file);
      // 入力要素は次の tick で破棄
      setTimeout(() => {
        try { input.remove(); } catch (_) {}
      }, 0);
      resolve(file);
    };

    input.onchange = () => {
      console.log('[avatar] onchange fired, files=', input.files);
      settle(input.files?.[0] || null, 'onchange');
    };
    input.oninput = () => {
      console.log('[avatar] oninput fired, files=', input.files);
      // onchange のバックアップ（一部ブラウザ向け）
      if (input.files && input.files.length > 0) {
        settle(input.files[0], 'oninput');
      }
    };

    // フォーカス復帰でのキャンセル検出（onchange が発火しない場合のセーフティ）
    const handleFocus = () => {
      console.log('[avatar] window focus event');
      window.removeEventListener('focus', handleFocus);
      setTimeout(() => {
        console.log('[avatar] focus fallback check, resolved=', resolved, 'files=', input.files);
        if (!resolved && (!input.files || input.files.length === 0)) settle(null, 'focus-cancel');
      }, 500);
    };
    window.addEventListener('focus', handleFocus);

    // input は不可視で document.body に append
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    document.body.appendChild(input);
    console.log('[avatar] input appended; calling .click()');
    input.click();
    console.log('[avatar] .click() returned');
  });
}

/** File → HTMLImageElement */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = url;
  });
}

/**
 * File を 256×256 にセンタークロップして JPEG base64 data URI を返す。
 *   maxSize：出力辺長（デフォルト 256）
 *   quality：JPEG 品質（デフォルト 0.85）
 */
export async function processImageToDataUri(file, {
  maxSize = AVATAR_OUTPUT_SIZE,
  quality = AVATAR_OUTPUT_QUALITY,
} = {}) {
  const v = validateImageFile(file);
  if (!v.ok) throw new Error(v.error);

  const img = await loadImage(file);

  // センタークロップ：短辺に合わせて正方形を切り出す
  const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth  - srcSize) / 2;
  const sy = (img.naturalHeight - srcSize) / 2;

  const canvas = document.createElement('canvas');
  canvas.width  = maxSize;
  canvas.height = maxSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D コンテキストが取得できません');

  // 高品質スケーリング
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, maxSize, maxSize);

  // JPEG で出力（PNG だと容量が大きくなりがち、写真用途で十分）
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * data URI かどうか（旧 Storage URL と区別する用途）
 */
export function isDataUri(s) {
  return typeof s === 'string' && s.startsWith('data:');
}
