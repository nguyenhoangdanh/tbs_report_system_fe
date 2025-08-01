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
import useAdminOverviewStore from '@/store/admin-overview-store'

/**
 * Hook for manager reports - Force fresh data every time
 */
export function useManagerReports(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  const { user } = useAuth()

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
      useHierarchyStore.getState().forceRefresh()
    }
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
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
    isRefreshing,
    setHierarchyData,
    setRefreshing,
    shouldRefetch,
    initializeStore,
    isInitialized
  } = useHierarchyStore()

  // Sync user to store
  // useEffect(() => {
  //   setCurrentUser(user?.id || null)
  // }, [user?.id, setCurrentUser])
  useEffect(() => {
    if (user?.id) {
      initializeStore(user.id)
    }
  }, [user?.id, initializeStore])

  // ✅ FIXED: Stable needsRefetch that doesn't change constantly
  const needsRefetch = useMemo(() => {
    if (!user?.id || !isInitialized) return false
    
    const shouldFetch = shouldRefetch(user.id, filters)

    const hasNoData = !hierarchyData
    
    return shouldFetch || hasNoData
  }, [user?.id, filters, hierarchyData, shouldRefetch, isInitialized])

  const queryResult = useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.myView(user?.id || 'anonymous', filters),
    queryFn: async () => {
      try {
        setRefreshing(true)
        
        const result = await HierarchyService.getMyHierarchyView(filters)
        
        
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
     enabled: !!user?.id && needsRefetch && isInitialized,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: 'always', // ✅ CRITICAL: Always refetch on mount
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0, // ✅ CRITICAL: Always consider data stale
    gcTime: 0, // ✅ CRITICAL: Don't cache data between mounts
    // enabled: !!user?.id && needsRefetch && isInitialized,
    // cacheStrategy: 'realtime',
    // throwOnError: false,
    // refetchOnMount: false, // ✅ CRITICAL: Don't auto refetch on mount
    // refetchOnWindowFocus: false,
    // refetchOnReconnect: true,
    // staleTime: 5000, // ✅ Increase stale time to reduce refetches
    // gcTime: 10000, // ✅ Increase gc time
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
  month?: number
}) {
  const { user } = useAuth()
  
  // ✅ SAME: Listen for evaluation broadcasts
  React.useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      useAdminOverviewStore.getState().forceRefresh()
    }
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
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
    isRefetching,
    setManagerReportsData,
    setRefreshing,
    shouldRefetch,
    initializeStore,
    isInitialized
  } = useAdminOverviewStore()

  // Sync user to store
  useEffect(() => {
    if (user?.id) {
      initializeStore(user.id)
    }
  }, [user?.id, initializeStore])

  // ✅ CRITICAL FIX: Always enable query when user exists and store is initialized
  const shouldRefetchData = useMemo(() => {
    if (!user?.id || !isInitialized) return false
    
    // ✅ FIXED: Always return true for first load or when shouldRefetch says so
    const needsRefetch = shouldRefetch(user.id, filters)
    
    // ✅ NEW: Also enable if we don't have data at all
    const hasNoData = !managerReportsData
    
    return needsRefetch || hasNoData
  }, [user?.id, isInitialized, shouldRefetch, filters, managerReportsData])

  const queryResult = useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.managerReports(user?.id || 'anonymous', filters),
    queryFn: async () => {
      try {
        setRefreshing(true)

        const result = await HierarchyService.getManagerReports(filters)

        if (result?.success && result.data) {
          setManagerReportsData(result.data, filters)
          setRefreshing(false)
          return result
        } else {
          setManagerReportsData(null, filters)
          setRefreshing(false)
          throw new Error('Failed to fetch manager reports data')
        }
      } catch (error) {
        console.error('useAdminOverview: Error in queryFn:', error)
        setRefreshing(false)
        throw error
      }
    },
    enabled: !!user?.id && shouldRefetchData && isInitialized,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: 'always', // ✅ CRITICAL: Always refetch on mount
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0, // ✅ CRITICAL: Always consider data stale
    gcTime: 0, // ✅ CRITICAL: Don't cache data between mounts
  })

  const finalData = queryResult.data

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
