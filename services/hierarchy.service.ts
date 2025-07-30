import { api, type ApiResult } from '@/lib/api'
import type { 
  HierarchyResponse,
  ManagementHierarchyResponse,
  StaffHierarchyResponse,
  MixedHierarchyResponse,
  PositionDetailsResponse,
  UserDetailsResponse,
  EmployeesReportingStatusResponse,
  TaskCompletionTrendsResponse,
  IncompleteReasonsResponse,
  PositionOverviewResponse,
  ManagerReportsResponse
} from '@/types/hierarchy'

export interface HierarchyFilters {
  weekNumber?: number
  year?: number
  month?: number
  officeId?: string
  departmentId?: string
  page?: number
  limit?: number
  status?: 'not_submitted' | 'incomplete' | 'completed' | 'all'
  weeks?: number
}

export class HierarchyService {
  /**
   * Get hierarchy view based on user role and permissions
   */
  static async getMyHierarchyView(filters?: HierarchyFilters): Promise<ApiResult<HierarchyResponse>> {
    try {
      
      const params = new URLSearchParams()
      
      if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
      if (filters?.year) params.append('year', filters.year.toString())
      if (filters?.month) params.append('month', filters.month.toString())
      if (filters?.officeId) params.append('officeId', filters.officeId)
      if (filters?.departmentId) params.append('departmentId', filters.departmentId)

      const url = `/hierarchy-reports/my-view${params.toString() ? `?${params.toString()}` : ''}`

      const response = await api.get<HierarchyResponse>(url,
        {
          enableCache: false
        }
      )

      // Validate response structure
      if (!response.data || typeof response !== 'object') {
        throw new Error('Invalid response format')
      }

      const data = response.data;

      // Check for valid viewType
      if (!data.viewType) {
        throw new Error('Response missing viewType')
      }

      // Handle different response types - KHỚP CHÍNH XÁC VỚI BACKEND
      switch (data.viewType) {
        case 'management':
          if (data.groupBy === 'position' && Array.isArray(data.positions)) {
            // return data as ManagementHierarchyResponse
            return {
              ...response,
              data: data as ManagementHierarchyResponse
            }
          }
          throw new Error('Invalid management hierarchy structure')

        case 'staff':
          if (data.groupBy === 'jobPosition' && Array.isArray(data.jobPositions)) {
            return {
              ...response,
              data: data as StaffHierarchyResponse
            }
          }
          throw new Error('Invalid staff hierarchy structure')

        case 'mixed':
          if (data.groupBy === 'mixed') {
            // Validate mixed response structure - CHÍNH XÁC THEO BACKEND
            const hasPositions = Array.isArray(data.positions)
            const hasJobPositions = Array.isArray(data.jobPositions)

            if (hasPositions || hasJobPositions) {
              return {
                ...response,
                data: data as MixedHierarchyResponse
              }
            }

            throw new Error('Mixed hierarchy response has no positions or jobPositions')
          }
          throw new Error('Invalid mixed hierarchy structure - missing groupBy=mixed')

        case 'empty':
          return response
          
        default:
          throw new Error(`Unknown response viewType: ${response}`)
          // throw new Error(`Unknown response viewType: ${response.viewType}`)
      }
    } catch (error) {
      console.error('HierarchyService.getMyHierarchyView error:', error)
      
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to fetch hierarchy data')
      }
    }
  }

  /**
   * Check if response is management hierarchy
   */
  static isManagementHierarchy(response: HierarchyResponse): response is ManagementHierarchyResponse {
    return response.viewType === 'management' && response.groupBy === 'position' && 'positions' in response
  }

  /**
   * Check if response is staff hierarchy
   */
  static isStaffHierarchy(response: HierarchyResponse): response is StaffHierarchyResponse {
    return response.viewType === 'staff' && response.groupBy === 'jobPosition' && 'jobPositions' in response
  }

  /**
   * Get offices overview (Admin/Superadmin only)
   */
  static async getOfficesOverview(filters?: HierarchyFilters): Promise<ApiResult<PositionOverviewResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate numbers before sending
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<PositionOverviewResponse>(`/hierarchy-reports/offices-overview${query}`)
  }

  /**
   * Get position details
   */
  static async getPositionDetails(
    positionId: string, 
    filters?: HierarchyFilters
  ): Promise<ApiResult<PositionDetailsResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate numbers
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<PositionDetailsResponse>(`/hierarchy-reports/position/${positionId}${query}`)
  }

  /**
   * Get position users list
   */
  static async getPositionUsers(
    positionId: string,
    filters?: HierarchyFilters
  ): Promise<any> {
    const params = new URLSearchParams()
    
    // FIX: Validate numbers
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/position-users/${positionId}${query}`)
  }

  /**
   * Get user details
   */
  static async getUserDetails(
    userId: string,
    filters?: HierarchyFilters & { limit?: number }
  ): Promise<ApiResult<UserDetailsResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate all numeric parameters
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters?.limit !== undefined) {
      const limitNum = Number(filters.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        params.append('limit', String(limitNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    // Always fetch fresh data after evaluation actions by adding a cache-busting param
    return await api.get<UserDetailsResponse>(`/hierarchy-reports/user/${userId}${query}${query ? '&' : '?'}_=${Date.now()}`)
  }

  /**
   * Get employees without reports
   */
  static async getEmployeesWithoutReports(filters?: HierarchyFilters): Promise<ApiResult<EmployeesReportingStatusResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate numbers for pagination and date filters
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters?.page !== undefined) {
      const pageNum = Number(filters.page)
      if (!isNaN(pageNum) && pageNum > 0) {
        params.append('page', String(pageNum))
      }
    }
    if (filters?.limit !== undefined) {
      const limitNum = Number(filters.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        params.append('limit', String(limitNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<EmployeesReportingStatusResponse>(`/hierarchy-reports/employees-without-reports${query}`)
  }

  /**
   * Get employees with incomplete reports
   */
  static async getEmployeesWithIncompleteReports(filters?: HierarchyFilters): Promise<ApiResult<EmployeesReportingStatusResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Same validation pattern
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters?.page !== undefined) {
      const pageNum = Number(filters.page)
      if (!isNaN(pageNum) && pageNum > 0) {
        params.append('page', String(pageNum))
      }
    }
    if (filters?.limit !== undefined) {
      const limitNum = Number(filters.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        params.append('limit', String(limitNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<EmployeesReportingStatusResponse>(`/hierarchy-reports/employees-incomplete-reports${query}`)
  }

  /**
   * Get employees reporting status
   */
  static async getEmployeesReportingStatus(filters?: HierarchyFilters): Promise<ApiResult<EmployeesReportingStatusResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate numeric parameters
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    if (filters?.page !== undefined) {
      const pageNum = Number(filters.page)
      if (!isNaN(pageNum) && pageNum > 0) {
        params.append('page', String(pageNum))
      }
    }
    if (filters?.limit !== undefined) {
      const limitNum = Number(filters.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        params.append('limit', String(limitNum))
      }
    }
    if (filters?.status && typeof filters.status === 'string') {
      params.append('status', filters.status)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<EmployeesReportingStatusResponse>(`/hierarchy-reports/employees-reporting-status${query}`)
  }

  /**
   * Get task completion trends
   */
  static async getTaskCompletionTrends(filters?: HierarchyFilters & { weeks?: number }): Promise<ApiResult<TaskCompletionTrendsResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate all possible numeric parameters
    if (filters?.officeId && typeof filters.officeId === 'string') {
      params.append('officeId', filters.officeId)
    }
    if (filters?.departmentId && typeof filters.departmentId === 'string') {
      params.append('departmentId', filters.departmentId)
    }
    if (filters?.weeks !== undefined) {
      const weeksNum = Number(filters.weeks)
      if (!isNaN(weeksNum) && weeksNum > 0 && weeksNum <= 52) {
        params.append('weeks', String(weeksNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<TaskCompletionTrendsResponse>(`/hierarchy-reports/task-completion-trends${query}`)
  }

  /**
   * Get incomplete reasons hierarchy analysis
   */
  static async getIncompleteReasonsHierarchy(filters?: HierarchyFilters): Promise<ApiResult<IncompleteReasonsResponse>> {
    const params = new URLSearchParams()
    
    // FIX: Validate week and year parameters
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<IncompleteReasonsResponse>(`/hierarchy-reports/incomplete-reasons-hierarchy${query}`)
  }

  /**
   * Get report details for admin view
   */
  static async getReportDetails(userId: string, reportId: string): Promise<ApiResult<any>> {
    try {
      const response = await api.get(`/hierarchy-reports/user/${userId}/report/${reportId}`)
      return response
    } catch (error) {
      console.error('[HIERARCHY] Get report details error:', error)
      throw error
    }
  }

  /**
   * Get manager reports - for managers to view reports of their subordinates
   */
  static async getManagerReports(filters?: HierarchyFilters): Promise<ApiResult<ManagerReportsResponse>> {
    const params = new URLSearchParams()
    if (filters?.weekNumber !== undefined) {
      const weekNum = Number(filters.weekNumber)
      if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
        params.append('weekNumber', String(weekNum))
      }
    }
    if (filters?.year !== undefined) {
      const yearNum = Number(filters.year)
      if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
        params.append('year', String(yearNum))
      }
    }
    // const query = params.toString() ? `?${params}` : ''a
    // return await api.get<ManagerReportsResponse>(`/hierarchy-reports/manager-reports${query}`)


    const url = `/hierarchy-reports/manager-reports${params.toString() ? `?${params.toString()}` : ''}`

    const response = await api.get<ManagerReportsResponse>(url, {
      enableCache: false // Always fetch fresh data for manager reports
    })

    // Validate response structure
    if (!response.data || typeof response !== 'object') {
      throw new Error('Invalid response format')
    }

    return response;

  }

  /**
   * Get specific report details for admin view
   */
  static async getReportDetailsForAdmin(userId: string, reportId: string): Promise<ApiResult<any>> {
    return await api.get(`/hierarchy-reports/user/${userId}/report/${reportId}`)
  }
}
