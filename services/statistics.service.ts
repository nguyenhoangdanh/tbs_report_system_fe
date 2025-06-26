import { api } from '@/lib/api'

export interface WeeklyTaskStats {
  weekNumber: number
  year: number
  completed: number
  uncompleted: number
  total: number
  incompleteReasonsAnalysis: IncompleteReasonData[]
}

export interface MonthlyTaskStats {
  year: number
  stats: MonthlyTaskData[]
}

export interface YearlyTaskStats {
  stats: YearlyTaskData[]
}

export interface MonthlyTaskData {
  month: number
  completed: number
  uncompleted: number
  total: number
  topIncompleteReasons: IncompleteReasonData[]
}

export interface YearlyTaskData {
  year: number
  completed: number
  uncompleted: number
  total: number
  topIncompleteReasons: IncompleteReasonData[]
}

export interface IncompleteTaskReason {
  reason: string
  count: number
  percentage: number
  tasks?: Array<{ taskName: string; reason?: string }> // Added task details
  sampleTasks?: Array<{ 
    taskName: string 
    weekNumber?: number
    year?: number 
    daysWorked?: string[]
  }>
}

export interface IncompleteReasonData {
  reason: string
  count: number
  percentage: number
  tasks?: Array<{ taskName: string }>
  sampleTasks?: Array<{ 
    taskName: string 
    weekNumber?: number
    year?: number
  }>
}

export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  status: 'completed' | 'pending' | 'draft'
  createdAt: string
  updatedAt: string
  incompleteTasksCount: number
  mostCommonIncompleteReason?: string
  incompleteTasksSample?: Array<{ taskName: string }> // Added sample tasks
}

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
      reasons: IncompleteReasonData[]
    } | null
  }
  totals: {
    totalReports: number
    completedReports: number
    thisMonthReports: number
    completionRate: number
  }
}

export interface IncompleteReasonsAnalysis {
  totalIncompleteTasks: number
  totalReports: number
  filters: any
  reasonsAnalysis: Array<{
    reason: string
    count: number
    percentage: number
    tasks: Array<{
      taskName: string
      weekNumber: number
      year: number
      daysWorked: string[]
    }>
  }>
}

export class StatisticsService {
  static async getDashboardStats(): Promise<DashboardStats> {
    return await api.get<DashboardStats>('/statistics/dashboard')
  }

  static async getWeeklyTaskStats(): Promise<WeeklyTaskStats> {
    return await api.get<WeeklyTaskStats>('/statistics/weekly-task-stats')
  }

  static async getMonthlyTaskStats(year?: number): Promise<MonthlyTaskStats> {
    const params = year ? `?year=${year}` : ''
    return await api.get<MonthlyTaskStats>(`/statistics/monthly-task-stats${params}`)
  }

  static async getYearlyTaskStats(): Promise<YearlyTaskStats> {
    return await api.get<YearlyTaskStats>('/statistics/yearly-task-stats')
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    return await api.get<RecentActivity[]>('/statistics/recent-activities')
  }

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
}
