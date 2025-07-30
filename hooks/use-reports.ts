'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ReportService, CreateWeeklyReportDto, UpdateReportDto, PaginationParams, TaskEvaluationsService } from '@/services/report.service'
import { toast } from 'react-toast-kit'
import { WeeklyReport, PaginatedResponse, TaskEvaluation, EvaluationType, Task } from '@/types'
import { useAuth } from '@/components/providers/auth-provider'
import { useApiMutation, useApiQuery } from './use-api-query'
import useReportStore from '@/store/report-store'
import type { ApiResult, ProjectApiError  } from '@/lib/api'
import { QUERY_KEYS, INVALIDATION_PATTERNS } from './query-key'
import { hierarchyStoreActions } from '@/store/hierarchy-store'
import { adminOverviewStoreActions } from '@/store/admin-overview-store'

// Clear user caches
export const clearUserCaches = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.reports.all(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.statistics.user(userId) })
    queryClient.removeQueries({ queryKey: QUERY_KEYS.statistics.dashboardCombined(userId) })
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
    queryKey: QUERY_KEYS.reports.myReports(user?.id || 'anonymous', page, limit),
    queryFn: () => ReportService.getMyReports({ page, limit } as PaginationParams),
    enabled: !!user?.id,
    cacheStrategy: 'fresh',
    throwOnError: false,
  })
}

export function useReportById(id?: string) {
  const { user } = useAuth()
  
  return useApiQuery<WeeklyReport, Error>({
    queryKey: QUERY_KEYS.reports.reportById(user?.id || 'anonymous', id!),
    queryFn: () => ReportService.getReportById(id!),
    enabled: !!id && !!user?.id,
    cacheStrategy: 'normal',
    throwOnError: false,
  })
}

export function useReportByWeek(weekNumber?: number, year?: number) {
  const { user } = useAuth()
  const { setCachedReport, getCachedReport, syncReportToStore, clearTasks } = useReportStore()
  
  return useApiQuery<WeeklyReport | null, Error>({
    queryKey: QUERY_KEYS.reports.reportByWeek(user?.id || 'anonymous', weekNumber!, year!),
    queryFn: async (): Promise<ApiResult<WeeklyReport | null>> => {
      // Check store cache first
      const cacheKey = `${weekNumber}-${year}`
      const cached = getCachedReport(cacheKey)
      
      if (cached) {
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
          setCachedReport(cacheKey, apiResult.data)
          syncReportToStore(apiResult.data)
          return {
            success: true,
            data: apiResult.data
          }
        } else if (apiResult.success && !apiResult.data) {
          // No report found for this week (valid case)
          // OPTIMIZED: Use store directly instead of hook
          const { selectedReport, clearCacheForWeek } = useReportStore.getState()
          if (selectedReport?.weekNumber === weekNumber && selectedReport?.year === year) {
            clearCacheForWeek(weekNumber!, year!) // Clear cache
            syncReportToStore(null) // Clear selectedReport
            clearTasks()
          }
          
          return {
            success: true,
            data: null
          }
        } else {
          // API returned error
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
    cacheStrategy: 'fresh', // Always fresh for current work
    throwOnError: false,
  })
}

export function useCurrentWeekReport() {
  const { user } = useAuth()
  
  return useApiQuery<WeeklyReport | null, Error>({
    queryKey: QUERY_KEYS.reports.currentWeek(user?.id || 'anonymous'),
    queryFn: () => ReportService.getCurrentWeekReport(),
    enabled: !!user?.id,
    cacheStrategy: 'fresh',
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
    enableOptimistic: true,
    optimisticUpdate: {
      queryKey: QUERY_KEYS.reports.myReports(user?.id || 'anonymous', 1, 10),
      updater: (old: any, variables) => {
        const optimisticReport = {
          id: `temp-${Date.now()}`,
          ...variables,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
        return old ? [optimisticReport, ...old.data] : [optimisticReport]
      }
    },
    onMutate: async (newReport) => {
      if (!user?.id) return
      setSaving(true)
    },
    onSuccess: (newReport, variables) => {
      if (!user?.id) return
      
      
      // ✅ ENHANCED: Update store with the ACTUAL response data
      const cacheKey = `${newReport.weekNumber}-${newReport.year}`
      setCachedReport(cacheKey, newReport)
      syncReportToStore(newReport)
      
      // Update React Query cache
      queryClient.setQueryData(
        QUERY_KEYS.reports.reportByWeek(user.id, newReport.weekNumber, newReport.year),
        newReport
      )
      
      // Invalidate related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports.all(user.id),
          exact: false,
          refetchType: 'active'
        })
        
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports.currentWeek(user.id),
          refetchType: 'active'
        })

        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.statistics.user(user.id),
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
    },
    onSuccess: (updatedReport, variables) => {
      if (!user?.id) return
      
      
      // ✅ ENHANCED: Update store with the ACTUAL response data
      const cacheKey = `${updatedReport.weekNumber}-${updatedReport.year}`
      setCachedReport(cacheKey, updatedReport)
      syncReportToStore(updatedReport)
      
      // Update React Query cache
      queryClient.setQueryData(QUERY_KEYS.reports.reportById(user.id, variables.id), updatedReport)
      queryClient.setQueryData(
        QUERY_KEYS.reports.reportByWeek(user.id, updatedReport.weekNumber, updatedReport.year),
        updatedReport
      )
      
      // Invalidate related queries
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.reports.all(user.id),
          exact: false,
          refetchType: 'active'
        })

        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.statistics.user(user.id),
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
  const { removeCachedReport, syncReportToStore, clearTasks, clearCacheForWeek } = useReportStore()

  return useApiMutation<void, string, Error>({
    mutationFn: (id: string) => ReportService.deleteReport(id),
    onMutate: async (reportId) => {
      if (!user?.id) return
      
      // Get the report data before deletion for cleanup
      const reportQuery = queryClient.getQueriesData({ 
        queryKey: QUERY_KEYS.reports.all(user.id) 
      })
      
      // Find the report to be deleted
      let reportToDelete = null
      for (const [queryKey, data] of reportQuery) {
        if (Array.isArray(data)) {
          reportToDelete = data.find((r: any) => r.id === reportId)
        } else if (data && typeof data === 'object' && 'data' in data) {
          const reports = (data as any).data
          if (Array.isArray(reports)) {
            reportToDelete = reports.find((r: any) => r.id === reportId)
          }
        }
        if (reportToDelete) break
      }
      
      
      // Clear store state first
      const { selectedReport } = useReportStore.getState()
      if (selectedReport?.id === reportId) {
        syncReportToStore(null)
        clearTasks()
      }
      
      if (reportToDelete) {
        clearCacheForWeek(reportToDelete.weekNumber, reportToDelete.year)
        removeCachedReport(reportId)
        
        // Clear React Query cache immediately
        queryClient.removeQueries({ 
          queryKey: QUERY_KEYS.reports.reportByWeek(user.id, reportToDelete.weekNumber, reportToDelete.year) 
        })
        queryClient.removeQueries({ 
          queryKey: QUERY_KEYS.reports.reportById(user.id, reportId) 
        })
      }
      
      return { reportToDelete }
    },
    onSuccess: (result, deletedId, context) => {
      if (!user?.id) return
      
      
      // ENHANCED: Ensure complete state cleanup after successful deletion
      const { selectedReport } = useReportStore.getState()
      if (selectedReport?.id === deletedId) {
        syncReportToStore(null)
        clearTasks()
      }
      
      // Clear all caches related to this report
      removeCachedReport(deletedId)
      
      // Remove from React Query cache completely
      queryClient.removeQueries({ queryKey: QUERY_KEYS.reports.reportById(user.id, deletedId) })

      // If we have the report data, also clear week-specific cache
      if (context?.reportToDelete) {
        const { weekNumber, year } = context.reportToDelete
        queryClient.removeQueries({ 
          queryKey: QUERY_KEYS.reports.reportByWeek(user.id, weekNumber, year) 
        })
      }
      
      // Force immediate invalidation of related queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports.all(user.id),
        exact: false,
        refetchType: 'all'
      })
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reports.currentWeek(user.id),
        refetchType: 'all'
      })

      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.statistics.user(user.id),
        exact: false,
        refetchType: 'all'
      })
      
      toast.success('Xóa báo cáo thành công!')
    },
    onError: (error) => {
      console.error('❌ Delete report failed:', error)
      handleError(error, 'Không thể xóa báo cáo')
    },
    retry: 1,
  })
}

export function useApproveTask() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useApiMutation<void, string, Error>({
    mutationFn: (taskId: string) => ReportService.approveTask(taskId),
    onMutate: async (taskId) => {
      if (!user?.id) return
    },
    onSuccess: (result, taskId) => {

      if (!user?.id) return
      
      // ✅ TARGETED: Use invalidation patterns for consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: INVALIDATION_PATTERNS.adminOverview.all(),
          exact: false,
          refetchType: 'all'
        })
        
        queryClient.invalidateQueries({ 
          queryKey: INVALIDATION_PATTERNS.reports.userSpecific(user.id),
          exact: false,
          refetchType: 'all'
        })
        
        hierarchyStoreActions.forceRefresh()
        adminOverviewStoreActions.forceRefresh()
      }, 50)
      
      toast.success('Task approved successfully!')
    },
    onError: (error) => {
      console.error('❌ Approve task failed:', error)
      handleError(error, 'Failed to approve task')
    },
    retry: 1,
  })
}

export function useRejectTask() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useApiMutation<void, string, Error>({
    mutationFn: (taskId: string) => ReportService.rejectTask(taskId),
    onMutate: async (taskId) => {
      if (!user?.id) return
    },
    onSuccess: (result, taskId) => {
      if (!user?.id) return

      // ✅ TARGETED: Use invalidation patterns for consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: INVALIDATION_PATTERNS.adminOverview.all(),
          exact: false,
          refetchType: 'all'
        })
        
        queryClient.invalidateQueries({ 
          queryKey: INVALIDATION_PATTERNS.reports.userSpecific(user.id),
          exact: false,
          refetchType: 'all'
        })
        
        hierarchyStoreActions.forceRefresh()
        adminOverviewStoreActions.forceRefresh()
      }, 50)
      
      toast.success('Task rejected successfully!')
    },
    onError: (error) => {
      console.error('❌ Reject task failed:', error)
      handleError(error, 'Failed to reject task')
    },
    retry: 1,
  })
}