'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'
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
} from '@/services/statistics.service'

// Shared query keys with reports
export const STATISTICS_QUERY_KEYS = {
  statistics: ['statistics'] as const,
  dashboard: ['statistics', 'dashboard'] as const,
  dashboardCombined: ['statistics', 'dashboard-combined'] as const,
  userReports: ['statistics', 'user-reports'] as const,
  weeklyTaskStats: ['statistics', 'weekly-task-stats'] as const,
  monthlyTaskStats: (year?: number) => ['statistics', 'monthly-task-stats', year] as const,
  yearlyTaskStats: ['statistics', 'yearly-task-stats'] as const,
  recentActivities: ['statistics', 'recent-activities'] as const,
  incompleteReasonsAnalysis: (filters: any) => ['statistics', 'incomplete-reasons-analysis', filters] as const,
  adminDashboard: (filters?: any) => ['statistics', 'admin-dashboard', filters] as const,
  overview: ['statistics', 'overview'] as const,
  completionRate: (filters?: any) => ['statistics', 'completion-rate', filters] as const,
  missingReports: (filters?: any) => ['statistics', 'missing-reports', filters] as const,
  summaryReport: (filters?: any) => ['statistics', 'summary-report', filters] as const,
}

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.dashboard,
    queryFn: () => StatisticsService.getDashboardStats(),
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
  return useQuery<UserReportStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.userReports,
    queryFn: () => StatisticsService.getUserReportStats(),
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
  return useQuery<RecentActivity[], Error>({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities,
    queryFn: () => StatisticsService.getRecentActivities(),
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
  return useQuery<WeeklyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats,
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
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
  return useQuery<MonthlyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.monthlyTaskStats(year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
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
  return useQuery<YearlyTaskStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.yearlyTaskStats,
    queryFn: () => StatisticsService.getYearlyTaskStats(),
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
  return useQuery<IncompleteReasonsAnalysis, Error>({
    queryKey: STATISTICS_QUERY_KEYS.incompleteReasonsAnalysis(filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
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
  return useQuery<any, Error>({
    queryKey: STATISTICS_QUERY_KEYS.adminDashboard(filters),
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
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
  return useQuery<OverviewStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.overview,
    queryFn: () => StatisticsService.getOverview(),
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
  return useQuery<CompletionRateStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.completionRate(filters),
    queryFn: () => StatisticsService.getCompletionRate(filters),
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
  return useQuery<MissingReportsStats, Error>({
    queryKey: STATISTICS_QUERY_KEYS.missingReports(filters),
    queryFn: () => StatisticsService.getMissingReports(filters),
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
  return useQuery<SummaryReport, Error>({
    queryKey: STATISTICS_QUERY_KEYS.summaryReport(filters),
    queryFn: () => StatisticsService.getSummaryReport(filters),
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
