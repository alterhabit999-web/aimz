/**
 * api/collections.js — Appwrite コレクション ID 定数
 *
 * scripts/schema.js で作成しているコレクション ID と一致させる。
 * 各 API モジュールはこの定数を import して databases.* を呼ぶ。
 */

export const COLLECTIONS = {
  PROFILES:              'profiles',
  DEPARTMENTS:           'departments',
  TEAMS:                 'teams',
  TEAM_MEMBERS:          'team_members',
  PROJECTS:              'projects',
  PROJECT_ASSIGNEES:     'project_assignees',
  TASKS:                 'tasks',
  SUBTASKS:              'subtasks',
  SCHEDULES:             'schedules',
  SCHEDULE_PARTICIPANTS: 'schedule_participants',
  PROJECT_FILES:         'project_files',
  NOTIFICATIONS:         'notifications',
  INVITATIONS:           'invitations',
};
