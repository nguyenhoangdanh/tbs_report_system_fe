'use client'

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import type { ApiResult } from '@/lib/api'

/**
 * Custom hook that wraps useQuery to handle ApiResult pattern
 */
export function useApiQuery<TData, TError = Error>(
  options: Omit<UseQueryOptions<TData, TError>, 'queryFn'> & {
    queryFn: () => Promise<ApiResult<TData>>
  }
) {
  return useQuery<TData, TError>({
    ...options,
    queryFn: async () => {
      const result = await options.queryFn()
      if (!result.success) {
        // Create proper error object with status code
        const error = new Error(result.error?.message || 'API call failed') as any
        error.status = result.error?.status
        error.statusCode = result.error?.status
        error.code = result.error?.code
        throw error
      }
      return result.data!
    },
    // Enhanced retry logic with proper error handling
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (not found)
      if (error?.status === 404 || error?.statusCode === 404) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

/**
 * Custom hook that wraps useMutation to handle ApiResult pattern
 * TData - The type of data returned by the mutation
 * TVariables - The type of variables passed to the mutation
 * TError - The type of error (defaults to Error)
 * TContext - The type of context returned by onMutate (defaults to unknown)
 */
export function useApiMutation<
  TData, 
  TVariables = void, 
  TError = Error, 
  TContext = unknown
>(
  options: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> & {
    mutationFn: (variables: TVariables) => Promise<ApiResult<TData>>
  }
) {
  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn: async (variables) => {
      const result = await options.mutationFn(variables)
      
      // Check if the API call was successful
      if (!result.success) {
        // Create proper error object with all error details
        const error = new Error(result.error?.message || 'API call failed') as any
        error.status = result.error?.status
        error.statusCode = result.error?.status
        error.code = result.error?.code
        error.data = result.error?.data
        error.response = {
          status: result.error?.status,
          data: result.error?.data
        }
        
        console.error('🚫 API Mutation Error:', {
          message: error.message,
          status: error.status,
          data: error.data
        })
        
        throw error
      }
      
      return result.data!
    },
    // Enhanced mutation options with better error handling
    onSuccess: (data, variables, context) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      console.error('💥 Mutation failed:', error)
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    onSettled: (data, error, variables, context) => {
      if (options.onSettled) {
        options.onSettled(data, error, variables, context)
      }
    }
  })
}
