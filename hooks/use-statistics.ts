import { useQuery } from '@tanstack/react-query'
import { StatisticsService } from '@/services/statistics.service'

// Combined hook for dashboard data
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard', 'combined-data'],
    queryFn: async () => {
      // Fetch all dashboard data in parallel using Promise.all
      const [
        recentActivities,
        weeklyTaskStats,
        monthlyTaskStats,
        yearlyTaskStats
      ] = await Promise.all([
        StatisticsService.getRecentActivities(),
        StatisticsService.getWeeklyTaskStats(),
        StatisticsService.getMonthlyTaskStats(),
        StatisticsService.getYearlyTaskStats()
      ]);

      return {
        activities: recentActivities,
        weeklyTaskStats,
        monthlyTaskStats,
        yearlyTaskStats
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Keep individual hooks for other pages that need specific data
export function useDashboardStats() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: StatisticsService.getDashboardStats,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['statistics', 'recent-activities'],
    queryFn: StatisticsService.getRecentActivities,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useAdminDashboardStats(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  return useQuery({
    queryKey: ['statistics', 'admin-dashboard', filters],
    queryFn: () => StatisticsService.getAdminDashboardStats(filters),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useUserReportStats() {
  return useQuery({
    queryKey: ['statistics', 'user-reports'],
    queryFn: StatisticsService.getUserReportStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useWeeklyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'weekly-task-stats'],
    queryFn: StatisticsService.getWeeklyTaskStats,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useMonthlyTaskStats(year?: number) {
  return useQuery({
    queryKey: ['statistics', 'monthly-task-stats', year],
    queryFn: () => StatisticsService.getMonthlyTaskStats(year),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useYearlyTaskStats() {
  return useQuery({
    queryKey: ['statistics', 'yearly-task-stats'],
    queryFn: StatisticsService.getYearlyTaskStats,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
