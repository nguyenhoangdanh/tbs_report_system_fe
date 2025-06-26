import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService } from '@/services/report.service'
import type { WeeklyReport, CreateWeeklyReportDto, PaginatedResponse } from '@/types'

// Đơn giản hóa reports page data
export function useReportsPageData(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['reports', 'page-data', page, limit],
    queryFn: async () => {
      const [reportsData, currentWeekReport] = await Promise.allSettled([
        ReportService.getMyReports(page, limit),
        ReportService.getCurrentWeekReport(),
      ])

      return {
        reports: reportsData.status === 'fulfilled' ? reportsData.value : { data: [], total: 0, page, limit },
        currentWeekReport: currentWeekReport.status === 'fulfilled' ? currentWeekReport.value : null,
      }
    },
    staleTime: process.env.NODE_ENV === 'production' ? 3 * 60 * 1000 : 60 * 1000,
    gcTime: process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

// Optimized my reports query
export function useMyReports(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<WeeklyReport>, Error>({
    queryKey: ['reports', 'my', page, limit] as const,
    queryFn: () => ReportService.getMyReports(page, limit),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
    networkMode: 'online',
    meta: {
      priority: 'normal',
      timeout: 10000,
    },
  })
}

// Cached report by ID
export function useReportById(id?: string) {
  return useQuery({
    queryKey: ['report', id] as const,
    queryFn: () => id ? ReportService.getReportById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    networkMode: 'online',
    meta: {
      priority: 'high',
      timeout: 8000,
    },
  })
}

// Optimized report by week
export function useReportByWeek(weekNumber?: number, year?: number) {
  return useQuery({
    queryKey: ['report', 'week', weekNumber, year] as const,
    queryFn: () => (weekNumber && year) ? ReportService.getReportByWeek(weekNumber, year) : Promise.resolve(null),
    enabled: !!weekNumber && !!year,
    staleTime: 2 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    networkMode: 'online',
    meta: {
      priority: 'high',
      timeout: 8000,
    },
  })
}

// Đơn giản hóa mutations
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onSuccess: () => {
      // Đơn giản hóa cache invalidation
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    },
    retry: 1,
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ReportService.updateReport(id, data),
    onSuccess: (updatedReport, variables) => {
      queryClient.setQueryData(['report', variables.id], updatedReport)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    },
    retry: 1,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    },
    retry: 1,
  })
}

// Optimized task operations
export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => ReportService.deleteTask(taskId),
    onSuccess: () => {
      // Invalidate related queries efficiently
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['statistics', 'weekly-task-stats'] })
    },
    retry: 1,
    retryDelay: 1000,
    meta: {
      priority: 'normal',
      timeout: 8000,
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => ReportService.updateTask(taskId, data),
    onSuccess: () => {
      // Efficient cache invalidation
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['statistics', 'weekly-task-stats'] })
    },
    retry: 1,
    retryDelay: 1000,
    meta: {
      priority: 'normal',
      timeout: 8000,
    },
  })
}
