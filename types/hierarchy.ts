// Base hierarchy types
export interface HierarchyView {
  weekNumber: number
  year: number
}

// Add the missing HierarchyFilters interface
export interface HierarchyFilters {
  weekNumber?: number
  year?: number
  officeId?: string
  departmentId?: string
  limit?: number
  weeks?: number
  page?: number
}

export interface OfficeStats {
  totalDepartments: number
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  usersWithoutReports: number
  totalTasks: number
  completedTasks: number
  reportSubmissionRate: number
  reportCompletionRate: number
  taskCompletionRate: number
  topIncompleteReasons: Array<{
    reason: string
    count: number
  }>
  // Add the missing property that components are trying to access
  completedReports: number
}

export interface Office {
  id: string
  name: string
  type: string
  description?: string
  stats: OfficeStats
}

export interface OfficesOverviewSummary {
  totalOffices: number
  totalDepartments: number
  totalUsers: number
  totalUsersWithReports: number
  totalUsersWithCompletedReports: number
  totalUsersWithoutReports: number
  averageSubmissionRate: number
  averageCompletionRate: number
  // Add the missing property that components are trying to access
  totalReportsSubmitted: number
}

export interface OfficesOverviewResponse {
  weekNumber: number
  year: number
  offices: Office[]
  summary: OfficesOverviewSummary
}

export interface DepartmentStats {
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  usersWithoutReports: number
  totalTasks: number
  completedTasks: number
  reportSubmissionRate: number
  reportCompletionRate: number
  taskCompletionRate: number
  topIncompleteReasons: Array<{
    reason: string
    count: number
  }>
}

export interface Department {
  id: string
  name: string
  description?: string
  stats: DepartmentStats
  jobPositionsBreakdown: Array<{
    id: string
    jobName: string
    positionName: string
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
  }>
}

export interface OfficeDetailsResponse {
  office: {
    id: string
    name: string
    type: string
    description?: string
  }
  weekNumber: number
  year: number
  departments: Department[]
  summary: {
    totalDepartments: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports: number
    totalUsersWithoutReports: number
    averageSubmissionRate: number
    averageCompletionRate: number
  }
}

export interface UserReportStatus {
  hasReport: boolean
  reportId?: string
  isCompleted: boolean
  isLocked: boolean
  totalTasks: number
  completedTasks: number
  workDaysCount: number
  taskCompletionRate: number
  incompleteReasons: Array<{
    taskName: string
    reason: string
  }>
}

export interface UserInDepartment {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  jobPosition: {
    id: string
    jobName: string
    positionName: string
  }
  reportStatus: UserReportStatus
}

export interface DepartmentDetailsResponse extends HierarchyView {
  department: {
    id: string
    name: string
    description?: string
    office: {
      id: string
      name: string
      type: string
    }
  }
  users: UserInDepartment[]
  summary: {
    totalUsers: number
    usersWithReports: number
    completedReports: number
    averageTaskCompletion: number
    // Add ranking distribution for better performance tracking
    rankingDistribution?: {
      excellent: { count: number; percentage: number }
      good: { count: number; percentage: number }
      average: { count: number; percentage: number }
      poor: { count: number; percentage: number }
      fail: { count: number; percentage: number }
    }
  }
}

export interface UserDetails {
  user: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    email?: string
    role: string
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
    }
  }
  overallStats: {
    totalReports: number
    completedReports: number
    reportCompletionRate: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
  reports: Array<{
    id: string
    weekNumber: number
    year: number
    isCompleted: boolean
    isLocked: boolean
    createdAt: string
    updatedAt: string
    stats: {
      totalTasks: number
      completedTasks: number
      incompleteTasks: number
      taskCompletionRate: number
      tasksByDay: Record<string, number>
      incompleteReasons: Array<{
        reason: string
        count: number
        tasks: string[]
      }>
    }
    tasks: Array<any>
  }>
}

// Task completion trends
export interface TaskCompletionTrends {
  filters: {
    officeId?: string
    departmentId?: string
    weeks: number
  }
  trends: Array<{
    weekNumber: number
    year: number
    totalReports: number
    completedReports: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
    reportCompletionRate: number
  }>
  summary: {
    averageTaskCompletion: number
    averageReportCompletion: number
  }
}

// Incomplete reasons analysis
export interface IncompleteReasonsHierarchy {
  weekNumber: number
  year: number
  filters: {
    officeId?: string
    departmentId?: string
  }
  totalIncompleteTasks: number
  totalReports: number
  reasonsAnalysis: Array<{
    reason: string
    count: number
    affectedUsers: number
    percentage: number
    sampleTasks: Array<{
      taskName: string
      userName: string
      department: string
      office: string
    }>
  }>
  summary: {
    topReason: string
    mostAffectedUsers: number
    diversityIndex: number
  }
}

export interface EmployeesWithoutReportsResponse {
  weekNumber: number;
  year: number;
  employees: Array<{
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    office: {
      id: string;
      name: string;
      type: string;
    };
    jobPosition: {
      id: string;
      jobName: string;
      positionName: string;
      department: {
        id: string;
        name: string;
        office: {
          name: string;
        };
      };
    };
    lastReportDate?: string;
    daysOverdue: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalActiveUsers: number;
    usersWithReports: number;
    usersWithoutReports: number;
    submissionRate: number;
    missingRate?: number;
  };
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    officeName: string;
    totalUsers: number;
    usersWithoutReports: number;
    missingRate: number;
  }>;
}

export interface EmployeesWithIncompleteReportsResponse {
  weekNumber: number;
  year: number;
  employees: Array<{
    reportId: string;
    employee: {
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email?: string;
      phone?: string;
      role: string;
      office: {
        id: string;
        name: string;
        type: string;
      };
      jobPosition: {
        id: string;
        jobName: string;
        positionName: string;
        department: {
          id: string;
          name: string;
          office: {
            name: string;
          };
        };
      };
    };
    reportDetails: {
      createdAt: string;
      updatedAt: string;
      isLocked: boolean;
      totalTasks: number;
      completedTasks: number;
      incompleteTasks: number;
      completionRate: number;
      topIncompleteReasons: Array<{
        reason: string;
        count: number;
      }>;
    };
    daysOverdue: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncompleteReports: number;
  };
}

export interface EmployeesReportingStatusResponse {
  weekNumber: number;
  year: number;
  employees: Array<{
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    office: {
      id: string;
      name: string;
      type: string;
    };
    jobPosition: {
      id: string;
      jobName: string;
      positionName: string;
      department: {
        id: string;
        name: string;
        office: {
          id: string;
          name: string;
        };
      };
    };
    status: 'not_submitted' | 'incomplete' | 'completed';
    reportDetails: {
      reportId: string;
      createdAt: string;
      updatedAt: string;
      totalTasks: number;
      completedTasks: number;
      incompleteTasks?: number;
      completionRate?: number;
    } | null;
    daysOverdue: number | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalEmployees: number;
    notSubmitted: number;
    incomplete: number;
    completed: number;
    submissionRate: number;
    completionRate: number;
  };
  filters: {
    weekNumber: number;
    year: number;
    status?: string;
    officeId?: string;
    departmentId?: string;
  };
}

export interface EmployeeReportingFilters {
  weekNumber?: number;
  year?: number;
  officeId?: string;
  departmentId?: string;
  status?: 'not_submitted' | 'incomplete' | 'completed' | 'all';
  page?: number;
  limit?: number;
}
