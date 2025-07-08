import { api } from '@/lib/api'
import type {
  OfficesOverviewResponse,
  OfficeDetailsResponse,
  DepartmentDetailsResponse,
  UserDetails,
  TaskCompletionTrends,
  IncompleteReasonsHierarchy,
  HierarchyFilters,
} from '@/types/hierarchy'
import type {
  EmployeesWithoutReportsResponse,
  EmployeesWithIncompleteReportsResponse,
  EmployeesReportingStatusResponse,
  EmployeeReportingFilters,
} from '@/types/statistics'

export class HierarchyService {
  /**
   * Get hierarchy view based on user role
   */
  static async getMyHierarchyView(filters?: HierarchyFilters): Promise<OfficesOverviewResponse | OfficeDetailsResponse | DepartmentDetailsResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/my-hierarchy-view${query}`)
  }

  /**
   * Get offices overview (Admin/Superadmin only)
   */
  static async getOfficesOverview(filters?: HierarchyFilters): Promise<OfficesOverviewResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/offices-overview${query}`)
  }

  /**
   * Get office details
   */
  static async getOfficeDetails(
    officeId: string,
    filters?: HierarchyFilters
  ): Promise<OfficeDetailsResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/office/${officeId}/details${query}`)
  }

  /**
   * Get department details
   */
  static async getDepartmentDetails(
    departmentId: string,
    filters?: HierarchyFilters
  ): Promise<DepartmentDetailsResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/department/${departmentId}/details${query}`)
  }

  /**
   * Get user details
   */
  static async getUserDetails(
    userId: string,
    filters?: HierarchyFilters
  ): Promise<UserDetails> {
    const params = new URLSearchParams()
    
    // Ensure parameters are properly set
    if (filters?.weekNumber !== undefined) {
      params.append('weekNumber', filters.weekNumber.toString())
    }
    if (filters?.year !== undefined) {
      params.append('year', filters.year.toString())
    }
    if (filters?.limit !== undefined) {
      params.append('limit', filters.limit.toString())
    }
    
    const query = params.toString() ? `?${params}` : ''
    
    return await api.get(`/hierarchy-reports/user/${userId}/details${query}`)
  }

  /**
   * Get task completion trends
   */
  static async getTaskCompletionTrends(filters?: {
    officeId?: string
    departmentId?: string
    weeks?: number
  }): Promise<TaskCompletionTrends> {
    const params = new URLSearchParams()
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weeks) params.append('weeks', filters.weeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/task-completion-trends${query}`)
  }

  /**
   * Get incomplete reasons hierarchy analysis
   */
  static async getIncompleteReasonsHierarchy(filters?: {
    officeId?: string
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<IncompleteReasonsHierarchy> {
    const params = new URLSearchParams()
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/incomplete-reasons-hierarchy${query}`)
  }

  /**
   * Get employees who haven't submitted reports
   */
  static async getEmployeesWithoutReports(
    filters?: EmployeeReportingFilters
  ): Promise<EmployeesWithoutReportsResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/employees-without-reports${query}`)
  }

  /**
   * Get employees with incomplete reports
   */
  static async getEmployeesWithIncompleteReports(
    filters?: EmployeeReportingFilters
  ): Promise<EmployeesWithIncompleteReportsResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/employees-incomplete-reports${query}`)
  }

  /**
   * Get comprehensive employee reporting status
   */
  static async getEmployeesReportingStatus(
    filters?: EmployeeReportingFilters
  ): Promise<EmployeesReportingStatusResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/employees-reporting-status${query}`)
  }

  /**
   * Admin: Get user reports for management
   */
  static async getUserReportsForAdmin(
    userId: string,
    filters?: {
      page?: number
      limit?: number
      weekNumber?: number
      year?: number
    }
  ): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/user/${userId}/reports${query}`)
  }

  /**
   * Admin: Get specific report details for a user
   */
  static async getReportDetailsForAdmin(
    userId: string,
    reportId: string
  ): Promise<any> {
    return await api.get(`/hierarchy-reports/admin/user/${userId}/report/${reportId}`)
  }
}
