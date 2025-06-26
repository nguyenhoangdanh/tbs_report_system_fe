export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  OFFICE_MANAGER = 'OFFICE_MANAGER',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum OfficeType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  FACTORY_OFFICE = 'FACTORY_OFFICE',
}

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER' | 'OFFICE_MANAGER' | 'OFFICE_ADMIN'

export interface User {
  id: string
  employeeCode: string
  email?: string
  firstName: string
  lastName: string
  cardId?: string
  role: Role
  jobPositionId: string
  isActive: boolean
  officeId: string
  createdAt: string
  updatedAt: string
  office: Office
  jobPosition: JobPosition
}
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

export interface WeeklyReport {
  id: string
  weekNumber: number
  year: number
  isLocked: boolean
  tasks: TaskReport[]
  createdAt: string
  updatedAt: string
  user: User
}

export interface TaskReport {
  id: string
  taskName: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  isCompleted: boolean
  reasonNotDone?: string
  reportId: string
}

// Auth DTOs
export interface LoginDto {
  employeeCode: string
  password: string
}

export interface RegisterDto {
  employeeCode: string
  email?: string
  password: string
  firstName: string
  lastName: string
  cardId?: string
  jobPositionId: string
  officeId: string
  role: Role
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordDto {
  employeeCode: string
  cardId: string
}

export interface ResetPasswordDto {
  employeeCode: string
  cardId: string
  newPassword: string
}

export interface ForgotPasswordResponse {
  message: string
  user: {
    employeeCode: string
    firstName: string
    lastName: string
    email?: string
  }
}

export interface UpdateProfileDto {
  employeeCode?: string
  firstName?: string
  lastName?: string
  email?: string
  cardId?: string
  jobPositionId?: string
  officeId?: string
  role?: UserRole
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
}

// Report DTOs
export interface CreateWeeklyReportDto {
  weekNumber: number
  year: number
  tasks: CreateTaskReportDto[]
}

export interface CreateTaskReportDto {
  taskName: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  sunday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}

// Fix: UpdateTaskReportDto should be for updating entire report with tasks array
export interface UpdateTaskReportDto {
  tasks: UpdateTaskDto[]
}

// Single task update DTO
export interface UpdateTaskDto {
  id?: string // Optional for new tasks
  taskName: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  sunday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}

// Individual task update (for single task operations)
export interface UpdateSingleTaskDto {
  taskName?: string
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  sunday?: boolean
  isCompleted?: boolean
  reasonNotDone?: string
}

// Auth related types
export interface AuthResponse {
  success: boolean
  user: User
  message: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
