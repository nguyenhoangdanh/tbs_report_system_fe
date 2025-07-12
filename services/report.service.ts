import { api } from '@/lib/api'
import type { WeeklyReport, PaginatedResponse } from '@/types'

export interface CreateWeeklyReportDto {
  weekNumber: number
  year: number
  tasks: CreateTaskDto[]
}

export interface CreateTaskDto {
  taskName: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}

export interface UpdateReportDto {
  tasks?: UpdateTaskDto[]
  isCompleted?: boolean
}

export interface UpdateTaskDto {
  taskName?: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ReportFilters {
  weekNumber?: number
  year?: number
  startDate?: string
  endDate?: string
  isCompleted?: boolean
}

export class ReportService {
  /**
   * Get my reports with pagination
   */
  static async getMyReports(params?: PaginationParams): Promise<PaginatedResponse<WeeklyReport>> {
    const searchParams = new URLSearchParams()
    
    // FIX: Validate pagination parameters
    if (params?.page !== undefined) {
      const pageNum = Number(params.page)
      if (!isNaN(pageNum) && pageNum > 0) {
        searchParams.append('page', String(pageNum))
      }
    }
    if (params?.limit !== undefined) {
      const limitNum = Number(params.limit)
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        searchParams.append('limit', String(limitNum))
      }
    }
    
    const query = searchParams.toString() ? `?${searchParams}` : ''
    return await api.get<PaginatedResponse<WeeklyReport>>(`/reports/my-reports${query}`)
  }

  /**
   * Get report by ID
   */
  static async getReportById(id: string): Promise<WeeklyReport> {
    return await api.get<WeeklyReport>(`/reports/${id}`)
  }

  /**
   * Get report by week and year - with proper number validation
   */
  static async getReportByWeek(weekNumber: number, year: number): Promise<WeeklyReport> {
    // FIX: Validate inputs are proper numbers
    const validWeekNumber = Number(weekNumber)
    const validYear = Number(year)
    
    if (isNaN(validWeekNumber) || isNaN(validYear)) {
      throw new Error('Week number and year must be valid numbers')
    }
    
    if (validWeekNumber < 1 || validWeekNumber > 53) {
      throw new Error('Week number must be between 1 and 53')
    }
    
    if (validYear < 2020 || validYear > 2030) {
      throw new Error('Year must be between 2020 and 2030')
    }
    
    return await api.get<WeeklyReport>(`/reports/week/${validWeekNumber}/${validYear}`)
  }

  /**
   * Get current week report
   */
  static async getCurrentWeekReport(): Promise<WeeklyReport> {
    return await api.get<WeeklyReport>('/reports/current-week')
  }

  /**
   * Create weekly report - with proper number validation
   */
  static async createWeeklyReport(data: CreateWeeklyReportDto): Promise<WeeklyReport> {
    // FIX: Ensure weekNumber and year are proper numbers
    const validWeekNumber = Number(data.weekNumber)
    const validYear = Number(data.year)
    
    // Validate numbers
    if (isNaN(validWeekNumber) || isNaN(validYear)) {
      throw new Error('Week number and year must be valid numbers')
    }
    
    if (validWeekNumber < 1 || validWeekNumber > 53) {
      throw new Error('Week number must be between 1 and 53')
    }
    
    if (validYear < 2020 || validYear > 2030) {
      throw new Error('Year must be between 2020 and 2030')
    }
    
    const payload = {
      ...data,
      weekNumber: validWeekNumber,
      year: validYear,
      tasks: data.tasks.map(task => ({
        ...task,
        monday: Boolean(task.monday),
        tuesday: Boolean(task.tuesday),
        wednesday: Boolean(task.wednesday),
        thursday: Boolean(task.thursday),
        friday: Boolean(task.friday),
        saturday: Boolean(task.saturday),
        isCompleted: Boolean(task.isCompleted)
      }))
    }
    
    return await api.post<WeeklyReport>('/reports', payload)
  }

  /**
   * Update report
   */
  static async updateReport(id: string, data: UpdateReportDto): Promise<WeeklyReport> {
    return await api.patch<WeeklyReport>(`/reports/${id}`, data)
  }

  /**
   * Delete report
   */
  static async deleteReport(id: string): Promise<void> {
    return await api.delete<void>(`/reports/${id}`)
  }

  /**
   * Update task
   */
  static async updateTask(taskId: string, data: UpdateTaskDto): Promise<void> {
    return await api.patch<void>(`/reports/tasks/${taskId}`, data)
  }

  /**
   * Delete task
   */
  static async deleteTask(taskId: string): Promise<void> {
    return await api.delete<void>(`/reports/tasks/${taskId}`)
  }

  /**
   * Complete report
   */
  static async completeReport(id: string): Promise<WeeklyReport> {
    return await api.patch<WeeklyReport>(`/reports/${id}/complete`)
  }

  /**
   * Reopen report
   */
  static async reopenReport(id: string): Promise<WeeklyReport> {
    return await api.patch<WeeklyReport>(`/reports/${id}/reopen`)
  }
}