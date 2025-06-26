'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'

// Shared query keys with reports
export const STATISTICS_QUERY_KEYS = {
  statistics: ['statistics'] as const,
  dashboard: ['statistics', 'dashboard'] as const,
  dashboardCombined: ['statistics', 'dashboard-combined'] as const,
  weeklyTaskStats: ['statistics', 'weekly-task-stats'] as const,
  monthlyTaskStats: (year?: number) => ['statistics', 'monthly-task-stats', year] as const,
  yearlyTaskStats: ['statistics', 'yearly-task-stats'] as const,
  recentActivities: ['statistics', 'recent-activities'] as const,
  incompleteReasonsAnalysis: (filters: any) => ['statistics', 'incomplete-reasons-analysis', filters] as const,
}

// Đơn giản hóa dashboard data loading với cache key consistent
export function useDashboardData() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboardCombined,
    queryFn: async () => {
      // Load data theo thứ tự ưu tiên
      const [dashboardStats, weeklyTaskStats, activities, monthlyTaskStats, yearlyTaskStats] = await Promise.allSettled([
        StatisticsService.getDashboardStats(),
        StatisticsService.getWeeklyTaskStats(),
        StatisticsService.getRecentActivities(),
        StatisticsService.getMonthlyTaskStats(),
        StatisticsService.getYearlyTaskStats(),
      ])

      return {
        dashboardStats: dashboardStats.status === 'fulfilled' ? dashboardStats.value : null,
        weeklyTaskStats: weeklyTaskStats.status === 'fulfilled' ? weeklyTaskStats.value : null,
        activities: activities.status === 'fulfilled' ? activities.value : [],
        monthlyTaskStats: monthlyTaskStats.status === 'fulfilled' ? 
          monthlyTaskStats.value : 
          { year: new Date().getFullYear(), stats: [] },
        yearlyTaskStats: yearlyTaskStats.status === 'fulfilled' ? 
          yearlyTaskStats.value : 
          { stats: [] },
      }
    },
    staleTime: process.env.NODE_ENV === 'production' ? 2 * 60 * 1000 : 30 * 1000, // Giảm stale time để update nhanh hơn
    gcTime: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

// Individual hooks được đơn giản hóa với consistent cache keys
export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats,
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboard,
    queryFn: () => StatisticsService.getDashboardStats(),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useRecentActivities() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities,
    queryFn: () => StatisticsService.getRecentActivities(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.monthlyTaskStats(year),
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.yearlyTaskStats,
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useIncompleteReasonsAnalysis(filters: {
  weekNumber?: number
  year?: number
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.incompleteReasonsAnalysis(filters),
    queryFn: () => StatisticsService.getIncompleteReasonsAnalysis(filters),
    enabled: !!(filters.weekNumber && filters.year) || !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
