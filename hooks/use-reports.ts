'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportService, CreateWeeklyReportDto, UpdateReportDto, UpdateTaskDto, PaginationParams, ReportFilters } from '@/services/report.service'
import { toast } from 'react-toast-kit'
import { WeeklyReport, PaginatedResponse } from '@/types'
import { useAuth } from '@/components/providers/auth-provider'

// User-specific query keys to prevent cross-user data contamination
const QUERY_KEYS = {
  reports: (userId?: string) => ['reports', userId] as const,
  myReports: (userId: string, page: number, limit: number) => ['reports', 'my', userId, page, limit] as const,
  reportById: (userId: string, id: string) => ['reports', 'by-id', userId, id] as const,
  reportByWeek: (userId: string, weekNumber: number, year: number) => ['reports', 'by-week', userId, weekNumber, year] as const,
  currentWeek: (userId: string) => ['reports', 'current-week', userId] as const,
  // Dashboard và statistics keys
  statistics: (userId?: string) => ['statistics', userId] as const,
  dashboardData: (userId: string) => ['statistics', 'dashboard-combined', userId] as const,
}

// Utility function to clear all user-specific caches
export const clearUserCaches = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.reports(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.statistics(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.dashboardData(userId) })
  } else {
    // Clear all caches if no specific user
    queryClient.clear()
  }
}

// Simplified error handler
const handleError = (error: any, defaultMessage: string) => {
  const message = error?.message || defaultMessage
  toast.error(message)
}

// Optimized my reports query with error handling
// Fix the return type to handle the actual API response structure
export function useMyReports(page = 1, limit = 10) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: QUERY_KEYS.myReports(user?.id || 'anonymous', page, limit),
    queryFn: () => ReportService.getMyReports({ page, limit } as PaginationParams),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
    // Transform response to handle different response structures
    select: (data: any) => {
      // If data has pagination structure
      if (data && typeof data === 'object' && 'data' in data) {
        return data
      }
      
      // If data is direct array
      if (Array.isArray(data)) {
        return {
          data: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1
        }
      }
      
      // Fallback
      return {
        data: [],
        total: 0,
        page: 1,
        limit: limit,
        totalPages: 0
      }
    }
  })
}

export function useReportById(id?: string) {
  const { user } = useAuth()
  
  return useQuery<WeeklyReport, Error>({
    queryKey: QUERY_KEYS.reportById(user?.id || 'anonymous', id!),
    queryFn: () => ReportService.getReportById(id!),
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: QUERY_KEYS.reportByWeek(user?.id || 'anonymous', weekNumber!, year!),
    queryFn: () => ReportService.getReportByWeek(weekNumber!, year!),
    enabled: !!weekNumber && !!year && weekNumber > 0 && year > 0 && !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 8 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (report not found)
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 2
    },
    throwOnError: false,
  })
}

export function useCurrentWeekReport() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: QUERY_KEYS.currentWeek(user?.id || 'anonymous'),
    queryFn: () => ReportService.getCurrentWeekReport(),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (report not found)
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 2
    },
    throwOnError: false,
  })
}

// Optimized mutations with simplified error handling
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<WeeklyReport, Error, CreateWeeklyReportDto>({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onSuccess: (newReport) => {
      if (!user?.id) return
      
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(user.id, newReport.weekNumber, newReport.year),
        newReport
      )
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports(user.id),
        exact: false 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.currentWeek(user.id) 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics(user.id),
        exact: false 
      })
    },
    onError: (error) => handleError(error, 'Không thể tạo báo cáo'),
    retry: 1,
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<WeeklyReport, Error, { id: string, data: UpdateReportDto }>({
    mutationFn: ({ id, data }: { id: string, data: UpdateReportDto }) => ReportService.updateReport(id, data),
    onSuccess: (updatedReport, variables) => {
      if (!user?.id) return
      
      queryClient.setQueryData(QUERY_KEYS.reportById(user.id, variables.id), updatedReport)
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(user.id, updatedReport.weekNumber, updatedReport.year),
        updatedReport
      )
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports(user.id),
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics(user.id),
        exact: false 
      })
    },
    onError: (error) => handleError(error, 'Không thể cập nhật báo cáo'),
    retry: 1,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onSuccess: (result, deletedId) => {
      if (!user?.id) return
      
      queryClient.removeQueries({ queryKey: QUERY_KEYS.reportById(user.id, deletedId) })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports(user.id),
        exact: false 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.currentWeek(user.id) 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics(user.id),
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.dashboardData(user.id) 
      })
      
      toast.success('Xóa báo cáo thành công!')
    },
    onError: (error) => handleError(error, 'Không thể xóa báo cáo'),
    retry: 1,
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: (taskId: string) => ReportService.deleteTask(taskId),
    onSuccess: () => {
      if (!user?.id) return
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports(user.id),
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics(user.id),
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
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: UpdateTaskDto }) => ReportService.updateTask(taskId, data),
    onSuccess: () => {
      if (!user?.id) return
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports(user.id),
        exact: false 
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics(user.id),
        exact: false 
      })
      
      toast.success('Cập nhật công việc thành công!')
    },
    onError: (error) => handleError(error, 'Không thể cập nhật công việc'),
    retry: 1,
  })
}