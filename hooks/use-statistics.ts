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

// Optimized dashboard data loading with timeout and better error handling
export function useDashboardData() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboardCombined,
    queryFn: async () => {
      // Race condition with timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard data timeout')), 6000)
      })

      const dataPromise = Promise.allSettled([
        StatisticsService.getDashboardStats(),
        StatisticsService.getWeeklyTaskStats(),
        StatisticsService.getRecentActivities(),
        StatisticsService.getMonthlyTaskStats(),
        StatisticsService.getYearlyTaskStats(),
      ])

      try {
        const results = await Promise.race([dataPromise, timeoutPromise]) as PromiseSettledResult<any>[]
        
        return {
          dashboardStats: results[0]?.status === 'fulfilled' ? results[0].value : getFallbackDashboardStats(),
          weeklyTaskStats: results[1]?.status === 'fulfilled' ? results[1].value : getFallbackWeeklyStats(),
          activities: results[2]?.status === 'fulfilled' ? results[2].value : [],
          monthlyTaskStats: results[3]?.status === 'fulfilled' ? 
            results[3].value : 
            { year: new Date().getFullYear(), stats: [] },
          yearlyTaskStats: results[4]?.status === 'fulfilled' ? 
            results[4].value : 
            { stats: [] },
        }
      } catch (error) {
        console.warn('Dashboard data loading failed, using fallbacks:', error)
        return {
          dashboardStats: getFallbackDashboardStats(),
          weeklyTaskStats: getFallbackWeeklyStats(),
          activities: [],
          monthlyTaskStats: { year: new Date().getFullYear(), stats: [] },
          yearlyTaskStats: { stats: [] },
        }
      }
    },
    staleTime: process.env.NODE_ENV === 'production' ? 3 * 60 * 1000 : 30 * 1000,
    gcTime: process.env.NODE_ENV === 'production' ? 20 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1, // Only 1 retry to avoid redundant calls
    networkMode: 'online',
  })
}

// Fallback data functions
function getFallbackDashboardStats() {
  return {
    currentWeek: {
      weekNumber: getWeekNumber(new Date()),
      year: new Date().getFullYear(),
      hasReport: false,
      isCompleted: false,
      isLocked: false,
      incompleteTasksAnalysis: null,
    },
    totals: {
      totalReports: 0,
      completedReports: 0,
      thisMonthReports: 0,
      completionRate: 0,
    },
  }
}

function getFallbackWeeklyStats() {
  return {
    weekNumber: getWeekNumber(new Date()),
    year: new Date().getFullYear(),
    completed: 0,
    uncompleted: 0,
    total: 0,
    incompleteReasonsAnalysis: [],
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
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
