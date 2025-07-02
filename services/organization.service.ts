import { api } from '@/lib/api'
import type { Office, Department, Position, JobPosition } from '@/types'

export class OrganizationService {
  /**
   * Get all offices
   */
  static async getOffices(): Promise<Office[]> {
    return await api.get<Office[]>('/organizations/offices')
  }

  /**
   * Get all departments
   */
  static async getDepartments(): Promise<Department[]> {
    return await api.get<Department[]>('/organizations/departments')
  }

  /**
   * Get all positions
   */
  static async getPositions(): Promise<Position[]> {
    return await api.get<Position[]>('/organizations/positions')
  }

  /**
   * Get all job positions
   */
  static async getJobPositions(): Promise<JobPosition[]> {
    return await api.get<JobPosition[]>('/organizations/job-positions')
  }
}
