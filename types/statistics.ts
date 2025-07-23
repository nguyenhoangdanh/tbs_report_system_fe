// Employee reporting interfaces
export interface EmployeeWithoutReport {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  role: string
  office: {
    id: string
    name: string
    type: string
  }
  jobPosition: {
    id: string
    jobName: string
    positionName: string
    department: {
      id: string
      name: string
      office: {
        id: string
        name: string
      }
    }
  }
  lastReportDate: string | null
  daysOverdue: number
}

export interface EmployeeWithIncompleteReport {
  reportId: string
  employee: EmployeeWithoutReport
  reportDetails: {
    createdAt: string
    updatedAt: string
    isLocked: boolean
    totalTasks: number
    completedTasks: number
    incompleteTasks: number
    completionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }
  daysOverdue: number
}

export interface EmployeeReportingStatus {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  role: string
  office: {
    id: string
    name: string
    type: string
  }
  jobPosition: {
    id: string
    jobName: string
    positionName: string
    department: {
      id: string
      name: string
      office: {
        id: string
        name: string
      }
    }
  }
  status: 'not_submitted' | 'incomplete' | 'completed'
  reportDetails: {
    reportId: string
    createdAt: string
    updatedAt: string
    totalTasks: number
    completedTasks: number
    incompleteTasks?: number
    completionRate?: number
  } | null
  daysOverdue: number | null
}

// Statistics types matching backend exactly
export interface DashboardStats {
  currentWeek: {
    weekNumber: number
    year: number
    hasReport: boolean
    isCompleted: boolean
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
  totals: {
    totalReports: number
    completedReports: number
    completionRate: number
  }
}

export interface UserReportStats {
  totalReports: number
  completedReports: number
  reportCompletionRate: number
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
}

// Fix WeeklyTaskStats to match backend response
export interface WeeklyTaskStats {
  weekNumber: number
  year: number
  total: number
  completed: number
  uncompleted: number
  completionRate: number
  incompleteReasonsAnalysis: Array<{
    reason: string
    count: number
  }>
}

// Fix MonthlyTaskStats to include summary
export interface MonthlyTaskStats {
  year: number
  monthlyStats: Array<{
    month: number
    year: number
    completed: number
    uncompleted: number
    total: number
    completionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }>
  summary: {
    totalTasks: number
    totalCompleted: number
    averageCompletionRate: number
  }
}

export interface YearlyTaskStats {
  yearlyStats: Array<{
    year: number
    total: number
    completed: number
    uncompleted: number
    completionRate: number
    reportsCount: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }>
  summary: {
    totalTasksAllYears: number
    averageCompletionRate: number
  }
}

export interface RecentActivity {
  reportId: string
  weekNumber: number
  year: number
  isCompleted: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  stats: {
    totalTasks: number
    completedTasks: number
    incompleteTasks: number
    taskCompletionRate: number
    completionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }
}

// Fix IncompleteReasonsAnalysis to include summary
export interface IncompleteReasonsAnalysis {
  totalIncompleteTasks: number
  totalReports: number
  reasonsAnalysis: Array<{
    reason: string
    count: number
    percentage: number
    sampleTasks: Array<{
      taskName: string
      weekNumber: number
      year: number
    }>
  }>
  filters: {
    weekNumber?: number
    year?: number
    startDate?: string
    endDate?: string
  }
  summary: {
    mostCommonReason: string
    diversityIndex: number
    averageReasonsPerReport: number
  }
}

// Admin-specific stats
export interface AdminDashboardStats extends DashboardStats {
  adminStats: {
    totalUsers: number
    totalReports: number
    currentWeekReports: number
    reportingRate: number
  }
}

export interface CompletionRateStats {
  targetWeek: number
  targetYear: number
  totalReports: number
  totalTasks: number
  completedTasks: number
  completionRate: number
  departmentId?: string
  userRole: string
}

export interface MissingReportsStats {
  targetWeek: number
  targetYear: number
  totalUsers: number
  usersWithReports: number
  usersWithoutReports: number
  missingReportRate: number
  userRole: string
  missingUsers: Array<{
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    email: string
    office: string
    department: string
    position: string
  }>
}

export interface SummaryReport {
  weekNumber: number
  year: number
  summary: {
    totalUsers: number
    reportSubmissionRate: number
    taskCompletionRate: number
    missingReportsCount: number
  }
  details: {
    dashboardStats: any
    completionRate: CompletionRateStats
    missingReports: MissingReportsStats
  }
}
