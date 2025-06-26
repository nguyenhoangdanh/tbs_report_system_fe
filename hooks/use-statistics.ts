'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'

// Đơn giản hóa dashboard data loading
export function useDashboardData() {
  return useQuery({
    queryKey: ['statistics', 'dashboard-combined'],
    queryFn: async () => {
      // Load data theo thứ tự ưu tiên
      const [weeklyTaskStats, activities, monthlyTaskStats, yearlyTaskStats] = await Promise.allSettled([
        StatisticsService.getWeeklyTaskStats(),
        StatisticsService.getRecentActivities(),
        StatisticsService.getMonthlyTaskStats(),
        StatisticsService.getYearlyTaskStats(),
      ])

      return {
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
    staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2 * 60 * 1000,
    gcTime: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

// Individual hooks được đơn giản hóa
export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'weekly-task-stats'],
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => StatisticsService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['statistics', 'recent-activities'],
    queryFn: () => StatisticsService.getRecentActivities(),
    staleTime: 2 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly-task-stats', year],
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'yearly-task-stats'],
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
