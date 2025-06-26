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

// Optimized dashboard data loading - ONLY load what's needed, no redundant calls
export function useDashboardData() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboardCombined,
    queryFn: async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard data timeout')), 6000)
      })

      const dataPromise = Promise.allSettled([
        StatisticsService.getWeeklyTaskStats(),
        StatisticsService.getMonthlyTaskStats(),
        StatisticsService.getYearlyTaskStats(),
        StatisticsService.getRecentActivities(),
      ])

      try {
        const results = await Promise.race([dataPromise, timeoutPromise]) as PromiseSettledResult<any>[]
        
        // Enhanced data extraction with better error handling
        const weeklyStats = results[0]?.status === 'fulfilled' ? results[0].value : null
        const monthlyStats = results[1]?.status === 'fulfilled' ? results[1].value : null
        const yearlyStats = results[2]?.status === 'fulfilled' ? results[2].value : null
        const activities = results[3]?.status === 'fulfilled' ? results[3].value : null

        // Debug logging
        console.log('[DASHBOARD DATA] Raw API responses:', {
          weeklyStats,
          monthlyStats,
          yearlyStats,
          activities
        })

        // Safer data extraction
        const safeWeeklyStats = weeklyStats || getFallbackWeeklyStats()
        const safeMonthlyStats = monthlyStats || { year: new Date().getFullYear(), stats: [] }
        const safeYearlyStats = yearlyStats || { stats: [] }
        const safeActivities = Array.isArray(activities) ? activities : []

        // Construct dashboard stats with null checks
        const dashboardStats = {
          currentWeek: {
            weekNumber: safeWeeklyStats?.weekNumber || getWeekNumber(new Date()),
            year: safeWeeklyStats?.year || new Date().getFullYear(),
            hasReport: (safeWeeklyStats?.total || 0) > 0,
            isCompleted: (safeWeeklyStats?.uncompleted || 0) === 0 && (safeWeeklyStats?.total || 0) > 0,
            isLocked: false,
            incompleteTasksAnalysis: (safeWeeklyStats?.incompleteReasonsAnalysis?.length || 0) > 0 ? {
              totalIncompleteTasks: safeWeeklyStats.uncompleted || 0,
              totalTasks: safeWeeklyStats.total || 0,
              reasons: safeWeeklyStats.incompleteReasonsAnalysis || []
            } : null
          },
          totals: {
            totalReports: calculateTotalReports(safeMonthlyStats),
            completedReports: calculateCompletedReports(safeMonthlyStats),
            thisMonthReports: calculateThisMonthReports(safeMonthlyStats),
            completionRate: calculateCompletionRate(safeMonthlyStats?.stats || [])
          }
        }

        const result = {
          dashboardStats,
          weeklyTaskStats: safeWeeklyStats,
          monthlyTaskStats: safeMonthlyStats,
          yearlyTaskStats: safeYearlyStats,
          activities: safeActivities,
        }

        console.log('[DASHBOARD DATA] Final processed data:', result)
        return result

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
    retry: 1,
    networkMode: 'online',
  })
}

// Enhanced calculation functions with null safety
function calculateTotalReports(monthlyStats: any): number {
  if (!monthlyStats?.stats || !Array.isArray(monthlyStats.stats)) return 0
  return monthlyStats.stats.reduce((sum: number, month: any) => sum + (month?.total || 0), 0)
}

function calculateCompletedReports(monthlyStats: any): number {
  if (!monthlyStats?.stats || !Array.isArray(monthlyStats.stats)) return 0
  return monthlyStats.stats.reduce((sum: number, month: any) => sum + (month?.completed || 0), 0)
}

function calculateThisMonthReports(monthlyStats: any): number {
  if (!monthlyStats?.stats || !Array.isArray(monthlyStats.stats)) return 0
  const currentMonth = new Date().getMonth() + 1
  const thisMonth = monthlyStats.stats.find((m: any) => m?.month === currentMonth)
  return thisMonth?.total || 0
}

function calculateCompletionRate(monthlyStats: any[]): number {
  if (!monthlyStats || monthlyStats.length === 0) return 0
  
  const totalTasks = monthlyStats.reduce((sum, month) => sum + (month?.total || 0), 0)
  const completedTasks = monthlyStats.reduce((sum, month) => sum + (month?.completed || 0), 0)
  
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
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

// Individual hooks - these can be used when you only need specific data
export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.weeklyTaskStats,
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
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

export function useRecentActivities() {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.recentActivities,
    queryFn: () => StatisticsService.getRecentActivities(),
    staleTime: 60 * 1000,
    gcTime: 8 * 60 * 1000,
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
