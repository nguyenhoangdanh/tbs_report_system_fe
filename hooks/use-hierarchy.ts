import { useQuery } from '@tanstack/react-query'
import { HierarchyService } from '@/services/hierarchy.service'
import type { HierarchyFilters } from '@/types/hierarchy'

// Query keys with proper typing
const HIERARCHY_KEYS = {
  all: ['hierarchy'] as const,
  officesOverview: (filters?: HierarchyFilters) => 
    ['hierarchy', 'offices-overview', filters] as const,
  officeDetails: (officeId: string, filters?: HierarchyFilters) => 
    ['hierarchy', 'office-details', officeId, filters] as const,
  departmentDetails: (departmentId: string, filters?: HierarchyFilters) => 
    ['hierarchy', 'department-details', departmentId, filters] as const,
  userDetails: (userId: string, filters?: HierarchyFilters) => 
    ['hierarchy', 'user-details', userId, filters] as const,
  myHierarchyView: (filters?: HierarchyFilters) => 
    ['hierarchy', 'my-view', filters] as const,
  taskCompletionTrends: (filters: { officeId?: string; departmentId?: string; weeks?: number }) => 
    ['hierarchy', 'task-completion-trends', filters] as const,
  incompleteReasons: (filters: { officeId?: string; departmentId?: string; weekNumber?: number; year?: number }) => 
    ['hierarchy', 'incomplete-reasons', filters] as const,
}

// Performance-optimized hooks with memoization and error handling
export function useOfficesOverview(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['hierarchy', 'offices-overview', filters],
    queryFn: () => HierarchyService.getOfficesOverview(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useOfficeDetails(officeId: string, filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['hierarchy', 'office-details', officeId, filters],
    queryFn: () => HierarchyService.getOfficeDetails(officeId, filters),
    enabled: !!officeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useDepartmentDetails(departmentId: string, filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['hierarchy', 'department-details', departmentId, filters],
    queryFn: () => HierarchyService.getDepartmentDetails(departmentId, filters),
    enabled: !!departmentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useUserDetails(userId: string, filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['hierarchy', 'user-details', userId, filters],
    queryFn: () => HierarchyService.getUserDetails(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useMyHierarchyView(filters?: HierarchyFilters) {
  return useQuery({
    queryKey: ['hierarchy', 'my-view', filters],
    queryFn: () => HierarchyService.getMyHierarchyView(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useTaskCompletionTrends(filters: {
  officeId?: string
  departmentId?: string
  weeks?: number
}) {
  return useQuery({
    queryKey: ['hierarchy', 'task-completion-trends', filters],
    queryFn: () => HierarchyService.getTaskCompletionTrends(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useIncompleteReasonsHierarchy(filters: {
  officeId?: string
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  return useQuery({
    queryKey: ['hierarchy', 'incomplete-reasons', filters],
    queryFn: () => HierarchyService.getIncompleteReasonsHierarchy(filters),
    enabled: !!(filters.weekNumber && filters.year),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useUserReportsForAdmin(
  userId: string,
  filters?: {
    page?: number
    limit?: number
    weekNumber?: number
    year?: number
  }
) {
  return useQuery({
    queryKey: ['hierarchy', 'user-reports-admin', userId, filters],
    queryFn: () => HierarchyService.getUserReportsForAdmin(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useReportDetailsForAdmin(userId: string, reportId: string) {
  return useQuery({
    queryKey: ['hierarchy', 'report-details-admin', userId, reportId],
    queryFn: () => HierarchyService.getReportDetailsForAdmin(userId, reportId),
    enabled: !!userId && !!reportId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

export function useCurrentWeekFilter() {
  const now = new Date()
  const year = now.getFullYear()
  
  // Calculate current week number (ISO week)
  const firstDayOfYear = new Date(year, 0, 1)
  const daysSinceFirstDay = Math.floor((now.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7)
  
  return { weekNumber, year }
}
