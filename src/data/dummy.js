/**
 * dummy.js — 開発用ダミーデータ
 *
 * Appwrite DB 連携前の UI 開発用に、仕様書の DB スキーマに合わせた
 * 架空のデータを提供する。後で各コレクションの取得関数に差し替える。
 */

// ============================================================
// ユーザー
// ============================================================
export const DUMMY_USERS = [
  { id: 'u1', full_name: '山田 太郎',   avatar_url: null, is_admin: true,  email: 'yamada@example.com' },
  { id: 'u2', full_name: '佐藤 花子',   avatar_url: null, is_admin: false, email: 'sato@example.com' },
  { id: 'u3', full_name: '鈴木 一郎',   avatar_url: null, is_admin: false, email: 'suzuki@example.com' },
  { id: 'u4', full_name: '田中 美咲',   avatar_url: null, is_admin: false, email: 'tanaka@example.com' },
  { id: 'u5', full_name: '高橋 健',     avatar_url: null, is_admin: false, email: 'takahashi@example.com' },
];

export const CURRENT_USER_ID = 'u1';

// ============================================================
// 部署
// ============================================================
export const DUMMY_DEPARTMENTS = [
  { id: 'd1', name: '営業部', description: '営業活動全般を担当' },
  { id: 'd2', name: '開発部', description: 'プロダクト開発を担当' },
  { id: 'd3', name: '管理部', description: '総務・人事・経理' },
];

// ============================================================
// チーム
// ============================================================
export const DUMMY_TEAMS = [
  { id: 't1', department_id: 'd1', name: '法人営業',     description: '法人顧客向け営業' },
  { id: 't2', department_id: 'd1', name: '個人営業',     description: '個人顧客向け営業' },
  { id: 't3', department_id: 'd2', name: 'フロントエンド', description: 'Web フロントエンド' },
  { id: 't4', department_id: 'd2', name: 'バックエンド',   description: 'API・DB' },
  { id: 't5', department_id: 'd3', name: '総務',           description: '社内総務' },
];

// ============================================================
// チームメンバー
// role: 'leader' | 'member'
//   leader はチームの代表者。チーム作成権限・自チーム編集権限を持つ。
//   1 つのチームに複数 leader を置くことも可能。
// ============================================================
export const DUMMY_TEAM_MEMBERS = [
  // 法人営業（営業部）
  { team_id: 't1', user_id: 'u3', role: 'leader' },
  { team_id: 't1', user_id: 'u2', role: 'member' },
  { team_id: 't1', user_id: 'u1', role: 'member' },  // u1 は営業部にも所属（マルチ部署）

  // 個人営業（営業部）
  { team_id: 't2', user_id: 'u2', role: 'leader' },

  // フロントエンド（開発部）
  { team_id: 't3', user_id: 'u1', role: 'leader' },  // u1 はリーダー
  { team_id: 't3', user_id: 'u4', role: 'member' },

  // バックエンド（開発部）
  { team_id: 't4', user_id: 'u5', role: 'leader' },
  { team_id: 't4', user_id: 'u1', role: 'member' },
];

// ============================================================
// 案件（プロジェクト）
// assignee_ids: 担当者の user_id 配列（複数可、仕様書 3-3）
// ============================================================
export const DUMMY_PROJECTS = [
  {
    id: 'p1', team_id: 't3', name: '社内ポータル刷新',
    description: '老朽化した社内ポータルサイトを React で刷新する',
    status: '進行中', priority: '高',
    start_date: '2026-04-01', end_date: '2026-06-30',
    assignee_ids: ['u1', 'u4'],
  },
  {
    id: 'p2', team_id: 't3', name: 'スマホアプリ開発',
    description: 'iOS/Android 両対応のネイティブアプリ',
    status: '未着手', priority: '中',
    start_date: '2026-05-15', end_date: '2026-09-30',
    assignee_ids: ['u1'],
  },
  {
    id: 'p3', team_id: 't1', name: '新規顧客開拓キャンペーン',
    description: 'Q2 の新規顧客獲得施策',
    status: '進行中', priority: '高',
    start_date: '2026-04-01', end_date: '2026-06-30',
    assignee_ids: ['u3', 'u2'],
  },
  {
    id: 'p4', team_id: 't4', name: 'API リファクタリング',
    description: 'レガシー API の段階的リファクタ',
    status: '保留', priority: '低',
    start_date: '2026-04-15', end_date: '2026-07-31',
    assignee_ids: ['u5'],
  },
];

// ============================================================
// タスク（親タスク）
// progress_mode: 'manual' | 'auto'
//   - manual: progress_rate を直接編集
//   - auto:   progress_rate は小タスクの完了率から自動計算
// ============================================================
export const DUMMY_TASKS = [
  { id: 'tk1', project_id: 'p1', name: '要件定義',         description: '機能要件・非機能要件の整理', status: '完了',   priority: '高', assignee_id: 'u1', start_date: '2026-04-01', due_date: '2026-04-15', progress_rate: 100, progress_mode: 'manual' },
  { id: 'tk2', project_id: 'p1', name: 'デザインモックアップ', description: 'Figma で各画面のモックを作成', status: '進行中', priority: '高', assignee_id: 'u4', start_date: '2026-04-10', due_date: '2026-05-05', progress_rate: 60,  progress_mode: 'auto' },
  { id: 'tk3', project_id: 'p1', name: 'フロントエンド実装', description: 'React + デザインシステムで実装', status: '進行中', priority: '中', assignee_id: 'u1', start_date: '2026-04-20', due_date: '2026-05-02', progress_rate: 30,  progress_mode: 'auto' },
  { id: 'tk4', project_id: 'p1', name: 'バックエンド連携',   description: '', status: '未着手', priority: '中', assignee_id: 'u5', start_date: '2026-05-15', due_date: '2026-06-20', progress_rate: 0, progress_mode: 'manual' },
  { id: 'tk5', project_id: 'p1', name: 'リリース準備',       description: '', status: '未着手', priority: '高', assignee_id: 'u1', start_date: '2026-06-15', due_date: '2026-06-30', progress_rate: 0, progress_mode: 'manual' },
  { id: 'tk10',project_id: 'p1', name: 'API 設計レビュー',   description: 'エンドポイント・スキーマのレビュー', status: '進行中', priority: '高', assignee_id: 'u1', start_date: '2026-04-22', due_date: '2026-04-27', progress_rate: 70, progress_mode: 'manual' },

  { id: 'tk6', project_id: 'p2', name: '技術選定',         description: 'RN vs ネイティブの比較検討', status: '未着手', priority: '高', assignee_id: 'u1', start_date: '2026-04-30', due_date: '2026-05-05', progress_rate: 0, progress_mode: 'manual' },
  { id: 'tk7', project_id: 'p2', name: 'プロトタイプ作成', description: '', status: '未着手', priority: '中', assignee_id: 'u4', start_date: '2026-06-01', due_date: '2026-06-30', progress_rate: 0, progress_mode: 'manual' },

  { id: 'tk8', project_id: 'p3', name: 'ターゲットリスト作成', description: '', status: '完了',   priority: '高', assignee_id: 'u2', start_date: '2026-04-01', due_date: '2026-04-10', progress_rate: 100, progress_mode: 'manual' },
  { id: 'tk9', project_id: 'p3', name: '訪問アポ取り',         description: '', status: '進行中', priority: '高', assignee_id: 'u3', start_date: '2026-04-08', due_date: '2026-05-31', progress_rate: 50,  progress_mode: 'manual' },
];

// ============================================================
// 小タスク
// ============================================================
export const DUMMY_SUBTASKS = [
  { id: 'st1', task_id: 'tk2', name: 'トップページ',     is_completed: true,  assignee_id: 'u4', due_date: '2026-04-25' },
  { id: 'st2', task_id: 'tk2', name: '一覧ページ',       is_completed: true,  assignee_id: 'u4', due_date: '2026-04-28' },
  { id: 'st3', task_id: 'tk2', name: '詳細ページ',       is_completed: false, assignee_id: 'u4', due_date: '2026-05-02' },
  { id: 'st4', task_id: 'tk2', name: '管理画面',         is_completed: false, assignee_id: 'u4', due_date: '2026-05-05' },
  { id: 'st5', task_id: 'tk3', name: 'コンポーネント設計', is_completed: true,  assignee_id: 'u1', due_date: '2026-04-25' },
  { id: 'st6', task_id: 'tk3', name: 'ルーティング実装',   is_completed: false, assignee_id: 'u1', due_date: '2026-05-10' },
];

// ============================================================
// スケジュール
// ============================================================
export const DUMMY_SCHEDULES = [
  { id: 's1', project_id: 'p1', title: 'キックオフミーティング', start_at: '2026-04-29T10:00:00', end_at: '2026-04-29T11:00:00', location: '会議室 A', memo: '全員参加' },
  { id: 's2', project_id: 'p1', title: 'デザインレビュー',       start_at: '2026-04-29T14:00:00', end_at: '2026-04-29T15:30:00', location: 'Zoom',     memo: '' },
  { id: 's3', project_id: 'p3', title: '営業定例',               start_at: '2026-04-29T16:00:00', end_at: '2026-04-29T17:00:00', location: '会議室 B', memo: '' },
];

// ============================================================
// 通知
// related_type / related_id: クリック時の遷移先を決める
//   'project' なら /projects/:id へ
//   'task' なら 親案件の /projects/:project_id へ（モーダル起動は将来）
// ============================================================
export const DUMMY_NOTIFICATIONS = [
  { id: 'n1', user_id: 'u1', type: 'task_assigned', title: '新しいタスクがアサインされました', body: '「リリース準備」が割り当てられました',     is_read: false, created_at: '2026-04-29T09:30:00', related_type: 'task', related_id: 'tk5' },
  { id: 'n2', user_id: 'u1', type: 'due_reminder',  title: '期限が近づいています',             body: '「フロントエンド実装」の期限まで 3 日',     is_read: false, created_at: '2026-04-28T08:00:00', related_type: 'task', related_id: 'tk3' },
  { id: 'n3', user_id: 'u1', type: 'task_assigned', title: 'タスクが更新されました',           body: '「要件定義」が完了になりました',             is_read: true,  created_at: '2026-04-25T15:00:00', related_type: 'task', related_id: 'tk1' },
  { id: 'n4', user_id: 'u1', type: 'due_reminder',  title: '期限超過があります',               body: '「API 設計レビュー」の期限を 2 日超過',     is_read: false, created_at: '2026-04-29T07:00:00', related_type: 'task', related_id: 'tk10' },
  { id: 'n5', user_id: 'u1', type: 'task_assigned', title: '案件に追加されました',             body: '案件「社内ポータル刷新」の担当者になりました', is_read: true,  created_at: '2026-04-22T11:00:00', related_type: 'project', related_id: 'p1' },
];

// ============================================================
// ヘルパー関数（よく使う検索）
// ============================================================
export const findUser       = (id) => DUMMY_USERS.find(u => u.id === id);
export const findDepartment = (id) => DUMMY_DEPARTMENTS.find(d => d.id === id);
export const findTeam       = (id) => DUMMY_TEAMS.find(t => t.id === id);
export const findProject    = (id) => DUMMY_PROJECTS.find(p => p.id === id);
export const findTask       = (id) => DUMMY_TASKS.find(t => t.id === id);

export const teamsByDepartment = (departmentId) =>
  DUMMY_TEAMS.filter(t => t.department_id === departmentId);

export const projectsByTeam = (teamId) =>
  DUMMY_PROJECTS.filter(p => p.team_id === teamId);

export const tasksByProject = (projectId) =>
  DUMMY_TASKS.filter(t => t.project_id === projectId);

export const subtasksByTask = (taskId) =>
  DUMMY_SUBTASKS.filter(st => st.task_id === taskId);

export const myTasks = (userId = CURRENT_USER_ID) =>
  DUMMY_TASKS.filter(t => t.assignee_id === userId);

export const todaySchedules = () => {
  const today = new Date().toISOString().slice(0, 10);
  return DUMMY_SCHEDULES.filter(s => s.start_at.slice(0, 10) === today);
};

export const myNotifications = (userId = CURRENT_USER_ID) =>
  DUMMY_NOTIFICATIONS.filter(n => n.user_id === userId);

// ============================================================
// 日付ヘルパー
// ============================================================
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today().getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export { daysUntil };

// ============================================================
// ダッシュボード用の集計
// ============================================================

// 自分の担当でかつ未完了なタスクを期限が近い順にソート
export const myOpenTasks = (userId = CURRENT_USER_ID) =>
  DUMMY_TASKS
    .filter(t => t.assignee_id === userId && t.status !== '完了')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

// 期限が迫るタスク：期限超過 + N 日以内（デフォルト 7 日）
export const upcomingTasks = (userId = CURRENT_USER_ID, withinDays = 7) =>
  myOpenTasks(userId).filter(t => {
    if (!t.due_date) return false;
    const d = daysUntil(t.due_date);
    return d <= withinDays;  // 過去（マイナス）= 期限超過 も含む
  });

// 自分のタスクをステータス別にグルーピング
export const myTasksByStatus = (userId = CURRENT_USER_ID) => {
  const tasks = DUMMY_TASKS.filter(t => t.assignee_id === userId);
  return {
    '未着手': tasks.filter(t => t.status === '未着手'),
    '進行中': tasks.filter(t => t.status === '進行中'),
    '完了':   tasks.filter(t => t.status === '完了'),
  };
};

// 自分が所属するチームの案件
export const myProjects = (userId = CURRENT_USER_ID) => {
  const myTeamIds = DUMMY_TEAM_MEMBERS
    .filter(tm => tm.user_id === userId)
    .map(tm => tm.team_id);
  return DUMMY_PROJECTS.filter(p => myTeamIds.includes(p.team_id));
};

// 案件の進捗率：所属タスクの progress_rate 平均
export const projectProgress = (projectId) => {
  const tasks = tasksByProject(projectId);
  if (tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => acc + (t.progress_rate || 0), 0);
  return Math.round(sum / tasks.length);
};

// ============================================================
// チーム・メンバー関連
// ============================================================

// 自分が所属するチーム ID 一覧
export const myTeamIds = (userId = CURRENT_USER_ID) =>
  DUMMY_TEAM_MEMBERS
    .filter(tm => tm.user_id === userId)
    .map(tm => tm.team_id);

// 自分が所属するチーム一覧
export const myTeams = (userId = CURRENT_USER_ID) => {
  const ids = myTeamIds(userId);
  return DUMMY_TEAMS.filter(t => ids.includes(t.id));
};

// 自分が所属する部署一覧（重複除去）
export const myDepartments = (userId = CURRENT_USER_ID) => {
  const teams = myTeams(userId);
  const deptIds = [...new Set(teams.map(t => t.department_id))];
  return deptIds
    .map(id => findDepartment(id))
    .filter(Boolean);
};

// 自分の所属部署のチーム一覧（同部署の他チームも閲覧可能）
export const visibleTeams = (userId = CURRENT_USER_ID) => {
  const myDeptIds = myDepartments(userId).map(d => d.id);
  return DUMMY_TEAMS.filter(t => myDeptIds.includes(t.department_id));
};

// 自分の所属部署のメンバー一覧（同部署の他チームメンバーも閲覧可能）
export const visibleMembers = (userId = CURRENT_USER_ID) => {
  const visibleTeamIds = visibleTeams(userId).map(t => t.id);
  const userIds = [...new Set(
    DUMMY_TEAM_MEMBERS
      .filter(tm => visibleTeamIds.includes(tm.team_id))
      .map(tm => tm.user_id)
  )];
  return userIds.map(id => findUser(id)).filter(Boolean);
};

// チームのメンバー一覧
export const membersOfTeam = (teamId) => {
  return DUMMY_TEAM_MEMBERS
    .filter(tm => tm.team_id === teamId)
    .map(tm => ({ ...findUser(tm.user_id), role: tm.role }))
    .filter(u => u.id);
};

// 特定ユーザーがチームメンバーシップで持つ全 role 情報を返す
//   [{ team_id, role }]
export const teamMembershipsOf = (userId = CURRENT_USER_ID) =>
  DUMMY_TEAM_MEMBERS.filter(tm => tm.user_id === userId);

// ============================================================
// 権限判定
// ============================================================

// チームリーダーである（=どこかのチームで role='leader' を持つ）
export const isTeamLeader = (userId = CURRENT_USER_ID) =>
  DUMMY_TEAM_MEMBERS.some(tm => tm.user_id === userId && tm.role === 'leader');

// 特定チームのリーダーである
export const isLeaderOf = (userId, teamId) =>
  DUMMY_TEAM_MEMBERS.some(
    tm => tm.user_id === userId && tm.team_id === teamId && tm.role === 'leader'
  );

// チーム作成権限：管理者 または チームリーダー
export const canCreateTeam = (user) =>
  Boolean(user?.is_admin) || isTeamLeader(user?.id);

// 特定チームを編集できる：管理者 または そのチームのリーダー
export const canEditTeam = (user, teamId) =>
  Boolean(user?.is_admin) || isLeaderOf(user?.id, teamId);

// 特定チームのメンバーである
export const isMemberOf = (userId, teamId) =>
  DUMMY_TEAM_MEMBERS.some(tm => tm.user_id === userId && tm.team_id === teamId);

// 案件作成権限：管理者 または いずれかのチームのメンバー
export const canCreateProject = (user) =>
  Boolean(user?.is_admin) ||
  DUMMY_TEAM_MEMBERS.some(tm => tm.user_id === user?.id);

// 案件編集権限：管理者 または 該当チームのメンバー
export const canEditProject = (user, project) => {
  if (user?.is_admin) return true;
  if (!project) return false;
  return isMemberOf(user?.id, project.team_id);
};

// ============================================================
// 案件の担当者・チームメンバー
// ============================================================
export const assigneesOfProject = (project) => {
  if (!project?.assignee_ids) return [];
  return project.assignee_ids.map(id => findUser(id)).filter(Boolean);
};

// 案件のチームのメンバー一覧（担当者の選択肢として使う）
export const teamMembersForProject = (project) => {
  if (!project?.team_id) return [];
  return membersOfTeam(project.team_id);
};

// ============================================================
// タスク権限・進捗計算
// ============================================================

// 案件のチームに所属している（または Admin）
export const canCreateTask = (user, project) => {
  if (user?.is_admin) return true;
  if (!project) return false;
  return isMemberOf(user?.id, project.team_id);
};

// 同上（タスク単位の編集判定）
export const canEditTask = (user, task) => {
  if (user?.is_admin) return true;
  if (!task) return false;
  const project = findProject(task.project_id);
  return canCreateTask(user, project);
};

// ============================================================
// 管理者ダッシュボード用の集計
// ============================================================

// チームごとの案件サマリー：完了 / 全体・平均進捗
export const teamProjectSummary = (teamId) => {
  const projects = projectsByTeam(teamId);
  if (projects.length === 0) {
    return { count: 0, completedCount: 0, avgProgress: 0 };
  }
  const completedCount = projects.filter(p => p.status === '完了').length;
  const sumProgress = projects.reduce((acc, p) => acc + projectProgress(p.id), 0);
  return {
    count: projects.length,
    completedCount,
    avgProgress: Math.round(sumProgress / projects.length),
  };
};

// メンバー別タスク負荷：未完了タスク数 + 期限超過数
export const memberWorkloads = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return DUMMY_USERS.map(u => {
    const myAll = DUMMY_TASKS.filter(t => t.assignee_id === u.id);
    const open = myAll.filter(t => t.status !== '完了');
    const overdue = open.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < today;
    });
    return {
      user: u,
      total: myAll.length,
      openCount: open.length,
      overdueCount: overdue.length,
    };
  }).sort((a, b) => b.openCount - a.openCount);
};

// 期限超過の全タスク
export const overdueTasks = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return DUMMY_TASKS.filter(t => {
    if (!t.due_date || t.status === '完了') return false;
    return new Date(t.due_date) < today;
  }).sort((a, b) => a.due_date.localeCompare(b.due_date));
};

// 小タスクの完了率（auto モード時の親タスク進捗率の元）
//   subtasks が空なら 0 を返す。
export const subtaskProgress = (taskId, overrideSubtasks) => {
  const list = overrideSubtasks ?? subtasksByTask(taskId);
  if (list.length === 0) return 0;
  const done = list.filter(s => s.is_completed).length;
  return Math.round((done / list.length) * 100);
};

// タスクの進捗率：mode に応じて返す
//   - auto:   小タスクから自動計算（overrideSubtasks 指定可、編集中ライブ反映用）
//   - manual: progress_rate を返す
export const computedProgress = (task, overrideSubtasks) => {
  if (!task) return 0;
  if (task.progress_mode === 'auto') return subtaskProgress(task.id, overrideSubtasks);
  return task.progress_rate ?? 0;
};
