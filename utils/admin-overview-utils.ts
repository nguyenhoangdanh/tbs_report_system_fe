import type { ManagerReportsEmployee, ManagerReportsResponse } from '@/types/hierarchy'

// Transform ManagerReports data to format tương tự HierarchyDashboard
export function transformManagerReportsToHierarchyFormat(overview: ManagerReportsResponse) {
  if (!overview?.groupedReports) return { managementPositions: [], jobPositions: [] }
  
  const managementPositions: any[] = []
  const jobPositions: any[] = []
  
  overview.groupedReports.forEach((positionGroup, positionIndex) => {
    // Check if this is management position
    const isManagement = positionGroup.position?.isManagement || 
      positionGroup.position?.name?.toLowerCase().includes("trưởng") ||
      positionGroup.position?.name?.toLowerCase().includes("giám đốc") ||
      positionGroup.position?.name?.toLowerCase().includes("phó")
    
    if (isManagement) {
      // Group all job positions under this management position
      const allEmployees = positionGroup.jobPositions.flatMap(jp => jp.employees)
      
      // Calculate aggregated stats for management position
      const totalUsers = allEmployees.length
      const usersWithReports = allEmployees.filter(emp => emp.stats.hasReport).length
      const usersWithCompletedReports = allEmployees.filter(emp => emp.stats.isCompleted).length
      const usersWithoutReports = totalUsers - usersWithReports
      const submissionRate = totalUsers > 0 ? Math.round((usersWithReports / totalUsers) * 100) : 0
      
      const totalTasks = allEmployees.reduce((sum, emp) => sum + emp.stats.totalTasks, 0)
      const completedTasks = allEmployees.reduce((sum, emp) => sum + emp.stats.completedTasks, 0)
      const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Calculate ranking distribution
      const rankingDistribution = {
        excellent: { count: 0, percentage: 0 },
        good: { count: 0, percentage: 0 },
        average: { count: 0, percentage: 0 },
        poor: { count: 0, percentage: 0 },
        fail: { count: 0, percentage: 0 },
      }
      
      allEmployees.forEach((emp) => {
        const rate = emp.stats.taskCompletionRate
        if (rate === 100) rankingDistribution.excellent.count++
        else if (rate >= 95) rankingDistribution.good.count++
        else if (rate >= 90) rankingDistribution.average.count++
        else if (rate >= 85) rankingDistribution.poor.count++
        else rankingDistribution.fail.count++
      })
      
      // Convert percentages
      Object.keys(rankingDistribution).forEach(key => {
        const item = rankingDistribution[key as keyof typeof rankingDistribution]
        item.percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
      })
      
      // CRITICAL FIX: Transform ALL users to compatible format - không bỏ sót ai
      const transformedUsers = allEmployees.map((emp) => ({
        id: emp.user.id,
        employeeCode: emp.user.employeeCode,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        fullName: `${emp.user.firstName} ${emp.user.lastName}`,
        email: emp.user.email,
        office: {
          id: emp.user.office?.id || '',
          name: emp.user.office?.name || '',
          type: emp.user.office?.type || '',
        },
        jobPosition: {
          id: emp.user.jobPosition?.id || '',
          jobName: emp.user.jobPosition?.jobName || '',
          department: {
            id: emp.user.jobPosition?.department?.id || '',
            name: emp.user.jobPosition?.department?.name || '',
            office: emp.user.jobPosition?.department?.office,
          },
        },
        position: {
          id: emp.user.jobPosition?.position?.id || '',
          name: emp.user.jobPosition?.position?.name || '',
          description: emp.user.jobPosition?.position?.description || '',
        },
        stats: {
          hasReport: emp.stats.hasReport,
          isCompleted: emp.stats.isCompleted,
          totalTasks: emp.stats.totalTasks,
          completedTasks: emp.stats.completedTasks,
          taskCompletionRate: emp.stats.taskCompletionRate,
        },
      }))
      
      managementPositions.push({
        position: {
          id: positionGroup.position?.id || `mgmt-${positionIndex}`,
          name: positionGroup.position?.name || 'Vị trí quản lý',
          level: positionGroup.position?.level || 1,
          description: positionGroup.position?.description || '',
          isManagement: true,
        },
        stats: {
          totalUsers,
          usersWithReports,
          usersWithCompletedReports,
          usersWithoutReports,
          submissionRate,
          totalTasks,
          completedTasks,
          averageCompletionRate,
          rankingDistribution,
          users: transformedUsers, // CRITICAL: Add users to stats
        },
        userCount: totalUsers,
        users: transformedUsers, // CRITICAL: Ensure users are at root level too
      })
    } else {
      // Handle as job positions (non-management)
      positionGroup.jobPositions.forEach((jobPositionGroup, jobIndex) => {
        const employees = jobPositionGroup.employees
        const totalUsers = employees.length
        const usersWithReports = employees.filter(emp => emp.stats.hasReport).length
        const usersWithCompletedReports = employees.filter(emp => emp.stats.isCompleted).length
        const usersWithoutReports = totalUsers - usersWithReports
        const submissionRate = totalUsers > 0 ? Math.round((usersWithReports / totalUsers) * 100) : 0
        
        const totalTasks = employees.reduce((sum, emp) => sum + emp.stats.totalTasks, 0)
        const completedTasks = employees.reduce((sum, emp) => sum + emp.stats.completedTasks, 0)
        const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        
        // Calculate ranking distribution
        const rankingDistribution = {
          excellent: { count: 0, percentage: 0 },
          good: { count: 0, percentage: 0 },
          average: { count: 0, percentage: 0 },
          poor: { count: 0, percentage: 0 },
          fail: { count: 0, percentage: 0 },
        }
        
        employees.forEach((emp) => {
          const rate = emp.stats.taskCompletionRate
          if (rate === 100) rankingDistribution.excellent.count++
          else if (rate >= 95) rankingDistribution.good.count++
          else if (rate >= 90) rankingDistribution.average.count++
          else if (rate >= 85) rankingDistribution.poor.count++
          else rankingDistribution.fail.count++
        })
        
        // Convert percentages
        Object.keys(rankingDistribution).forEach(key => {
          const item = rankingDistribution[key as keyof typeof rankingDistribution]
          item.percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
        })
        
        // CRITICAL FIX: Transform ALL users - không bỏ sót ai
        const transformedUsers = employees.map((emp) => ({
          id: emp.user.id,
          employeeCode: emp.user.employeeCode,
          firstName: emp.user.firstName,
          lastName: emp.user.lastName,
          fullName: `${emp.user.firstName} ${emp.user.lastName}`,
          email: emp.user.email,
          office: {
            id: emp.user.office?.id || '',
            name: emp.user.office?.name || '',
            type: emp.user.office?.type || '',
          },
          jobPosition: {
            id: emp.user.jobPosition?.id || '',
            jobName: emp.user.jobPosition?.jobName || '',
            department: {
              id: emp.user.jobPosition?.department?.id || '',
              name: emp.user.jobPosition?.department?.name || '',
              office: emp.user.jobPosition?.department?.office,
            },
          },
          position: {
            id: emp.user.jobPosition?.position?.id || '',
            name: emp.user.jobPosition?.position?.name || '',
            description: emp.user.jobPosition?.position?.description || '',
          },
          stats: {
            hasReport: emp.stats.hasReport,
            isCompleted: emp.stats.isCompleted,
            totalTasks: emp.stats.totalTasks,
            completedTasks: emp.stats.completedTasks,
            taskCompletionRate: emp.stats.taskCompletionRate,
          },
        }))
        
        // CRITICAL FIX: Use unique key for job positions
        const uniqueKey = `${positionGroup.position?.id || positionIndex}-${jobPositionGroup.jobPosition?.id || jobIndex}`
        
        jobPositions.push({
          jobPosition: {
            id: jobPositionGroup.jobPosition?.id || `job-${positionIndex}-${jobIndex}`,
            jobName: jobPositionGroup.jobPosition?.jobName || '',
            code: jobPositionGroup.jobPosition?.code || '',
            department: {
              id: jobPositionGroup.jobPosition?.department?.id || '',
              name: jobPositionGroup.jobPosition?.department?.name || '',
              office: jobPositionGroup.jobPosition?.department?.office,
            },
            position: {
              id: jobPositionGroup.jobPosition?.position?.id || '',
              name: jobPositionGroup.jobPosition?.position?.name || '',
            },
          },
          position: {
            id: uniqueKey, // CRITICAL FIX: Use unique key
            name: positionGroup.position?.name || '',
            description: positionGroup.position?.description || '',
            isManagement: false,
          },
          stats: {
            totalUsers,
            usersWithReports,
            usersWithCompletedReports,
            usersWithoutReports,
            submissionRate,
            totalTasks,
            completedTasks,
            averageCompletionRate,
            rankingDistribution,
            users: transformedUsers, // CRITICAL: Add users to stats
          },
          userCount: totalUsers,
          users: transformedUsers, // CRITICAL: Ensure users are at root level too
          _uniqueKey: uniqueKey, // Add unique identifier for debugging
        })
      })
    }
  })
  
  return { managementPositions, jobPositions }
}

// Group management positions by level and name (similar to HierarchyDashboard)
export function groupManagementPositions(managementPositions: any[]) {
  const managementByLevelAndPosition = new Map<string, { positions: any[]; level: number }>()

  managementPositions.forEach((pos) => {
    const level = pos.position?.level || 10
    const positionName = pos.position?.description || pos.position?.name || "Vị trí quản lý"
    const key = `${level}-${positionName}`

    if (!managementByLevelAndPosition.has(key)) {
      managementByLevelAndPosition.set(key, {
        positions: [],
        level: level,
      })
    }
    managementByLevelAndPosition.get(key)!.positions.push(pos)
  })

  return Array.from(managementByLevelAndPosition.entries())
    .sort(([keyA, dataA], [keyB, dataB]) => {
      if (dataA.level !== dataB.level) {
        return dataA.level - dataB.level
      }
      const nameA = keyA.split("-").slice(1).join("-")
      const nameB = keyB.split("-").slice(1).join("-")
      return nameA.localeCompare(nameB)
    })
    .map(([key, data]) => {
      const positionName = key.split("-").slice(1).join("-")
      const level = data.level

      return {
        id: `position-level-${level}-${positionName.toLowerCase().replace(/\s+/g, "-")}`,
        label: positionName,
        level,
        positions: data.positions,
        isManagement: true,
      }
    })
}
