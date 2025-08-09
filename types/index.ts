import { EmployeeWithoutReport } from "./statistics"

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
  avatar?: string  // ✅ Add avatar field
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
    description?: string
    department: {
      id: string
      name: string
      description?: string
      office: {
        id: string
        name: string
        description: string
      }
    }
    position: {
      id: string
      name: string
      description?: string
    }
  }
  stats: {
      hasReport: boolean
      isCompleted: boolean
      totalTasks: number
      completedTasks: number
      taskCompletionRate: number
    }
  isManager: boolean
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
  avatar?: string  | null // Allow null for removing avatar
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
  evaluations?: TaskEvaluation[]
}

export enum EvaluationType {
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
}

// Task Evaluation types
export interface CreateEvaluationDto {
  taskId: string
  evaluatedIsCompleted: boolean
  evaluatedReasonNotDone?: string
  evaluatorComment?: string
  evaluationType: EvaluationType
}

export interface UpdateEvaluationDto {
  evaluatedIsCompleted?: boolean
  evaluatedReasonNotDone?: string
  evaluatorComment?: string
  evaluationType?: EvaluationType
}

export interface TaskEvaluation {
  id: string
  taskId: string
  evaluatorId: string
  originalIsCompleted: boolean
  evaluatedIsCompleted: boolean
  originalReasonNotDone?: string
  evaluatedReasonNotDone?: string
  evaluatorComment?: string
  evaluationType: EvaluationType
  createdAt: string
  updatedAt: string
  task?: Task
  evaluator?: User
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
  evaluations: TaskEvaluation[]
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
  id: string
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
  refresh_token: string| null
  user: User | null // Allow user to be null
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

export interface JobPositionGroup {
  jobPosition: JobPosition
  employees: EmployeeWithoutReport[]
  stats: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
}

export interface PositionGroup {
  position: Position
  jobPositionGroups: Record<string, any>
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  jobPositions: JobPositionGroup[]
}



export interface ManagerOverviewResponse {
  manager: User
  weekNumber: number
  year: number
  groupedReports: PositionGroup[]
  summary: {
    totalSubordinates: number
    subordinatesWithReports: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
}

// Transformed types for UI compatibility
export interface SubordinateInfo {
  user: User
  stats: {
    status: "completed" | "incomplete" | "not_submitted"
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
  report?: WeeklyReport
  tasks?: Task[]
}

export interface DepartmentBreakdown {
  id: string
  name: string
  totalSubordinates: number
  subordinatesWithReports: number
  subordinatesWithCompletedReports: number
  completedTasks: number
  totalTasks: number
}

export interface TransformedManagerOverview {
  manager: User
  summary: {
    totalPositions?: number
    totalJobPositions?: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports?: number
    totalUsersWithoutReports?: number
    averageSubmissionRate: number
    averageCompletionRate: number
    departmentBreakdown: DepartmentBreakdown[]
    managementSummary?: any
    staffSummary?: any
  }
  subordinates: SubordinateInfo[]
  weekNumber: number
  year: number
}
