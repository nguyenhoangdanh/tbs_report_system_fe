import { Ranking } from "@/services/report.service"
import { Task } from "."
import { User, WeeklyReport} from "./index"

// Base types
export interface Office {
  id: string
  name: string
  type: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface Department {
  id: string
  name: string
  description?: string
  office?: Office
}

export interface Position {
  id: string
  name: string
  description?: string
}

export interface JobPosition {
  id: string
  jobName: string
  code?: string
  department: Department
}

// ==========================================
// MANAGER REPORTS TYPES - Based on Backend Implementation
// ==========================================

// Backend getManagerReports return type
export interface ManagerReportsResponse {
  manager: User
  weekNumber: number
  year: number
  groupedReports: ManagerReportsPositionGroup[]
  summary: ManagerReportsSummary
}

export interface ManagerReportsPositionGroup {
  position: {
    id: string
    name: string
    level: number
    description?: string
    isManagement: boolean
  }
  jobPositionGroups: Record<string, never> // Empty object from Map conversion
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  jobPositions: ManagerReportsJobPositionGroup[]
}

export interface ManagerReportsJobPositionGroup {
  jobPosition: {
    id: string
    jobName: string
    code: string
    description?: string
    department: {
      id: string
      name: string
      description?: string
      officeId: string
      createdAt?: string
      updatedAt?: string
      office: {
        id: string
        name: string
        type: string
        description?: string
        createdAt?: string
        updatedAt?: string
      }
    }
    position: {
      id: string
      name: string
      description?: string
      level?: number
      priority?: number
      isManagement?: boolean
      isReportable?: boolean
      canViewHierarchy?: boolean
      createdAt?: string
      updatedAt?: string
    }
  }
  employees: ManagerReportsEmployee[]
  stats: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
}

export interface ManagerReportsEmployee {
  user:  User
  stats: {
    hasReport: boolean
    isCompleted: boolean
    totalTasks: number
    completedTasks: number
    incompleteTasks: number
    taskCompletionRate: number
    status: "not_submitted" | "incomplete" | "completed"
  }
}

export interface ManagerReportsSummary {
  totalSubordinates: number
  subordinatesWithReports: number
  subordinatesWithoutReports: number
  subordinatesWithCompletedReports: number
  subordinatesWithIncompleteReports: number
  reportSubmissionRate: number
  totalTasks: number
  totalCompletedTasks: number
  overallTaskCompletionRate: number
  totalPositions: number
  totalJobPositions: number
}

// ==========================================
// EXISTING TYPES (kept for backward compatibility)
// ==========================================

// Report status types
export interface ReportStatus {
  hasReport: boolean
  isCompleted: boolean
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
  workDaysCount?: number
  isLocked?: boolean
  incompleteReasons?: Array<{
    taskName: string
    reason: string
  }>
}

// Stats types
export interface Stats {
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  usersWithoutReports: number
  totalTasks: number
  completedTasks: number
  reportSubmissionRate: number
  reportCompletionRate: number
  taskCompletionRate: number
  topIncompleteReasons?: Array<{ reason: string; count: number }>
  rankingDistribution?: RankingDistribution
  officesCount?: number
  officeNames?: string[]
}

export interface JobPositionStats {
  jobPosition: JobPosition
  stats: Stats
}

export interface PositionStats {
  position: {
    id: string
    name: string
    description?: string
  }
  users: PositionUser[]
  stats: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
    reportSubmissionRate: number
    reportCompletionRate: number
    rankingDistribution: RankingDistribution
    officesCount: number
    officeNames: string[]
  }
}

export interface UserStats {
  user: User
  reportStatus: ReportStatus
}

export interface DepartmentStats {
  id: string
  name: string
  description?: string
  stats: Stats
  jobPositionsBreakdown?: Array<{
    id: string
    jobName: string
    positionName: string
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
  }>
}

// Updated ranking distribution với thang điểm mới
export interface RankingDistribution {
  excellent: { count: number; percentage: number }
  good: { count: number; percentage: number }
  average: { count: number; percentage: number }
  poor: { count: number; percentage: number }
  // fail: { count: number; percentage: number }
}

// Management hierarchy response (Group by Position)
export interface ManagementHierarchyResponse {
  weekNumber: number
  year: number
  viewType: 'management'
  groupBy: 'position'
  positions: Array<{
    position: {
      id: string
      name: string
      level: number
      description?: string
      isManagement: boolean
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      positionRanking: Ranking
      rankingDistribution: RankingDistribution
    }
    userCount: number
    departmentBreakdown: Array<{
      id: string
      name: string
      userCount: number
      usersWithReports: number
    }>
  }>
  summary: {
    totalPositions: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports?: number
    averageSubmissionRate: number
    averageCompletionRate: number
    bestPerformingPosition: any
    needsImprovementCount: number
  }
}

// Staff hierarchy response (Group by JobPosition)
export interface StaffHierarchyResponse {
  weekNumber: number
  year: number
  viewType: 'staff'
  groupBy: 'jobPosition'
  jobPositions: Array<{
    jobPosition: {
      id: string
      jobName: string
      code: string
      description?: string
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
      }
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      positionRanking: Ranking
      rankingDistribution: RankingDistribution
    }
    userCount: number
  }>
  summary: {
    totalJobPositions: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports?: number
    averageSubmissionRate: number
    averageCompletionRate: number
    bestPerformingJobPosition: any
    needsImprovementCount: number
  }
}

// Mixed hierarchy response - KHỚP CHÍNH XÁC VỚI BACKEND
export interface MixedHierarchyResponse {
  weekNumber: number
  year: number
  viewType: 'mixed'
  groupBy: 'mixed'
  positions: Array<{
    position: {
      id: string
      name: string
      level?: number
      description?: string
      isManagement: boolean
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      positionRanking: Ranking
      rankingDistribution: RankingDistribution
    }
    userCount: number
    departmentBreakdown: Array<{
      id: string
      name: string
      userCount: number
      usersWithReports: number
    }>
    users: any[]
  }>
  jobPositions: Array<{
    jobPosition: {
      id: string
      jobName: string
      code: string
      description?: string
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
      }
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      positionRanking: Ranking
      rankingDistribution: RankingDistribution
    }
    userCount: number
    users: any[]
  }>
  summary: {
    totalPositions: number
    totalJobPositions: number
    totalUsers: number
    totalUsersWithReports: number
    averageSubmissionRate: number
    averageCompletionRate: number
    managementSummary: {
      totalPositions: number
      totalUsers: number
      totalUsersWithReports: number
      averageSubmissionRate: number
      averageCompletionRate: number
      bestPerformingPosition: any
      needsImprovementCount: number
    }
    staffSummary: {
      totalJobPositions: number
      totalUsers: number
      totalUsersWithReports: number
      averageSubmissionRate: number
      averageCompletionRate: number
      bestPerformingJobPosition: any
      needsImprovementCount: number
    }
  }
}

// Empty hierarchy response - THÊM TYPE CHO EMPTY RESPONSE
export interface EmptyHierarchyResponse {
  weekNumber: number
  year: number
  viewType: 'empty'
  groupBy: 'none'
  positions: []
  jobPositions: []
  summary: {
    totalPositions: 0
    totalJobPositions: 0
    totalUsers: 0
    totalUsersWithReports: 0
    averageSubmissionRate: 0
    averageCompletionRate: 0
  }
}

// Union type for hierarchy responses - CẬP NHẬT ĐỂ BAO GỒM TẤT CẢ
export type HierarchyResponse = 
  | ManagementHierarchyResponse 
  | StaffHierarchyResponse 
  | MixedHierarchyResponse
  | EmptyHierarchyResponse

// User ranking interface với thang điểm mới
export interface UserRanking {
  rank: Ranking
  label: string
  color: string
  bgColor: string
}

export interface UserReportStatus {
  hasReport: boolean
  isCompleted: boolean
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
}

export interface PositionUser {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  office: Office
  position?: {
      id: string
      name: string
      description?: string
      level?: number
    }
  jobPosition: {
    id: string
    jobName: string
    department: {
      id: string
      name: string
      office: {
        id: string
        name: string
      }
    }
  }
  stats: UserReportStatus
}

// Response types
export interface PositionOverviewResponse {
  weekNumber: number
  year: number
  groupBy: 'position' | 'mixed'
  positions?: PositionStats[]
  data?: Array<{
    type: 'position' | 'jobPosition'
    position?: {
      id: string
      name: string
      description?: string
      level?: number
    }
    jobPosition?: {
      id: string
      jobName: string
      department: string
      office: string
    }
    users: PositionUser[]
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      reportSubmissionRate: number
      reportCompletionRate: number
      rankingDistribution: RankingDistribution
      officesCount?: number
      officeNames?: string[]
    }
  }>
  summary: {
    totalPositions: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports: number
    totalUsersWithoutReports: number
    averageSubmissionRate: number
    averageCompletionRate: number
    rankingDistribution: RankingDistribution
  }
}

export interface PositionDetailsResponse {
  position: {
    id: string
    name: string
    description?: string
  }
  weekNumber: number
  year: number
  groupBy: 'user'
  users: PositionUser[]
  summary: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    averageTaskCompletion: number
  }
}

export interface OfficeDetailsResponse {
  office: Office
  weekNumber: number
  year: number
  departments: DepartmentStats[]
  summary: {
    totalDepartments: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports: number
    totalUsersWithoutReports: number
    averageSubmissionRate: number
    averageCompletionRate: number
    rankingDistribution: RankingDistribution
  }
}

export interface DepartmentDetailsResponse {
  department: Department & { office: Office }
  weekNumber: number
  year: number
  users: UserStats[]
  summary: {
    totalUsers: number
    usersWithReports: number
    completedReports: number
    averageTaskCompletion: number
    rankingDistribution: RankingDistribution
  }
}

export interface UserDetailsResponse {
  user: User
  overallStats: {
    totalReports: number
    completedReports: number
    reportCompletionRate: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
  reports: WeeklyReport[]
  // reports: Array<{
  //   id: string
  //   weekNumber: number
  //   year: number
  //   isCompleted: boolean
  //   isLocked: boolean
  //   createdAt: string
  //   updatedAt: string
  //   stats: {
  //     totalTasks: number
  //     completedTasks: number
  //     incompleteTasks: number
  //     taskCompletionRate: number
  //     tasksByDay: {
  //       monday: number
  //       tuesday: number
  //       wednesday: number
  //       thursday: number
  //       friday: number
  //       saturday: number
  //     }
  //     incompleteReasons: Array<{
  //       reason: string
  //       count: number
  //       tasks: string[]
  //     }>
  //   }
  //   tasks: Task[]
  // }>
}

// Helper function để tính ranking từ completion rate
// export function calculateUserRanking(completionRate: number): UserRanking {
//   if (completionRate >= 100) {
//     return {
//       rank: 'EXCELLENT',
//       label: 'Xuất sắc',
//       color: '#22c55e',
//       bgColor: '#f0fdf4'
//     }
//   } else if (completionRate >= 95) {
//     return {
//       rank: 'GOOD',
//       label: 'Tốt',
//       color: '#3b82f6',
//       bgColor: '#eff6ff'
//     }
//   } else if (completionRate >= 90) {
//     return {
//       rank: 'AVERAGE',
//       label: 'Trung bình',
//       color: '#f59e0b',
//       bgColor: '#fffbeb'
//     }
//   } else if (completionRate >= 85) {
//     return {
//       rank: 'POOR',
//       label: 'Yếu',
//       color: '#f97316',
//       bgColor: '#fff7ed'
//     }
//   }
//   // else {
//   //   return {
//   //     rank: 'FAIL',
//   //     label: 'Kém',
//   //     color: '#ef4444',
//   //     bgColor: '#fef2f2'
//   //   }
//   // }
// }

// Normalize ranking distribution để đảm bảo có đầy đủ properties
export function normalizeRankingDistribution(
  distribution?: Partial<RankingDistribution>
): RankingDistribution {
  const defaultRankItem = { count: 0, percentage: 0 }
  
  return {
    excellent: distribution?.excellent || defaultRankItem,
    good: distribution?.good || defaultRankItem,
    average: distribution?.average || defaultRankItem,
    poor: distribution?.poor || defaultRankItem,
    // fail: distribution?.fail || defaultRankItem,
  }
}

// Week filters
export interface WeekFilters {
  weekNumber?: number
  year?: number
}

// Hierarchy list params
export interface HierarchyListParams {
  officeId?: string
  departmentId?: string
  weekNumber?: number
  year?: number
  page?: number
  limit?: number
}

// Task completion trends
export interface TaskCompletionTrendsResponse {
  filters: {
    officeId?: string
    departmentId?: string
    weeks: number
  }
  trends: Array<{
    weekNumber: number
    year: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }>
  summary: {
    averageTaskCompletion: number
    totalCompletedTasks: number
    totalTasks: number
  }
}

// Incomplete reasons response
export interface IncompleteReasonsResponse {
  weekNumber: number
  year: number
  totalReports: number
  totalIncompleteTasks: number
  reasonsAnalysis: Array<{
    reason: string
    count: number
    users: number
    percentage: number
    sampleTasks: Array<{
      taskName: string
      userName: string
      department: string
      office: string
    }>
  }>
  summary: {
    totalIncompleteTasks: number
    diversityIndex: number
  }
}

// Employees reporting status
export interface EmployeesReportingStatusResponse {
  weekNumber: number
  year: number
  employees: Array<{
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    role: string
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
    }
    status: 'not_submitted' | 'incomplete' | 'completed'
    reportDetails?: {
      id: string
      createdAt: string
      updatedAt: string
      totalTasks: number
      completedTasks: number
      incompleteTasks?: number
      completionRate?: number
    }
    lastReportDate?: string | null
    daysOverdue?: number
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalActiveUsers: number
    usersWithReports: number
    usersWithoutReports: number
  }
}

// Type for department breakdown in summary
export interface SubordinateDepartmentBreakdown {
  id: string
  name: string
  totalSubordinates: number
  subordinatesWithReports: number
  subordinatesWithCompletedReports: number
  totalTasks: number
  completedTasks: number
}

// Type for subordinate stats
export interface SubordinateStats {
  hasReport: boolean
  isCompleted: boolean
  totalTasks: number
  completedTasks: number
  incompleteTasks: number
  taskCompletionRate: number
  status: 'not_submitted' | 'incomplete' | 'completed' | 'all'
}

// Type for subordinate item
export interface SubordinateItem {
  user: User & { fullName: string }
  report: any | null
  stats: SubordinateStats
}

// Type for summary
export interface SubordinatesSummary {
  totalSubordinates: number
  subordinatesWithReports: number
  subordinatesWithoutReports: number
  subordinatesWithCompletedReports: number
  subordinatesWithIncompleteReports: number
  reportSubmissionRate: number
  totalTasks: number
  totalCompletedTasks: number
  overallTaskCompletionRate: number
  departmentBreakdown: SubordinateDepartmentBreakdown[]
}

// Main type for manager-subordinates hierarchy
export interface ManagerSubordinatesHierarchy {
  manager: User & { fullName: string }
  weekNumber: number
  year: number
  subordinates: SubordinateItem[]
  summary: SubordinatesSummary
}
