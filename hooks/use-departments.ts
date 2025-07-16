'use client'

import { UserService } from '@/services/user.service'
import { useApiQuery } from './use-api-query'
import type { Department, Position, JobPosition, Office } from '@/types'

// Query keys for organization data
const ORGANIZATION_QUERY_KEYS = {
  departments: ['organizations', 'departments'] as const,
  positions: ['organizations', 'positions'] as const,
  jobPositions: ['organizations', 'job-positions'] as const,
  offices: ['organizations', 'offices'] as const,
}

/**
 * Get all departments
 */
export function useDepartments() {
  return useApiQuery<Department[]>({
    queryKey: ORGANIZATION_QUERY_KEYS.departments,
    queryFn: () => UserService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get all positions
 */
export function usePositions() {
  return useApiQuery<Position[]>({
    queryKey: ORGANIZATION_QUERY_KEYS.positions,
    queryFn: () => UserService.getPositions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get all job positions
 */
export function useJobPositions() {
  return useApiQuery<JobPosition[]>({
    queryKey: ORGANIZATION_QUERY_KEYS.jobPositions,
    queryFn: () => UserService.getJobPositions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get all offices
 */
export function useOffices() {
  return useApiQuery<Office[]>({
    queryKey: ORGANIZATION_QUERY_KEYS.offices,
    queryFn: () => UserService.getOffices(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Helper hook to get departments by office ID
 */
export function useDepartmentsByOffice(officeId?: string) {
  const { data: departments, ...rest } = useDepartments()
  
  const filteredDepartments = departments?.filter(
    dept => !officeId || dept.officeId === officeId
  ) || []
  
  return {
    data: filteredDepartments,
    ...rest,
  }
}

/**
 * Helper hook to get job positions by department ID
 */
export function useJobPositionsByDepartment(departmentId?: string) {
  const { data: jobPositions, ...rest } = useJobPositions()
  
  const filteredJobPositions = jobPositions?.filter(
    jp => !departmentId || jp.departmentId === departmentId
  ) || []
  
  return {
    data: filteredJobPositions,
    ...rest,
  }
}

/**
 * Helper hook to get office and department options for forms
 */
export function useOrganizationOptions() {
  const officesQuery = useOffices()
  const departmentsQuery = useDepartments()
  const jobPositionsQuery = useJobPositions()
  
  const officeOptions = officesQuery.data?.map(office => ({
    value: office.id,
    label: office.name,
    type: office.type,
  })) || []
  
  const departmentOptions = departmentsQuery.data?.map(dept => ({
    value: dept.id,
    label: dept.name,
    officeId: dept.officeId,
  })) || []
  
  const jobPositionOptions = jobPositionsQuery.data?.map(jp => ({
    value: jp.id,
    label: jp.jobName,
    departmentId: jp.departmentId,
    positionName: jp.position.name,
  })) || []
  
  return {
    officeOptions,
    departmentOptions,
    jobPositionOptions,
    isLoading: officesQuery.isLoading || departmentsQuery.isLoading || jobPositionsQuery.isLoading,
    hasError: officesQuery.error || departmentsQuery.error || jobPositionsQuery.error,
  }
}
