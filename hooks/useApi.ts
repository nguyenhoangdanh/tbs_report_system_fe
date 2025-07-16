'use client'

import { useState, useCallback } from 'react'
import { api, type ApiResult, type ApiError } from '@/lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<ApiResult<T>>
  reset: () => void
}

export function useApi<T>(
  apiCall: (...args: any[]) => Promise<ApiResult<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (...args: any[]): Promise<ApiResult<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await apiCall(...args)
      
      if (result.success) {
        setState({
          data: result.data || null,
          loading: false,
          error: null,
        })
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error || null,
        })
      }
      
      return result
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        code: 'UNKNOWN_ERROR',
      }
      
      setState({
        data: null,
        loading: false,
        error: apiError,
      })
      
      return { success: false, error: apiError }
    }
  }, [apiCall])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Specific hooks for common patterns
export function useGet<T>(endpoint: string) {
  return useApi<T>(() => api.get<T>(endpoint))
}

export function usePost<T>(endpoint: string) {
  return useApi<T>((data: any) => api.post<T>(endpoint, data))
}

export function usePut<T>(endpoint: string) {
  return useApi<T>((data: any) => api.put<T>(endpoint, data))
}

export function usePatch<T>(endpoint: string) {
  return useApi<T>((data: any) => api.patch<T>(endpoint, data))
}

export function useDelete<T = void>(endpoint: string) {
  return useApi<T>(() => api.delete<T>(endpoint))
}
