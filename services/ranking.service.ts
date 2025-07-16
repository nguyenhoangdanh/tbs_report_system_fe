import { api, type ApiResult } from '@/lib/api'

export type Ranking = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'FAIL'

// Updated ranking interface với thang điểm mới
export interface EmployeeRanking {
  rank: Ranking;
  label: string
  color: string
  bgColor: string
  description: string
}

export interface EmployeeRankingData {
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email: string
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
    ranking: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'FAIL' | 'POOR'
    rankingLabel: string
    analysisPeriod: {
      weeks: number
      from: { weekNumber: number; year: number }
      to: { weekNumber: number; year: number }
    }
  }
}

export interface EmployeeRankingResponse {
  filters: {
    weekNumber?: number
    year?: number
    periodWeeks: number
    positionId?: string
    jobPositionId?: string
  }
  employees: EmployeeRankingData[]
  summary: {
    totalEmployees: number
    rankingDistribution: {
      excellent: { count: number; percentage: number }
      good: { count: number; percentage: number }
      average: { count: number; percentage: number }
      belowAverage: { count: number; percentage: number }
      poor: { count: number; percentage: number }
    }
    averageCompletionRate: number
    topPerformers: number
    needsImprovement: number
  }
}

// Position-based ranking (Management hierarchy)
export interface PositionRankingResponse {
  filters: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
    timeFrame?: 'week' | 'month' | 'year'
  }
  groupBy: 'position'
  positions: Array<{
    position: {
      id: string
      name: string
      level: number
      description?: string
    }
    stats: {
      totalEmployees: number
      averageCompletionRate: number
      positionRanking: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'FAIL' | 'POOR'
      rankingDistribution: {
        excellent: { count: number; percentage: number }
        good: { count: number; percentage: number }
        average: { count: number; percentage: number }
        belowAverage: { count: number; percentage: number }
        poor: { count: number; percentage: number }
      }
    }
  }>
  summary: {
    totalPositions: number
    totalEmployees: number
    averageCompletionRate: number
    bestPerformingPosition: any
    needsImprovementPositions: number
  }
}

// JobPosition-based ranking (Staff level)
export interface JobPositionRankingResponse {
  filters: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
    timeFrame?: 'week' | 'month' | 'year'
    departmentId?: string
  }
  groupBy: 'jobPosition'
  jobPositions: Array<{
    jobPosition: {
      id: string
      jobName: string
      code: string
      department: {
        id: string
        name: string
        office: {
          id: string
          name: string
        }
      }
      position: {
        id: string
        name: string
      }
    }
    stats: {
      totalEmployees: number
      averageCompletionRate: number
      jobPositionRanking: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'FAIL' | 'POOR'
      rankingDistribution: {
        excellent: { count: number; percentage: number }
        good: { count: number; percentage: number }
        average: { count: number; percentage: number }
        belowAverage: { count: number; percentage: number }
        poor: { count: number; percentage: number }
      }
    }
  }>
  summary: {
    totalJobPositions: number
    totalEmployees: number
    averageCompletionRate: number
    bestPerformingJobPosition: any
    needsImprovementJobPositions: number
  }
}

// Time performance response
export interface TimePerformanceResponse {
  timeFrame: 'week' | 'month' | 'year'
  filters: {
    timeFrame: 'week' | 'month' | 'year'
    positionId?: string
    jobPositionId?: string
    year?: number
  }
  timeSeriesData: Array<{
    period: string
    weekNumber?: number
    month?: number
    year: number
    totalReports: number
    totalTasks: number
    completedTasks: number
    completionRate: number
  }>
  summary: {
    totalPeriods: number
    averageCompletionRate: number
    bestPeriod: any
    worstPeriod: any
    trend: 'improving' | 'declining' | 'stable'
  }
}

export interface DepartmentRankingResponse {
  filters: {
    departmentId?: string
    officeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }
  departments: Array<{
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
      departmentRanking: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'FAIL' | 'POOR'
      rankingDistribution: {
        excellent: { count: number; percentage: number }
        good: { count: number; percentage: number }
        average: { count: number; percentage: number }
        belowAverage: { count: number; percentage: number }
        poor: { count: number; percentage: number }
      }
      topPerformers: Array<{
        employeeCode: string
        fullName: string
        completionRate: number
        ranking: string
      }>
      needsImprovement: Array<{
        employeeCode: string
        fullName: string
        completionRate: number
        ranking: string
      }>
    }
  }>
  summary: {
    totalDepartments: number
    totalEmployees: number
    averageCompletionRate: number
    bestPerformingDepartment: any
    needsImprovementDepartments: number
  }
}

// Add missing interfaces at the end before the RankingService class
export interface OfficeRankingResponse {
  filters: {
    officeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }
  offices: Array<{
    office: {
      id: string
      name: string
      type: string
      description?: string
    }
    ranking: {
      rank: number
      totalOffices: number
    }
    performance: {
      totalEmployees: number
      totalDepartments: number
      averageCompletionRate: number
      totalReports: number
      completedReports: number
      totalTasks: number
      completedTasks: number
    }
    topDepartments: Array<{
      name: string
      completionRate: number
    }>
  }>
  summary: {
    totalOffices: number
    averageCompletionRate: number
    topOffice: {
      name: string
      completionRate: number
    } | null
  }
}

export interface OverallRankingResponse {
  filters: {
    weekNumber?: number
    year?: number
    periodWeeks: number
  }
  overview: {
    totalEmployees: number
    totalDepartments: number
    totalOffices: number
    systemAverageCompletionRate: number
  }
  topPerformers: {
    employees: Array<{
      rank: number
      employeeCode: string
      name: string
      department: string
      office: string
      completionRate: number
    }>
    departments: Array<{
      rank: number
      name: string
      office: string
      completionRate: number
      employeeCount: number
    }>
    offices: Array<{
      rank: number
      name: string
      type: string
      completionRate: number
      employeeCount: number
      departmentCount: number
    }>
  }
  trends: {
    weeklyTrends: Array<{
      weekNumber: number
      year: number
      averageCompletionRate: number
      totalReports: number
      completedReports: number
    }>
  }
}

export class RankingService {
  /**
   * Get employee ranking data
   */
  static async getEmployeeRanking(filters?: {
    employeeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
    positionId?: string
    jobPositionId?: string
  }): Promise<ApiResult<EmployeeRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.employeeId && typeof filters.employeeId === 'string') {
      params.append('employeeId', filters.employeeId)
    }
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    if (filters?.positionId && typeof filters.positionId === 'string') {
      params.append('positionId', filters.positionId)
    }
    if (filters?.jobPositionId && typeof filters.jobPositionId === 'string') {
      params.append('jobPositionId', filters.jobPositionId)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<EmployeeRankingResponse>(`/ranking/employees${query}`)
  }

  /**
   * Get position-based ranking (Management hierarchy)
   */
  static async getPositionRanking(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
    timeFrame?: 'week' | 'month' | 'year'
  }): Promise<ApiResult<PositionRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    if (filters?.timeFrame && ['week', 'month', 'year'].includes(filters.timeFrame)) {
      params.append('timeFrame', filters.timeFrame)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<PositionRankingResponse>(`/ranking/position-ranking${query}`)
  }

  /**
   * Get job position-based ranking (Staff level)
   */
  static async getJobPositionRanking(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
    timeFrame?: 'week' | 'month' | 'year'
    departmentId?: string
  }): Promise<ApiResult<JobPositionRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    if (filters?.timeFrame && ['week', 'month', 'year'].includes(filters.timeFrame)) {
      params.append('timeFrame', filters.timeFrame)
    }
    if (filters?.departmentId && typeof filters.departmentId === 'string') {
      params.append('departmentId', filters.departmentId)
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<JobPositionRankingResponse>(`/ranking/jobposition-ranking${query}`)
  }

  /**
   * Get time performance data
   */
  static async getTimePerformance(filters: {
    timeFrame: 'week' | 'month' | 'year'
    positionId?: string
    jobPositionId?: string
    year?: number
  }): Promise<ApiResult<TimePerformanceResponse>> {
    const params = new URLSearchParams()
    
    params.append('timeFrame', filters.timeFrame)
    
    if (filters.positionId && typeof filters.positionId === 'string') {
      params.append('positionId', filters.positionId)
    }
    if (filters.jobPositionId && typeof filters.jobPositionId === 'string') {
      params.append('jobPositionId', filters.jobPositionId)
    }
    if (filters.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    
    const query = params.toString() ? `?${params}` : ''
    // return await api.get<ApiResult<TimePerformanceResponse>>(`/ranking/time-performance${query}`)
    return await api.get<TimePerformanceResponse>(`/ranking/time-performance${query}`)
  }

  /**
   * Get department ranking statistics
   */
  static async getDepartmentRankingStats(filters?: {
    departmentId?: string
    officeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<ApiResult<DepartmentRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.departmentId && typeof filters.departmentId === 'string') {
      params.append('departmentId', filters.departmentId)
    }
    if (filters?.officeId && typeof filters.officeId === 'string') {
      params.append('officeId', filters.officeId)
    }
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<DepartmentRankingResponse>(`/ranking/departments${query}`)
  }

  /**
   * Get office ranking statistics
   */
  static async getOfficeRankingStats(filters?: {
    officeId?: string
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<ApiResult<OfficeRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.officeId && typeof filters.officeId === 'string') {
      params.append('officeId', filters.officeId)
    }
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<OfficeRankingResponse>(`/ranking/offices${query}`)
  }

  /**
   * Get overall ranking statistics (Admin only)
   */
  static async getOverallRankingStats(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<ApiResult<OverallRankingResponse>> {
    const params = new URLSearchParams()
    
    if (filters?.weekNumber !== undefined && !isNaN(Number(filters.weekNumber))) {
      params.append('weekNumber', String(Number(filters.weekNumber)))
    }
    if (filters?.year !== undefined && !isNaN(Number(filters.year))) {
      params.append('year', String(Number(filters.year)))
    }
    if (filters?.periodWeeks !== undefined && !isNaN(Number(filters.periodWeeks))) {
      params.append('periodWeeks', String(Number(filters.periodWeeks)))
    }
    
    const query = params.toString() ? `?${params}` : ''
    return await api.get<OverallRankingResponse>(`/ranking/overall${query}`)
  }

  /**
   * Get my personal ranking (simplified)
   */
  static async getMyRanking(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<ApiResult<EmployeeRankingData | null>> {
    const response = await this.getEmployeeRanking(filters)
    if (!response.success || !response.data || response.data.employees.length === 0) {
      return { success: false }
    }
    return { success: true, data: response.data.employees[0] } // Assuming
    // return response.data?.employees?.[0] || null
  }
}

/**
 * Calculate ranking from completion rate - Updated với thang điểm mới
 */
export function calculateRankingFromRate(completionRate: number): EmployeeRanking {
  if (completionRate >= 100) {
    return {
      rank: 'EXCELLENT',
      label: 'Xuất sắc',
      color: '#22c55e',
      bgColor: '#f0fdf4',
      description: 'Hoàn thành xuất sắc (≥100%)'
    }
  } else if (completionRate >= 95) {
    return {
      rank: 'GOOD',
      label: 'Tốt',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      description: 'Hoàn thành tốt (≥95%)'
    }
  } else if (completionRate >= 90) {
    return {
      rank: 'AVERAGE',
      label: 'Trung bình',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      description: 'Hoàn thành trung bình (≥90%)'
    }
  } else if (completionRate >= 85) {
    return {
      rank: 'POOR',
      label: 'Yếu',
      color: '#f97316',
      bgColor: '#fff7ed',
      description: 'Yếu (≥85%)'
    }
  } else {
    return {
      rank: 'FAIL',
      label: 'Kém',
      color: '#ef4444',
      bgColor: '#fef2f2',
      description: 'Kém (<85%)'
    }
  }
}

/**
 * Calculate ranking color based on completion rate
 */
export function getRankingColor(completionRate: number): string {
  const ranking = calculateRankingFromRate(completionRate)
  return ranking.color
}

/**
 * Calculate ranking background color based on completion rate
 */
export function getRankingBgColor(completionRate: number): string {
  const ranking = calculateRankingFromRate(completionRate)
  return ranking.bgColor
}
