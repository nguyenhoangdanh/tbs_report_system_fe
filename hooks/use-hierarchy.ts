'use client'

import { useQuery } from '@tanstack/react-query'
import { HierarchyService } from '@/services/hierarchy.service'
import { getCurrentWeek } from '@/utils/week-utils'
import type { 
  HierarchyResponse, 
  ManagementHierarchyResponse,
  StaffHierarchyResponse,
  UserDetailsResponse,
  MixedHierarchyResponse 
} from '@/types/hierarchy'

export function useMyHierarchyView(filters?: {
  weekNumber?: number
  year?: number
  month?: number
}) {
  return useQuery({
    queryKey: ['hierarchy', 'my-view', filters],
    queryFn: async () => {
      try {
        const result = await HierarchyService.getMyHierarchyView(filters)
        return result
      } catch (error) {
        console.error('useMyHierarchyView: Error in queryFn:', error)
        throw error
      }
    },
    staleTime: 0, // Always refetch - không cache
    gcTime: 0, // Don't keep in memory
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: (failureCount, error) => {
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useUserDetails(userId: string, filters?: {
  weekNumber?: number
  year?: number
  limit?: number
}) {
  return useQuery<UserDetailsResponse>({
    queryKey: ['hierarchy', 'user-details', userId, filters],
    queryFn: () => HierarchyService.getUserDetails(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useReportDetailsForAdmin(userId: string, reportId: string) {
  return useQuery({
    queryKey: ['hierarchy', 'report-details', userId, reportId],
    queryFn: async () => {
      // Note: This is a mock - replace with actual API call
      const response = await fetch(`/api/admin/reports/${reportId}`)
      if (!response.ok) throw new Error('Failed to fetch report details')
      return response.json()
    },
    enabled: !!userId && !!reportId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useUserReportsForAdmin(userId: string, filters?: {
  page?: number
  limit?: number
  year?: number
}) {
  return useQuery({
    queryKey: ['hierarchy', 'user-reports', userId, filters],
    queryFn: async () => {
      // Note: This is a mock - replace with actual API call
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.year) params.append('year', filters.year.toString())
      
      const response = await fetch(`/api/admin/users/${userId}/reports?${params}`)
      if (!response.ok) throw new Error('Failed to fetch user reports')
      return response.json()
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
