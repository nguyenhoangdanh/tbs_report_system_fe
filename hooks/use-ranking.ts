'use client'

import { useQuery } from '@tanstack/react-query'
import { RankingService } from '@/services/ranking.service'
import type {
  EmployeeRankingResponse,
  EmployeeRankingData,
  DepartmentRankingResponse,
  OfficeRankingResponse,
  OverallRankingResponse
} from '@/services/ranking.service'

export const RANKING_QUERY_KEYS = {
  ranking: ['ranking'] as const,
  employees: (filters?: any) => ['ranking', 'employees', filters] as const,
  departments: (filters?: any) => ['ranking', 'departments', filters] as const,
  offices: (filters?: any) => ['ranking', 'offices', filters] as const,
  overall: (filters?: any) => ['ranking', 'overall', filters] as const,
  myRanking: (filters?: any) => ['ranking', 'my-ranking', filters] as const,
}

/**
 * Get employee rankings
 */
export function useEmployeeRanking(filters?: {
  employeeId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery<EmployeeRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.employees(filters),
    queryFn: () => RankingService.getEmployeeRanking(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get my personal ranking (for dashboard)
 */
export function useMyRanking(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery({
    queryKey: RANKING_QUERY_KEYS.myRanking(filters),
    queryFn: () => RankingService.getEmployeeRanking(filters), // Don't pass employeeId to get current user
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
    select: (data: EmployeeRankingResponse): EmployeeRankingData | null => {
      // Extract only my ranking data - return the first employee from the response
      if (data?.employees?.length > 0) {
        return data.employees[0] // Return the first (and should be only) employee data
      }
      return null
    }
  })
}

/**
 * Get department rankings
 */
export function useDepartmentRanking(filters?: {
  departmentId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery<DepartmentRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.departments(filters),
    queryFn: () => RankingService.getDepartmentRankingStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get office rankings
 */
export function useOfficeRanking(filters?: {
  officeId?: string
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery<OfficeRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.offices(filters),
    queryFn: () => RankingService.getOfficeRankingStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get overall rankings (Admin only)
 */
export function useOverallRanking(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery<OverallRankingResponse, Error>({
    queryKey: RANKING_QUERY_KEYS.overall(filters),
    queryFn: () => RankingService.getOverallRankingStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}
