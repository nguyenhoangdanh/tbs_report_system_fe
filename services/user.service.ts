import { api } from '@/lib/api'
import type { User, Department, Position, PaginatedResponse, UpdateProfileDto, Office, JobPosition } from '@/types'

export class UserService {
  static async getAllUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    return api.get<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`)
  }

  static async getUserById(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`)
  }

  static async updateUser(id: string, data: UpdateProfileDto): Promise<User> {
    return api.patch<User>(`/users/${id}`, data)
  }

  static async deleteUser(id: string): Promise<void> {
    return api.delete<void>(`/users/${id}`)
  }

  static async updateProfile(data: UpdateProfileDto): Promise<User> {
    return api.patch<User>('/users/profile', data)
  }

  static async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    return api.patch<void>('/auth/change-password', data)
  }

  // Public endpoints for registration
  static async getOffices(): Promise<Office[]> {
    return api.get<Office[]>('/organizations/offices')
  }

  static async getJobPositions(): Promise<JobPosition[]> {
    return api.get<JobPosition[]>('/organizations/job-positions')
  }

  static async getDepartments(): Promise<Department[]> {
    return api.get<Department[]>('/organizations/departments')
  }

  static async getPositions(): Promise<Position[]> {
    return api.get<Position[]>('/organizations/positions')
  }
}
