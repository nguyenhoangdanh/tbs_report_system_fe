"use client"

import { memo, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/providers/auth-provider'
import { useMyHierarchyView, isManagementHierarchy, isStaffHierarchy } from '@/hooks/use-hierarchy'
import { getCurrentWeek } from '@/utils/week-utils'
import { HierarchyLoadingSkeleton } from './hierarchy-loading'
import { ErrorMessage } from '@/components/ui/error-message'
import { HierarchySummaryCards } from './hierarchy-summary-cards'
import { PositionCard } from './position-card'
import { PositionGroupsList } from './position-groups-list'
import { PositionEmployeesList } from './position-employees-list'
import {
  Calendar,
  RefreshCw,
  Users,
  Building2,
  AlertTriangle,
  BarChart3,
  Filter,
  Crown,
  Shield,
  UserCheck,
  Eye
} from 'lucide-react'

// Filter types
type FilterPeriod = 'week' | 'month' | 'year'

interface HierarchyFilters {
  period: FilterPeriod
  weekNumber?: number
  month?: number
  year: number
  periodWeeks?: number
}

// Position stats interface
interface PositionStats {
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
  users: any[] // Required property for PositionGroupsList
}

// Position data interface  
interface PositionData {
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

// Tab interface
interface TabConfig {
  id: string
  label: string
  icon: any
  show: boolean
  positions?: PositionData[]
  isManagement?: boolean
}

// User permissions utility
const useUserPermissions = (userRole?: string) => {
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
        canViewPositions: true, // USER có thể xem positions nếu họ có management role
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

// Data extraction utility - KHỚP CHÍNH XÁC VỚI BACKEND RESPONSE
const useHierarchyData = (hierarchyData: any, userPermissions: any) => {
  return useMemo(() => {
    if (!hierarchyData) {
      return { positions: [], jobPositions: [], summary: null }
    }

    let positions: PositionData[] = []
    let jobPositions: PositionData[] = []

    console.log('Processing hierarchy data:', {
      viewType: hierarchyData.viewType,
      groupBy: hierarchyData.groupBy,
      hasPositions: !!hierarchyData.positions,
      hasJobPositions: !!hierarchyData.jobPositions,
      positionsLength: hierarchyData.positions?.length || 0,
      jobPositionsLength: hierarchyData.jobPositions?.length || 0
    })

    // Transform data to match expected structure - FIX user data mapping
    const transformPositionData = (item: any): PositionData => {
      // Debug raw item structure
      console.log('Transforming position item:', {
        position: item.position,
        jobPosition: item.jobPosition,
        stats: item.stats,
        users: item.users?.slice(0, 2) // Log first 2 users for debugging
      })

      return {
        ...item,
        stats: {
          ...item.stats,
          needsImprovementCount: item.stats.needsImprovementCount || 0,
          users: item.users || [] // Make sure users are included
        },
        users: item.users || [] // Ensure users are at top level too
      }
    }

    // Handle MIXED view - CHÍNH XÁC THEO BACKEND
    if (hierarchyData.viewType === 'mixed' && hierarchyData.groupBy === 'mixed') {
      console.log('Processing mixed view')
      
      if (userPermissions.canViewPositions && Array.isArray(hierarchyData.positions)) {
        positions = hierarchyData.positions.map(transformPositionData)
        console.log('Transformed management positions:', positions.length)
        console.log('First position users sample:', positions[0]?.users?.slice(0, 2))
      }
      
      if (userPermissions.canViewJobPositions && Array.isArray(hierarchyData.jobPositions)) {
        jobPositions = hierarchyData.jobPositions.map(transformPositionData)
        console.log('Transformed job positions:', jobPositions.length)
        console.log('First job position users sample:', jobPositions[0]?.users?.slice(0, 2))
      }
      
      return {
        positions,
        jobPositions,
        summary: hierarchyData.summary
      }
    }

    // Handle MANAGEMENT-only view
    else if (hierarchyData.viewType === 'management' && hierarchyData.groupBy === 'position') {
      console.log('Processing management-only view')
      
      if (userPermissions.canViewPositions && Array.isArray(hierarchyData.positions)) {
        positions = hierarchyData.positions.map(transformPositionData)
        console.log('Transformed management positions:', positions.length)
      }
      
      return {
        positions,
        jobPositions: [],
        summary: hierarchyData.summary
      }
    }

    // Handle STAFF-only view
    else if (hierarchyData.viewType === 'staff' && hierarchyData.groupBy === 'jobPosition') {
      console.log('Processing staff-only view')
      
      if (userPermissions.canViewJobPositions && Array.isArray(hierarchyData.jobPositions)) {
        jobPositions = hierarchyData.jobPositions.map(transformPositionData)
        console.log('Transformed job positions:', jobPositions.length)
      }
      
      return {
        positions: [],
        jobPositions,
        summary: hierarchyData.summary
      }
    }

    // Handle EMPTY view
    else if (hierarchyData.viewType === 'empty') {
      console.log('Processing empty view')
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

    // Unknown format - log cho debugging
    else {
      console.error('Unknown hierarchy data format:', {
        viewType: hierarchyData.viewType,
        groupBy: hierarchyData.groupBy,
        availableKeys: Object.keys(hierarchyData)
      })
      
      return {
        positions: [],
        jobPositions: [],
        summary: hierarchyData.summary || null
      }
    }
  }, [hierarchyData, userPermissions])
}

// Filters component
const FiltersComponent = memo(({
  filters,
  onFiltersChange
}: {
  filters: HierarchyFilters
  onFiltersChange: (filters: HierarchyFilters) => void
}) => {
  const currentWeek = getCurrentWeek()
  const currentYear = new Date().getFullYear()

  const yearOptions = useMemo(() => [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1
  ], [currentYear])

  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `Tháng ${i + 1}`
    }))
    , [])

  const weekOptions = useMemo(() =>
    Array.from({ length: 53 }, (_, i) => ({
      value: i + 1,
      label: `Tuần ${i + 1}`
    }))
    , [])

  const handleFilterChange = useCallback((key: keyof HierarchyFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }, [filters, onFiltersChange])

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Bộ lọc:</span>
      </div>

      {/* Week Selection */}
      {filters.period === 'week' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tuần:</span>
          <Select
            value={filters.weekNumber?.toString()}
            onValueChange={(value) => handleFilterChange('weekNumber', parseInt(value))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map(week => (
                <SelectItem key={week.value} value={week.value.toString()}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Month Selection */}
      {filters.period === 'month' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tháng:</span>
          <Select
            value={filters.month?.toString()}
            onValueChange={(value) => handleFilterChange('month', parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Năm:</span>
        <Select
          value={filters.year.toString()}
          onValueChange={(value) => handleFilterChange('year', parseInt(value))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

FiltersComponent.displayName = 'FiltersComponent'

// Overview Tab Component
const OverviewTab = memo(({
  positions,
  jobPositions,
  userPermissions,
  filterDisplayText
}: {
  positions: PositionData[]
  jobPositions: PositionData[]
  userPermissions: any
  filterDisplayText: string
}) => {
  // Group management positions by position name
  const managementPositions = useMemo(() => {
    return positions.filter(pos => pos.position?.isManagement === true)
  }, [positions])

  // Group job positions by department
  const jobPositionsByDept = useMemo(() => {
    const grouped = new Map<string, PositionData[]>()

    jobPositions.forEach(jobPos => {
      const deptName = jobPos.jobPosition?.department?.name || 'Khác'
      if (!grouped.has(deptName)) {
        grouped.set(deptName, [])
      }
      grouped.get(deptName)!.push(jobPos)
    })

    return grouped
  }, [jobPositions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Management Positions Overview */}
      {managementPositions.length > 0 && userPermissions.canViewPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            Cấp Quản Lý ({managementPositions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managementPositions.map((position, index) => {
              const totalUsers = position.stats?.totalUsers || 0
              const avgCompletion = position.stats?.averageCompletionRate || 0

              return (
                <Card key={position.position?.id || `mgmt-${index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {position.position?.name || 'Vị trí quản lý'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Quản lý
                      </Badge>
                    </div>
                    {/* Bỏ hiển thị level */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Nhân viên:</span>
                        <span className="text-sm font-medium">{totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Hoàn thành:</span>
                        <span className="text-sm font-medium text-blue-600">{Math.round(avgCompletion)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Job Positions Overview */}
      {jobPositions.length > 0 && userPermissions.canViewJobPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Vị trí công việc ({jobPositions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobPositions.slice(0, 6).map((jobPos, index) => (
              <motion.div
                key={jobPos.jobPosition?.id || `job-${index}`}
                className="p-4 border rounded-lg transition-all duration-200 hover:shadow-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate text-sm">
                    {jobPos.jobPosition?.jobName || 'Vị trí công việc'}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {jobPos.userCount || 0}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {jobPos.jobPosition?.department?.name || 'Phòng ban'}
                </div>
                <div className="text-xs text-green-600">
                  {jobPos.stats?.usersWithReports || 0}/{jobPos.userCount || 0} đã nộp
                  ({Math.round(jobPos.stats?.submissionRate || 0)}%)
                </div>
              </motion.div>
            ))}
          </div>

          {jobPositions.length > 6 && (
            <div className="mt-4 text-center">
              <Badge variant="outline">
                Còn {jobPositions.length - 6} vị trí khác
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {positions.length === 0 && jobPositions.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">
            Không tìm thấy dữ liệu cho {filterDisplayText}
          </p>
        </div>
      )}
    </motion.div>
  )
})

OverviewTab.displayName = 'OverviewTab'

// Main component
const HierarchyDashboard = memo(() => {
  const { user } = useAuth()
  const currentWeekInfo = useMemo(() => getCurrentWeek(), [])
  const userPermissions = useUserPermissions(user?.role)

  // Filter state
  const [filters, setFilters] = useState<HierarchyFilters>({
    period: 'week',
    weekNumber: currentWeekInfo.weekNumber,
    year: currentWeekInfo.year,
    periodWeeks: 4
  })

  const [activeTab, setActiveTab] = useState<string>('overview')

  // API filters
  const apiFilters = useMemo(() => {
    const baseFilters: any = {
      year: filters.year,
    }

    if (filters.period === 'week' && filters.weekNumber) {
      baseFilters.weekNumber = filters.weekNumber
    } else if (filters.period === 'month' && filters.month) {
      baseFilters.month = filters.month
    }

    return baseFilters
  }, [filters])

  // Data hooks - Force fresh data
  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy
  } = useMyHierarchyView(apiFilters)

  // Event handlers - FIX: Remove duplicate declarations
  const handleFiltersChange = useCallback((newFilters: HierarchyFilters) => {
    setFilters(newFilters)
    // Force immediate refetch when filters change
    setTimeout(() => {
      refetchHierarchy()
    }, 100)
  }, [refetchHierarchy])

  const handleRefresh = useCallback(() => {
    // Clear any cached data and force refetch
    refetchHierarchy()
  }, [refetchHierarchy])

  // Extract data based on response type
  const { positions, jobPositions, summary } = useHierarchyData(hierarchyData, userPermissions)

  // Debug logging
  console.log('Final extracted data:')
  console.log('- Positions:', positions.length)
  console.log('- Job Positions:', jobPositions.length)
  console.log('- User Permissions:', userPermissions)

  // Separate management positions and job positions
  const managementPositions = useMemo(() => {
    const mgmtPos = positions.filter(pos => {
      // Kiểm tra cả isManagement từ API và tên chức danh
      const isManagement = pos.position?.isManagement === true
      const hasManagementInName = pos.position?.name?.toLowerCase().includes('trưởng') ||
                                  pos.position?.name?.toLowerCase().includes('giám đốc') ||
                                  pos.position?.name?.toLowerCase().includes('phó')
      
      return isManagement || hasManagementInName
    })
    console.log('Management positions filtered:', mgmtPos.length)
    return mgmtPos
  }, [positions])

  const employeeJobPositions = useMemo(() => {
    // JobPositions thường là nhân viên thường
    console.log('Employee job positions:', jobPositions.length)
    return jobPositions
  }, [jobPositions])

  // Generate tab configuration based on available data
  const availableTabs = useMemo((): TabConfig[] => {
    const tabs: TabConfig[] = [
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: BarChart3,
        show: true
      }
    ]

    console.log('Generating tabs for:')
    console.log('- Management positions:', managementPositions.length)
    console.log('- Employee job positions:', employeeJobPositions.length)

    // Add management position tabs (group by position name)
    if (managementPositions.length > 0 && userPermissions.canViewPositions) {
      const managementByPosition = new Map<string, PositionData[]>()
      
      managementPositions.forEach(pos => {
        const positionName = pos.position?.name || 'Vị trí quản lý'
        if (!managementByPosition.has(positionName)) {
          managementByPosition.set(positionName, [])
        }
        managementByPosition.get(positionName)!.push(pos)
      })

      // Add each management position as a separate tab
      Array.from(managementByPosition.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([positionName, positionList]) => {
          tabs.push({
            id: `position-${positionName.toLowerCase().replace(/\s+/g, '-')}`,
            label: `${positionName} (${positionList.length})`,
            icon: Crown,
            show: true,
            positions: positionList,
            isManagement: true
          })
        })
    }

    // Add job positions tab for employee level
    if (employeeJobPositions.length > 0 && userPermissions.canViewJobPositions) {
      tabs.push({
        id: 'jobPositions',
        label: `Vị trí công việc (${employeeJobPositions.length})`,
        icon: Users,
        show: true,
        positions: employeeJobPositions,
        isManagement: false
      })
    }

    console.log('Generated tabs:', tabs.map(t => ({ id: t.id, label: t.label, show: t.show })))
    return tabs.filter(tab => tab.show)
  }, [managementPositions, employeeJobPositions, userPermissions])

  // Format filter display
  const filterDisplayText = useMemo(() => {
    const { period, weekNumber, month, year } = filters

    if (period === 'week' && weekNumber) {
      return `Tuần ${weekNumber}/${year}`
    } else if (period === 'month' && month) {
      return `Tháng ${month}/${year}`
    } else {
      return `Năm ${year}`
    }
  }, [filters])

  // User level display
  const userLevelDisplay = useMemo(() => {
    switch (userPermissions.userLevel) {
      case 'ADMIN':
        return 'Quản trị viên/Tổng giám đốc - Xem tất cả'
      case 'USER':
        return 'Nhân viên - Xem theo cấp độ chức vụ'
      default:
        return 'Không có quyền xem'
    }
  }, [userPermissions.userLevel])

  // Auto-set active tab if current doesn't exist
  const effectiveActiveTab = useMemo(() => {
    const availableTabIds = availableTabs.map(tab => tab.id)
    if (!availableTabIds.includes(activeTab)) {
      return availableTabIds[0] || 'overview'
    }
    return activeTab
  }, [activeTab, availableTabs])

  // Loading state
  if (hierarchyLoading) {
    return <HierarchyLoadingSkeleton />
  }

  // Error state - Enhanced with more debugging info
  if (hierarchyError) {
    console.error('Hierarchy error details:', {
      error: hierarchyError,
      hierarchyData,
      apiFilters
    })
    
    return (
      <ErrorMessage
        message="Không thể tải dữ liệu hierarchy" 
        details={`${hierarchyError.message}${hierarchyData ? ` | viewType: ${hierarchyData.viewType}` : ''}`}
        onRetry={handleRefresh}
      />
    )
  }

  // No permission state
  if (!userPermissions.canViewPositions && !userPermissions.canViewJobPositions) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có quyền truy cập</h3>
          <p className="text-muted-foreground mb-4">
            Bạn không có quyền xem thống kê hierarchy
          </p>
          <div className="text-sm text-muted-foreground">
            Cấp độ: {userLevelDisplay}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Báo cáo Hierarchy
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {userLevelDisplay}
                </p>
                {/* Debug info - remove in production */}
                <div className="text-xs text-muted-foreground mt-1">
                  Debug: {hierarchyData?.viewType || 'N/A'} | 
                  Positions: {positions.length} | 
                  JobPositions: {jobPositions.length} |
                  Tabs: {availableTabs.length}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {filterDisplayText}
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Làm mới</span>
                </Button>
              </div>
            </div>

            <FiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <HierarchySummaryCards summary={summary} />
      )}

      {/* Dynamic Tabs */}
      {availableTabs.length > 1 ? (
        <Card>
          <CardHeader>
            <Tabs value={effectiveActiveTab} onValueChange={setActiveTab}>
              {/* Responsive TabsList */}
              <div className="relative">
                <TabsList className={`grid w-full ${availableTabs.length <= 4 ? `grid-cols-${availableTabs.length}` : 'grid-cols-4 lg:grid-cols-6'} gap-1 h-auto p-1`}>
                  {availableTabs.map(tab => {
                    const IconComponent = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 px-2 py-2 text-xs sm:text-sm min-w-0"
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate hidden sm:inline">
                          {tab.label}
                        </span>
                        <span className="truncate sm:hidden">
                          {tab.label.split(' ')[0]}
                        </span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <OverviewTab
                  positions={managementPositions}
                  jobPositions={employeeJobPositions}
                  userPermissions={userPermissions}
                  filterDisplayText={filterDisplayText}
                />
              </TabsContent>

              {/* Management Position Tabs */}
              {availableTabs
                .filter(tab => tab.id.startsWith('position-') && tab.isManagement)
                .map(tab => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <tab.icon className="w-5 h-5" />
                          {tab.label}
                        </h3>
                        <Badge variant="outline">
                          Cấp quản lý
                        </Badge>
                      </div>

                      <PositionGroupsList
                        positions={tab.positions || []}
                        filterDisplayText={filterDisplayText}
                        isManagement={true}
                      />
                    </motion.div>
                  </TabsContent>
                ))}

              {/* Job Positions Tab */}
              <TabsContent value="jobPositions" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Vị trí công việc
                    </h3>
                    <Badge variant="outline">
                      {employeeJobPositions.length} vị trí
                    </Badge>
                  </div>

                  <PositionGroupsList
                    positions={employeeJobPositions}
                    filterDisplayText={filterDisplayText}
                    isJobPosition={true}
                  />
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      ) : (
        // Show overview directly if only one tab
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tổng quan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewTab
              positions={managementPositions}
              jobPositions={employeeJobPositions}
              userPermissions={userPermissions}
              filterDisplayText={filterDisplayText}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
})

HierarchyDashboard.displayName = 'HierarchyDashboard'

export default HierarchyDashboard