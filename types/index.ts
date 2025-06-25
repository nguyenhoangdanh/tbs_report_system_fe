 export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER' | 'OFFICE_MANAGER' | 'OFFICE_ADMIN'

export interface User {
  id: string
  employeeCode: string
  email?: string // Optional
  firstName: string
  lastName: string
  fullName?: string // Computed property from backend
  cardId?: string // Optional CCCD
  role: UserRole 
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
  type: 'HEAD_OFFICE' | 'FACTORY_OFFICE'
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
  department: Department
  position: Position
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
  jobPositionId: string // JobPosition đã chứa departmentId
  officeId: string
  role: UserRole
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

export interface UpdateTaskReportDto {
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

// API Response Types
export interface AuthResponse {
  user: User
  message: string
}

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
