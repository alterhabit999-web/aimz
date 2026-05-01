/**
 * api/index.js — Appwrite データアクセス層の入口
 *
 * 各画面は `import { listProjects } from '../api'` のように使う。
 * 内部で profiles/teams/projects 等のモジュールに振り分け、
 * 将来的なダミー → 実 DB の差し替えやキャッシュ層挿入に備える。
 */

export { COLLECTIONS } from './collections';
export * from './profiles';
// 後続の機能実装で順次追加：
// export * from './departments';
// export * from './teams';
// export * from './projects';
// export * from './tasks';
// ...
