"use client"

import { memo, useState, useCallback, useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useMyHierarchyView } from "@/hooks/use-hierarchy"
import { useHierarchyFilters } from "@/hooks/use-hierarchy-filters"
import { useUserPermissions, useHierarchyData, type PositionData } from "@/utils/hierarchy-utils"
import { HierarchyLoadingSkeleton } from "./hierarchy-loading"
import { ErrorMessage } from "@/components/ui/error-message"
import { HierarchySummaryCards } from "./hierarchy-summary-cards"
import { PositionGroupsList } from "./position-groups-list"
import { HierarchyHeader } from "./hierarchy-header"
import { AlertTriangle, BarChart3, Crown, Users, ArrowLeft, ChevronRight } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { OverviewCard } from "./hierarchy-overview-card"

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
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const shouldReduceMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy, // ✅ NOW: This will work with the fixed hook
  } = useMyHierarchyView(apiFilters)

  const handleFiltersChangeWithRefetch = useCallback(
    (newFilters: any) => {
      handleFiltersChange(newFilters)
      setTimeout(() => {
        refetchHierarchy()
      }, 100)
    },
    [handleFiltersChange, refetchHierarchy],
  )

  const handleRefresh = useCallback(() => {
    refetchHierarchy()
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [refetchHierarchy, setIsRefreshing])

  const { positions, jobPositions, summary } = useHierarchyData(hierarchyData, userPermissions)

  const managementPositions = useMemo(() => {
    const mgmtPos = positions.filter((pos) => {
      const isManagement = pos.position?.isManagement === true
      const hasManagementInName =
        pos.position?.name?.toLowerCase().includes("trưởng") ||
        pos.position?.name?.toLowerCase().includes("giám đốc") ||
        pos.position?.name?.toLowerCase().includes("phó")

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
        id: "overview",
        label: "Tổng quan",
        icon: BarChart3,
        show: true,
      },
    ]

    if (managementPositions.length > 0 && userPermissions.canViewPositions) {
      const managementByLevelAndPosition = new Map<string, { positions: PositionData[]; level: number }>()

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

      Array.from(managementByLevelAndPosition.entries())
        .sort(([keyA, dataA], [keyB, dataB]) => {
          if (dataA.level !== dataB.level) {
            return dataA.level - dataB.level
          }
          const nameA = keyA.split("-").slice(1).join("-")
          const nameB = keyB.split("-").slice(1).join("-")
          return nameA.localeCompare(nameB)
        })
        .forEach(([key, data]) => {
          const positionName = key.split("-").slice(1).join("-")
          const level = data.level

          const tabLabel = `${positionName}`

          tabs.push({
            id: `position-level-${level}-${positionName.toLowerCase().replace(/\s+/g, "-")}`,
            label: tabLabel,
            icon: Crown,
            show: true,
            positions: data.positions,
            isManagement: true,
          })
        })
    }

    if (employeeJobPositions.length > 0 && userPermissions.canViewJobPositions) {
      employeeJobPositions.forEach((pos, idx) => {
        const jobName = pos.jobPosition?.jobName || pos.position?.name || `Vị trí công việc ${idx + 1}`
        tabs.push({
          id: `job-position-${pos.position?.id || idx}`,
          label: jobName,
          icon: Users,
          show: true,
          positions: [pos],
          isManagement: false,
        })
      })
    }

    return tabs.filter((tab) => tab.show)
  }, [managementPositions, employeeJobPositions, userPermissions])

  const managementTabs = useMemo(() => {
    return availableTabs.filter((tab) => tab.isManagement)
  }, [availableTabs])

  const userLevelDisplay = useMemo(() => {
    switch (userPermissions.userLevel) {
      case "ADMIN":
        return "Quản trị viên/Tổng giám đốc - Xem tất cả"
      case "USER":
        return "Nhân viên - Xem theo cấp độ chức vụ"
      default:
        return "Không có quyền xem"
    }
  }, [userPermissions.userLevel])

  const effectiveActiveTab = useMemo(() => {
    const availableTabIds = availableTabs.map((tab) => tab.id)
    if (!availableTabIds.includes(activeTab)) {
      return availableTabIds[0] || "overview"
    }
    return activeTab
  }, [activeTab, availableTabs])

  const currentTab = useMemo(() => {
    return availableTabs.find((tab) => tab.id === effectiveActiveTab)
  }, [availableTabs, effectiveActiveTab])

  const handleBackToOverview = useCallback(() => {
    setActiveTab("overview")
  }, [])

  // Handler to be passed to children for evaluation actions
  const handleEvaluationChange = () => {
    // Invalidate hierarchy data to force refetch after evaluation
    queryClient.invalidateQueries({ queryKey: ['hierarchy', 'my-view'], refetchType: 'all' })
  }

  if (hierarchyLoading || isRefreshing) {
    return <HierarchyLoadingSkeleton />
  }

  if (hierarchyError) {
    return (
      <ErrorMessage
        message="Không thể tải dữ liệu hierarchy"
        details={`${hierarchyError.message}${hierarchyData ? ` | viewType: ${hierarchyData.viewType}` : ""}`}
        onRetry={handleRefresh}
      />
    )
  }

  if (!userPermissions.canViewPositions && !userPermissions.canViewJobPositions) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }} // Reduced scale
        animate={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
        transition={shouldReduceMotion ? {} : { duration: 0.2 }} // Reduced duration
        className="p-2 sm:p-4"
      >
        <Card className="glass-green border-green-500/20">
          <CardContent className="p-4 sm:p-8 text-center">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Không có quyền truy cập</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Bạn không có quyền xem thống kê hierarchy
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground">Cấp độ: {userLevelDisplay}</div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 p-2 sm:p-0"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }} // Reduced from y: 20
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.2 }} // Reduced duration
    >
      <HierarchyHeader
        filterDisplayText={filterDisplayText}
        filters={filters}
        onFiltersChange={handleFiltersChangeWithRefetch}
        onRefresh={handleRefresh}
      />

      {summary && <HierarchySummaryCards summary={summary} />}

      <Card className="border-border/50 dark:border-border/90 shadow-green-glow/20">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          {effectiveActiveTab !== "overview" && (
            <motion.div
              className="flex flex-col gap-3"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -15 }} // Reduced from x: -20
              animate={shouldReduceMotion ? false : { opacity: 1, x: 0 }}
              transition={shouldReduceMotion ? {} : { duration: 0.15 }} // Reduced duration
            >
              <motion.div 
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} // Reduced from 1.05
                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }} // Reduced from 0.95
                transition={shouldReduceMotion ? {} : { duration: 0.1 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToOverview}
                  className="flex items-center gap-2 hover:bg-green-500/10 bg-green-gradient text-foreground w-fit text-sm transition-colors duration-150" // Reduced transition
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Quay lại tổng quan</span>
                  <span className="xs:hidden">Tổng quan</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </CardHeader>
        
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {effectiveActiveTab === "overview" ? (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }} // Reduced from y: 20
              animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? {} : { duration: 0.15 }} // Reduced duration
              className="space-y-4 sm:space-y-6"
            >
              {/* Management positions cards - Mobile optimized */}
              {managementTabs.length > 0 && userPermissions.canViewPositions && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-warm-gradient shadow-green-glow">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-gradient">Cấp quản lý</h3>
                    <Badge variant="outline" className="glass-green border-green-500/30 text-xs">
                      {managementPositions.length}
                    </Badge>
                  </div>
                  
                  {/* Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {managementTabs.map((tab) => (
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

              {/* Employee job positions card - Mobile optimized */}
              {employeeJobPositions.length > 0 && userPermissions.canViewJobPositions && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-green-gradient shadow-green-glow">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-gradient">Vị trí công việc</h3>
                    <Badge variant="outline" className="glass-green border-green-500/30 text-xs">
                      {employeeJobPositions.length}
                    </Badge>
                  </div>
                  
                  {/* Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {employeeJobPositions.map((pos, index) => (
                      <OverviewCard
                        key={pos.position?.id || `job-${index}`}
                        title={pos.jobPosition?.jobName || pos.position?.name || "Vị trí công việc"}
                        count={1}
                        icon={Users}
                        onClick={() => setActiveTab(`job-position-${pos.position?.id || index}`)}
                        description=""
                        variant="employee"
                        positions={[pos]}
                        isJobPosition={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback if no data - Mobile optimized */}
              {managementTabs.length === 0 && employeeJobPositions.length === 0 && (
                <motion.div
                  className="text-center py-8 sm:py-12 px-4"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }} // Reduced scale
                  animate={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
                  transition={shouldReduceMotion ? {} : { duration: 0.2 }} // Reduced duration
                >
                  <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Không có dữ liệu</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    Không tìm thấy dữ liệu hierarchy với bộ lọc hiện tại
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }} // Reduced from y: 20
              animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? {} : { duration: 0.15 }} // Reduced duration
              className="space-y-3 sm:space-y-4"
            >
              {/* Detail view for management positions */}
              {(currentTab?.isManagement && hierarchyData) && (
                <PositionGroupsList
                  positions={currentTab.positions || []}
                  filterDisplayText={filterDisplayText}
                  isManagement={true}
                  weekNumber={hierarchyData.weekNumber}
                  year={hierarchyData.year || new Date().getFullYear()}
                  canEvaluation={user?.isManager}
                  onEvaluationChange={handleEvaluationChange}
                />
              )}

              {/* Detail view for job positions */}
              {(!currentTab?.isManagement && currentTab?.id?.startsWith("job-position-") && hierarchyData) && (
                <PositionGroupsList
                  positions={currentTab.positions || []}
                  filterDisplayText={filterDisplayText}
                  isJobPosition={true}
                  weekNumber={hierarchyData.weekNumber}
                  year={hierarchyData.year || new Date().getFullYear()}
                  canEvaluation={user?.isManager}
                  onEvaluationChange={handleEvaluationChange}
                />
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
})

HierarchyDashboard.displayName = "HierarchyDashboard"

export default HierarchyDashboard
