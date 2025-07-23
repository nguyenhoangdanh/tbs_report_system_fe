'use client'

import { StatisticsService } from '@/services/statistics.service'
import { useAuth } from '@/components/providers/auth-provider'
import { useApiQuery } from './use-api-query'
import { QUERY_KEYS } from './query-key'

/**
 * Get dashboard statistics - ENHANCED for real-time updates
 */
export function useDashboardStats() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.statistics.dashboard(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getDashboardStats(),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
  })
}

/**
 * Get user report statistics - ENHANCED for real-time updates
 */
export function useUserReportStats() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.statistics.userReports(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getUserReportStats(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.recentActivities(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getRecentActivities(),
    enabled: !!user?.id,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.weeklyTaskStats(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getWeeklyTaskStats(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.monthlyTaskStats(user?.id || 'anonymous', year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.yearlyTaskStats(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.incompleteReasonsAnalysis(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.adminDashboard(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.overview(user?.id || 'anonymous'),
    queryFn: () => StatisticsService.getOverview(),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.completionRate(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getCompletionRate(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.missingReports(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getMissingReports(filters),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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
    queryKey: QUERY_KEYS.statistics.summaryReport(user?.id || 'anonymous', filters),
    queryFn: () => StatisticsService.getSummaryReport(filters),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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