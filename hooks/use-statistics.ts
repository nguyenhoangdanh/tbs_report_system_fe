'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  DashboardStats,
  UserReportStats,
  WeeklyTaskStats,
  MonthlyTaskStats,
  YearlyTaskStats,
  RecentActivity,
  IncompleteReasonsAnalysis,
  OverviewStats,
  CompletionRateStats,
  MissingReportsStats,
  SummaryReport
} from '@/types/statistics'

// User-specific query keys to prevent cross-user data contamination
export const STATISTICS_QUERY_KEYS = {
  statistics: (userId?: string) => ['statistics', userId] as const,
  dashboard: (userId: string) => ['statistics', 'dashboard', userId] as const,
  dashboardCombined: (userId: string) => ['statistics', 'dashboard-combined', userId] as const,
  userReports: (userId: string) => ['statistics', 'user-reports', userId] as const,
  weeklyTaskStats: (userId: string) => ['statistics', 'weekly-task-stats', userId] as const,
  monthlyTaskStats: (userId: string, year?: number) => ['statistics', 'monthly-task-stats', userId, year] as const,
  yearlyTaskStats: (userId: string) => ['statistics', 'yearly-task-stats', userId] as const,
  recentActivities: (userId: string) => ['statistics', 'recent-activities', userId] as const,
  incompleteReasonsAnalysis: (userId: string, filters: any) => ['statistics', 'incomplete-reasons-analysis', userId, filters] as const,
  adminDashboard: (userId: string, filters?: any) => ['statistics', 'admin-dashboard', userId, filters] as const,
  overview: (userId: string) => ['statistics', 'overview', userId] as const,
  completionRate: (userId: string, filters?: any) => ['statistics', 'completion-rate', userId, filters] as const,
  missingReports: (userId: string, filters?: any) => ['statistics', 'missing-reports', userId, filters] as const,
  summaryReport: (userId: string, filters?: any) => ['statistics', 'summary-report', userId, filters] as const,
}

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  const { user } = useAuth()
  
  return useQuery<DashboardStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.dashboard(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getDashboardStats(),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get user report statistics
 */
export function useUserReportStats() {
  const { user } = useAuth()
  
  return useQuery<UserReportStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.userReports(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getUserReportStats(),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get recent activities
 */
export function useRecentActivities() {
  const { user } = useAuth()
  
  return useQuery<RecentActivity[], Error>({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getRecentActivities(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
    // Transform data to match expected format
    select: (data) => {
      if (!Array.isArray(data)) return []
      
      return data.map((activity: any) => ({
        ...activity,
        id: activity.reportId, // Use reportId as id
        title: activity.title || `Báo cáo tuần ${activity.weekNumber}/${activity.year}`,
        description: activity.description || `${activity.stats.completedTasks}/${activity.stats.totalTasks} công việc hoàn thành`,
        status: activity.isCompleted ? 'completed' : (activity.stats.incompleteTasks > 0 ? 'pending' : 'draft'),
        incompleteTasksCount: activity.stats.incompleteTasks || 0,
        mostCommonIncompleteReason: activity.stats.topIncompleteReasons?.[0]?.reason,
        incompleteTasksSample: activity.stats.topIncompleteReasons?.map((reason: any) => ({
          taskName: `Công việc có lý do: ${reason.reason}`,
          reason: reason.reason
        })) || []
      }))
    }
  })
}

/**
 * Get weekly task statistics
 */
export function useWeeklyTaskStats() {
  const { user } = useAuth()
  
  return useQuery<WeeklyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get monthly task statistics
 */
export function useMonthlyTaskStats(year?: number) {
  const { user } = useAuth()
  
  return useQuery<MonthlyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.monthlyTaskStats(user?.id || 'anonymous', year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get yearly task statistics
 */
export function useYearlyTaskStats() {
  const { user } = useAuth()
  
  return useQuery<YearlyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.yearlyTaskStats(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get incomplete reasons analysis
 */
export function useIncompleteReasonsAnalysis(filters: {
  weekNumber?: number
  year?: number
  startDate?: string
  endDate?: string
}) {
  const { user } = useAuth()
  
  return useQuery<IncompleteReasonsAnalysis, Error>({
    queryKey: STATISTICS_QUERY_KEYS.incompleteReasonsAnalysis(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get admin dashboard statistics
 */
export function useAdminDashboardStats(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery<any, Error>({
    queryKey: STATISTICS_QUERY_KEYS.adminDashboard(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get overview statistics
 */
export function useOverview() {
  const { user } = useAuth()
  
  return useQuery<OverviewStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.overview(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getOverview(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get completion rate statistics
 */
export function useCompletionRate(filters?: {
  week?: number
  year?: number
  departmentId?: string
}) {
  const { user } = useAuth()
  
  return useQuery<CompletionRateStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.completionRate(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getCompletionRate(filters),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get missing reports statistics
 */
export function useMissingReports(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery<MissingReportsStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.missingReports(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getMissingReports(filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get summary report
 */
export function useSummaryReport(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery<SummaryReport, Error>({
    queryKey: STATISTICS_QUERY_KEYS.summaryReport(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getSummaryReport(filters),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Combined dashboard data hook
 */
export function useDashboardData() {
  const { user } = useAuth()
  const dashboardStats = useDashboardStats()
  const recentActivities = useRecentActivities()
  const weeklyTaskStats = useWeeklyTaskStats()
  const monthlyTaskStats = useMonthlyTaskStats()
  const yearlyTaskStats = useYearlyTaskStats()
  
  return {
    data: {
      dashboardStats: dashboardStats.data,
      activities: recentActivities.data,
      weeklyTaskStats: weeklyTaskStats.data,
      monthlyTaskStats: monthlyTaskStats.data,
      yearlyTaskStats: yearlyTaskStats.data,
    },
    isLoading: dashboardStats.isLoading || recentActivities.isLoading || weeklyTaskStats.isLoading || monthlyTaskStats.isLoading || yearlyTaskStats.isLoading,
    error: dashboardStats.error || recentActivities.error || weeklyTaskStats.error || monthlyTaskStats.error || yearlyTaskStats.error,
    refetch: () => {
      dashboardStats.refetch()
      recentActivities.refetch()
      weeklyTaskStats.refetch()
      monthlyTaskStats.refetch()
      yearlyTaskStats.refetch()
    },
  }
}
