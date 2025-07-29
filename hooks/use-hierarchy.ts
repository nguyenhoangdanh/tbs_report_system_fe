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
import { useMemo, useState, useCallback, useEffect } from 'react'
import useHierarchyStore from '@/store/hierarchy-store'

export function useMyHierarchyView(filters?: {
  weekNumber?: number
  year?: number
  month?: number
}) {
  const { user } = useAuth()
  
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

  // ✅ ENHANCED: More reliable shouldRefetch logic
  const needsRefetch = useMemo(() => {
    if (!user?.id) return false
    
    return shouldRefetch(user.id, filters)
  }, [user?.id, filters, shouldRefetch, lastRefreshTimestamp])

  const queryResult = useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.myView(user?.id || 'anonymous', filters),
    queryFn: async () => {
      try {
        console.log('🔄 useMyHierarchyView: Fetching with filters:', filters, 'for user:', user?.id)
        setRefreshing(true)
        
        const result = await HierarchyService.getMyHierarchyView(filters)
        
        console.log('✅ useMyHierarchyView: Fresh data received:', result?.success, result?.data)
        
        // ✅ FIXED: Handle ApiResult structure correctly
        if (result?.success && result.data) {
          setHierarchyData(result.data, filters)
          setRefreshing(false) // ✅ CRITICAL: Ensure loading state is cleared
          return result
        } else {
          // Handle error case
          setHierarchyData(null, filters)
          setRefreshing(false) // ✅ CRITICAL: Ensure loading state is cleared
          throw new Error(result?.error?.message || 'Failed to fetch hierarchy data')
        }
      } catch (error) {
        console.error('useMyHierarchyView: Error in queryFn:', error)
        setRefreshing(false) // ✅ CRITICAL: Always clear loading state
        throw error
      }
    },
    enabled: !!user?.id && needsRefetch,
    cacheStrategy: 'realtime',
    throwOnError: false,
    refetchOnMount: needsRefetch ? 'always' : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 500,
    gcTime: 1000,
  })


  const finalData = queryResult.data;

  // ✅ FIXED: Return the correct loading state
  return {
    data: finalData,
    isLoading: (queryResult.isLoading && needsRefetch) || isRefreshing,
    isError: queryResult.isError,
    error: queryResult.error,
    isStoreRefreshing: isRefreshing,
    isFetching: queryResult.isFetching,
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
 * Hook for manager reports - OPTIMIZED for real-time updates
 */
export function useManagerReports(filters?: {
  weekNumber?: number
  year?: number
  userId?: string
}) {
  return useApiQuery({
    queryKey: ['hierarchy', 'managerReports', filters],
    queryFn: async () => {
      const enhancedFilters = {
        ...filters,
      }
      
      try {
        const result = await HierarchyService.getManagerReports(enhancedFilters)
        console.log('✅ useManagerReports: Fresh data received')
        return result
      } catch (error) {
        console.error('❌ useManagerReports: Fetch failed:', error)
        throw error
      }
    },
    enabled: !!filters?.weekNumber && !!filters?.year && !!filters?.userId,
    cacheStrategy: 'realtime',
    throwOnError: true,
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 1000,
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