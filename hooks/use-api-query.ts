'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ApiResult } from '@/lib/api'
import { CacheUtils, createCacheUtils } from '@/lib/cache-utils'

// ================================
// TYPE DEFINITIONS
// ================================

interface OptimisticUpdateContext {
  previousData: any
  queryKey: readonly unknown[]
}

interface EnhancedMutationContext {
  optimistic?: OptimisticUpdateContext
  [key: string]: any
}

// ================================
// ENHANCED HOOKS
// ================================

/**
 * Enhanced useApiQuery with smart caching and error handling
 */
export function useApiQuery<TData, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'queryFn'> & {
    queryFn: () => Promise<ApiResult<TData>>
    // Enhanced options
    invalidateOnSuccess?: boolean
    cacheStrategy?: 'aggressive' | 'normal' | 'fresh' | 'realtime' | 'realtime-stable'
  }
) {
  // ✅ FIXED: Better cache configuration without conflicts
  const getCacheConfig = (strategy: string = 'normal') => {
    switch (strategy) {
      case 'aggressive':
        return { 
          staleTime: 10 * 60 * 1000, 
          gcTime: 30 * 60 * 1000,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false
        }
      case 'fresh':
        return { 
          staleTime: 0, // ✅ CRITICAL: Always stale for AdminOverview
          gcTime: 1000, // ✅ Very short cache time
          refetchOnMount: true,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false
        }
      case 'realtime':
        return {
          staleTime: 0,
          gcTime: 0,
          refetchOnMount: 'always' as const,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: false
        }
       case 'realtime-stable':
        return {
          staleTime: 0,
          gcTime: 2000,
          refetchOnMount: 'always' as const,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: false
        }
      default:
        return { 
          staleTime: 2 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false
        }
    }
  }

  const cacheConfig = getCacheConfig(options.cacheStrategy)
  
  // ✅ CRITICAL: Don't spread cacheConfig if options override them
  const { cacheStrategy, invalidateOnSuccess, ...cleanOptions } = options
  
  // ✅ FIXED: Properly merge cache config with user options, user options take precedence
  const finalOptions = {
    ...cacheConfig,
    ...cleanOptions, // User options override cache config
    queryFn: async () => {
      const result = await options.queryFn()
      if (!result.success) {
        const error = new Error(result.error?.message || 'API call failed') as any
        error.status = result.error?.status
        error.statusCode = result.error?.status
        error.code = result.error?.code
        throw error
      }
      return result.data!
    },
    retry: cleanOptions.retry !== undefined ? cleanOptions.retry : (cacheConfig.retry !== undefined ? cacheConfig.retry : (failureCount: number, error: any) => {
      if (error?.status === 404 || error?.statusCode === 404) return false
      if (error?.status === 401 || error?.statusCode === 401) return false
      if (error?.message?.includes('SECURITY')) return false
      return failureCount < 1
    }),
  }

  return useQuery<TData, TError>(finalOptions)
}

/**
 * Enhanced useApiMutation with optimistic updates and smart invalidation
 */
export function useApiMutation<
  TData, 
  TVariables = void, 
  TError = Error
>(
  options: Omit<UseMutationOptions<TData, TError, TVariables, EnhancedMutationContext>, 'mutationFn'> & {
    mutationFn: (variables: TVariables) => Promise<ApiResult<TData>>
    // Enhanced options
    optimisticUpdate?: {
      queryKey: readonly unknown[]
      updater: (old: any, variables: TVariables) => any
    }
    invalidation?: {
      type: 'user' | 'report' | 'evaluation' | 'organization' | 'custom'
      userId?: string
      customInvalidation?: (cacheUtils: CacheUtils, data: TData, variables: TVariables) => Promise<void>
    }
    enableOptimistic?: boolean
  }
) {
  const queryClient = useQueryClient()
  const cacheUtils = createCacheUtils(queryClient)

  return useMutation<TData, TError, TVariables, EnhancedMutationContext>({
    ...options,
    mutationFn: async (variables) => {
      const result = await options.mutationFn(variables)
      
      if (!result.success) {
        const error = new Error(result.error?.message || 'API call failed') as any
        error.status = result.error?.status
        error.statusCode = result.error?.status
        error.code = result.error?.code
        error.data = result.error?.data
        throw error
      }
      
      return result.data!
    },
    onMutate: async (variables): Promise<EnhancedMutationContext> => {
      let context: EnhancedMutationContext = {}
      
      // Custom onMutate
      if (options.onMutate) {
        const customContext = await options.onMutate(variables)
        if (customContext && typeof customContext === 'object') {
          context = { ...context, ...customContext }
        }
      }
      
      // Optimistic update
      if (options.enableOptimistic && options.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey })
        const previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey)
        
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          (old: any) => options.optimisticUpdate!.updater(old, variables)
        )
        
        context.optimistic = { 
          previousData, 
          queryKey: options.optimisticUpdate.queryKey 
        }
      }
      
      return context
    },
    onSuccess: async (data, variables, context) => {
      // Custom onSuccess
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }

      // Smart invalidation based on type
      if (options.invalidation) {
        const { type, userId, customInvalidation } = options.invalidation
        
        try {
          switch (type) {
            case 'user':
              if (userId) await cacheUtils.invalidateUserData(userId)
              break
            case 'report':
              if (userId) await cacheUtils.invalidateUserData(userId)
              break
            case 'evaluation':
              if (userId) await cacheUtils.invalidateUserData(userId)
              break
            case 'organization':
              cacheUtils.clearOrganizationCaches()
              break
            case 'custom':
              if (customInvalidation) {
                await customInvalidation(cacheUtils, data, variables)
              }
              break
          }
          
          // Force refetch active queries for immediate UI update
          setTimeout(() => cacheUtils.refetchActiveQueries(), 100)
        } catch (error) {
          console.warn('Cache invalidation failed:', error)
        }
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.optimistic) {
        queryClient.setQueryData(context.optimistic.queryKey, context.optimistic.previousData)
      }
      
      console.error('🚫 API Mutation failed:', error)
      
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    onSettled: (data, error, variables, context) => {
      if (options.onSettled) {
        options.onSettled(data, error, variables, context)
      }
    },
    retry: options.retry ?? 1,
  })
}

// ================================
// UTILITY HOOKS
// ================================

/**
 * Hook to get cache utils instance - MEMOIZED để tránh rerender
 */
export function useCacheUtils() {
  const queryClient = useQueryClient()
  
  // Memoize để tránh tạo instance mới mỗi render
  return useMemo(() => createCacheUtils(queryClient), [queryClient])
}

/**
 * Convenient hook for mutations with common patterns
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
  options: Parameters<typeof useApiMutation<TData, TVariables, TError>>[0] & {
    userId?: string
    invalidationType?: 'user' | 'report' | 'evaluation' | 'organization'
  }
) {
  return useApiMutation<TData, TVariables, TError>({
    ...options,
    enableOptimistic: true,
    invalidation: options.invalidationType ? {
      type: options.invalidationType,
      userId: options.userId,
    } : undefined,
  })
}
