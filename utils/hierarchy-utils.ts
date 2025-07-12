import { useMemo } from 'react'

export interface PositionStats {
  totalUsers: number
  usersWithReports: number
  usersWithCompletedReports: number
  usersWithoutReports: number
  submissionRate: number
  totalTasks: number
  completedTasks: number
  averageCompletionRate: number
  needsImprovementCount: number
  positionRanking?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR"
  rankingDistribution?: any
  users: any[]
}

export interface PositionData {
  position?: {
    id: string
    name: string
    level?: number
    description?: string
    isManagement?: boolean
  }
  jobPosition?: {
    id: string
    jobName: string
    code?: string
    description?: string
    department?: {
      id: string
      name: string
      office?: {
        id: string
        name: string
      }
    }
    position?: {
      id: string
      name: string
    }
  }
  stats: PositionStats
  userCount: number
  departmentBreakdown?: Array<{
    id: string
    name: string
    userCount: number
    usersWithReports: number
  }>
  users?: Array<{
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName?: string
    email: string
    office: {
      id: string
      name: string
      type?: string
    }
    jobPosition: {
      id: string
      jobName: string
      department: {
        id: string
        name: string
        office?: {
          id: string
          name: string
        }
      }
    }
    stats: {
      hasReport: boolean
      isCompleted: boolean
      totalTasks: number
      completedTasks: number
      taskCompletionRate: number
    }
  }>
}

export const useUserPermissions = (userRole?: string) => {
  return useMemo(() => {
    if (!userRole) return {
      canViewPositions: false,
      canViewJobPositions: false,
      canViewRanking: false,
      userLevel: 'NONE',
      viewScope: 'NONE'
    }

    const isSuperAdmin = userRole === 'SUPERADMIN'
    const isAdmin = userRole === 'ADMIN'
    const isUser = userRole === 'USER'

    if (isSuperAdmin || isAdmin) {
      return {
        canViewPositions: true,
        canViewJobPositions: true,
        canViewRanking: true,
        userLevel: 'ADMIN',
        viewScope: 'ALL',
        excludeFromStats: true
      }
    }

    if (isUser) {
      return {
        canViewPositions: true,
        canViewJobPositions: true,
        canViewRanking: true,
        userLevel: 'USER',
        viewScope: 'DEPARTMENT_OR_SAME_LEVEL',
        excludeFromStats: false
      }
    }

    return {
      canViewPositions: false,
      canViewJobPositions: false,
      canViewRanking: false,
      userLevel: 'NONE',
      viewScope: 'NONE'
    }
  }, [userRole])
}

export const useHierarchyData = (hierarchyData: any, userPermissions: any) => {
  return useMemo(() => {
    if (!hierarchyData) {
      return { positions: [], jobPositions: [], summary: null }
    }

    let positions: PositionData[] = []
    let jobPositions: PositionData[] = []

    const transformPositionData = (item: any): PositionData => {
      return {
        ...item,
        stats: {
          ...item.stats,
          needsImprovementCount: item.stats.needsImprovementCount || 0,
          users: item.users || []
        },
        users: item.users || []
      }
    }

    if (hierarchyData.viewType === 'mixed' && hierarchyData.groupBy === 'mixed') {
      if (userPermissions.canViewPositions && Array.isArray(hierarchyData.positions)) {
        positions = hierarchyData.positions.map(transformPositionData)
      }

      if (userPermissions.canViewJobPositions && Array.isArray(hierarchyData.jobPositions)) {
        jobPositions = hierarchyData.jobPositions.map(transformPositionData)
      }

      return {
        positions,
        jobPositions,
        summary: hierarchyData.summary
      }
    }

    else if (hierarchyData.viewType === 'management' && hierarchyData.groupBy === 'position') {
      if (userPermissions.canViewPositions && Array.isArray(hierarchyData.positions)) {
        positions = hierarchyData.positions.map(transformPositionData)
      }

      return {
        positions,
        jobPositions: [],
        summary: hierarchyData.summary
      }
    }

    else if (hierarchyData.viewType === 'staff' && hierarchyData.groupBy === 'jobPosition') {
      if (userPermissions.canViewJobPositions && Array.isArray(hierarchyData.jobPositions)) {
        jobPositions = hierarchyData.jobPositions.map(transformPositionData)
      }

      return {
        positions: [],
        jobPositions,
        summary: hierarchyData.summary
      }
    }

    else if (hierarchyData.viewType === 'empty') {
      return {
        positions: [],
        jobPositions: [],
        summary: hierarchyData.summary || {
          totalPositions: 0,
          totalJobPositions: 0,
          totalUsers: 0,
          totalUsersWithReports: 0,
          averageSubmissionRate: 0,
          averageCompletionRate: 0
        }
      }
    }

    else {
      return {
        positions: [],
        jobPositions: [],
        summary: hierarchyData.summary || null
      }
    }
  }, [hierarchyData, userPermissions])
}
