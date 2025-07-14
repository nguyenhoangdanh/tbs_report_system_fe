export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum OfficeType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  FACTORY_OFFICE = 'FACTORY_OFFICE',
}

// Fix UserRole type to use the actual Role enum values
export type UserRole = Role

// Common types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success?: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role:  Role
  isActive: boolean
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
        id: string
        name: string
      }
    }
    position: {
      id: string
      name: string
      description?: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  employeeCode: string
  email?: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: Role // Use Role enum directly
  jobPositionId: string
  officeId: string
}

export interface UpdateProfileDto {
  employeeCode?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  jobPositionId?: string
  officeId?: string
  // role: Role
}

// Task interface (6-day work week)
export interface Task {
  id: string
  taskName: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  isCompleted: boolean
  reasonNotDone?: string
  createdAt: string
  updatedAt: string
  reportId: string
}

// Weekly Report types - Fix to match backend exactly
export interface WeeklyReport {
  id: string
  weekNumber: number
  year: number
  isCompleted: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  userId: string
  tasks: Task[]
  user: User
  // Optional statistics
  totalTasks?: number
  completedTasks?: number
  taskCompletionRate?: number
}

// Create/Update DTOs
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

export interface CreateWeeklyReportDto {
  weekNumber: number
  year: number
  tasks: CreateTaskDto[]
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

export interface UpdateReportDto {
  isCompleted?: boolean
  tasks?: UpdateTaskDto[]
  updatedAt?: boolean
}

// Auth types - Fixed and consolidated
export interface AuthUser extends User {
  accessToken?: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginDto {
  employeeCode: string
  password: string
  rememberMe?: boolean
}

export interface RegisterDto {
  employeeCode: string
  email?: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  jobPositionId: string
  officeId: string
  role: Role // Use Role enum directly
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordDto {
  employeeCode: string
  phone: string
}

export interface ResetPasswordDto {
  employeeCode: string
  phone: string
  newPassword: string
}

export interface AuthResponse {
  access_token: string  // Changed from success: boolean
  user: User
  message: string
}

export interface ForgotPasswordResponse {
  message: string
  user: {
    employeeCode: string
    firstName: string
    lastName: string
    phone: string
  }
}

export interface LoginResponse {
  access_token: string
  user: User
}

// Office and Department types
export interface Office {
  id: string
  name: string
  type: OfficeType
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  description?: string
  officeId: string
  createdAt: string
  updatedAt: string
  office: Office
}

export interface Position {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface JobPosition {
  id: string
  jobName: string
  code: string
  description?: string
  positionId: string
  departmentId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  position: Position
  department: Department
}

// Common response types
export interface ErrorResponse {
  message: string
  error: string
  statusCode: number
}

// API Service types
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
}
