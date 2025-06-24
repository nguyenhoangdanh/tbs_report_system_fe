import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService } from '@/services/report.service'
import type { WeeklyReport, CreateWeeklyReportDto, PaginatedResponse } from '@/types'

export function useMyReports(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<WeeklyReport>, Error>({
    queryKey: ['reports', 'my', page, limit] as const,
    queryFn: () => ReportService.getMyReports(page, limit),
  })
}

export function useReportById(id?: string) {
  return useQuery({
    queryKey: ['report', id] as const,
    queryFn: () => id ? ReportService.getReportById(id) : Promise.resolve(null),
    enabled: !!id,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  return useQuery({
    queryKey: ['report', weekNumber, year] as const,
    queryFn: () => (weekNumber && year) ? ReportService.getReportByWeek(weekNumber, year) : Promise.resolve(null),
    enabled: !!weekNumber && !!year,
  })
}

export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['statistics', 'dashboard'] })
    }
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ReportService.updateReport(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['statistics', 'dashboard'] })
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
