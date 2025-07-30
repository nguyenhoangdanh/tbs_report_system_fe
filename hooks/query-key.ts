// ================================
// CHUẨN HÓA QUERY KEYS - VERSION 4.1 (RESTORED ALL MISSING KEYS)
// ================================

export const QUERY_KEYS = {
  // ===== AUTH QUERIES =====
  auth: {
    all: () => ['auth'] as const,
    profile: (userId?: string) => userId ? ['auth', 'profile', userId] as const : ['auth', 'profile'] as const,
    check: (userId?: string) => ['auth', 'check', userId] as const,
    permissions: (userId?: string) => ['auth', 'permissions', userId] as const,
  },

  // ===== USERS QUERIES =====
  users: {
    all: () => ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (page: number, limit: number) => ['users', 'list', page, limit] as const,
    details: () => ['users', 'detail'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    profile: ['users', 'profile'] as const,
    withRanking: (filters?: any) => ['users', 'with-ranking', JSON.stringify(filters || {})] as const,
  },

  // ===== ORGANIZATIONS QUERIES =====
  organizations: {
    all: () => ['organizations'] as const,
    offices: ['organizations', 'offices'] as const,
    departments: ['organizations', 'departments'] as const,
    positions: ['organizations', 'positions'] as const,
    jobPositions: ['organizations', 'job-positions'] as const,
  },

  // ===== HIERARCHY QUERIES =====
  hierarchy: {
    all: () => ['hierarchy'] as const,
    myView: (userId: string, filters?: any) => 
      ['hierarchy', 'myView', userId, JSON.stringify(filters || {})] as const,
    userDetails: (currentUserId: string, targetUserId: string, filters?: any) => 
      ['hierarchy', 'user-details', currentUserId, targetUserId, JSON.stringify(filters || {})] as const,
    reportDetailsAdmin: (currentUserId: string, reportId: string) => 
      ['hierarchy', 'report-details-admin', currentUserId, reportId] as const,
    userReports: (userId: string, filters?: any) => 
      ['hierarchy', 'user-reports', userId, JSON.stringify(filters || {})] as const,
    // ✅ SEPARATE: Different key for original vs store version to prevent conflicts
    managerReports: (userId: string, filters?: any) => 
      ['hierarchy', 'manager-reports', userId, JSON.stringify(filters || {})] as const,
    managerReportsWithStore: (userId: string, filters?: any, timestamp?: number) => 
      ['hierarchy', 'manager-reports-with-store', userId, JSON.stringify(filters || {}), timestamp] as const,
    adminOverview: (userId: string, filters?: any) => 
      ['hierarchy', 'admin-overview', userId, JSON.stringify(filters || {})] as const,
  },
  
  // ===== REPORTS QUERIES =====
  reports: {
    all: (userId: string) => ['reports', userId] as const,
    user: (userId: string) => ['reports', 'user', userId] as const,
    myReports: (userId: string, page: number, limit: number) => ['reports', 'my', userId, page, limit] as const,
    reportById: (userId: string, id: string) => ['reports', 'by-id', userId, id] as const,
    reportByWeek: (userId: string, weekNumber: number, year: number) => ['reports', 'by-week', userId, weekNumber, year] as const,
    currentWeek: (userId: string) => ['reports', 'current-week', userId] as const,
    adminReports: (userId: string, filters?: any) => ['reports', 'admin', userId, JSON.stringify(filters || {})] as const,
  },
  
  // ===== TASK EVALUATIONS QUERIES =====
  taskEvaluations: {
    all: () => ['task-evaluations'] as const,
    byTask: (taskId: string) => ['task-evaluations', taskId] as const,
    myEvaluations: (userId: string, params?: any) => ['my-task-evaluations', userId, JSON.stringify(params || {})] as const,
    evaluableTasks: (userId: string, params?: any) => ['evaluable-tasks', userId, JSON.stringify(params || {})] as const,
    user: (userId: string) => ['evaluations', 'user', userId] as const,
  },

  // ===== STATISTICS QUERIES =====
  statistics: {
    all: () => ['statistics'] as const,
    user: (userId: string) => ['statistics', 'user', userId] as const,
    dashboard: (userId: string) => ['statistics', 'user', userId, 'dashboard'] as const,
    dashboardCombined: (userId: string) => ['statistics', 'user', userId, 'dashboard-combined'] as const,
    userReports: (userId: string) => ['statistics', 'user', userId, 'reports'] as const,
    weeklyTaskStats: (userId: string, filters?: any) => ['statistics', 'user', userId, 'weekly-task-stats', JSON.stringify(filters || {})] as const,
    monthlyTaskStats: (userId: string, year?: number) => ['statistics', 'user', userId, 'monthly-task-stats', year] as const,
    yearlyTaskStats: (userId: string) => ['statistics', 'user', userId, 'yearly-task-stats'] as const,
    recentActivities: (userId: string) => ['statistics', 'user', userId, 'recent-activities'] as const,
    incompleteReasonsAnalysis: (userId: string, filters: any) => ['statistics', 'user', userId, 'incomplete-reasons-analysis', JSON.stringify(filters)] as const,
    adminDashboard: (userId: string, filters?: any) => ['statistics', 'user', userId, 'admin-dashboard', JSON.stringify(filters || {})] as const,
    overview: (userId: string) => ['statistics', 'user', userId, 'overview'] as const,
    completionRate: (userId: string, filters?: any) => ['statistics', 'user', userId, 'completion-rate', JSON.stringify(filters || {})] as const,
    missingReports: (userId: string, filters?: any) => ['statistics', 'user', userId, 'missing-reports', JSON.stringify(filters || {})] as const,
    summaryReport: (userId: string, filters?: any) => ['statistics', 'user', userId, 'summary-report', JSON.stringify(filters || {})] as const,
  },
} as const

// ✅ ENHANCED: Keep the invalidation patterns for targeted cache invalidation
export const INVALIDATION_PATTERNS = {
  // Patterns for AdminOverviewPage with evaluation tracking
  adminOverview: {
    all: () => ['hierarchy'] as const,
    managerReports: (userId?: string) => userId ? ['hierarchy', 'manager-reports', userId] as const : ['hierarchy', 'manager-reports'] as const,
    adminOverview: (userId?: string) => userId ? ['hierarchy', 'admin-overview', userId] as const : ['hierarchy', 'admin-overview'] as const,
    userDetails: () => ['hierarchy', 'user-details'] as const,
    myView: () => ['hierarchy', 'myView'] as const,
    // ✅ NEW: Evaluation-specific patterns
    evaluationRelated: (userId?: string) => userId ? [
      ['hierarchy', 'manager-reports', userId],
      ['hierarchy', 'admin-overview', userId],
      ['hierarchy', 'myView', userId]
    ] as const : [
      ['hierarchy', 'manager-reports'],
      ['hierarchy', 'admin-overview'],
      ['hierarchy', 'myView']
    ] as const,
  },
  
  // Patterns for HierarchyDashboard
  hierarchyDashboard: {
    all: () => ['hierarchy'] as const,
    myView: () => ['hierarchy', 'myView'] as const,
    userDetails: () => ['hierarchy', 'user-details'] as const,
  },
  
  // Patterns for ReportsPage  
  reports: {
    all: () => ['reports'] as const,
    userSpecific: (userId: string) => ['reports', userId] as const,
  },
  
  // Common evaluation patterns
  evaluations: {
    all: () => ['task-evaluations'] as const,
    myEvaluations: () => ['my-task-evaluations'] as const,
    evaluableTasks: () => ['evaluable-tasks'] as const,
  },

  // Statistics patterns
  statistics: {
    all: () => ['statistics'] as const,
    userSpecific: (userId: string) => ['statistics', 'user', userId] as const,
  }
} as const

// ✅ BACKWARDS COMPATIBILITY: Export individual query key functions that might be used elsewhere
export const getReportsQueryKey = (userId: string) => QUERY_KEYS.reports.all(userId)
export const getMyReportsQueryKey = (userId: string, page: number, limit: number) => QUERY_KEYS.reports.myReports(userId, page, limit)
export const getReportByIdQueryKey = (userId: string, id: string) => QUERY_KEYS.reports.reportById(userId, id)
export const getReportByWeekQueryKey = (userId: string, weekNumber: number, year: number) => QUERY_KEYS.reports.reportByWeek(userId, weekNumber, year)
export const getCurrentWeekQueryKey = (userId: string) => QUERY_KEYS.reports.currentWeek(userId)

// ✅ HIERARCHY COMPATIBILITY
export const getHierarchyQueryKey = () => QUERY_KEYS.hierarchy.all()
export const getMyViewQueryKey = (userId: string, filters?: any) => QUERY_KEYS.hierarchy.myView(userId, filters)
// export const getManagerReportsQueryKey = (userId: string, filters?: any) => QUERY_KEYS.hierarchy.managerReports(userId, filters)
export const getUserDetailsQueryKey = (currentUserId: string, targetUserId: string, filters?: any) => QUERY_KEYS.hierarchy.userDetails(currentUserId, targetUserId, filters)

// ✅ TASK EVALUATIONS COMPATIBILITY
export const getTaskEvaluationsQueryKey = (taskId: string) => QUERY_KEYS.taskEvaluations.byTask(taskId)
export const getMyTaskEvaluationsQueryKey = (userId: string, params?: any) => QUERY_KEYS.taskEvaluations.myEvaluations(userId, params)

// ✅ STATISTICS COMPATIBILITY
export const getStatisticsQueryKey = (userId: string) => QUERY_KEYS.statistics.user(userId)
export const getDashboardQueryKey = (userId: string) => QUERY_KEYS.statistics.dashboard(userId)
export const getDashboardCombinedQueryKey = (userId: string) => QUERY_KEYS.statistics.dashboardCombined(userId)

// ✅ ORGANIZATIONS COMPATIBILITY
export const getOfficesQueryKey = () => QUERY_KEYS.organizations.offices
export const getDepartmentsQueryKey = () => QUERY_KEYS.organizations.departments
export const getPositionsQueryKey = () => QUERY_KEYS.organizations.positions
export const getJobPositionsQueryKey = () => QUERY_KEYS.organizations.jobPositions

// ✅ USERS COMPATIBILITY
export const getUsersQueryKey = () => QUERY_KEYS.users.all()
export const getUsersListQueryKey = (page: number, limit: number) => QUERY_KEYS.users.list(page, limit)
export const getUserDetailQueryKey = (id: string) => QUERY_KEYS.users.detail(id)
export const getUserProfileQueryKey = () => QUERY_KEYS.users.profile

// ✅ ENHANCED: Update compatibility functions for consistent naming
export const getManagerReportsQueryKey = (userId: string, filters?: any) => 
  QUERY_KEYS.hierarchy.managerReports(userId, filters)
export const getAdminOverviewQueryKey = (userId: string, filters?: any) => 
  QUERY_KEYS.hierarchy.adminOverview(userId, filters)