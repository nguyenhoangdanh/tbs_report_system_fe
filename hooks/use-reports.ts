'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ReportService, CreateWeeklyReportDto, UpdateReportDto, PaginationParams } from '@/services/report.service'
import { toast } from 'react-toast-kit'
import { WeeklyReport, PaginatedResponse } from '@/types'
import { useAuth } from '@/components/providers/auth-provider'
import { useApiMutation, useApiQuery } from './use-api-query'
import useReportStore from '@/store/report-store'
import type { ApiResult, ProjectApiError  } from '@/lib/api'


// User-specific query keys
const QUERY_KEYS = {
  reports: (userId?: string) => ['reports', userId] as const,
  myReports: (userId: string, page: number, limit: number) => ['reports', 'my', userId, page, limit] as const,
  reportById: (userId: string, id: string) => ['reports', 'by-id', userId, id] as const,
  reportByWeek: (userId: string, weekNumber: number, year: number) => ['reports', 'by-week', userId, weekNumber, year] as const,
  currentWeek: (userId: string) => ['reports', 'current-week', userId] as const,
  statistics: (userId?: string) => ['statistics', userId] as const,
  dashboardData: (userId: string) => ['statistics', 'dashboard-combined', userId] as const,
}

// Clear user caches
export const clearUserCaches = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.reports(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.statistics(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.dashboardData(userId) })
  } else {
    queryClient.clear()
  }
}

// Error handler
const handleError = (error: any, defaultMessage: string) => {
  const message = error?.message || defaultMessage
  toast.error(message)
}

// Queries
export function useMyReports(page = 1, limit = 10) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.myReports(user?.id || 'anonymous', page, limit),
    queryFn: () => ReportService.getMyReports({ page, limit } as PaginationParams),
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    throwOnError: false,
  })
}

export function useReportById(id?: string) {
  const { user } = useAuth()
  
  return useApiQuery<WeeklyReport, Error>({
    queryKey: QUERY_KEYS.reportById(user?.id || 'anonymous', id!),
    queryFn: () => ReportService.getReportById(id!),
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  const { user } = useAuth()
  const { setCachedReport, getCachedReport, syncReportToStore, clearTasks } = useReportStore()
  
  return useApiQuery<WeeklyReport | null, Error>({
    queryKey: QUERY_KEYS.reportByWeek(user?.id || 'anonymous', weekNumber!, year!),
    queryFn: async (): Promise<ApiResult<WeeklyReport | null>> => {
      // Check store cache first
      const cacheKey = `${weekNumber}-${year}`
      const cached = getCachedReport(cacheKey)
      
      if (cached) {
        console.log('📦 Using cached report for week:', cacheKey)
        syncReportToStore(cached)
        return {
          success: true,
          data: cached
        }
      }
      
      try {
        // Call the service method
        const apiResult = await ReportService.getReportByWeek(weekNumber!, year!)
        
        // Handle the API result
        if (apiResult.success && apiResult.data) {
          console.log('✅ Fetched fresh report for week:', cacheKey, apiResult.data.id)
          setCachedReport(cacheKey, apiResult.data)
          syncReportToStore(apiResult.data)
          return {
            success: true,
            data: apiResult.data
          }
        } else if (apiResult.success && !apiResult.data) {
          // No report found for this week (valid case)
          console.log('❌ No report found for week:', cacheKey)
         // THÊM: Force clear selectedReport và cache
  const { selectedReport, clearCacheForWeek } = useReportStore.getState()
  if (selectedReport?.weekNumber === weekNumber && selectedReport?.year === year) {
    console.log('🧹 Clearing selectedReport for deleted week')
  }
  clearCacheForWeek(weekNumber!, year!) // Clear cache
  
  syncReportToStore(null) // Này sẽ clear selectedReport
  clearTasks()
          return {
            success: true,
            data: null
          }
        } else {
          // API returned error
          console.log('❌ API error for week:', cacheKey, apiResult.error)
          syncReportToStore(null)
          clearTasks()
          return {
            success: false,
            error: apiResult.error || {
              message: 'Failed to fetch report',
              status: 500,
              isServerError: true
            } as ProjectApiError
          }
        }
      } catch (error: any) {
        console.log('❌ Exception fetching report for week:', cacheKey, error)
        syncReportToStore(null)
        clearTasks()
        
        return {
          success: false,
          error: {
            message: error.message || 'Network error occurred',
            status: error.status || 500,
            isNetworkError: true
          } as ProjectApiError
        }
      }
    },
    enabled: !!weekNumber && !!year && weekNumber > 0 && year > 0 && !!user?.id,
     staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    throwOnError: false,
  })
}

export function useCurrentWeekReport() {
  const { user } = useAuth()
  
  return useApiQuery<WeeklyReport | null, Error>({
    queryKey: QUERY_KEYS.currentWeek(user?.id || 'anonymous'),
    queryFn: () => ReportService.getCurrentWeekReport(),
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    throwOnError: false,
  })
}

// Mutations
export function useCreateWeeklyReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { setCachedReport, syncReportToStore, setSaving } = useReportStore()
  
  return useApiMutation<WeeklyReport, CreateWeeklyReportDto, Error>({
    mutationFn: (data: CreateWeeklyReportDto) => ReportService.createWeeklyReport(data),
    onMutate: async (newReport) => {
      if (!user?.id) return
      setSaving(true)
      console.log('🚀 Creating report mutation started:', newReport)
    },
    onSuccess: (newReport, variables) => {
      if (!user?.id) return
      
      console.log('✅ Report created successfully:', newReport)
      
      // Update store and cache immediately
      const cacheKey = `${newReport.weekNumber}-${newReport.year}`
      setCachedReport(cacheKey, newReport)
      syncReportToStore(newReport)
      
      // Update React Query cache
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(user.id, newReport.weekNumber, newReport.year),
        newReport
      )
      
      // Invalidate related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports(user.id),
          exact: false,
          refetchType: 'active'
        })
        
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.currentWeek(user.id),
          refetchType: 'active'
        })

        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.statistics(user.id),
          exact: false,
          refetchType: 'active'
        })
      }, 100)
      
      toast.success('Tạo báo cáo thành công!')
    },
    onError: (error) => {
      console.error('❌ Create report failed:', error)
      handleError(error, 'Không thể tạo báo cáo')
    },
    onSettled: () => {
      setSaving(false)
    },
    retry: 1,
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { setCachedReport, syncReportToStore, setSaving } = useReportStore()

  return useApiMutation<WeeklyReport, { id: string, data: UpdateReportDto }, Error>({
    mutationFn: ({ id, data }: { id: string, data: UpdateReportDto }) => ReportService.updateReport(id, data),
    onMutate: async (variables) => {
      if (!user?.id) return
      setSaving(true)
      console.log('🚀 Updating report mutation started:', variables)
    },
    onSuccess: (updatedReport, variables) => {
      if (!user?.id) return
      
      console.log('✅ Report updated successfully:', updatedReport)
      
      // Update store and cache immediately
      const cacheKey = `${updatedReport.weekNumber}-${updatedReport.year}`
      setCachedReport(cacheKey, updatedReport)
      syncReportToStore(updatedReport)
      
      // Update React Query cache
      queryClient.setQueryData(QUERY_KEYS.reportById(user.id, variables.id), updatedReport)
      queryClient.setQueryData(
        QUERY_KEYS.reportByWeek(user.id, updatedReport.weekNumber, updatedReport.year),
        updatedReport
      )
      
      // Invalidate related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports(user.id),
          exact: false,
          refetchType: 'active'
        })

        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.statistics(user.id),
          exact: false,
          refetchType: 'active'
        })
      }, 100)

      toast.success('Cập nhật báo cáo thành công!')
    },
    onError: (error) => {
      console.error('❌ Update report failed:', error)
      handleError(error, 'Không thể cập nhật báo cáo')
    },
    onSettled: () => {
      setSaving(false)
    },
    retry: 1,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { removeCachedReport, syncReportToStore, clearTasks } = useReportStore()

  return useApiMutation<void, string, Error>({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onMutate: async (reportId) => {
      if (!user?.id) return
      console.log('🚀 Deleting report mutation started:', reportId)
    },
    onSuccess: (result, deletedId) => {
      if (!user?.id) return
      
      console.log('✅ Report deleted successfully:', deletedId)

      const { selectedReport } = useReportStore.getState()
  if (selectedReport?.id === deletedId) {
    console.log('🧹 Clearing selectedReport after deletion')
    syncReportToStore(null) // Đảm bảo clear selectedReport
  }
      
      // Clear store and cache immediately
      removeCachedReport(deletedId)
      syncReportToStore(null)
      clearTasks()
      
      // Remove from React Query cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.reportById(user.id, deletedId) })
      
      // Invalidate related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports(user.id),
          exact: false,
          refetchType: 'active'
        })
        
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.currentWeek(user.id),
          refetchType: 'active'
        })

        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.statistics(user.id),
          exact: false,
          refetchType: 'active'
        })
      }, 100)
      
      toast.success('Xóa báo cáo thành công!')
    },
    onError: (error) => {
      console.error('❌ Delete report failed:', error)
      handleError(error, 'Không thể xóa báo cáo')
    },
    retry: 1,
  })
}