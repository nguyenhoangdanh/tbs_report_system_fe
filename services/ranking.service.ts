import { api } from '@/lib/api'

export enum EmployeeRanking {
  EXCELLENT = 'EXCELLENT',       // Xuất sắc (90-100%)
  GOOD = 'GOOD',                 // Tốt (80-89%)
  AVERAGE = 'AVERAGE',           // Trung bình (70-79%)
  BELOW_AVERAGE = 'BELOW_AVERAGE', // Dưới trung bình (60-69%)
  POOR = 'POOR'                  // Kém (< 60%)
}

export interface EmployeeRankingData {
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email?: string
    role: string
    office: {
      id: string
      name: string
      type: string
    }
    jobPosition: {
      id: string
      jobName: string
      positionName: string
      department: {
        id: string
        name: string
        office: {
          name: string
        }
      }
    }
  }
  performance: {
    totalReports: number
    totalTasks: number
    completedTasks: number
    completionRate: number
    ranking: EmployeeRanking
    rankingLabel: string
    analysisPeriod: {
      weeks: number
      from: { weekNumber: number; year: number }
      to: { weekNumber: number; year: number }
    }
  }
}

export interface RankingDistribution {
  excellent: { count: number; percentage: number }
  good: { count: number; percentage: number }
  average: { count: number; percentage: number }
  belowAverage: { count: number; percentage: number }
  poor: { count: number; percentage: number }
}

export interface EmployeeRankingResponse {
  filters: {
    employeeId?: string
    weekNumber: number
    year: number
    periodWeeks: number
  }
  employees: EmployeeRankingData[]
  summary: {
    totalEmployees: number
    rankingDistribution: RankingDistribution
    averageCompletionRate: number
    topPerformers: number
    needsImprovement: number
  }
}

export interface DepartmentRankingStats {
  department: {
    id: string
    name: string
    description?: string
    office: {
      id: string
      name: string
      type: string
    }
  }
  stats: {
    totalEmployees: number
    averageCompletionRate: number
    departmentRanking: EmployeeRanking
    rankingDistribution: RankingDistribution
    topPerformers: Array<{
      employeeCode: string
      fullName: string
      completionRate: number
      ranking: EmployeeRanking
    }>
    needsImprovement: Array<{
      employeeCode: string
      fullName: string
      completionRate: number
      ranking: EmployeeRanking
    }>
  }
}

export interface DepartmentRankingResponse {
  filters: {
    departmentId?: string
    weekNumber: number
    year: number
    periodWeeks: number
  }
  departments: DepartmentRankingStats[]
  summary: {
    totalDepartments: number
    totalEmployees: number
    averageCompletionRate: number
    bestPerformingDepartment: DepartmentRankingStats
    needsImprovementDepartments: number
  }
}

export interface OfficeRankingStats {
  office: {
    id: string
    name: string
    type: string
    description?: string
  }
  stats: {
    totalEmployees: number
    totalDepartments: number
    averageCompletionRate: number
    officeRanking: EmployeeRanking
    rankingDistribution: RankingDistribution
    departmentBreakdown: Array<{
      departmentId: string
      departmentName: string
      totalEmployees: number
      averageCompletionRate: number
      departmentRanking: EmployeeRanking
      rankingDistribution: RankingDistribution
    }>
    topPerformers: Array<{
      employeeCode: string
      fullName: string
      completionRate: number
      ranking: EmployeeRanking
    }>
    needsImprovement: Array<{
      employeeCode: string
      fullName: string
      completionRate: number
      ranking: EmployeeRanking
    }>
  }
}

export interface OfficeRankingResponse {
  filters: {
    officeId?: string
    weekNumber: number
    year: number
    periodWeeks: number
  }
  offices: OfficeRankingStats[]
  summary: {
    totalOffices: number
    totalEmployees: number
    averageCompletionRate: number
    bestPerformingOffice: OfficeRankingStats
    needsImprovementOffices: number
  }
}

export interface OverallRankingResponse {
  filters: {
    weekNumber: number
    year: number
    periodWeeks: number
  }
  overall: {
    totalEmployees: number
    totalOffices: number
    totalDepartments: number
    rankingDistribution: RankingDistribution
    averageCompletionRate: number
  }
  officeRankings: Array<{
    office: {
      id: string
      name: string
      type: string
    }
    averageCompletionRate: number
    ranking: EmployeeRanking
    totalEmployees: number
  }>
  topPerformers: Array<{
    employeeCode: string
    fullName: string
    completionRate: number
    ranking: EmployeeRanking
  }>
  needsImprovement: Array<{
    employeeCode: string
    fullName: string
    completionRate: number
    ranking: EmployeeRanking
  }>
}

export class RankingService {
  /**
   * Get employee rankings and classifications
   */
  static async getEmployeeRanking(filters?: {
    employeeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<EmployeeRankingResponse> {
    const params = new URLSearchParams()
    if (filters?.employeeId) params.append('employeeId', filters.employeeId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.periodWeeks) params.append('periodWeeks', filters.periodWeeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/ranking/employees${query}`)
  }

  /**
   * Get department ranking statistics
   */
  static async getDepartmentRankingStats(filters?: {
    departmentId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<DepartmentRankingResponse> {
    const params = new URLSearchParams()
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.periodWeeks) params.append('periodWeeks', filters.periodWeeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/ranking/departments${query}`)
  }

  /**
   * Get office ranking statistics
   */
  static async getOfficeRankingStats(filters?: {
    officeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<OfficeRankingResponse> {
    const params = new URLSearchParams()
    if (filters?.officeId) params.append('officeId', filters.officeId)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.periodWeeks) params.append('periodWeeks', filters.periodWeeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/ranking/offices${query}`)
  }

  /**
   * Get overall ranking statistics (Admin/Superadmin only)
   */
  static async getOverallRankingStats(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<OverallRankingResponse> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.periodWeeks) params.append('periodWeeks', filters.periodWeeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get(`/ranking/overall${query}`)
  }
}

// Helper functions
export function getRankingLabel(ranking: EmployeeRanking): string {
  const labels = {
    [EmployeeRanking.EXCELLENT]: 'Xuất sắc',
    [EmployeeRanking.GOOD]: 'Tốt',
    [EmployeeRanking.AVERAGE]: 'Trung bình',
    [EmployeeRanking.BELOW_AVERAGE]: 'Dưới trung bình',
    [EmployeeRanking.POOR]: 'Kém'
  }
  return labels[ranking] || 'Chưa xếp loại'
}

// Helper function to calculate ranking from completion rate
export function calculateRankingFromRate(completionRate: number): EmployeeRanking {
  if (completionRate === 100) return EmployeeRanking.EXCELLENT
  if (completionRate >= 95) return EmployeeRanking.GOOD
  if (completionRate >= 90) return EmployeeRanking.AVERAGE
  if (completionRate >= 85) return EmployeeRanking.BELOW_AVERAGE
  return EmployeeRanking.POOR
}
