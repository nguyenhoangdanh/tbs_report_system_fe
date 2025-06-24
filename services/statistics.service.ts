import { api } from '@/lib/api'

export interface DashboardStats {
  currentWeek: {
    weekNumber: number
    year: number
    hasReport: boolean
    isCompleted: boolean
    isLocked: boolean
  }
  totals: {
    totalReports: number
    completedReports: number
    thisMonthReports: number
    completionRate: number
  }
}

export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  status: 'completed' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface AdminDashboardStats {
  overview: {
    totalReports: number
    completedReports: number
    currentWeekReports: number
    totalActiveUsers: number
    reportRate: number
    completionRate: number
  }
  departmentStats: Array<{
    id: string
    name: string
    office: string
    totalUsers: number
    reportedUsers: number
    completedUsers: number
    reportRate: number
    completionRate: number
  }>
  currentWeek: {
    weekNumber: number
    year: number
  }
}

export interface WeeklyTaskStats {
  weekNumber: number
  year: number
  completed: number
  uncompleted: number
  total: number
}

export interface MonthlyTaskStats {
  year: number
  stats: Array<{
    month: number
    completed: number
    uncompleted: number
    total: number
  }>
}

export interface YearlyTaskStats {
  stats: Array<{
    year: number
    completed: number
    uncompleted: number
    total: number
  }>
}

export class StatisticsService {
  static async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/statistics/dashboard')
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    return api.get<RecentActivity[]>('/statistics/recent-activities')
  }

  static async getUserReportStats() {
    return api.get('/statistics/user-reports')
  }

  static async getAdminDashboardStats(filters?: {
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<AdminDashboardStats> {
    const params = new URLSearchParams()
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return api.get<AdminDashboardStats>(`/statistics/admin-dashboard${query}`)
  }

  static async getWeeklyTaskStats(): Promise<WeeklyTaskStats> {
    return api.get<WeeklyTaskStats>('/statistics/weekly-task-stats')
  }

  static async getMonthlyTaskStats(year?: number): Promise<MonthlyTaskStats> {
    const params = year ? `?year=${year}` : ''
    return api.get<MonthlyTaskStats>(`/statistics/monthly-task-stats${params}`)
  }

  static async getYearlyTaskStats(): Promise<YearlyTaskStats> {
    return api.get<YearlyTaskStats>('/statistics/yearly-task-stats')
  }
}
