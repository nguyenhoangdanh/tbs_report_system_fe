import type { ManagerReportsEmployee, ManagerReportsResponse } from '@/types/hierarchy'

// Transform ManagerReports data to PositionCard compatible format - KHÔI PHỤC LOGIC CŨ
export function transformManagerReportsToPositions(overview: ManagerReportsResponse) {
  if (!overview?.groupedReports) return []
  
  const positions: any[] = []
  
  overview.groupedReports.forEach((positionGroup, positionIndex) => {
    positionGroup.jobPositions.forEach((jobPositionGroup, jobIndex) => {
      const allEmployees = jobPositionGroup.employees || []
      
      // Calculate stats for this position
      const totalUsers = allEmployees.length
      const usersWithReports = allEmployees.filter((emp: ManagerReportsEmployee) => emp.stats.hasReport).length
      const usersWithCompletedReports = allEmployees.filter((emp: ManagerReportsEmployee) => emp.stats.isCompleted).length
      const usersWithoutReports = totalUsers - usersWithReports
      const submissionRate = totalUsers > 0 ? Math.round((usersWithReports / totalUsers) * 100) : 0
      
      const totalTasks = allEmployees.reduce((sum: number, emp: ManagerReportsEmployee) => sum + emp.stats.totalTasks, 0)
      const completedTasks = allEmployees.reduce((sum: number, emp: ManagerReportsEmployee) => sum + emp.stats.completedTasks, 0)
      const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Calculate ranking distribution
      const rankingDistribution = {
        excellent: { count: 0, percentage: 0 },
        good: { count: 0, percentage: 0 },
        average: { count: 0, percentage: 0 },
        poor: { count: 0, percentage: 0 },
        fail: { count: 0, percentage: 0 },
      }
      
      allEmployees.forEach((emp: ManagerReportsEmployee) => {
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
      
      // CRITICAL: Transform users to PositionUsersTable format - ĐẢM BẢO TẤT CẢ USERS
      const transformedUsers = allEmployees.map((emp: ManagerReportsEmployee) => ({
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
      
      // CRITICAL: Use unique key to prevent duplicate keys
      const uniqueId = `${positionGroup.position?.id || `pos-${positionIndex}`}-${jobPositionGroup.jobPosition?.id || `job-${jobIndex}`}`
      
      const positionData = {
        position: {
          id: uniqueId, // Use unique ID
          name: positionGroup.position?.name || 'Vị trí quản lý',
          level: positionGroup.position?.level || 1,
          description: positionGroup.position?.description || '',
          isManagement: positionGroup.position?.isManagement || false,
        },
        jobPosition: {
          id: jobPositionGroup.jobPosition?.id || '',
          jobName: jobPositionGroup.jobPosition?.jobName || '',
          department: {
            name: jobPositionGroup.jobPosition?.department?.name || '',
          },
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
          users: transformedUsers, // CRITICAL: Ensure users are in stats
        },
        userCount: totalUsers,
        users: transformedUsers, // CRITICAL: Also at root level for PositionCard
        _debugInfo: {
          positionIndex,
          jobIndex,
          originalPositionId: positionGroup.position?.id,
          originalJobPositionId: jobPositionGroup.jobPosition?.id,
          uniqueId,
        }
      }
      
      positions.push(positionData)
    })
  })
  
  return positions
}

// Group positions by department for overview cards - KHÔI PHỤC LOGIC CŨ
export function groupPositionsByDepartment(positions: any[]) {
  const departmentMap = new Map()
  
  positions.forEach((pos) => {
    const deptName = pos.jobPosition?.department?.name || 'Chưa phân loại'
    const deptId = pos.jobPosition?.department?.id || 'unknown'
    
    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, {
        id: deptId,
        name: deptName,
        positions: [],
        totalUsers: 0,
        usersWithReports: 0,
        usersWithCompletedReports: 0,
        totalTasks: 0,
        completedTasks: 0,
      })
    }
    
    const dept = departmentMap.get(deptId)
    dept.positions.push(pos)
    dept.totalUsers += pos.stats.totalUsers
    dept.usersWithReports += pos.stats.usersWithReports
    dept.usersWithCompletedReports += pos.stats.usersWithCompletedReports
    dept.totalTasks += pos.stats.totalTasks
    dept.completedTasks += pos.stats.completedTasks
  })
  
  return Array.from(departmentMap.values())
}
