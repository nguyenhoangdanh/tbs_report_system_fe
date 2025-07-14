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
  CompletionRateStats,
  MissingReportsStats,
  SummaryReport
} from '@/types/statistics'
import type { OverviewStats } from '@/services/statistics.service'

// User-specific query keys to prevent cross-user data contamination
export const STATISTICS_QUERY_KEYS = {
  statistics: (userId?: string) => ['statistics', userId] as const,
  dashboard: (userId: string) => ['statistics', 'dashboard', userId] as const,
  dashboardCombined: (userId: string) => ['statistics', 'dashboard-combined', userId] as const,
  userReports: (userId: string) => ['statistics', 'user-reports', userId] as const,
  weeklyTaskStats: (userId: string, filters?: any) => ['statistics', 'weekly-task-stats', userId, filters] as const,
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
 * Get dashboard statistics - OPTIMIZED
 */
export function useDashboardStats() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboard(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getDashboardStats(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased
    gcTime: 30 * 60 * 1000, // 30 minutes - increased
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // reduced
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get user report statistics - OPTIMIZED
 */
export function useUserReportStats() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.userReports(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getUserReportStats(),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - increased
    gcTime: 60 * 60 * 1000, // 1 hour - increased
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get recent activities - OPTIMIZED
 */
export function useRecentActivities() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getRecentActivities(),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
    // Transform data to match expected format
    select: (data: RecentActivity[]) => {
      if (!Array.isArray(data)) return []
      
      return data.map((activity: any) => ({
        ...activity,
        id: activity.reportId,
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
 * Get weekly task statistics - OPTIMIZED with proper filters
 */
export function useWeeklyTaskStats(filters?: {
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getWeeklyTaskStats(filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get monthly task statistics - OPTIMIZED
 */
export function useMonthlyTaskStats(year?: number) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.monthlyTaskStats(user?.id || 'anonymous', year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes - increased for less frequent data
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get yearly task statistics - OPTIMIZED
 */
export function useYearlyTaskStats() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.yearlyTaskStats(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes - very long for yearly data
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get incomplete reasons analysis - OPTIMIZED
 */
export function useIncompleteReasonsAnalysis(filters: {
  weekNumber?: number
  year?: number
  startDate?: string
  endDate?: string
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.incompleteReasonsAnalysis(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get admin dashboard statistics - OPTIMIZED
 */
export function useAdminDashboardStats(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.adminDashboard(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get overview statistics - OPTIMIZED
 */
export function useOverview() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.overview(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getOverview(),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get completion rate statistics - OPTIMIZED
 */
export function useCompletionRate(filters?: {
  week?: number
  year?: number
  departmentId?: string
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.completionRate(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getCompletionRate(filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get missing reports statistics - OPTIMIZED
 */
export function useMissingReports(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.missingReports(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getMissingReports(filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Get summary report - OPTIMIZED
 */
export function useSummaryReport(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.summaryReport(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getSummaryReport(filters),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 3000,
    throwOnError: false,
  })
}

/**
 * Combined dashboard data hook - OPTIMIZED to reduce simultaneous calls
 */
export function useDashboardData() {
  const { user } = useAuth()
  
  // Only call essential APIs first
  const dashboardStats = useDashboardStats()
  const recentActivities = useRecentActivities()
  
  // Conditional calls based on data availability to prevent overload
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
    isLoading: dashboardStats.isLoading || recentActivities.isLoading,
    error: dashboardStats.error || recentActivities.error || weeklyTaskStats.error || monthlyTaskStats.error || yearlyTaskStats.error,
    refetch: () => {
      // Staggered refetch to prevent API overload
      dashboardStats.refetch()
      setTimeout(() => recentActivities.refetch(), 500)
      setTimeout(() => weeklyTaskStats.refetch(), 1000)
      setTimeout(() => monthlyTaskStats.refetch(), 1500)
      setTimeout(() => yearlyTaskStats.refetch(), 2000)
    },
  }
}