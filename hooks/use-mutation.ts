import { useAuth } from '@/components/providers/auth-provider'
import { ApiResult } from '@/lib/api'
// ================================
// CACHE INVALIDATION UTILITIES
// ================================

import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from './use-api-query'
import { QUERY_KEYS } from './query-key'

export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  // ===== ENHANCED INVALIDATE METHODS =====
  
  /**
   * Invalidate all user-related data after major changes
   */
  async invalidateUserData(userId: string) {
    const promises = [
      // Reports
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.user(userId) }),
      // Evaluations
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.evaluations.user(userId) }),
      // Hierarchy
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.myView(userId) }),
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.managerReports(userId) }),
      // Statistics
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics.user(userId) }),
      // User profile
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.detail(userId) }),
    ]
    
    await Promise.all(promises)
  }

  /**
   * Invalidate report-related data after report operations
   */
  async invalidateReportData(userId: string, reportId?: string) {
    const promises = [
      // User reports
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.user(userId) }),
      // Hierarchy data
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.myView(userId) }),
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.managerReports(userId) }),
      // Statistics
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics.user(userId) }),
      // Evaluations (affected by report changes)
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.evaluations.user(userId) }),
    ]

    if (reportId) {
      promises.push(
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.reportDetailsAdmin(userId, reportId) })
      )
    }
    
    await Promise.all(promises)
  }

  /**
   * Invalidate evaluation-related data after evaluation operations
   */
  async invalidateEvaluationData(userId: string, taskId?: string) {
    const promises = [
      // Evaluations
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.evaluations.all }),
      // Reports (tasks might have evaluation changes)
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.user(userId) }),
      // Hierarchy (evaluation affects hierarchy view)
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.all }),
      // Statistics
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics.user(userId) }),
    ]

    if (taskId) {
      promises.push(
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.evaluations.task(taskId) })
      )
    }
    
    await Promise.all(promises)
  }

  /**
   * Invalidate user management data after user operations
   */
  async invalidateUserManagementData(userId?: string) {
    const promises = [
      // All user lists
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.lists() }),
      // User with ranking
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all, predicate: (query) => 
        query.queryKey[0] === 'users' && query.queryKey.includes('with-ranking')
      }),
    ]

    if (userId) {
      promises.push(
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.detail(userId) })
      )
    }
    
    await Promise.all(promises)
  }

  /**
   * Invalidate statistics data after any data changes
   */
  async invalidateStatisticsData(userId: string) {
    await this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics.user(userId) })
  }

  /**
   * Force refetch active queries for immediate UI update
   */
  async refetchActiveQueries() {
    await this.queryClient.refetchQueries({ type: "active" })
  }

  /**
   * Clear specific user cache completely
   */
  clearUserCache(userId: string) {
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS.reports.user(userId) })
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS.evaluations.user(userId) })
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS.hierarchy.myView(userId) })
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS.statistics.user(userId) })
    this.queryClient.removeQueries({ queryKey: QUERY_KEYS.users.detail(userId) })
  }

  /**
   * Update specific query data optimistically
   */
  updateQueryData<T>(queryKey: readonly unknown[], updater: (old: T | undefined) => T) {
    this.queryClient.setQueryData(queryKey, updater)
  }

  /**
   * Remove specific query from cache
   */
  removeQuery(queryKey: readonly unknown[]) {
    this.queryClient.removeQueries({ queryKey })
  }
}

// ================================
// UPDATED HOOKS WITH STANDARDIZED KEYS
// ================================

// Hook to create cache manager instance
export function useCacheManager() {
  const queryClient = useQueryClient()
  return new CacheManager(queryClient)
}

// ===== OPTIMIZED MUTATION HOOKS =====

/**
 * Enhanced mutation hook with comprehensive cache invalidation
 */
export function useOptimizedMutation<TData, TVariables, TError = Error>(
  options: {
    mutationFn: (variables: TVariables) => Promise<ApiResult<TData>>
    onMutate?: (variables: TVariables) => Promise<any> | any
    onSuccess?: (data: TData, variables: TVariables, context: any) => void
    onError?: (error: TError, variables: TVariables, context: any) => void
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void
    invalidateQueries?: (cacheManager: CacheManager, data: TData, variables: TVariables) => Promise<void>
    mutationKey?: readonly unknown[]
    retry?: number
  }
) {
  const cacheManager = useCacheManager()
  const { user } = useAuth()

  return useApiMutation<TData, TVariables, TError>({
    ...options,
    onSuccess: async (data, variables, context) => {
      // Call custom onSuccess first
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }

      // Execute custom invalidation logic
      if (options.invalidateQueries && user?.id) {
        await options.invalidateQueries(cacheManager, data, variables)
      }

      // Force refetch active queries for immediate UI update
      setTimeout(() => {
        cacheManager.refetchActiveQueries()
      }, 50)
    },
    onError: (error, variables, context) => {
      console.error('🚫 Optimized mutation failed:', error)
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    retry: options.retry ?? 1,
  })
}