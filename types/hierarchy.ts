export interface OfficeStats {
  id: string;
  name: string;
  type: string;
  description?: string;
  stats: {
    totalDepartments: number;
    totalUsers: number;
    usersWithReports: number;
    completedReports: number;
    totalTasks: number;
    completedTasks: number;
    reportSubmissionRate: number;
    reportCompletionRate: number;
    taskCompletionRate: number;
    topIncompleteReasons: IncompleteReason[];
  };
}

export interface DepartmentStats {
  id: string;
  name: string;
  description?: string;
  stats: {
    totalUsers: number;
    usersWithReports: number;
    completedReports: number;
    totalTasks: number;
    completedTasks: number;
    reportSubmissionRate: number;
    taskCompletionRate: number;
    topIncompleteReasons: IncompleteReason[];
  };
  jobPositionsBreakdown: JobPositionBreakdown[];
}

export interface JobPositionBreakdown {
  id: string;
  jobName: string;
  positionName: string;
  totalUsers: number;
  usersWithReports: number;
  completedReports: number;
}

export interface UserStats {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone?: string;
  jobPosition: {
    id: string;
    jobName: string;
    positionName: string;
  };
  reportStatus: {
    hasReport: boolean;
    reportId?: string; // Add reportId property
    isCompleted: boolean;
    isLocked: boolean;
    totalTasks: number;
    completedTasks: number;
    workDaysCount: number;
    taskCompletionRate: number;
    incompleteReasons: Array<{
      taskName: string;
      reason: string;
    }>;
  };
}

export interface IncompleteReason {
  reason: string;
  count: number;
  percentage?: number;
  sampleTasks?: string[];
  tasks?: Array<{
    taskName: string;
    userName?: string;
    department?: string;
    office?: string;
  }>;
}

export interface OfficesOverview {
  weekNumber: number;
  year: number;
  offices: OfficeStats[];
  summary: {
    totalOffices: number;
    totalDepartments: number;
    totalUsers: number;
    totalReportsSubmitted: number;
    averageSubmissionRate: number;
  };
}

export interface OfficeDetails {
  office: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
  weekNumber: number;
  year: number;
  departments: DepartmentStats[];
  summary: {
    totalDepartments: number;
    totalUsers: number;
    totalReportsSubmitted: number;
    averageSubmissionRate: number;
  };
}

export interface DepartmentDetails {
  department: {
    id: string;
    name: string;
    description?: string;
    office: {
      id: string;
      name: string;
      type: string;
    };
  };
  weekNumber: number;
  year: number;
  users: UserStats[];
  summary: {
    totalUsers: number;
    usersWithReports: number;
    completedReports: number;
    averageTaskCompletion: number;
  };
}

export interface UserDetails {
  user: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string;
    role: string;
    isActive: boolean;
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
  };
  overallStats: {
    totalReports: number;
    completedReports: number;
    reportCompletionRate: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
  };
  reports: Array<{
    id: string;
    weekNumber: number;
    year: number;
    isCompleted: boolean;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
    stats: {
      totalTasks: number;
      completedTasks: number;
      incompleteTasks: number;
      taskCompletionRate: number;
      tasksByDay: Record<string, number>;
      incompleteReasons: Array<{
        reason: string;
        count: number;
        tasks: string[];
      }>;
    };
    tasks: Array<any>;
  }>;
}

export interface TaskCompletionTrends {
  filters: {
    officeId?: string;
    departmentId?: string;
    weeks: number;
  };
  trends: Array<{
    weekNumber: number;
    year: number;
    totalReports: number;
    completedReports: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    reportCompletionRate: number;
  }>;
  summary: {
    averageTaskCompletion: number;
    averageReportCompletion: number;
  };
}

export interface IncompleteReasonsHierarchy {
  weekNumber: number;
  year: number;
  filters: {
    officeId?: string;
    departmentId?: string;
    weekNumber?: number;
    year?: number;
  };
  totalIncompleteTasks: number;
  totalReports: number;
  reasonsAnalysis: Array<{
    reason: string;
    count: number;
    affectedUsers: number;
    percentage: number;
    sampleTasks: Array<{
      taskName: string;
      userName: string;
      department: string;
      office: string;
    }>;
  }>;
  summary: {
    topReason: string;
    mostAffectedUsers: number;
    diversityIndex: number;
  };
}

export interface HierarchyFilters {
  weekNumber?: number;
  year?: number;
  officeId?: string;
  departmentId?: string;
  limit?: number;
  weeks?: number;
}
