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
import { useMemo } from 'react'

export function useMyHierarchyView(filters?: {
  weekNumber?: number
  year?: number
  month?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: QUERY_KEYS.hierarchy.myView(user?.id || 'anonymous', filters),
    queryFn: async () => {
      try {
        const result = await HierarchyService.getMyHierarchyView(filters)
        return result
      } catch (error) {
        console.error('useMyHierarchyView: Error in queryFn:', error)
        throw error
      }
    },
    enabled: !!user?.id,
    cacheStrategy: 'fresh', // Always fresh for hierarchy data
    throwOnError: false,
  })
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
    cacheStrategy: 'fresh',
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
  const { user } = useAuth()
  
  // STABLE queryKey - Use useMemo for filters to prevent unnecessary re-computation
  const stableQueryKey = useMemo(() => [
    'hierarchy', 
    'managerReports', 
    user?.id || 'anonymous',
    filters?.weekNumber || 0,
    filters?.year || 0,
    user?.employeeCode, // Stable identifier
    'realtime' // Add version to force fresh when needed
  ], [user?.id, user?.employeeCode, filters?.weekNumber, filters?.year])
  
  return useApiQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      // CRITICAL: Validate user context before making request
      if (!user?.id) {
        throw new Error('No authenticated user found')
      }
      
      const enhancedFilters = {
        ...filters,
        userId: user.id
      }
      
      
      try {
        const result = await HierarchyService.getManagerReports(enhancedFilters)
        
        return result
      } catch (error) {
        console.error('❌ useManagerReports: Fetch failed:', error)
        throw error
      }
    },
    enabled: !!user?.id,
    cacheStrategy: 'realtime', // NO CACHE - Always fresh data
    throwOnError: true,
    notifyOnChangeProps: ['data', 'error', 'isLoading'], // Limit what causes rerender
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
