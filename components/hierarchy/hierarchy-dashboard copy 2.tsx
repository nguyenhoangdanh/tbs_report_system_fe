"use client"

import { memo, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { useMyHierarchyView } from '@/hooks/use-hierarchy'
import { useHierarchyFilters } from '@/hooks/use-hierarchy-filters'
import { useUserPermissions, useHierarchyData, PositionData } from '@/utils/hierarchy-utils'
import { HierarchyLoadingSkeleton } from './hierarchy-loading'
import { ErrorMessage } from '@/components/ui/error-message'
import { HierarchySummaryCards } from './hierarchy-summary-cards'
import { PositionGroupsList } from './position-groups-list'
import { HierarchyHeader } from './hierarchy-header'
import {
  AlertTriangle,
  BarChart3,
  Crown,
  Users,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

interface TabConfig {
  id: string
  label: string
  icon: any
  show: boolean
  positions?: PositionData[]
  isManagement?: boolean
}

interface OverviewCardProps {
  title: string
  count: number
  icon: any
  onClick: () => void
  description?: string
  variant?: 'management' | 'employee'
  positions?: PositionData[]
  isJobPosition?: boolean
}

const OverviewCard = memo(({ title, count, icon: Icon, onClick, description, variant = 'management', positions = [], isJobPosition = false }: OverviewCardProps) => {
  const stats = useMemo(() => {
    if (isJobPosition) {
      // For job positions, calculate from users array in each position
      let totalEmployees = 0
      let totalFilled = 0
      let totalPending = 0
      let submissionRate = 0

      positions.forEach(pos => {
        const users = pos.users || []
        const userCount = users.length
        // const completedTasks = users.filter(user =>
        //   user.stats?.isCompleted === true ||
        //   user.stats?.taskCompletionRate === 100
        // ).length
        // const totalReports = users.filter(user => user.stats?.hasReport).length;

        totalEmployees += userCount
        totalFilled += pos.stats?.usersWithReports || 0
        submissionRate = pos.stats?.submissionRate || 0
        totalPending += (userCount - (pos.stats?.usersWithReports || 0))
        // totalFilled = pos.stats.usersWithReports;
        // totalFilled += completedTasks
        // totalPending += (userCount - completedTasks)

        // if (pos.position?.department?.name) {
        //   departments.add(pos.position.department.name)
        // }
      })

      // const completionRate = totalEmployees > 0 ? Math.round((totalFilled / totalEmployees) * 100) : 0

      return {
        totalEmployees,
        totalFilled,
        totalPending,
        submissionRate,
      }
    } else {
      // For management positions
      let totalEmployees = 0
      let totalFilled = 0
      let totalPending = 0
      let submissionRate = 0

      positions.forEach(pos => {
        const users = pos.users || []
        const userCount = users.length
        totalEmployees += userCount
        totalFilled += pos.stats?.usersWithReports || 0
        submissionRate = pos.stats?.submissionRate || 0
        totalPending += (userCount - (pos.stats?.usersWithReports || 0))
      })

      return {
        totalEmployees,
        totalFilled,
        totalPending,
        submissionRate
      }
    }
  }, [positions, isJobPosition])

  return (
    <Card
      className={`backdrop-blur-sm bg-card/95 hover:bg-card/100 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:scale-[1.02] ${variant === 'management' ? 'border-blue-200 hover:border-blue-300' : 'border-green-200 hover:border-green-300'
        }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${variant === 'management' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{title}</h3>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nhân viên:</span>
                <span className="font-medium">{stats.totalEmployees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đã nộp:</span>
                <span className="font-medium text-blue-600">{stats.totalFilled}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tỷ lệ hoàn thành:</span>
                <span className={`font-medium ${stats.submissionRate > 80 ? 'text-green-600' :
                    stats.submissionRate > 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {stats.submissionRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chưa nộp:</span>
                <span className="font-medium text-red-600">{stats.totalPending}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${stats.submissionRate > 80 ? 'bg-green-500' :
                    stats.submissionRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${stats.submissionRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

OverviewCard.displayName = 'OverviewCard'

const HierarchyDashboard = memo(() => {
  const { user } = useAuth()
  const userPermissions = useUserPermissions(user?.role)
  const { filters, apiFilters, filterDisplayText, handleFiltersChange } = useHierarchyFilters()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy
  } = useMyHierarchyView(apiFilters)

  const handleFiltersChangeWithRefetch = useCallback((newFilters: any) => {
    handleFiltersChange(newFilters)
    setTimeout(() => {
      refetchHierarchy()
    }, 100)
  }, [handleFiltersChange, refetchHierarchy])

  const handleRefresh = useCallback(() => {
    refetchHierarchy()
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [refetchHierarchy, setIsRefreshing])

  const { positions, jobPositions, summary } = useHierarchyData(hierarchyData, userPermissions)

  const managementPositions = useMemo(() => {
    const mgmtPos = positions.filter(pos => {
      const isManagement = pos.position?.isManagement === true
      const hasManagementInName = pos.position?.name?.toLowerCase().includes('trưởng') ||
        pos.position?.name?.toLowerCase().includes('giám đốc') ||
        pos.position?.name?.toLowerCase().includes('phó')

      return isManagement || hasManagementInName
    })
    return mgmtPos
  }, [positions])

  const employeeJobPositions = useMemo(() => {
    return jobPositions
  }, [jobPositions])

  const availableTabs = useMemo((): TabConfig[] => {
    const tabs: TabConfig[] = [
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: BarChart3,
        show: true
      }
    ]

    if (managementPositions.length > 0 && userPermissions.canViewPositions) {
      const managementByLevelAndPosition = new Map<string, { positions: PositionData[], level: number }>()

      managementPositions.forEach(pos => {
        const level = pos.position?.level || 10
        const positionName = pos.position?.description || pos.position?.name || 'Vị trí quản lý'
        const key = `${level}-${positionName}`

        if (!managementByLevelAndPosition.has(key)) {
          managementByLevelAndPosition.set(key, {
            positions: [],
            level: level
          })
        }
        managementByLevelAndPosition.get(key)!.positions.push(pos)
      })

      Array.from(managementByLevelAndPosition.entries())
        .sort(([keyA, dataA], [keyB, dataB]) => {
          if (dataA.level !== dataB.level) {
            return dataA.level - dataB.level
          }
          const nameA = keyA.split('-').slice(1).join('-')
          const nameB = keyB.split('-').slice(1).join('-')
          return nameA.localeCompare(nameB)
        })
        .forEach(([key, data]) => {
          const positionName = key.split('-').slice(1).join('-')
          const level = data.level

          const tabLabel = `${positionName}`

          tabs.push({
            id: `position-level-${level}-${positionName.toLowerCase().replace(/\s+/g, '-')}`,
            label: tabLabel,
            icon: Crown,
            show: true,
            positions: data.positions,
            isManagement: true
          })
        })
    }

    if (employeeJobPositions.length > 0 && userPermissions.canViewJobPositions) {
      tabs.push({
        id: 'jobPositions',
        label: `Vị trí công việc`,
        icon: Users,
        show: true,
        positions: employeeJobPositions,
        isManagement: false
      })
    }

    return tabs.filter(tab => tab.show)
  }, [managementPositions, employeeJobPositions, userPermissions])

  const managementTabs = useMemo(() => {
    return availableTabs.filter(tab => tab.isManagement)
  }, [availableTabs])

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

  const effectiveActiveTab = useMemo(() => {
    const availableTabIds = availableTabs.map(tab => tab.id)
    if (!availableTabIds.includes(activeTab)) {
      return availableTabIds[0] || 'overview'
    }
    return activeTab
  }, [activeTab, availableTabs])

  const currentTab = useMemo(() => {
    return availableTabs.find(tab => tab.id === effectiveActiveTab)
  }, [availableTabs, effectiveActiveTab])

  const handleBackToOverview = useCallback(() => {
    setActiveTab('overview')
  }, [])

  if (hierarchyLoading || isRefreshing) {
    return <HierarchyLoadingSkeleton />
  }


  if (hierarchyError) {
    return (
      <ErrorMessage
        message="Không thể tải dữ liệu hierarchy"
        details={`${hierarchyError.message}${hierarchyData ? ` | viewType: ${hierarchyData.viewType}` : ''}`}
        onRetry={handleRefresh}
      />
    )
  }

  if (!userPermissions.canViewPositions && !userPermissions.canViewJobPositions) {
    return (
      <Card className="backdrop-blur-sm bg-card/80">
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

    console.log('employeeJobPositions:', employeeJobPositions)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="backdrop-blur-sm">
        <HierarchyHeader
          filterDisplayText={filterDisplayText}
          filters={filters}
          onFiltersChange={handleFiltersChangeWithRefetch}
          onRefresh={handleRefresh}
        />
      </div>

      {summary && (
        <div className="backdrop-blur-sm">
          <HierarchySummaryCards summary={summary} />
        </div>
      )}

      <Card className="backdrop-blur-sm bg-card/95">
        <CardHeader>
          {effectiveActiveTab === 'overview' ? (
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tổng quan
            </CardTitle>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToOverview}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại tổng quan
              </Button>
              <div className="flex items-center gap-2">
                {currentTab && (
                  <>
                    <currentTab.icon className="w-5 h-5" />
                    <CardTitle className="text-lg font-semibold">
                      {currentTab.label}
                    </CardTitle>
                    <Badge variant="outline">
                      {currentTab.isManagement ? 'Cấp quản lý' : `${currentTab.positions?.length || 0} vị trí`}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {effectiveActiveTab === 'overview' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Management positions cards */}
              {managementTabs.length > 0 && userPermissions.canViewPositions && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Cấp quản lý</h3>
                    <Badge variant="outline">{managementPositions.length} vị trí</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managementTabs.map(tab => (
                      <OverviewCard
                        key={tab.id}
                        title={tab.label}
                        count={tab.positions?.length || 0}
                        icon={Crown}
                        onClick={() => setActiveTab(tab.id)}
                        description="Cấp quản lý"
                        variant="management"
                        positions={tab.positions || []}
                        isJobPosition={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Employee job positions card */}
              {employeeJobPositions.length > 0 && userPermissions.canViewJobPositions && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Vị trí công việc</h3>
                    <Badge variant="outline">{employeeJobPositions.length} vị trí</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* <OverviewCard
                      title="Vị trí công việc"
                      count={employeeJobPositions.length}
                      icon={Users}
                      onClick={() => setActiveTab('jobPositions')}
                      description="Nhân viên - VTCV"
                      variant="employee"
                      positions={employeeJobPositions}
                      isJobPosition={true}
                    /> */}
                    {employeeJobPositions.map((pos, index) => (
                      <OverviewCard
                        key={pos.position?.id || `job-${index}`}
                        title={pos.jobPosition?.jobName || pos.position?.name || 'Vị trí công việc'}
                        count={employeeJobPositions.length}
                        icon={Users}
                        onClick={() => setActiveTab('jobPositions')}
                        description=''
                        variant="employee"
                        positions={[pos]}
                        isJobPosition={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback if no data */}
              {managementTabs.length === 0 && employeeJobPositions.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
                  <p className="text-muted-foreground">
                    Không tìm thấy dữ liệu hierarchy với bộ lọc hiện tại
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Detail view for management positions */}
              {currentTab?.isManagement && (
                <PositionGroupsList
                  positions={currentTab.positions || []}
                  filterDisplayText={filterDisplayText}
                  isManagement={true}
                />
              )}

              {/* Detail view for job positions */}
              {currentTab?.id === 'jobPositions' && (
                <PositionGroupsList
                  positions={currentTab.positions || []}
                  filterDisplayText={filterDisplayText}
                  isJobPosition={true}
                />
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})

HierarchyDashboard.displayName = 'HierarchyDashboard'

export default HierarchyDashboard