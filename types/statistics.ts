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

// Re-export the shared response types from hierarchy to avoid conflicts
export type {
  EmployeesWithoutReportsResponse,
  EmployeesWithIncompleteReportsResponse,
  EmployeesReportingStatusResponse,
  EmployeeReportingFilters,
} from './hierarchy'

// Base statistics types
export interface DashboardStats {
  currentWeek: {
    weekNumber: number
    year: number
    hasReport: boolean
    isCompleted: boolean
    isLocked: boolean
    incompleteTasksAnalysis: {
      totalIncompleteTasks: number
      topReasons: Array<{
        reason: string
        count: number
        percentage: number
        tasks: string[]
      }>
    } | null
  }
  totals: {
    totalReports: number
    completedReports: number
    thisMonthReports: number
    completionRate: number
  }
}

export interface UserReportStats {
  monthlyStats: Array<{
    year: number
    _count: { id: number }
  }>
  weeklyTrend: Array<{
    weekNumber: number
    year: number
    isCompleted: boolean
    createdAt: string
    totalTasks: number
    completedTasks: number
    incompleteTasks: number
  }>
  incompleteReasonsAnalysis: {
    totalIncompleteTasks: number
    topReasons: Array<{
      reason: string
      count: number
      percentage: number
      sampleTasks: Array<{
        taskName: string
        weekNumber: number
        year: number
      }>
    }>
  }
}
