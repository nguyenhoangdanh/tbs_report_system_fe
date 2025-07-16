'use client'

import { StatisticsService } from '@/services/statistics.service'
import { useAuth } from '@/components/providers/auth-provider'
import { useApiQuery } from './use-api-query'

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
 * Get dashboard statistics - ENHANCED for real-time updates
 */
export function useDashboardStats() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboard(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getDashboardStats(),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    refetchOnWindowFocus: true, // Enable refetch on focus
    refetchOnMount: true, // Always refetch on mount
    refetchOnReconnect: true, // Enable refetch on reconnect
    retry: 2, // Increased from 1 to 2
    retryDelay: 1000, // Reduced from 3000 to 1000
    throwOnError: false,
  })
}

/**
 * Get user report statistics - ENHANCED for real-time updates
 */
export function useUserReportStats() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.userReports(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getUserReportStats(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // Reduced from 10 minutes to 1 minute
    gcTime: 10 * 60 * 1000, // Reduced from 1 hour to 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get recent activities - ENHANCED for real-time updates
 */
export function useRecentActivities() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getRecentActivities(),
    enabled: !!user?.id,
    staleTime: 15 * 1000, // Reduced from 3 minutes to 15 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 15 minutes to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get weekly task statistics - ENHANCED for real-time updates
 */
export function useWeeklyTaskStats(filters?: {
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getWeeklyTaskStats(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get monthly task statistics - ENHANCED for real-time updates
 */
export function useMonthlyTaskStats(year?: number) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.monthlyTaskStats(user?.id || 'anonymous', year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // Reduced from 15 minutes to 2 minutes
    gcTime: 15 * 60 * 1000, // Reduced from 1 hour to 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get yearly task statistics - ENHANCED for real-time updates
 */
export function useYearlyTaskStats() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.yearlyTaskStats(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    gcTime: 30 * 60 * 1000, // Reduced from 2 hours to 30 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get incomplete reasons analysis - ENHANCED for real-time updates
 */
export function useIncompleteReasonsAnalysis(filters: {
  weekNumber?: number
  year?: number
  startDate?: string
  endDate?: string
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.incompleteReasonsAnalysis(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // Reduced from 10 minutes to 1 minute
    gcTime: 10 * 60 * 1000, // Reduced from 30 minutes to 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get admin dashboard statistics - ENHANCED for real-time updates
 */
export function useAdminDashboardStats(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.adminDashboard(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get overview statistics - ENHANCED for real-time updates
 */
export function useOverview() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.overview(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getOverview(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // Reduced from 10 minutes to 1 minute
    gcTime: 10 * 60 * 1000, // Reduced from 1 hour to 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get completion rate statistics - ENHANCED for real-time updates
 */
export function useCompletionRate(filters?: {
  week?: number
  year?: number
  departmentId?: string
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.completionRate(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getCompletionRate(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get missing reports statistics - ENHANCED for real-time updates
 */
export function useMissingReports(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.missingReports(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getMissingReports(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Reduced from 5 minutes to 30 seconds
    gcTime: 5 * 60 * 1000, // Reduced from 30 minutes to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get summary report - ENHANCED for real-time updates
 */
export function useSummaryReport(filters?: {
  week?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: STATISTICS_QUERY_KEYS.summaryReport(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getSummaryReport(filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // Reduced from 10 minutes to 1 minute
    gcTime: 10 * 60 * 1000, // Reduced from 1 hour to 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Combined dashboard data hook - ENHANCED with synchronized refetch
 */
export function useDashboardData() {
  const { user } = useAuth()
  
  // Core dashboard data
  const dashboardStats = useDashboardStats()
  const recentActivities = useRecentActivities()
  const userReportStats = useUserReportStats()
  
  // Additional stats
  const weeklyTaskStats = useWeeklyTaskStats()
  const monthlyTaskStats = useMonthlyTaskStats()
  const yearlyTaskStats = useYearlyTaskStats()
  
  return {
    data: {
      dashboardStats: dashboardStats.data,
      activities: recentActivities.data,
      userReportStats: userReportStats.data,
      weeklyTaskStats: weeklyTaskStats.data,
      monthlyTaskStats: monthlyTaskStats.data,
      yearlyTaskStats: yearlyTaskStats.data,
    },
    isLoading: dashboardStats.isLoading || recentActivities.isLoading || userReportStats.isLoading,
    error: dashboardStats.error || recentActivities.error || userReportStats.error || 
           weeklyTaskStats.error || monthlyTaskStats.error || yearlyTaskStats.error,
    refetch: async () => {
      // Synchronized refetch - all at once for immediate update
      const promises = [
        dashboardStats.refetch(),
        recentActivities.refetch(),
        userReportStats.refetch(),
        weeklyTaskStats.refetch(),
        monthlyTaskStats.refetch(),
        yearlyTaskStats.refetch(),
      ]
      
      try {
        await Promise.allSettled(promises)
      } catch (error) {
        console.error('Failed to refetch dashboard data:', error)
      }
    },
  }
}