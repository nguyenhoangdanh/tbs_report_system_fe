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
    } catch (error) {
      return null
    }
  }

  static async updateTaskReport(taskId: string, data: UpdateTaskReportDto): Promise<void> {
    return api.put<void>(`/reports/tasks/${taskId}`, data)
  }

  static async deleteReport(id: string): Promise<void> {
    return api.delete<void>(`/reports/${id}`)
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
}
