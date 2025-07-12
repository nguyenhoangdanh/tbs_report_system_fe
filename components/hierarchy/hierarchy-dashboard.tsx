"use client"

import { memo, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/providers/auth-provider'
import { useMyHierarchyView } from '@/hooks/use-hierarchy'
import { useHierarchyFilters } from '@/hooks/use-hierarchy-filters'
import { useUserPermissions, useHierarchyData, PositionData } from '@/utils/hierarchy-utils'
import { HierarchyLoadingSkeleton } from './hierarchy-loading'
import { ErrorMessage } from '@/components/ui/error-message'
import { HierarchySummaryCards } from './hierarchy-summary-cards'
import { PositionGroupsList } from './position-groups-list'
import { HierarchyHeader } from './hierarchy-header'
import { OverviewTab } from './hierarchy-overview-tab'
import {
  AlertTriangle,
  BarChart3,
  Crown,
  Users
} from 'lucide-react'

interface TabConfig {
  id: string
  label: string
  icon: any
  show: boolean
  positions?: PositionData[]
  isManagement?: boolean
}

const HierarchyDashboard = memo(() => {
  const { user } = useAuth()
  const userPermissions = useUserPermissions(user?.role)
  const { filters, apiFilters, filterDisplayText, handleFiltersChange } = useHierarchyFilters()
  const [activeTab, setActiveTab] = useState<string>('overview')

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
  }, [refetchHierarchy])

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
      // Group positions by level and position name
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

      // Sort by level first, then by position name
      Array.from(managementByLevelAndPosition.entries())
        .sort(([keyA, dataA], [keyB, dataB]) => {
          // Sort by level first (ascending: 1, 2, 3...)
          if (dataA.level !== dataB.level) {
            return dataA.level - dataB.level
          }
          // If same level, sort by position name
          const nameA = keyA.split('-').slice(1).join('-')
          const nameB = keyB.split('-').slice(1).join('-')
          return nameA.localeCompare(nameB)
        })
        .forEach(([key, data]) => {
          const positionName = key.split('-').slice(1).join('-')
          const level = data.level
          
          // Create tab label with level info
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
        label: `Nhân viên - VTCV (${employeeJobPositions.length})`,
        icon: Users,
        show: true,
        positions: employeeJobPositions,
        isManagement: false
      })
    }

    return tabs.filter(tab => tab.show)
  }, [managementPositions, employeeJobPositions, userPermissions])

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

  if (hierarchyLoading) {
    return <HierarchyLoadingSkeleton />
  }

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

      {availableTabs.length > 1 ? (
        <Card className="backdrop-blur-sm bg-card/95">
          <CardHeader>
            <Tabs value={effectiveActiveTab} onValueChange={setActiveTab}>
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

              <TabsContent value="overview" className="mt-6">
                <OverviewTab
                  positions={managementPositions}
                  jobPositions={employeeJobPositions}
                  userPermissions={userPermissions}
                  filterDisplayText={filterDisplayText}
                />
              </TabsContent>

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
        <Card className="backdrop-blur-sm bg-card/95">
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
    </motion.div>
  )
})

HierarchyDashboard.displayName = 'HierarchyDashboard'

export default HierarchyDashboard