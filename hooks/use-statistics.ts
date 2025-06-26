'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'

export function useDashboardData() {
  return useQuery({
    queryKey: ['statistics', 'dashboard-combined'],
    queryFn: async () => {
      // In production, prioritize most important data first
      if (process.env.NODE_ENV === 'production') {
        try {
          // Load critical data first (fastest response)
          const weeklyTaskStats = await StatisticsService.getWeeklyTaskStats();
          
          // Then load secondary data with shorter timeout
          const [activities, monthlyTaskStats, yearlyTaskStats] = await Promise.allSettled([
            StatisticsService.getRecentActivities(),
            StatisticsService.getMonthlyTaskStats(),
            StatisticsService.getYearlyTaskStats(),
          ]);

          return {
            weeklyTaskStats,
            dashboardStats: null, // Skip heavy dashboard stats in production for faster load
            activities: activities.status === 'fulfilled' ? activities.value : [],
            monthlyTaskStats: monthlyTaskStats.status === 'fulfilled' ? monthlyTaskStats.value : { year: new Date().getFullYear(), stats: [] },
            yearlyTaskStats: yearlyTaskStats.status === 'fulfilled' ? yearlyTaskStats.value : { stats: [] },
          };
        } catch (error) {
          // Fallback: minimal data for production
          return {
            weeklyTaskStats: { weekNumber: 0, year: 0, completed: 0, uncompleted: 0, total: 0 },
            dashboardStats: null,
            activities: [],
            monthlyTaskStats: { year: new Date().getFullYear(), stats: [] },
            yearlyTaskStats: { stats: [] },
          };
        }
      } else {
        // Development: load all data in parallel
        const [
          dashboardStats,
          activities,
          weeklyTaskStats,
          monthlyTaskStats,
          yearlyTaskStats,
        ] = await Promise.allSettled([
          StatisticsService.getDashboardStats(),
          StatisticsService.getRecentActivities(),
          StatisticsService.getWeeklyTaskStats(),
          StatisticsService.getMonthlyTaskStats(),
          StatisticsService.getYearlyTaskStats(),
        ]);

        return {
          dashboardStats: dashboardStats.status === 'fulfilled' ? dashboardStats.value : null,
          activities: activities.status === 'fulfilled' ? activities.value : [],
          weeklyTaskStats: weeklyTaskStats.status === 'fulfilled' ? weeklyTaskStats.value : { weekNumber: 0, year: 0, completed: 0, uncompleted: 0, total: 0 },
          monthlyTaskStats: monthlyTaskStats.status === 'fulfilled' ? monthlyTaskStats.value : { year: new Date().getFullYear(), stats: [] },
          yearlyTaskStats: yearlyTaskStats.status === 'fulfilled' ? yearlyTaskStats.value : { stats: [] },
        };
      }
    },
    staleTime: process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 2 * 60 * 1000, // 10 min in production
    gcTime: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: process.env.NODE_ENV === 'production' ? 0 : 1, // No retry in production for faster UX
    refetchInterval: false, // Disable background refresh
    refetchOnMount: true,
  });
}

// Lightweight hook for critical weekly stats only
export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'weekly-task-stats'],
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: false,
  });
}

// Minimal hooks for other stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => StatisticsService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0, // No retry for secondary data
    enabled: process.env.NODE_ENV !== 'production', // Disable in production
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['statistics', 'recent-activities'],
    queryFn: () => StatisticsService.getRecentActivities(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly-task-stats', year],
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'yearly-task-stats'],
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}
