import { api } from '@/lib/api'

// Updated interface types to match backend exactly
export interface DashboardStats {
  currentWeek: {
    weekNumber: number
    year: number
    hasReport: boolean
    isCompleted: boolean
    isLocked: boolean
    isReportingPeriod: boolean
    reportingPeriod: {
      startDate: string
      endDate: string
    }
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
  totalReports: number
  completedReports: number
  reportCompletionRate: number
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
}

export interface WeeklyTaskStats {
  weekNumber: number
  year: number
  isReportingPeriod: boolean
  completed: number
  uncompleted: number
  total: number
  incompleteReasonsAnalysis: Array<{
    reason: string
    count: number
    percentage: number
    sampleTasks: Array<{
      taskName: string
      reason: string
    }>
  }>
}

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
    totalYears: number
    averageCompletionRate: number
    bestYear: {
      year: number
      completionRate: number
    }
    worstYear: {
      year: number
      completionRate: number
    }
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

export interface OverviewStats {
  weekNumber: number
  year: number
  totalUsers: number
  totalReports: number
  completedReports: number
  submissionRate: number
  completionRate: number
  summary: {
    usersWithoutReports: number
    incompleteReports: number
  }
}

export interface CompletionRateStats {
  weekNumber: number
  year: number
  totalUsers: number
  usersWithReports: number
  completedReports: number
  completionRate: number
  filters?: {
    week?: number
    year?: number
    departmentId?: string
  }
}

export interface MissingReportsStats {
  weekNumber: number
  year: number
  totalUsers: number
  usersWithoutReports: number
  missingRate: number
  users: Array<{
    id: string
    employeeCode: string
    firstName: string
    lastName: string
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

export class StatisticsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    return await api.get<DashboardStats>('/statistics/dashboard')
  }

  /**
   * Get user report statistics
   */
  static async getUserReportStats(): Promise<UserReportStats> {
    return await api.get<UserReportStats>('/statistics/user-reports')
  }

  /**
   * Get weekly task statistics
   */
  static async getWeeklyTaskStats(filters?: {
    weekNumber?: number
    year?: number
  }): Promise<WeeklyTaskStats> {
    const params = new URLSearchParams()
    
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<WeeklyTaskStats>(`/statistics/weekly-tasks${query}`)
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(filters?: {
    limit?: number
  }): Promise<RecentActivity[]> {
    const params = new URLSearchParams()
    
    if (filters?.limit !== undefined) {
      const limitNum = Number(filters.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        params.append('limit', String(limitNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<RecentActivity[]>(`/statistics/recent-activities${query}`)
  }

  /**
   * Get monthly task statistics - with proper number validation
   */
  static async getMonthlyTaskStats(year?: number): Promise<MonthlyTaskStats> {
    const params = new URLSearchParams()
    
    // FIX: Validate year parameter
    if (year !== undefined) {
      const yearNum = Number(year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<MonthlyTaskStats>(`/statistics/monthly-tasks${query}`)
  }

  /**
   * Get yearly task statistics
   */
  static async getYearlyTaskStats(): Promise<YearlyTaskStats> {
    return await api.get<YearlyTaskStats>('/statistics/yearly-tasks')
  }

  /**
   * Get incomplete reasons analysis - with proper validation
   */
  static async getIncompleteReasonsAnalysis(filters: {
    weekNumber?: number
    year?: number
    startDate?: string
    endDate?: string
  }): Promise<IncompleteReasonsAnalysis> {
    const params = new URLSearchParams()
    
    // FIX: Validate numeric parameters
    if (filters.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters.startDate && typeof filters.startDate === 'string' && filters.startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      params.append('startDate', filters.startDate)
    }
    if (filters.endDate && typeof filters.endDate === 'string' && filters.endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      params.append('endDate', filters.endDate)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<IncompleteReasonsAnalysis>(`/statistics/incomplete-reasons-analysis${query}`)
  }

  // Admin endpoints
  /**
   * Get admin dashboard statistics
   */
  static async getAdminDashboardStats(filters?: {
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    
    // FIX: Validate parameters
    if (filters?.departmentId && typeof filters.departmentId === 'string') {
      params.append('departmentId', filters.departmentId)
    }
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/statistics/admin/dashboard${query}`)
  }

  /**
   * Get overview statistics
   */
  static async getOverview(): Promise<OverviewStats> {
    return await api.get<OverviewStats>('/statistics/overview')
  }

  /**
   * Get completion rate statistics - with proper validation
   */
  static async getCompletionRate(filters?: {
    week?: number
    year?: number
    departmentId?: string
  }): Promise<CompletionRateStats> {
    const params = new URLSearchParams()
    
    // FIX: Validate numeric parameters
    if (filters?.week !== undefined) {
      const weekNum = Number(filters.week)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('week', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters?.departmentId && typeof filters.departmentId === 'string') {
      params.append('departmentId', filters.departmentId)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<CompletionRateStats>(`/statistics/completion-rate${query}`)
  }

  /**
   * Get missing reports statistics
   */
  static async getMissingReports(filters?: {
    week?: number
    year?: number
  }): Promise<MissingReportsStats> {
    const params = new URLSearchParams()
    
    // FIX: Validate numeric parameters
    if (filters?.week !== undefined) {
      const weekNum = Number(filters.week)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('week', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<MissingReportsStats>(`/statistics/missing-reports${query}`)
  }

  /**
   * Get summary report
   */
  static async getSummaryReport(filters?: {
    week?: number
    year?: number
  }): Promise<SummaryReport> {
    const params = new URLSearchParams()
    
    // FIX: Validate numeric parameters
    if (filters?.week !== undefined) {
      const weekNum = Number(filters.week)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('week', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<SummaryReport>(`/statistics/summary-report${query}`)
  }
}
