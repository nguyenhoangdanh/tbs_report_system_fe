import { api } from '@/lib/api'
import type { User, Department, Position, PaginatedResponse, UpdateProfileDto, Office, JobPosition, CreateUserDto } from '@/types'

export class UserService {
  /**
   * Get all users with pagination (Admin only)
   */
  static async getAllUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    return api.get<PaginatedResponse<User>>(`/users/all?page=${page}&limit=${limit}`)
  }

  /**
   * Get user by ID or profile
   */
  static async getUserById(id: string): Promise<User> {
    if (id === 'profile') {
      return api.get<User>('/users/profile')
    }
    return api.get<User>(`/users/${id}`)
  }

  /**
   * Create new user (Admin only)
   */
  static async createUser(data: CreateUserDto): Promise<User> {
    return api.post<User>('/users', data)
  }

  /**
   * Update user by admin
   */
  static async updateUser(id: string, data: UpdateProfileDto): Promise<User> {
    return api.patch<User>(`/users/${id}`, data)
  }

  /**
   * Delete user (Admin only)
   */
  static async deleteUser(id: string): Promise<void> {
    return api.delete<void>(`/users/${id}`)
  }

  /**
   * Update current user profile
   */
  static async updateProfile(data: UpdateProfileDto): Promise<User> {
    return api.patch<User>('/users/profile', data)
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    return api.get<User>('/users/profile')
  }

  /**
   * Change password
   */
  static async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    return api.patch<void>('/auth/change-password', data)
  }

  // Organization endpoints
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

  /**
   * Get users with ranking data
   */
  static async getUsersWithRankingData(filters?: {
    weekNumber?: number
    year?: number
    periodWeeks?: number
  }): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.periodWeeks) params.append('periodWeeks', filters.periodWeeks.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return api.get<any>(`/users/with-ranking${query}`)
  }
}
