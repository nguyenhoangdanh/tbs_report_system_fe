import { api } from '@/lib/api'
import type {
  OfficesOverview,
  OfficeDetails,
  DepartmentDetails,
  UserDetails,
  TaskCompletionTrends,
  IncompleteReasonsHierarchy,
  HierarchyFilters
} from '@/types/hierarchy'

export class HierarchyService {
  /**
   * Get overview of all offices (Admin/Superadmin only)
   */
  static async getOfficesOverview(filters?: HierarchyFilters): Promise<OfficesOverview> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<OfficesOverview>(`/hierarchy-reports/offices-overview${query}`)
  }

  /**
   * Get detailed office statistics with departments breakdown
   */
  static async getOfficeDetails(
    officeId: string, 
    filters?: HierarchyFilters
  ): Promise<OfficeDetails> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<OfficeDetails>(`/hierarchy-reports/office/${officeId}/details${query}`)
  }

  /**
   * Get detailed department statistics with users breakdown
   */
  static async getDepartmentDetails(
    departmentId: string, 
    filters?: HierarchyFilters
  ): Promise<DepartmentDetails> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<DepartmentDetails>(`/hierarchy-reports/department/${departmentId}/details${query}`)
  }

  /**
   * Get detailed user statistics with task breakdown
   */
  static async getUserDetails(
    userId: string, 
    filters?: HierarchyFilters
  ): Promise<UserDetails> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<UserDetails>(`/hierarchy-reports/user/${userId}/details${query}`)
  }

  /**
   * Get hierarchy view based on current user role
   */
  static async getMyHierarchyView(filters?: HierarchyFilters): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/my-hierarchy-view${query}`)
  }

  /**
   * Get task completion trends across hierarchy
   */
  static async getTaskCompletionTrends(filters: {
    officeId?: string
    departmentId?: string
    weeks?: number
  }): Promise<TaskCompletionTrends> {
    const params = new URLSearchParams()
    if (filters.officeId) params.append('officeId', filters.officeId)
    if (filters.departmentId) params.append('departmentId', filters.departmentId)
    if (filters.weeks) params.append('weeks', filters.weeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<TaskCompletionTrends>(`/hierarchy-reports/task-completion-trends${query}`)
  }

  /**
   * Get incomplete task reasons analysis across hierarchy
   */
  static async getIncompleteReasonsHierarchy(filters: {
    officeId?: string
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<IncompleteReasonsHierarchy> {
    const params = new URLSearchParams()
    if (filters.officeId) params.append('officeId', filters.officeId)
    if (filters.departmentId) params.append('departmentId', filters.departmentId)
    if (filters.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<IncompleteReasonsHierarchy>(`/hierarchy-reports/incomplete-reasons-hierarchy${query}`)
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

  /**
   * Get the list of all departments in an office
   */
  static async getAllDepartmentsInOffice(officeId: string): Promise<any> {
    return await api.get(`/hierarchy-reports/office/${officeId}/departments`)
  }

  /**
   * Get the list of all users in a department
   */
  static async getAllUsersInDepartment(departmentId: string): Promise<any> {
    return await api.get(`/hierarchy-reports/department/${departmentId}/users`)
  }

  /**
   * Get task completion status for a specific user
   */
  static async getUserTaskCompletionStatus(userId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/user/${userId}/task-completion-status${query}`)
  }

  /**
   * Get department statistics for admin
   */
  static async getDepartmentStatisticsForAdmin(filters?: {
    officeId?: string
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/departments-statistics${query}`)
  }

  /**
   * Get user activity logs for admin
   */
  static async getUserActivityLogsForAdmin(userId: string, filters?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/user/${userId}/activity-logs${query}`)
  }

  /**
   * Admin: Get office reports
   */
  static async getOfficeReports(filters?: {
    page?: number
    limit?: number
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/offices-reports${query}`)
  }

  /**
   * Admin: Get specific office report details
   */
  static async getOfficeReportDetails(reportId: string): Promise<any> {
    return await api.get(`/hierarchy-reports/admin/office/report/${reportId}`)
  }

  /**
   * Admin: Get department user activity logs
   */
  static async getDepartmentUserActivityLogs(departmentId: string, filters?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/department/${departmentId}/activity-logs${query}`)
  }

  /**
   * Admin: Get user task details
   */
  static async getUserTaskDetails(userId: string, filters?: {
    officeId?: string
    departmentId?: string
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/user/${userId}/task-details${query}`)
  }

  /**
   * Admin: Get all users in an office
   */
  static async getAllUsersInOffice(officeId: string): Promise<any> {
    return await api.get(`/hierarchy-reports/admin/office/${officeId}/users`)
  }

  /**
   * Admin: Get all departments in a hierarchy
   */
  static async getAllDepartmentsInHierarchy(officeId?: string): Promise<any> {
    const params = new URLSearchParams()
    if (officeId) params.append('officeId', officeId)
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/departments${query}`)
  }

  /**
   * Admin: Get all users in a department (detailed)
   */
  static async getAllUsersInDepartmentDetailed(departmentId: string): Promise<any> {
    return await api.get(`/hierarchy-reports/admin/department/${departmentId}/users-detailed`)
  }

  /**
   * Admin: Get task completion trends for an office
   */
  static async getOfficeTaskCompletionTrends(officeId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/office/${officeId}/task-completion-trends${query}`)
  }

  /**
   * Admin: Get task completion trends for a department
   */
  static async getDepartmentTaskCompletionTrends(departmentId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/department/${departmentId}/task-completion-trends${query}`)
  }

  /**
   * Admin: Get incomplete task reasons for an office
   */
  static async getOfficeIncompleteReasons(officeId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/office/${officeId}/incomplete-reasons${query}`)
  }

  /**
   * Admin: Get incomplete task reasons for a department
   */
  static async getDepartmentIncompleteReasons(departmentId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/department/${departmentId}/incomplete-reasons${query}`)
  }

  /**
   * Admin: Get user performance summary
   */
  static async getUserPerformanceSummary(userId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/user/${userId}/performance-summary${query}`)
  }

  /**
   * Admin: Get department performance summary
   */
  static async getDepartmentPerformanceSummary(departmentId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/department/${departmentId}/performance-summary${query}`)
  }

  /**
   * Admin: Get office performance summary
   */
  static async getOfficePerformanceSummary(officeId: string, filters?: {
    weekNumber?: number
    year?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/hierarchy-reports/admin/office/${officeId}/performance-summary${query}`)
  }
}
