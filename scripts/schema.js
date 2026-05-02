/**
 * schema.js — AimZ の Appwrite コレクション定義（13 個）
 *
 * setup-appwrite.js から読み込み、コレクション・属性・インデックスを一括作成する。
 * 仕様書 v1.4 セクション 5 に準拠。
 *
 * ─ 設計方針 ─
 *   - id 系のカラムは Appwrite ドキュメント ID（string）として扱うため、外部キー風のフィールドは
 *     `string(36)` で持つ（DB 側の参照整合制約は持たない＝アプリ側で担保）。
 *   - 日付フィールドは Appwrite の `datetime` 型で統一。日付のみのケースも ISO8601 で保存する。
 *   - boolean / integer / string / enum / email を使用。
 *   - profiles の primary key は Appwrite Auth の userId と同一値を documentId に使う運用。
 */

const collections = [
  // ─────────── 1. profiles ───────────
  {
    id: 'profiles',
    name: 'Profiles',
    documentSecurity: false,
    attributes: [
      { key: 'full_name',  type: 'string',   size: 100, required: true },
      { key: 'email',      type: 'email',                required: false },
      { key: 'avatar_url', type: 'string',   size: 500, required: false },
      { key: 'is_admin',   type: 'boolean',              required: false, default: false },
      { key: 'is_active',  type: 'boolean',              required: false, default: true },
    ],
    indexes: [
      { key: 'email_idx',     type: 'unique', attributes: ['email'] },
      { key: 'is_admin_idx',  type: 'key',    attributes: ['is_admin'] },
      { key: 'full_name_idx', type: 'key',    attributes: ['full_name'] },
    ],
  },

  // ─────────── 2. departments ───────────
  {
    id: 'departments',
    name: 'Departments',
    documentSecurity: false,
    attributes: [
      { key: 'name',        type: 'string', size: 100,  required: true },
      { key: 'description', type: 'string', size: 500,  required: false },
      { key: 'created_by',  type: 'string', size: 36,   required: false },
    ],
    indexes: [
      { key: 'name_idx', type: 'unique', attributes: ['name'] },
    ],
  },

  // ─────────── 3. teams ───────────
  {
    id: 'teams',
    name: 'Teams',
    documentSecurity: false,
    attributes: [
      { key: 'department_id', type: 'string', size: 36,  required: true },
      { key: 'name',          type: 'string', size: 100, required: true },
      { key: 'description',   type: 'string', size: 500, required: false },
      { key: 'created_by',    type: 'string', size: 36,  required: false },
    ],
    indexes: [
      { key: 'department_idx',     type: 'key',    attributes: ['department_id'] },
      { key: 'department_name_idx', type: 'unique', attributes: ['department_id', 'name'] },
    ],
  },

  // ─────────── 4. team_members ───────────
  {
    id: 'team_members',
    name: 'Team Members',
    documentSecurity: false,
    attributes: [
      { key: 'team_id', type: 'string', size: 36, required: true },
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'role',    type: 'enum',   elements: ['leader', 'member'], required: false, default: 'member' },
    ],
    indexes: [
      { key: 'team_idx',         type: 'key',    attributes: ['team_id'] },
      { key: 'user_idx',         type: 'key',    attributes: ['user_id'] },
      { key: 'team_user_idx',    type: 'unique', attributes: ['team_id', 'user_id'] },
    ],
  },

  // ─────────── 5. projects ───────────
  {
    id: 'projects',
    name: 'Projects',
    documentSecurity: false,
    attributes: [
      { key: 'team_id',     type: 'string',   size: 36,   required: true },
      { key: 'name',        type: 'string',   size: 200,  required: true },
      { key: 'description', type: 'string',   size: 2000, required: false },
      { key: 'status',      type: 'enum',     elements: ['未着手', '進行中', '完了', '保留'], required: false, default: '未着手' },
      { key: 'priority',    type: 'enum',     elements: ['高', '中', '低'], required: false, default: '中' },
      { key: 'start_date',  type: 'datetime',             required: false },
      { key: 'end_date',    type: 'datetime',             required: false },
      { key: 'created_by',  type: 'string',   size: 36,   required: false },
    ],
    indexes: [
      { key: 'team_idx',   type: 'key', attributes: ['team_id'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
    ],
  },

  // ─────────── 6. project_assignees ───────────
  {
    id: 'project_assignees',
    name: 'Project Assignees',
    documentSecurity: false,
    attributes: [
      { key: 'project_id', type: 'string', size: 36, required: true },
      { key: 'user_id',    type: 'string', size: 36, required: true },
    ],
    indexes: [
      { key: 'project_idx',         type: 'key',    attributes: ['project_id'] },
      { key: 'user_idx',            type: 'key',    attributes: ['user_id'] },
      { key: 'project_user_idx',    type: 'unique', attributes: ['project_id', 'user_id'] },
    ],
  },

  // ─────────── 7. tasks ───────────
  {
    id: 'tasks',
    name: 'Tasks',
    documentSecurity: false,
    attributes: [
      { key: 'project_id',    type: 'string',   size: 36,   required: true },
      { key: 'name',          type: 'string',   size: 200,  required: true },
      { key: 'description',   type: 'string',   size: 2000, required: false },
      { key: 'status',        type: 'enum',     elements: ['未着手', '進行中', '完了'], required: false, default: '未着手' },
      { key: 'priority',      type: 'enum',     elements: ['高', '中', '低'], required: false, default: '中' },
      { key: 'assignee_id',   type: 'string',   size: 36,   required: false },
      { key: 'start_date',    type: 'datetime',             required: false },
      { key: 'due_date',      type: 'datetime',             required: false },
      { key: 'progress_mode', type: 'enum',     elements: ['manual', 'auto'], required: false, default: 'manual' },
      { key: 'progress_rate', type: 'integer',  min: 0, max: 100, required: false, default: 0 },
      { key: 'order_index',   type: 'integer',  required: false, default: 0 },
      { key: 'created_by',    type: 'string',   size: 36,   required: false },
    ],
    indexes: [
      { key: 'project_idx',  type: 'key', attributes: ['project_id'] },
      { key: 'assignee_idx', type: 'key', attributes: ['assignee_id'] },
      { key: 'status_idx',   type: 'key', attributes: ['status'] },
      { key: 'due_date_idx', type: 'key', attributes: ['due_date'] },
    ],
  },

  // ─────────── 8. subtasks ───────────
  {
    id: 'subtasks',
    name: 'Subtasks',
    documentSecurity: false,
    attributes: [
      { key: 'task_id',      type: 'string',   size: 36,  required: true },
      { key: 'name',         type: 'string',   size: 200, required: true },
      { key: 'is_completed', type: 'boolean',             required: false, default: false },
      { key: 'assignee_id',  type: 'string',   size: 36,  required: false },
      { key: 'due_date',     type: 'datetime',            required: false },
      { key: 'order_index',  type: 'integer',             required: false, default: 0 },
    ],
    indexes: [
      { key: 'task_idx', type: 'key', attributes: ['task_id'] },
    ],
  },

  // ─────────── 9. schedules ───────────
  {
    id: 'schedules',
    name: 'Schedules',
    documentSecurity: false,
    attributes: [
      { key: 'project_id', type: 'string',   size: 36,   required: false },
      { key: 'title',      type: 'string',   size: 200,  required: true },
      { key: 'start_at',   type: 'datetime',             required: true },
      { key: 'end_at',     type: 'datetime',             required: true },
      { key: 'location',   type: 'string',   size: 500,  required: false },
      { key: 'memo',       type: 'string',   size: 2000, required: false },
      { key: 'created_by', type: 'string',   size: 36,   required: false },
    ],
    indexes: [
      { key: 'project_idx',  type: 'key', attributes: ['project_id'] },
      { key: 'start_at_idx', type: 'key', attributes: ['start_at'] },
    ],
  },

  // ─────────── 10. schedule_participants ───────────
  {
    id: 'schedule_participants',
    name: 'Schedule Participants',
    documentSecurity: false,
    attributes: [
      { key: 'schedule_id', type: 'string', size: 36, required: true },
      { key: 'user_id',     type: 'string', size: 36, required: true },
    ],
    indexes: [
      { key: 'schedule_idx',         type: 'key',    attributes: ['schedule_id'] },
      { key: 'user_idx',             type: 'key',    attributes: ['user_id'] },
      { key: 'schedule_user_idx',    type: 'unique', attributes: ['schedule_id', 'user_id'] },
    ],
  },

  // ─────────── 11. project_files ───────────
  {
    id: 'project_files',
    name: 'Project Files',
    documentSecurity: false,
    attributes: [
      { key: 'project_id',  type: 'string',  size: 36,  required: true },
      { key: 'file_name',   type: 'string',  size: 200, required: true },
      { key: 'file_id',     type: 'string',  size: 36,  required: true },
      { key: 'file_size',   type: 'integer',            required: false },
      { key: 'mime_type',   type: 'string',  size: 100, required: false },
      { key: 'uploaded_by', type: 'string',  size: 36,  required: false },
    ],
    indexes: [
      { key: 'project_idx', type: 'key', attributes: ['project_id'] },
    ],
  },

  // ─────────── 12. notifications ───────────
  {
    id: 'notifications',
    name: 'Notifications',
    documentSecurity: false,
    attributes: [
      { key: 'user_id',      type: 'string',  size: 36,  required: true },
      { key: 'type',         type: 'string',  size: 50,  required: true },
      { key: 'title',        type: 'string',  size: 200, required: true },
      { key: 'body',         type: 'string',  size: 1000, required: false },
      // クリック時の遷移先を判別する用：'task' | 'project'（v7 で追加）
      { key: 'related_type', type: 'string',  size: 20,  required: false },
      { key: 'related_id',   type: 'string',  size: 36,  required: false },
      { key: 'is_read',      type: 'boolean',            required: false, default: false },
    ],
    indexes: [
      { key: 'user_idx',    type: 'key', attributes: ['user_id'] },
      { key: 'is_read_idx', type: 'key', attributes: ['is_read'] },
    ],
  },

  // ─────────── 13. invitations ───────────
  {
    id: 'invitations',
    name: 'Invitations',
    documentSecurity: false,
    attributes: [
      { key: 'email',      type: 'email',                required: true },
      { key: 'token',      type: 'string',   size: 64,   required: true },
      { key: 'is_admin',   type: 'boolean',              required: false, default: false },
      { key: 'message',    type: 'string',   size: 1000, required: false },
      { key: 'invited_by', type: 'string',   size: 36,   required: false },
      { key: 'is_used',    type: 'boolean',              required: false, default: false },
      { key: 'expires_at', type: 'datetime',             required: true },
    ],
    indexes: [
      { key: 'email_idx', type: 'unique', attributes: ['email'] },
      { key: 'token_idx', type: 'unique', attributes: ['token'] },
    ],
  },
];

module.exports = { collections };
