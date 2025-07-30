'use client'

import { HierarchyService } from '@/services/hierarchy.service'
import { getCurrentWeek } from '@/utils/week-utils'
import type { 
  ManagementHierarchyResponse,
  StaffHierarchyResponse,
  UserDetailsResponse,
  MixedHierarchyResponse 
} from '@/types/hierarchy'
import { useApiQuery } from './use-api-query'
import { QUERY_KEYS } from './query-key'
import { useAuth } from "@/components/providers/auth-provider"
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import useHierarchyStore from '@/store/hierarchy-store'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminOverviewStore } from '@/store/admin-overview-store'

/**
 * Hook for manager reports - Add simple broadcast listener
 */
export function useManagerReports(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [lastInvalidation, setLastInvalidation] = React.useState<number>(0)
  
  React.useEffect(() => {
    let debounceTimer: NodeJS.Timeout
    
    const handleEvaluationBroadcast = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
        try {
          const broadcastData = JSON.parse(e.newValue)
          if (broadcastData.type === 'evaluation-change') {
            const now = Date.now()
            
            // ✅ DEBOUNCE: Avoid rapid consecutive invalidations
            if (now - lastInvalidation < 1000) {
              console.log('🔄 useManagerReports: Skipping duplicate broadcast (too soon)')
              return
            }
            
            console.log('🔄 useManagerReports: Received broadcast, invalidating queries')
            
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
              console.log('🔄 useManagerReports: Executing query invalidation')
              setLastInvalidation(now)
              queryClient.invalidateQueries({
                queryKey: ['hierarchy', 'manager-reports'],
                exact: false,
                refetchType: 'all'
              })
            }, 800) // Increased delay to 800ms
          }
        } catch (e) {
          console.warn('Invalid evaluation broadcast data:', e)
        }
      }
    }
    
    window.addEventListener('storage', handleEvaluationBroadcast)
    return () => {
      window.removeEventListener('storage', handleEvaluationBroadcast)
      clearTimeout(debounceTimer)
    }
  }, [queryClient, lastInvalidation])

  return useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.managerReports(filters?.userId || 'anonymous', filters),
    queryFn: async () => {
      try {
        console.log('🔄 useManagerReports: Fetching with filters:', filters)
        const result = await HierarchyService.getManagerReports(filters)
        console.log('✅ useManagerReports: Fresh data received')
        return result
      } catch (error) {
        console.error('❌ useManagerReports: Fetch failed:', error)
        throw error
      }
    },
    enabled: !!filters?.weekNumber && !!filters?.year && !!filters?.userId,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 2000, // ✅ Increase staleTime to reduce rapid refetches
    gcTime: 5000,
  })
}

export function useMyHierarchyView(filters?: {
  weekNumber?: number
  year?: number
  month?: number
}) {
  const { user } = useAuth()
  
  React.useEffect(() => {
    let debounceTimer: NodeJS.Timeout
    
    const handleEvaluationBroadcast = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
        try {
          const broadcastData = JSON.parse(e.newValue)
          if (broadcastData.type === 'evaluation-change') {
            console.log('🔄 useMyHierarchyView: Received broadcast, debouncing refresh...')
            
            // ✅ DEBOUNCE: Clear previous timer and set new one
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
              console.log('🔄 useMyHierarchyView: Executing debounced refresh')
              useHierarchyStore.getState().forceRefresh()
            }, 500) // 500ms debounce to ensure backend has processed
          }
        } catch (e) {
          console.warn('Invalid evaluation broadcast data:', e)
        }
      }
    }
    
    window.addEventListener('storage', handleEvaluationBroadcast)
    return () => {
      window.removeEventListener('storage', handleEvaluationBroadcast)
      clearTimeout(debounceTimer)
    }
  }, [])

  const {
    hierarchyData,
    currentFilters,
    lastRefreshTimestamp,
    isRefreshing,
    setCurrentUser,
    setHierarchyData,
    setRefreshing,
    shouldRefetch
  } = useHierarchyStore()

  // Sync user to store
  useEffect(() => {
    setCurrentUser(user?.id || null)
  }, [user?.id, setCurrentUser])

  // ✅ FIXED: Stable needsRefetch that doesn't change constantly
  const needsRefetch = useMemo(() => {
    if (!user?.id) return false
    
    const shouldFetch = shouldRefetch(user.id, filters)
    console.log('🔄 needsRefetch calculation:', {
      userId: user.id,
      hasData: !!hierarchyData,
      shouldFetch,
      filters
    })
    
    return shouldFetch
  }, [user?.id, filters?.weekNumber, filters?.year, filters?.month, !!hierarchyData, shouldRefetch])

  const queryResult = useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.myView(user?.id || 'anonymous', filters),
    queryFn: async () => {
      try {
        console.log('🔄 useMyHierarchyView: Fetching with filters:', filters, 'for user:', user?.id)
        setRefreshing(true)
        
        const result = await HierarchyService.getMyHierarchyView(filters)
        
        console.log('✅ useMyHierarchyView: Fresh data received:', result?.success)
        
        if (result?.success && result.data) {
          setHierarchyData(result.data, filters)
          setRefreshing(false)
          return result
        } else {
          setHierarchyData(null, filters)
          setRefreshing(false)
          throw new Error(result?.error?.message || 'Failed to fetch hierarchy data')
        }
      } catch (error) {
        console.error('useMyHierarchyView: Error in queryFn:', error)
        setRefreshing(false)
        throw error
      }
    },
    enabled: !!user?.id && needsRefetch,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: false, // ✅ CRITICAL: Don't auto refetch on mount
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 5000, // ✅ Increase stale time to reduce refetches
    gcTime: 10000, // ✅ Increase gc time
  })

  const finalData = queryResult.data;

  // ✅ FIXED: Return the correct loading state
  return {
    data: finalData,
    isLoading: queryResult.isLoading || isRefreshing,
    isError: queryResult.isError,
    error: queryResult.error,
    isStoreRefreshing: isRefreshing,
    isFetching: queryResult.isFetching,
    refetch: queryResult.refetch,
  }
}

export function useUserDetails(userId: string, filters?: {
  weekNumber?: number
  year?: number
  limit?: number
  userId?: string
}) {
  const { user } = useAuth()
  
  return useApiQuery<UserDetailsResponse>({
    queryKey: QUERY_KEYS.hierarchy.userDetails(user?.id || 'anonymous', userId, filters),
    queryFn: () => HierarchyService.getUserDetails(userId, filters),
    enabled: !!userId && !!user?.id,
    cacheStrategy: 'realtime',
    throwOnError: false,
  })
}

/**
 * Get report details for admin view
 */
export function useReportDetailsForAdmin(userId: string, reportId: string) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.reportDetailsAdmin(user?.id || 'anonymous', reportId),
    queryFn: () => HierarchyService.getReportDetailsForAdmin(userId, reportId),
    enabled: !!userId && !!reportId && !!user?.id,
    cacheStrategy: 'normal', // Can cache report details for a bit
    throwOnError: false,
  })
}

export function useUserReportsForAdmin(userId: string, filters?: {
  page?: number
  limit?: number
  year?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.userReports(userId, filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.year) params.append('year', filters.year.toString())
      
      const response = await fetch(`/api/admin/users/${userId}/reports?${params}`)
      if (!response.ok) throw new Error('Failed to fetch user reports')
      return response.json()
    },
    enabled: !!userId && !!user?.id,
    cacheStrategy: 'normal',
    throwOnError: false,
  })
}

export function useCurrentWeekFilters() {
  const currentWeek = getCurrentWeek()
  return {
    weekNumber: currentWeek.weekNumber,
    year: currentWeek.year
  }
}

// Add new hook for admin overview filters - similar to hierarchy filters
export function useAdminOverviewFilters() {
  const currentWeekInfo = useMemo(() => getCurrentWeek(), [])
  
  const [filters, setFilters] = useState<{
    period: 'week' | 'month' | 'year'
    weekNumber?: number
    month?: number
    year: number
    periodWeeks?: number
  }>({
    period: 'week',
    weekNumber: currentWeekInfo.weekNumber,
    year: currentWeekInfo.year,
    periodWeeks: 4
  })

  const apiFilters = useMemo(() => {
    const baseFilters: any = {
      year: filters.year,
    }

    if (filters.period === 'week' && filters.weekNumber) {
      baseFilters.weekNumber = filters.weekNumber
    } else if (filters.period === 'month' && filters.month) {
      baseFilters.month = filters.month
    }

    return baseFilters
  }, [filters])

  const filterDisplayText = useMemo(() => {
    const { period, weekNumber, month, year } = filters

    if (period === 'week' && weekNumber) {
      return `Tuần ${weekNumber}/${year}`
    } else if (period === 'month' && month) {
      return `Tháng ${month}/${year}`
    } else {
      return `Năm ${year}`
    }
  }, [filters])

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
  }, [])

  return {
    filters,
    apiFilters,
    filterDisplayText,
    handleFiltersChange
  }
}

// Type guards - KHỚP CHÍNH XÁC VỚI BACKEND RESPONSE
export function isManagementHierarchy(data: any): data is ManagementHierarchyResponse {
  return data?.viewType === 'management' && data?.groupBy === 'position' && Array.isArray(data?.positions)
}

export function isStaffHierarchy(data: any): data is StaffHierarchyResponse {
  return data?.viewType === 'staff' && data?.groupBy === 'jobPosition' && Array.isArray(data?.jobPositions)
}

export function isMixedHierarchy(data: any): data is MixedHierarchyResponse {
  return data?.viewType === 'mixed' && data?.groupBy === 'mixed' && 
         (Array.isArray(data?.positions) || Array.isArray(data?.jobPositions))
}

// Helper functions
export function hasManagementPositions(data: any): boolean {
  if (isMixedHierarchy(data)) {
    return Array.isArray(data.positions) && data.positions.length > 0
  }
  return isManagementHierarchy(data) && data.positions.length > 0
}

export function hasJobPositions(data: any): boolean {
  if (isMixedHierarchy(data)) {
    return Array.isArray(data.jobPositions) && data.jobPositions.length > 0
  }
  return isStaffHierarchy(data) && data.jobPositions.length > 0
}