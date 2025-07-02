import { api } from '@/lib/api'

export interface DashboardStats {
  currentWeek: {
    weekNumber: number
    year: number
    hasReport: boolean
    isCompleted: boolean
    isLocked: boolean
    incompleteTasksAnalysis: {
      totalIncompleteTasks: number
      totalTasks: number
      reasons: Array<{
        reason: string
        count: number
        percentage: number
        tasks: string[]
      }>
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

export interface WeeklyTaskStats {
  weekNumber: number
  year: number
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
  id?: string
  reportId: string
  weekNumber: number
  year: number
  title?: string
  description?: string
  status: 'completed' | 'pending' | 'draft'
  isCompleted: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  incompleteTasksCount: number
  mostCommonIncompleteReason?: string
  incompleteTasksSample?: Array<{
    taskName: string
    reason: string
  }>
  stats: {
    totalTasks: number
    completedTasks: number
    incompleteTasks: number
    completionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }
}

export interface IncompleteReasonsAnalysis {
  filters: {
    weekNumber?: number
    year?: number
    startDate?: string
    endDate?: string
  }
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
  totalReports: number
  completedReports: number
  completionRate: number
  filters: any
}

export interface MissingReportsStats {
  weekNumber: number
  year: number
  totalUsers: number
  usersWithReports: number
  missingReports: number
  missingUsers: Array<{
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    daysOverdue: number
  }>
}

export interface SummaryReport {
  weekNumber: number
  year: number
  overview: OverviewStats
  completionRate: CompletionRateStats
  missingReports: {
    count: number
    users: Array<{
      id: string
      employeeCode: string
      firstName: string
      lastName: string
      fullName: string
      email: string
      daysOverdue: number
    }>
  }
  summary: {
    totalUsers: number
    submissionRate: number
    completionRate: number
    actionRequired: boolean
  }
}

export class StatisticsService {
  /**
   * Get dashboard statistics for current user
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
   * Get recent activities
   */
  static async getRecentActivities(): Promise<RecentActivity[]> {
    return await api.get<RecentActivity[]>('/statistics/recent-activities')
  }

  /**
   * Get weekly task statistics
   */
  static async getWeeklyTaskStats(): Promise<WeeklyTaskStats> {
    return await api.get<WeeklyTaskStats>('/statistics/weekly-task-stats')
  }

  /**
   * Get monthly task statistics
   */
  static async getMonthlyTaskStats(year?: number): Promise<MonthlyTaskStats> {
    const params = year ? `?year=${year}` : ''
    return await api.get<MonthlyTaskStats>(`/statistics/monthly-task-stats${params}`)
  }

  /**
   * Get yearly task statistics
   */
  static async getYearlyTaskStats(): Promise<YearlyTaskStats> {
    return await api.get<YearlyTaskStats>('/statistics/yearly-task-stats')
  }

  /**
   * Get incomplete reasons analysis
   */
  static async getIncompleteReasonsAnalysis(filters: {
    weekNumber?: number
    year?: number
    startDate?: string
    endDate?: string
  }): Promise<IncompleteReasonsAnalysis> {
    const params = new URLSearchParams()
    if (filters.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters.year) params.append('year', filters.year.toString())
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    return await api.get<IncompleteReasonsAnalysis>(`/statistics/incomplete-reasons-analysis?${params}`)
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminDashboardStats(filters?: {
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<any>(`/statistics/admin-dashboard${query}`)
  }

  /**
   * Get overall statistics overview
   */
  static async getOverview(): Promise<OverviewStats> {
    return await api.get<OverviewStats>('/statistics/overview')
  }

  /**
   * Get completion rate by department and week
   */
  static async getCompletionRate(filters?: {
    week?: number
    year?: number
    departmentId?: string
  }): Promise<CompletionRateStats> {
    const params = new URLSearchParams()
    if (filters?.week) params.append('week', filters.week.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<CompletionRateStats>(`/statistics/completion-rate${query}`)
  }

  /**
   * Get employees who have not submitted reports
   */
  static async getMissingReports(filters?: {
    week?: number
    year?: number
  }): Promise<MissingReportsStats> {
    const params = new URLSearchParams()
    if (filters?.week) params.append('week', filters.week.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<MissingReportsStats>(`/statistics/missing-reports${query}`)
  }

  /**
   * Get comprehensive summary report
   */
  static async getSummaryReport(filters?: {
    week?: number
    year?: number
  }): Promise<SummaryReport> {
    const params = new URLSearchParams()
    if (filters?.week) params.append('week', filters.week.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<SummaryReport>(`/statistics/summary-report${query}`)
  }
}
