'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HierarchyService } from '@/services/hierarchy.service'
import { getCurrentWeek } from '@/lib/date-utils'
import type {
  OfficesOverviewResponse,
  OfficeDetailsResponse,
  DepartmentDetailsResponse,
  UserDetails,
  TaskCompletionTrends,
  IncompleteReasonsHierarchy,
  HierarchyFilters,
  EmployeesWithoutReportsResponse,
  EmployeesWithIncompleteReportsResponse,
  EmployeesReportingStatusResponse,
  EmployeeReportingFilters
} from '@/types/hierarchy'
import { toast } from 'react-toast-kit'
import React from 'react'
import { useEmployeeRanking, useDepartmentRanking, useOfficeRanking } from './use-ranking'

// Query keys for hierarchy data
const HIERARCHY_QUERY_KEYS = {
  myHierarchyView: (filters?: HierarchyFilters) => ['hierarchy', 'my-view', filters] as const,
  officesOverview: (filters?: HierarchyFilters) => ['hierarchy', 'offices-overview', filters] as const,
  officeDetails: (officeId: string, filters?: HierarchyFilters) => ['hierarchy', 'office', officeId, filters] as const,
  departmentDetails: (departmentId: string, filters?: HierarchyFilters) => ['hierarchy', 'department', departmentId, filters] as const,
  userDetails: (userId: string, filters?: HierarchyFilters) => ['hierarchy', 'user', userId, filters] as const,
  taskCompletionTrends: (filters?: any) => ['hierarchy', 'task-completion-trends', filters] as const,
  incompleteReasonsHierarchy: (filters?: any) => ['hierarchy', 'incomplete-reasons', filters] as const,
  employeesWithoutReports: (filters?: EmployeeReportingFilters) => ['hierarchy', 'employees-without-reports', filters] as const,
  employeesWithIncompleteReports: (filters?: EmployeeReportingFilters) => ['hierarchy', 'employees-incomplete-reports', filters] as const,
  employeesReportingStatus: (filters?: EmployeeReportingFilters) => ['hierarchy', 'employees-reporting-status', filters] as const,
  userReportsForAdmin: (userId: string, filters?: any) => ['hierarchy', 'admin', 'user-reports', userId, filters] as const,
  reportDetailsForAdmin: (userId: string, reportId: string) => ['hierarchy', 'admin', 'report-details', userId, reportId] as const,
}

/**
 * Helper hook to get current week filters with proper type safety
 */
export function useCurrentWeekFilters(): HierarchyFilters {
  try {
    const currentWeekData = getCurrentWeek()
    
    // Ensure we have valid data
    if (!currentWeekData || typeof currentWeekData.weekNumber !== 'number' || typeof currentWeekData.year !== 'number') {
      // Fallback to current date calculation
      const now = new Date()
      const year = now.getFullYear()
      const weekNumber = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      
      return {
        weekNumber: Math.max(1, Math.min(52, weekNumber)),
        year,
      }
    }
    
    return {
      weekNumber: currentWeekData.weekNumber,
      year: currentWeekData.year,
    }
  } catch (error) {
    console.error('Error getting current week filters:', error)
    
    // Fallback implementation
    const now = new Date()
    const year = now.getFullYear()
    const weekNumber = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    return {
      weekNumber: Math.max(1, Math.min(52, weekNumber)),
      year,
    }
  }
}

/**
 * Get hierarchy view based on current user role
 */
export function useMyHierarchyView(filters?: HierarchyFilters) {
  return useQuery<OfficesOverviewResponse | OfficeDetailsResponse | DepartmentDetailsResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.myHierarchyView(filters),
    queryFn: () => HierarchyService.getMyHierarchyView(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get hierarchy view with ranking data combined
 */
export function useHierarchyWithRanking(filters?: HierarchyFilters) {
  const hierarchyQuery = useMyHierarchyView(filters)
  
  // Get ranking data based on the same filters
  const rankingFilters = {
    weekNumber: filters?.weekNumber,
    year: filters?.year,
    periodWeeks: 4, // Default 4 weeks for ranking analysis
  }
  
  const employeeRankingQuery = useEmployeeRanking(rankingFilters)
  
  // Only call office ranking for admin/superadmin level (offices overview)
  // Don't call department ranking unless we're at department level
  const officeRankingQuery = useOfficeRanking(rankingFilters)
  
  return {
    hierarchy: hierarchyQuery,
    employeeRanking: employeeRankingQuery,
    officeRanking: officeRankingQuery,
    isLoading: hierarchyQuery.isLoading || employeeRankingQuery.isLoading || officeRankingQuery.isLoading,
    error: hierarchyQuery.error || employeeRankingQuery.error || officeRankingQuery.error,
  }
}

/**
 * Get hierarchy with department ranking (for office details view)
 */
export function useHierarchyWithDepartmentRanking(filters?: HierarchyFilters & { officeId?: string }) {
  const hierarchyQuery = useMyHierarchyView(filters)
  
  const rankingFilters = {
    weekNumber: filters?.weekNumber,
    year: filters?.year,
    periodWeeks: 4,
    officeId: filters?.officeId, // Pass office ID to get departments in that office
  }
  
  const employeeRankingQuery = useEmployeeRanking(rankingFilters)
  const departmentRankingQuery = useDepartmentRanking(rankingFilters)
  
  return {
    hierarchy: hierarchyQuery,
    employeeRanking: employeeRankingQuery,
    departmentRanking: departmentRankingQuery,
    isLoading: hierarchyQuery.isLoading || employeeRankingQuery.isLoading || departmentRankingQuery.isLoading,
    error: hierarchyQuery.error || employeeRankingQuery.error || departmentRankingQuery.error,
  }
}

/**
 * Get hierarchy with user ranking (for department details view)
 */
export function useHierarchyWithUserRanking(filters?: HierarchyFilters & { departmentId?: string }) {
  const hierarchyQuery = useMyHierarchyView(filters)
  
  const rankingFilters = {
    weekNumber: filters?.weekNumber,
    year: filters?.year,
    periodWeeks: 4,
    departmentId: filters?.departmentId, // Pass department ID to get users in that department
  }
  
  const employeeRankingQuery = useEmployeeRanking(rankingFilters)
  
  return {
    hierarchy: hierarchyQuery,
    employeeRanking: employeeRankingQuery,
    isLoading: hierarchyQuery.isLoading || employeeRankingQuery.isLoading,
    error: hierarchyQuery.error || employeeRankingQuery.error,
  }
}

/**
 * Get offices overview (Admin/Superadmin only)
 */
export function useOfficesOverview(filters?: HierarchyFilters) {
  return useQuery<OfficesOverviewResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.officesOverview(filters),
    queryFn: () => HierarchyService.getOfficesOverview(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get office details
 */
export function useOfficeDetails(officeId: string, filters?: HierarchyFilters) {
  return useQuery<OfficeDetailsResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.officeDetails(officeId, filters),
    queryFn: () => HierarchyService.getOfficeDetails(officeId, filters),
    enabled: !!officeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get department details
 */
export function useDepartmentDetails(departmentId: string, filters?: HierarchyFilters) {
  return useQuery<DepartmentDetailsResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.departmentDetails(departmentId, filters),
    queryFn: () => HierarchyService.getDepartmentDetails(departmentId, filters),
    enabled: !!departmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get user details
 */
export function useUserDetails(userId: string, filters?: HierarchyFilters) {
  return useQuery<UserDetails, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.userDetails(userId, filters),
    queryFn: () => HierarchyService.getUserDetails(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get task completion trends
 */
export function useTaskCompletionTrends(filters?: {
  officeId?: string
  departmentId?: string
  weeks?: number
}) {
  return useQuery<TaskCompletionTrends, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.taskCompletionTrends(filters),
    queryFn: () => HierarchyService.getTaskCompletionTrends(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get incomplete reasons hierarchy analysis
 */
export function useIncompleteReasonsHierarchy(filters?: {
  officeId?: string
  departmentId?: string
  weekNumber?: number
  year?: number
}) {
  return useQuery<IncompleteReasonsHierarchy, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.incompleteReasonsHierarchy(filters),
    queryFn: () => HierarchyService.getIncompleteReasonsHierarchy(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get employees who haven't submitted reports
 */
export function useEmployeesWithoutReports(filters?: EmployeeReportingFilters) {
  return useQuery<EmployeesWithoutReportsResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.employeesWithoutReports(filters),
    queryFn: () => HierarchyService.getEmployeesWithoutReports(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get employees with incomplete reports
 */
export function useEmployeesWithIncompleteReports(filters?: EmployeeReportingFilters) {
  return useQuery<EmployeesWithIncompleteReportsResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.employeesWithIncompleteReports(filters),
    queryFn: () => HierarchyService.getEmployeesWithIncompleteReports(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get comprehensive employee reporting status
 */
export function useEmployeesReportingStatus(filters?: EmployeeReportingFilters) {
  return useQuery<EmployeesReportingStatusResponse, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.employeesReportingStatus(filters),
    queryFn: () => HierarchyService.getEmployeesReportingStatus(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Admin: Get user reports for management
 */
export function useUserReportsForAdmin(
  userId: string,
  filters?: {
    page?: number
    limit?: number
    weekNumber?: number
    year?: number
  }
) {
  return useQuery<any, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.userReportsForAdmin(userId, filters),
    queryFn: () => HierarchyService.getUserReportsForAdmin(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Admin: Get specific report details for a user
 */
export function useReportDetailsForAdmin(userId: string, reportId: string) {
  return useQuery<any, Error>({
    queryKey: HIERARCHY_QUERY_KEYS.reportDetailsForAdmin(userId, reportId),
    queryFn: () => HierarchyService.getReportDetailsForAdmin(userId, reportId),
    enabled: !!userId && !!reportId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Mutation to refresh hierarchy data
 */
export function useRefreshHierarchyData() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Invalidate all hierarchy queries
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy'],
        exact: false 
      })
    },
    onSuccess: () => {
      toast.success('Dữ liệu đã được cập nhật!')
    },
    onError: (error) => {
      console.error('Refresh hierarchy data error:', error)
      toast.error('Có lỗi khi cập nhật dữ liệu')
    },
  })
}

/**
 * Helper hook to determine data loading states
 */
export function useHierarchyLoadingStates(queries: Array<{ isLoading: boolean; error: any }>) {
  const isLoading = queries.some(query => query.isLoading)
  const hasError = queries.some(query => query.error)
  const allLoaded = queries.every(query => !query.isLoading)
  
  return {
    isLoading,
    hasError,
    allLoaded,
    errorCount: queries.filter(query => query.error).length,
  }
}

/**
 * Helper hook for pagination state management
 */
export function usePaginationState(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = React.useState(initialPage)
  const [limit, setLimit] = React.useState(initialLimit)
  
  const resetPagination = React.useCallback(() => {
    setPage(1)
  }, [])
  
  const goToPage = React.useCallback((newPage: number) => {
    setPage(Math.max(1, newPage))
  }, [])
  
  const changeLimit = React.useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }, [])
  
  return {
    page,
    limit,
    setPage: goToPage,
    setLimit: changeLimit,
    resetPagination,
  }
}

/**
 * Helper hook for filter state management
 */
export function useHierarchyFilters(initialFilters?: EmployeeReportingFilters) {
  const [filters, setFilters] = React.useState<EmployeeReportingFilters>(initialFilters || {})
  
  const updateFilter = React.useCallback((key: keyof EmployeeReportingFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const resetFilters = React.useCallback(() => {
    setFilters(initialFilters || {})
  }, [initialFilters])
  
  const clearFilters = React.useCallback(() => {
    setFilters({})
  }, [])
  
  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilters,
    setFilters,
  }
}
