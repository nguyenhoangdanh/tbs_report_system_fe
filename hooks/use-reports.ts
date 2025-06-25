import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService } from '@/services/report.service'
import type { WeeklyReport, CreateWeeklyReportDto, PaginatedResponse } from '@/types'

// Combined hook for reports page
export function useReportsPageData(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['reports', 'page-data', page, limit],
    queryFn: async () => {
      // Fetch reports and current week report in parallel
      const [reportsData, currentWeekReport] = await Promise.all([
        ReportService.getMyReports(page, limit),
        ReportService.getCurrentWeekReport().catch(() => null) // Don't fail if no current week report
      ]);

      return {
        reports: reportsData,
        currentWeekReport
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

export function useMyReports(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<WeeklyReport>, Error>({
    queryKey: ['reports', 'my', page, limit] as const,
    queryFn: () => ReportService.getMyReports(page, limit),
    staleTime: 60 * 1000,
  })
}

export function useReportById(id?: string) {
  return useQuery({
    queryKey: ['report', id] as const,
    queryFn: () => id ? ReportService.getReportById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  return useQuery({
    queryKey: ['report', weekNumber, year] as const,
    queryFn: () => (weekNumber && year) ? ReportService.getReportByWeek(weekNumber, year) : Promise.resolve(null),
    enabled: !!weekNumber && !!year,
    staleTime: 60 * 1000,
  })
}

// Optimized mutations with better cache invalidation
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onSuccess: () => {
      // Invalidate related queries efficiently
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    }
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ReportService.updateReport(id, data),
    onSuccess: (_data, variables) => {
      // More targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: ['report', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['statistics', 'dashboard'] })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => ReportService.deleteTask(taskId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report', 'my'] })
        queryClient.invalidateQueries({ queryKey: ['statistics', 'dashboard'] })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => ReportService.updateTask(taskId, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report', 'my'] })
        queryClient.invalidateQueries({ queryKey: ['statistics', 'dashboard'] })
    }
  })
}
