// ================================
// CHUẨN HÓA QUERY KEYS - VERSION 3.1 (FIXED)
// ================================

// Solution 1: Define the type explicitly
interface QueryKeys {
  auth: {
    all: readonly ['auth'];
    profile: (userId?: string) => readonly ['auth', 'profile', string | undefined];
    check: (userId?: string) => readonly ['auth', 'check', string | undefined];
    permissions: (userId?: string) => readonly ['auth', 'permissions', string | undefined];
  };
  users: {
    all: readonly ['users'];
    lists: () => readonly ['users', 'list'];
    list: (page: number, limit: number) => readonly ['users', 'list', number, number];
    details: () => readonly ['users', 'detail'];
    detail: (id: string) => readonly ['users', 'detail', string];
    profile: readonly ['users', 'profile'];
    withRanking: (filters?: any) => readonly ['users', 'with-ranking', string];
  };
  organizations: {
    all: readonly ['organizations'];
    offices: readonly ['organizations', 'offices'];
    departments: readonly ['organizations', 'departments'];
    positions: readonly ['organizations', 'positions'];
    jobPositions: readonly ['organizations', 'job-positions'];
  };
  reports: {
    all: readonly ['reports'];
    user: (userId: string) => readonly ['reports', 'user', string];
    myReports: (userId: string, page?: number, limit?: number) => readonly ['reports', 'user', string, 'my', number, number];
    byId: (userId: string, reportId: string) => readonly ['reports', 'user', string, 'byId', string];
    byWeek: (userId: string, weekNumber: number, year: number) => readonly ['reports', 'user', string, 'byWeek', number, number];
    currentWeek: (userId: string) => readonly ['reports', 'user', string, 'currentWeek'];
    adminReports: (userId: string, filters?: any) => readonly ['reports', 'admin', string, string];
  };
  evaluations: {
    all: readonly ['evaluations'];
    task: (taskId: string) => readonly ['evaluations', 'task', string];
    user: (userId: string) => readonly ['evaluations', 'user', string];
    myEvaluations: (userId: string, params?: any) => readonly ['evaluations', 'user', string, 'my', string];
    evaluableTasks: (userId: string, params?: any) => readonly ['evaluations', 'evaluable', string, string];
  };
  hierarchy: {
    all: readonly ['hierarchy'];
    myView: (userId: string, filters?: any) => readonly ['hierarchy', 'myView', string, string];
    userDetails: (viewerId: string, targetUserId: string, filters?: any) => readonly ['hierarchy', 'userDetails', string, string, string];
    managerReports: (userId: string, filters?: any) => readonly ['hierarchy', 'managerReports', string, string];
    reportDetailsAdmin: (userId: string, reportId: string) => readonly ['hierarchy', 'reportDetailsAdmin', string, string];
    userReports: (userId: string, filters?: any) => readonly ['hierarchy', 'userReports', string, string];
  };
  statistics: {
    all: readonly ['statistics'];
    user: (userId: string) => readonly ['statistics', 'user', string];
    dashboard: (userId: string) => readonly ['statistics', 'user', string, 'dashboard'];
    dashboardCombined: (userId: string) => readonly ['statistics', 'user', string, 'dashboard-combined'];
    userReports: (userId: string) => readonly ['statistics', 'user', string, 'reports'];
    weeklyTaskStats: (userId: string, filters?: any) => readonly ['statistics', 'user', string, 'weekly-task-stats', string];
    monthlyTaskStats: (userId: string, year?: number) => readonly ['statistics', 'user', string, 'monthly-task-stats', number | undefined];
    yearlyTaskStats: (userId: string) => readonly ['statistics', 'user', string, 'yearly-task-stats'];
    recentActivities: (userId: string) => readonly ['statistics', 'user', string, 'recent-activities'];
    incompleteReasonsAnalysis: (userId: string, filters: any) => readonly ['statistics', 'user', string, 'incomplete-reasons-analysis', string];
    adminDashboard: (userId: string, filters?: any) => readonly ['statistics', 'user', string, 'admin-dashboard', string];
    overview: (userId: string) => readonly ['statistics', 'user', string, 'overview'];
    completionRate: (userId: string, filters?: any) => readonly ['statistics', 'user', string, 'completion-rate', string];
    missingReports: (userId: string, filters?: any) => readonly ['statistics', 'user', string, 'missing-reports', string];
    summaryReport: (userId: string, filters?: any) => readonly ['statistics', 'user', string, 'summary-report', string];
  };
}

// Helper to allow self-referencing in QUERY_KEYS
function createQueryKeys<T extends QueryKeys>(keys: (self: T) => T): T {
  let result = {} as T;
  result = keys(result);
  return result;
}

// export const QUERY_KEYS = createQueryKeys<QueryKeys>((QUERY_KEYS) => ({
//   // ===== AUTH QUERIES =====
//   auth: {
//     all: ['auth'] as const,
//     profile: (userId?: string) => ['auth', 'profile', userId] as const,
//     check: (userId?: string) => ['auth', 'check', userId] as const,
//     permissions: (userId?: string) => ['auth', 'permissions', userId] as const,
//   },

//   // ===== USERS QUERIES =====
//   users: {
//     all: ['users'] as const,
//     lists: () => [...QUERY_KEYS.users.all, 'list'] as const,
//     list: (page: number, limit: number) => [...QUERY_KEYS.users.lists(), page, limit] as const,
//     details: () => [...QUERY_KEYS.users.all, 'detail'] as const,
//     detail: (id: string) => [...QUERY_KEYS.users.details(), id] as const,
//     profile: ['users', 'profile'] as const,
//     withRanking: (filters?: any) => [...QUERY_KEYS.users.all, 'with-ranking', JSON.stringify(filters || {})] as const,
//   },

//   // ===== ORGANIZATIONS QUERIES =====
//   organizations: {
//     all: ['organizations'] as const,
//     offices: ['organizations', 'offices'] as const,
//     departments: ['organizations', 'departments'] as const,
//     positions: ['organizations', 'positions'] as const,
//     jobPositions: ['organizations', 'job-positions'] as const,
//   },

//   // ===== REPORTS QUERIES =====
//   reports: {
//     all: ['reports'] as const,
//     user: (userId: string) => [...QUERY_KEYS.reports.all, 'user', userId] as const,
//     myReports: (userId: string, page?: number, limit?: number) => [...QUERY_KEYS.reports.user(userId), 'my', page || 1, limit || 10] as const,
//     byId: (userId: string, reportId: string) => [...QUERY_KEYS.reports.user(userId), 'byId', reportId] as const,
//     byWeek: (userId: string, weekNumber: number, year: number) => [...QUERY_KEYS.reports.user(userId), 'byWeek', weekNumber, year] as const,
//     currentWeek: (userId: string) => [...QUERY_KEYS.reports.user(userId), 'currentWeek'] as const,
//     adminReports: (userId: string, filters?: any) => [...QUERY_KEYS.reports.all, 'admin', userId, JSON.stringify(filters || {})] as const,
//   },

//   // ===== TASK EVALUATIONS QUERIES =====
//   evaluations: {
//     all: ['evaluations'] as const,
//     task: (taskId: string) => [...QUERY_KEYS.evaluations.all, 'task', taskId] as const,
//     user: (userId: string) => [...QUERY_KEYS.evaluations.all, 'user', userId] as const,
//     myEvaluations: (userId: string, params?: any) => [...QUERY_KEYS.evaluations.user(userId), 'my', JSON.stringify(params || {})] as const,
//     evaluableTasks: (userId: string, params?: any) => [...QUERY_KEYS.evaluations.all, 'evaluable', userId, JSON.stringify(params || {})] as const,
//   },

//   // ===== HIERARCHY QUERIES =====
//   hierarchy: {
//     all: ['hierarchy'] as const,
//     myView: (userId: string, filters?: any) => [...QUERY_KEYS.hierarchy.all, 'myView', userId, JSON.stringify(filters || {})] as const,
//     userDetails: (viewerId: string, targetUserId: string, filters?: any) => [...QUERY_KEYS.hierarchy.all, 'userDetails', viewerId, targetUserId, JSON.stringify(filters || {})] as const,
//     managerReports: (userId: string, filters?: any) => [...QUERY_KEYS.hierarchy.all, 'managerReports', userId, JSON.stringify(filters || {})] as const,
//     reportDetailsAdmin: (userId: string, reportId: string) => [...QUERY_KEYS.hierarchy.all, 'reportDetailsAdmin', userId, reportId] as const,
//     userReports: (userId: string, filters?: any) => [...QUERY_KEYS.hierarchy.all, 'userReports', userId, JSON.stringify(filters || {})] as const,
//   },

//   // ===== STATISTICS QUERIES =====
//   statistics: {
//     all: ['statistics'] as const,
//     user: (userId: string) => [...QUERY_KEYS.statistics.all, 'user', userId] as const,
//     dashboard: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'dashboard'] as const,
//     dashboardCombined: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'dashboard-combined'] as const,
//     userReports: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'reports'] as const,
//     weeklyTaskStats: (userId: string, filters?: any) => [...QUERY_KEYS.statistics.user(userId), 'weekly-task-stats', JSON.stringify(filters || {})] as const,
//     monthlyTaskStats: (userId: string, year?: number) => [...QUERY_KEYS.statistics.user(userId), 'monthly-task-stats', year] as const,
//     yearlyTaskStats: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'yearly-task-stats'] as const,
//     recentActivities: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'recent-activities'] as const,
//     incompleteReasonsAnalysis: (userId: string, filters: any) => [...QUERY_KEYS.statistics.user(userId), 'incomplete-reasons-analysis', JSON.stringify(filters)] as const,
//     adminDashboard: (userId: string, filters?: any) => [...QUERY_KEYS.statistics.user(userId), 'admin-dashboard', JSON.stringify(filters || {})] as const,
//     overview: (userId: string) => [...QUERY_KEYS.statistics.user(userId), 'overview'] as const,
//     completionRate: (userId: string, filters?: any) => [...QUERY_KEYS.statistics.user(userId), 'completion-rate', JSON.stringify(filters || {})] as const,
//     missingReports: (userId: string, filters?: any) => [...QUERY_KEYS.statistics.user(userId), 'missing-reports', JSON.stringify(filters || {})] as const,
//     summaryReport: (userId: string, filters?: any) => [...QUERY_KEYS.statistics.user(userId), 'summary-report', JSON.stringify(filters || {})] as const,
//   },
// }));

// Alternative Solution 3: Factory Pattern (Recommended for complex self-referencing)
function createQueryKeysFactory() {
  const base = {
    auth: {
      all: ['auth'] as const,
    },
    users: {
      all: ['users'] as const,
    },
    organizations: {
      all: ['organizations'] as const,
    },
    reports: {
      all: ['reports'] as const,
    },
    evaluations: {
      all: ['evaluations'] as const,
    },
    hierarchy: {
      all: ['hierarchy'] as const,
    },
    statistics: {
      all: ['statistics'] as const,
    },
  };

  return {
    // ===== AUTH QUERIES =====
    auth: {
      ...base.auth,
      profile: (userId?: string) => ['auth', 'profile', userId] as const,
      check: (userId?: string) => ['auth', 'check', userId] as const,
      permissions: (userId?: string) => ['auth', 'permissions', userId] as const,
    },

    // ===== USERS QUERIES =====
    users: {
      ...base.users,
      lists: () => [...base.users.all, 'list'] as const,
      list: (page: number, limit: number) => [...base.users.all, 'list', page, limit] as const,
      details: () => [...base.users.all, 'detail'] as const,
      detail: (id: string) => [...base.users.all, 'detail', id] as const,
      profile: ['users', 'profile'] as const,
      withRanking: (filters?: any) => [...base.users.all, 'with-ranking', JSON.stringify(filters || {})] as const,
    },

    // ===== ORGANIZATIONS QUERIES =====
    organizations: {
      ...base.organizations,
      offices: [...base.organizations.all, 'offices'] as const,
      departments: [...base.organizations.all, 'departments'] as const,
      positions: [...base.organizations.all, 'positions'] as const,
      jobPositions: [...base.organizations.all, 'job-positions'] as const,
    },

    // ===== REPORTS QUERIES =====
    reports: {
      ...base.reports,
      user: (userId: string) => [...base.reports.all, 'user', userId] as const,
      myReports: (userId: string, page?: number, limit?: number) => [...base.reports.all, 'user', userId, 'my', page || 1, limit || 10] as const,
      byId: (userId: string, reportId: string) => [...base.reports.all, 'user', userId, 'byId', reportId] as const,
      byWeek: (userId: string, weekNumber: number, year: number) => [...base.reports.all, 'user', userId, 'byWeek', weekNumber, year] as const,
      currentWeek: (userId: string) => [...base.reports.all, 'user', userId, 'currentWeek'] as const,
      adminReports: (userId: string, filters?: any) => [...base.reports.all, 'admin', userId, JSON.stringify(filters || {})] as const,
    },

    // ===== TASK EVALUATIONS QUERIES =====
    evaluations: {
      ...base.evaluations,
      task: (taskId: string) => [...base.evaluations.all, 'task', taskId] as const,
      user: (userId: string) => [...base.evaluations.all, 'user', userId] as const,
      myEvaluations: (userId: string, params?: any) => [...base.evaluations.all, 'user', userId, 'my', JSON.stringify(params || {})] as const,
      evaluableTasks: (userId: string, params?: any) => [...base.evaluations.all, 'evaluable', userId, JSON.stringify(params || {})] as const,
    },

    // ===== HIERARCHY QUERIES =====
    hierarchy: {
      ...base.hierarchy,
      myView: (userId: string, filters?: any) => [...base.hierarchy.all, 'myView', userId, JSON.stringify(filters || {})] as const,
      userDetails: (viewerId: string, targetUserId: string, filters?: any) => [...base.hierarchy.all, 'userDetails', viewerId, targetUserId, JSON.stringify(filters || {})] as const,
      managerReports: (userId: string, filters?: any) => [...base.hierarchy.all, 'managerReports', userId, JSON.stringify(filters || {})] as const,
      reportDetailsAdmin: (userId: string, reportId: string) => [...base.hierarchy.all, 'reportDetailsAdmin', userId, reportId] as const,
      userReports: (userId: string, filters?: any) => [...base.hierarchy.all, 'userReports', userId, JSON.stringify(filters || {})] as const,
    },

    // ===== STATISTICS QUERIES =====
    statistics: {
      ...base.statistics,
      user: (userId: string) => [...base.statistics.all, 'user', userId] as const,
      dashboard: (userId: string) => [...base.statistics.all, 'user', userId, 'dashboard'] as const,
      dashboardCombined: (userId: string) => [...base.statistics.all, 'user', userId, 'dashboard-combined'] as const,
      userReports: (userId: string) => [...base.statistics.all, 'user', userId, 'reports'] as const,
      weeklyTaskStats: (userId: string, filters?: any) => [...base.statistics.all, 'user', userId, 'weekly-task-stats', JSON.stringify(filters || {})] as const,
      monthlyTaskStats: (userId: string, year?: number) => [...base.statistics.all, 'user', userId, 'monthly-task-stats', year] as const,
      yearlyTaskStats: (userId: string) => [...base.statistics.all, 'user', userId, 'yearly-task-stats'] as const,
      recentActivities: (userId: string) => [...base.statistics.all, 'user', userId, 'recent-activities'] as const,
      incompleteReasonsAnalysis: (userId: string, filters: any) => [...base.statistics.all, 'user', userId, 'incomplete-reasons-analysis', JSON.stringify(filters)] as const,
      adminDashboard: (userId: string, filters?: any) => [...base.statistics.all, 'user', userId, 'admin-dashboard', JSON.stringify(filters || {})] as const,
      overview: (userId: string) => [...base.statistics.all, 'user', userId, 'overview'] as const,
      completionRate: (userId: string, filters?: any) => [...base.statistics.all, 'user', userId, 'completion-rate', JSON.stringify(filters || {})] as const,
      missingReports: (userId: string, filters?: any) => [...base.statistics.all, 'user', userId, 'missing-reports', JSON.stringify(filters || {})] as const,
      summaryReport: (userId: string, filters?: any) => [...base.statistics.all, 'user', userId, 'summary-report', JSON.stringify(filters || {})] as const,
    },
  };
}

export const QUERY_KEYS = createQueryKeysFactory();