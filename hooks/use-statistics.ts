'use client'

import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'

export function useDashboardData() {
  return useQuery({
    queryKey: ['statistics', 'dashboard-combined'],
    queryFn: async () => {
      // Sequential loading for critical data first, then parallel for non-critical
      try {
        // 1. Load critical data first (faster response)
        const weeklyTaskStats = await StatisticsService.getWeeklyTaskStats();
        
        // 2. Load less critical data in parallel
        const [
          dashboardStats,
          activities,
          monthlyTaskStats,
          yearlyTaskStats,
        ] = await Promise.allSettled([
          StatisticsService.getDashboardStats(),
          StatisticsService.getRecentActivities(), 
          StatisticsService.getMonthlyTaskStats(),
          StatisticsService.getYearlyTaskStats(),
        ]);

        return {
          // Critical data loaded first
          weeklyTaskStats,
          // Secondary data with fallbacks
          dashboardStats: dashboardStats.status === 'fulfilled' ? dashboardStats.value : null,
          activities: activities.status === 'fulfilled' ? activities.value : [],
          monthlyTaskStats: monthlyTaskStats.status === 'fulfilled' ? monthlyTaskStats.value : { year: new Date().getFullYear(), stats: [] },
          yearlyTaskStats: yearlyTaskStats.status === 'fulfilled' ? yearlyTaskStats.value : { stats: [] },
        };
      } catch (error) {
        // Fallback for critical data failure
        console.warn('[DASHBOARD] Critical data load failed, using fallbacks:', error);
        
        // Load non-critical data only
        const [activities, monthlyTaskStats, yearlyTaskStats] = await Promise.allSettled([
          StatisticsService.getRecentActivities(),
          StatisticsService.getMonthlyTaskStats(),
          StatisticsService.getYearlyTaskStats(),
        ]);

        return {
          weeklyTaskStats: { weekNumber: 0, year: 0, completed: 0, uncompleted: 0, total: 0 },
          dashboardStats: null,
          activities: activities.status === 'fulfilled' ? activities.value : [],
          monthlyTaskStats: monthlyTaskStats.status === 'fulfilled' ? monthlyTaskStats.value : { year: new Date().getFullYear(), stats: [] },
          yearlyTaskStats: yearlyTaskStats.status === 'fulfilled' ? yearlyTaskStats.value : { stats: [] },
        };
      }
    },
    staleTime: 5 * 60 * 1000, // Increase to 5 minutes - dashboard data doesn't change frequently
    gcTime: 10 * 60 * 1000, // Increase garbage collection time
    refetchOnWindowFocus: false,
    retry: 1, // Single retry only
    refetchInterval: false, // Disable background refresh để giảm API calls
    // Enable selective refresh on user action instead
    refetchOnMount: true,
  });
}

// Lightweight hook for critical weekly stats only
export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'weekly-task-stats'],
    queryFn: () => StatisticsService.getWeeklyTaskStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes for frequent data
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2, // Allow more retries for critical data
    refetchInterval: false, // No background refresh
  });
}

// Individual hooks simplified
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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly-task-stats', year],
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'yearly-task-stats'],
    queryFn: () => StatisticsService.getYearlyTaskStats(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
