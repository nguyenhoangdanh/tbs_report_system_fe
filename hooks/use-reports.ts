import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService } from '@/services/report.service'
import { toast } from 'react-hot-toast'
import type { WeeklyReport, CreateWeeklyReportDto, PaginatedResponse } from '@/types'

// Optimized query keys
const QUERY_KEYS = {
  reports: ['reports'] as const,
  myReports: (page: number, limit: number) => ['reports', 'my', page, limit] as const,
  reportById: (id: string) => ['reports', 'by-id', id] as const,
  reportByWeek: (weekNumber: number, year: number) => ['reports', 'by-week', weekNumber, year] as const,
  currentWeek: ['reports', 'current-week'] as const,
  // Dashboard và statistics keys
  statistics: ['statistics'] as const,
  dashboardData: ['statistics', 'dashboard-combined'] as const,
}

// Simplified error handler
const handleError = (error: any, defaultMessage: string) => {
  // Just use the error message from backend, fallback to default
  const message = error?.message || defaultMessage
  toast.error(message)
}

// Optimized my reports query with error handling
export function useMyReports(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<WeeklyReport>, Error>({
    queryKey: QUERY_KEYS.myReports(page, limit),
    queryFn: () => ReportService.getMyReports(page, limit),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false, // Prevent throwing to React Error Boundary
  })
}

export function useReportById(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reportById(id!),
    queryFn: () => ReportService.getReportById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.reportByWeek(weekNumber!, year!),
    queryFn: () => ReportService.getReportByWeek(weekNumber!, year!),
    enabled: !!weekNumber && !!year,
    staleTime: 30 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

export function useCurrentWeekReport() {
  return useQuery({
    queryKey: QUERY_KEYS.currentWeek,
    queryFn: () => ReportService.getCurrentWeekReport(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    throwOnError: false,
  })
}

// Optimized mutations with simplified error handling
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onSuccess: (newReport) => {
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(newReport.weekNumber, newReport.year),
        newReport
      )
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports,
        exact: false 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.currentWeek 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics,
        exact: false 
      })
    },
    onError: (error) => handleError(error, 'Không thể tạo báo cáo'),
    retry: 1,
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ReportService.updateReport(id, data),
    onSuccess: (updatedReport, variables) => {
      queryClient.setQueryData(QUERY_KEYS.reportById(variables.id), updatedReport)
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(updatedReport.weekNumber, updatedReport.year),
        updatedReport
      )
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports,
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics,
        exact: false 
      })
    },
    onError: (error) => handleError(error, 'Không thể cập nhật báo cáo'),
    retry: 1,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onSuccess: (result, deletedId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.reportById(deletedId) })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports,
        exact: false 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.currentWeek 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics,
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.dashboardData 
      })
      
      toast.success('Xóa báo cáo thành công!')
    },
    onError: (error) => handleError(error, 'Không thể xóa báo cáo'),
    retry: 1,
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => ReportService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports,
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics,
        exact: false 
      })
      
      toast.success('Xóa công việc thành công!')
    },
    onError: (error) => handleError(error, 'Không thể xóa công việc'),
    retry: 1,
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => ReportService.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports,
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics,
        exact: false 
      })
      
      toast.success('Cập nhật công việc thành công!')
    },
    onError: (error) => handleError(error, 'Không thể cập nhật công việc'),
    retry: 1,
  })
}
