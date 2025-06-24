import { api } from '@/lib/api'
import type { 
  WeeklyReport, 
  CreateWeeklyReportDto, 
  UpdateTaskReportDto,
  PaginatedResponse 
} from '@/types'

export class ReportService {
  static async createWeeklyReport(data: CreateWeeklyReportDto): Promise<WeeklyReport> {
    return api.post<WeeklyReport>('/reports', data)
  }

  static async getMyReports(page = 1, limit = 10): Promise<PaginatedResponse<WeeklyReport>> {
    return api.get<PaginatedResponse<WeeklyReport>>(`/reports/my?page=${page}&limit=${limit}`)
  }

  static async getReportById(id: string): Promise<WeeklyReport> {
    return api.get<WeeklyReport>(`/reports/${id}`)
  }

  static async getCurrentWeekReport(): Promise<WeeklyReport | null> {
    try {
      return await api.get<WeeklyReport>('/reports/current-week')
    } catch (error: any) {
      // Return null if no report found (404)
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  static async updateReport(id: string, data: any): Promise<WeeklyReport> {
    return api.patch<WeeklyReport>(`/reports/${id}`, data) // Changed from PUT to PATCH
  }

  static async deleteReport(id: string): Promise<void> {
    return api.delete<void>(`/reports/${id}`)
  }

  // New method to delete individual task
  static async deleteTask(taskId: string): Promise<void> {
    return api.delete<void>(`/reports/tasks/${taskId}`)
  }

  // New method to update individual task
  static async updateTask(taskId: string, data: any): Promise<any> {
    return api.patch(`/reports/tasks/${taskId}`, data)
  }

  // Admin/Superadmin endpoints
  static async getAllReports(
    page = 1, 
    limit = 10, 
    departmentId?: string,
    weekNumber?: number,
    year?: number
  ): Promise<PaginatedResponse<WeeklyReport>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(departmentId && { departmentId }),
      ...(weekNumber && { weekNumber: weekNumber.toString() }),
      ...(year && { year: year.toString() })
    })
    return api.get<PaginatedResponse<WeeklyReport>>(`/reports/all?${params}`)
  }

  static async getReportStats(weekNumber?: number, year?: number) {
    const params = new URLSearchParams({
      ...(weekNumber && { weekNumber: weekNumber.toString() }),
      ...(year && { year: year.toString() })
    })
    return api.get(`/reports/stats?${params}`)
  }

  static async getReportByWeek(weekNumber: number, year: number): Promise<WeeklyReport | null> {
    try {
      return await api.get<WeeklyReport>(`/reports/week/${weekNumber}/year/${year}`)
    } catch (error: any) {
      // Return null if no report found (404)
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }
}
