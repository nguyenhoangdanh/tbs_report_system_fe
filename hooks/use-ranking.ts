'use client'

import { useQuery } from '@tanstack/react-query'
import { RankingService } from '@/services/ranking.service'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  EmployeeRankingResponse,
  DepartmentRankingResponse,
  OfficeRankingResponse,
  OverallRankingResponse,
  EmployeeRankingData
} from '@/services/ranking.service'

// User-specific query keys
export const RANKING_QUERY_KEYS = {
  ranking: (userId?: string) => ['ranking', userId] as const,
  employeeRanking: (userId: string, filters?: any) => ['ranking', 'employees', userId, filters] as const,
  departmentRanking: (userId: string, filters?: any) => ['ranking', 'departments', userId, filters] as const,
  officeRanking: (userId: string, filters?: any) => ['ranking', 'offices', userId, filters] as const,
  overallRanking: (userId: string, filters?: any) => ['ranking', 'overall', userId, filters] as const,
  myRanking: (userId: string, filters?: any) => ['ranking', 'my-ranking', userId, filters] as const,
}

/**
 * Get employee ranking data
 */
export function useEmployeeRanking(filters?: {
  employeeId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  
  return useQuery<EmployeeRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.employeeRanking(user?.id || 'anonymous', filters),
    queryFn: () => RankingService.getEmployeeRanking(filters),
    enabled: !!user?.id && ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(user.role),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get department ranking statistics
 */
export function useDepartmentRankingStats(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  
  return useQuery<DepartmentRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.departmentRanking(user?.id || 'anonymous', filters),
    queryFn: () => RankingService.getDepartmentRankingStats(filters),
    enabled: !!user?.id && ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(user.role),
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get office ranking statistics
 */
export function useOfficeRankingStats(filters?: {
  officeId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  
  return useQuery<OfficeRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.officeRanking(user?.id || 'anonymous', filters),
    queryFn: () => RankingService.getOfficeRankingStats(filters),
    enabled: !!user?.id && ['ADMIN', 'SUPERADMIN'].includes(user.role),
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get overall ranking statistics (Admin only)
 */
export function useOverallRankingStats(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  
  return useQuery<OverallRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.overallRanking(user?.id || 'anonymous', filters),
    queryFn: () => RankingService.getOverallRankingStats(filters),
    enabled: !!user?.id && ['ADMIN', 'SUPERADMIN'].includes(user.role),
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get my personal ranking (simplified)
 */
export function useMyRanking(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  
  return useQuery<EmployeeRankingData | null, Error>({
    queryKey: RANKING_QUERY_KEYS.myRanking(user?.id || 'anonymous', filters),
    queryFn: () => RankingService.getMyRanking(filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Combined ranking dashboard data hook
 */
export function useRankingDashboard(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  const { user } = useAuth()
  const employeeRanking = useEmployeeRanking(filters)
  const departmentRanking = useDepartmentRankingStats(filters)
  const officeRanking = useOfficeRankingStats(filters)
  const overallRanking = useOverallRankingStats(filters)
  const myRanking = useMyRanking(filters)
  
  const isManager = user && ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(user.role)
  const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.role)
  
  return {
    data: {
      employeeRanking: isManager ? employeeRanking.data : null,
      departmentRanking: isManager ? departmentRanking.data : null,
      officeRanking: isAdmin ? officeRanking.data : null,
      overallRanking: isAdmin ? overallRanking.data : null,
      myRanking: myRanking.data,
    },
    isLoading: myRanking.isLoading || 
      (isManager && (employeeRanking.isLoading || departmentRanking.isLoading)) ||
      (isAdmin && (officeRanking.isLoading || overallRanking.isLoading)),
    error: myRanking.error || 
      (isManager && (employeeRanking.error || departmentRanking.error)) ||
      (isAdmin && (officeRanking.error || overallRanking.error)),
    refetch: () => {
      myRanking.refetch()
      if (isManager) {
        employeeRanking.refetch()
        departmentRanking.refetch()
      }
      if (isAdmin) {
        officeRanking.refetch()
        overallRanking.refetch()
      }
    },
  }
}
