'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'
import type { 
  DashboardStats, 
  RecentActivity, 
  WeeklyTaskStats, 
  MonthlyTaskStats, 
  YearlyTaskStats 
} from '@/services/statistics.service'

export function useDashboardData() {
  return useQuery({
    queryKey: ['statistics', 'dashboard-combined'],
    queryFn: async () => {
      // Parallel API calls for better performance
      const [
        dashboardStats,
        activities,
        weeklyTaskStats,
        monthlyTaskStats,
        yearlyTaskStats,
      ] = await Promise.all([
        StatisticsService.getDashboardStats().catch(() => null),
        StatisticsService.getRecentActivities().catch(() => []),
        StatisticsService.getWeeklyTaskStats().catch(() => ({ weekNumber: 0, year: 0, completed: 0, uncompleted: 0, total: 0 })),
        StatisticsService.getMonthlyTaskStats().catch(() => ({ year: new Date().getFullYear(), stats: [] })),
        StatisticsService.getYearlyTaskStats().catch(() => ({ stats: [] })),
      ]);

      return {
        dashboardStats,
        activities,
        weeklyTaskStats,
        monthlyTaskStats,
        yearlyTaskStats,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    // Enable background refetch
    refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
  });
}

// Individual hooks for specific data if needed
export function useDashboardStats() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => StatisticsService.getDashboardStats(),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['statistics', 'recent-activities'],
    queryFn: () => StatisticsService.getRecentActivities(),
    staleTime: 60 * 1000, // 1 minute for activities
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'weekly-task-stats'],
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly-task-stats', year],
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 5 * 60 * 1000, // 5 minutes for monthly data
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'yearly-task-stats'],
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes for yearly data
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
