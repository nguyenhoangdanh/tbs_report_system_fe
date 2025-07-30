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
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook for manager reports - Force fresh data every time
 */
export function useManagerReports(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  const { user } = useAuth()

  console.log('🔍 useManagerReports filters:', {
  weekNumber: filters?.weekNumber,
  year: filters?.year,
  userId: filters?.userId,
  hasFilters: !!filters
})

 const currentWeek = getCurrentWeek()
  const safeFilters = {
    weekNumber: filters?.weekNumber || currentWeek.weekNumber,
    year: filters?.year || currentWeek.year,
    userId: filters?.userId || user?.id
  }
  
  
  return useApiQuery({
    // queryKey: [...QUERY_KEYS.hierarchy.managerReports(user?.id || 'anonymous', filters)],
         queryKey: [
      ...QUERY_KEYS.hierarchy.managerReports(user?.id || 'anonymous', safeFilters), 
    ],
    queryFn: async () => {
      try {
        const result = await HierarchyService.getManagerReports(safeFilters)
        return result
      } catch (error) {
        console.error('❌ useManagerReports: Fetch failed:', error)
        throw error
      }
    },
    enabled: !!user?.id,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // ✅ Always stale
    gcTime: 0, // ✅ No cache retention
  })
}

export function useMyHierarchyView(filters?: {
  weekNumber?: number
  year?: number
  month?: number
}) {
  const { user } = useAuth()
  
  // ✅ FIXED: Also update HierarchyDashboard to use custom events
  React.useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      console.log('🔄 useMyHierarchyView: Custom event received, forcing refresh')
      useHierarchyStore.getState().forceRefresh()
    }
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
        console.log('🔄 useMyHierarchyView: Storage event received, forcing refresh')
        useHierarchyStore.getState().forceRefresh()
      }
    }
    
    window.addEventListener('evaluation-changed', handleCustomEvent as EventListener)
    window.addEventListener('storage', handleStorageEvent)
    
    return () => {
      window.removeEventListener('evaluation-changed', handleCustomEvent as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
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

// ✅ SIMPLE: Revert to simple approach like useManagerReports
export function useAdminOverview(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  const { user } = useAuth()
  
  // ✅ SAME: Listen for evaluation broadcasts
  React.useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      console.log('🔄 useAdminOverview: Custom event received, forcing refresh')
      useAdminOverviewStore.getState().forceRefresh()
    }
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
        console.log('🔄 useAdminOverview: Storage event received, forcing refresh')
        useAdminOverviewStore.getState().forceRefresh()
      }
    }
    
    window.addEventListener('evaluation-changed', handleCustomEvent as EventListener)
    window.addEventListener('storage', handleStorageEvent)
    
    return () => {
      window.removeEventListener('evaluation-changed', handleCustomEvent as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  const {
    managerReportsData,
    currentFilters,
    lastRefreshTimestamp,
    isRefetching,
    setManagerReportsData,
    setRefreshing,
    shouldRefetch
  } = useAdminOverviewStore()

  // ✅ SAME: Sync user to store
  useEffect(() => {
    useAdminOverviewStore.getState().setLastUserId(user?.id || null)
  }, [user?.id])

  const currentWeek = getCurrentWeek()
  const safeFilters = {
    weekNumber: filters?.weekNumber || currentWeek.weekNumber,
    year: filters?.year || currentWeek.year,
    userId: filters?.userId || user?.id
  }

  // ✅ CRITICAL FIX: Make shouldRefetchData work like needsRefetch in useMyHierarchyView
  const shouldRefetchData = useMemo(() => {
    if (!user?.id) return false
    
    const shouldFetch = shouldRefetch(user.id, safeFilters)
    console.log('🔄 useAdminOverview needsRefetch calculation:', {
      userId: user.id,
      hasData: !!managerReportsData,
      shouldFetch,
      filters: safeFilters,
      lastRefreshTimestamp,
      timeSinceRefresh: Date.now() - lastRefreshTimestamp
    })
    
    return shouldFetch
  }, [user?.id, safeFilters?.weekNumber, safeFilters?.year, safeFilters?.userId, !!managerReportsData, shouldRefetch, lastRefreshTimestamp])

  const queryResult = useApiQuery({
    queryKey: ['admin-overview', 'manager-reports', user?.id || 'anonymous', JSON.stringify(safeFilters)],
    queryFn: async () => {
      try {
        console.log('🔄 useAdminOverview: Fetching with filters:', safeFilters, 'for user:', user?.id)
        setRefreshing(true)
        
        const result = await HierarchyService.getManagerReports(safeFilters)
        
        console.log('✅ useAdminOverview: Fresh data received:', !!result)
        
        if (result) {
          setManagerReportsData(result, safeFilters)
          setRefreshing(false)
          return result
        } else {
          setManagerReportsData(null, safeFilters)
          setRefreshing(false)
          throw new Error('Failed to fetch manager reports data')
        }
      } catch (error) {
        console.error('useAdminOverview: Error in queryFn:', error)
        setRefreshing(false)
        throw error
      }
    },
    // ✅ CRITICAL FIX: Make enabled depend on shouldRefetchData like useMyHierarchyView
    enabled: !!user?.id && shouldRefetchData,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  })

  // ✅ REMOVE: No longer need manual useEffect refetch since enabled handles it
  // React.useEffect(() => {
  //   if (shouldRefetchData && queryResult.refetch) {
  //     console.log('🔄 useAdminOverview: shouldRefetchData is true, forcing refetch')
  //     queryResult.refetch()
  //   }
  // }, [shouldRefetchData, queryResult.refetch])

  const finalData = queryResult.data

  // ✅ SAME: Return structure as useMyHierarchyView
  return {
    data: finalData,
    isLoading: queryResult.isLoading || isRefetching,
    isError: queryResult.isError,
    error: queryResult.error,
    isStoreRefreshing: isRefetching,
    isFetching: queryResult.isFetching,
    refetch: queryResult.refetch,
  }
}

// ✅ DEPRECATED: Keep old hook for backward compatibility but mark as deprecated
export function useManagerReportsWithStore(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  console.warn('useManagerReportsWithStore is deprecated, use useAdminOverview instead')
  return useAdminOverview(filters)
}