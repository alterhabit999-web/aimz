/**
 * api/index.js — Appwrite データアクセス層の入口
 *
 * 各画面は `import { listProjects } from '../api'` のように使う。
 * 内部で profiles/teams/projects 等のモジュールに振り分け、
 * 将来的なダミー → 実 DB の差し替えやキャッシュ層挿入に備える。
 */

export { COLLECTIONS } from './collections';
export * from './profiles';
export * from './departments';
export * from './teams';
export * from './team-members';
export * from './projects';
export * from './project-assignees';
export * from './tasks';
export * from './subtasks';
export * from './schedules';
export * from './schedule-participants';
export * from './notifications';
export * from './project-files';
export * from './comments';
