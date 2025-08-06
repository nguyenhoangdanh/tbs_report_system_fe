"use client"

import React, { memo, useState, useCallback, useMemo, useEffect } from "react"
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
import useUIStateStore from "@/store/ui-state-store"
import { useScrollPreservation, usePageNavigationScroll } from "@/hooks/use-scroll-preservation"
import { toast } from "react-toast-kit"
import useHierarchyStore from "@/store/hierarchy-store"
import { ScreenLoading } from "../loading/screen-loading"

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
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false) // ✅ ADD: Manual refresh state
  const shouldReduceMotion = useReducedMotion()
  const queryClient = useQueryClient()

  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy,
    isStoreRefreshing,
  } = useMyHierarchyView(apiFilters)

  // ✅ SIMPLIFIED: Remove complex evaluation listener, use simple store refresh
  React.useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      useHierarchyStore.getState().forceRefresh()
    }
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'evaluation-broadcast' && e.newValue) {
        useHierarchyStore.getState().forceRefresh()
      }
    }

    window.addEventListener('evaluation-changed', handleCustomEvent as EventListener)
    window.addEventListener('storage', handleStorageEvent)
    
    return () => {
      window.removeEventListener('evaluation-changed', handleCustomEvent as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, []) // ✅ REMOVE: queryClient dependency

  const handleFiltersChangeWithRefetch = useCallback(
    (newFilters: any) => {
      handleFiltersChange(newFilters)
      // ✅ REMOVE: Automatic refetch, let hook handle it
    },
    [handleFiltersChange],
  )

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true) // ✅ ADD: Manual refresh state
    try {
      await refetchHierarchy()
    } finally {
      // ✅ OPTIMIZED: Shorter manual refresh state
      setTimeout(() => {
        setIsManualRefreshing(false)
      }, 500)
    }
  }, [refetchHierarchy])

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

  // ✅ ENHANCED: Handle back to overview with complete reset and broadcast
  const { clearAllExpandedForPage } = useUIStateStore()
  const { resetAllScrollPositions } = usePageNavigationScroll()

  const handleBackToOverview = useCallback(() => {
    
    // 1. ✅ BROADCAST: Notify all tables to reset
    window.dispatchEvent(new CustomEvent('hierarchy-tab-change', {
      detail: { resetUI: true, targetTab: 'overview' }
    }))
    
    // 2. ✅ CLEAR: Clear all expanded states
    clearAllExpandedForPage()
    
    // 3. ✅ SCROLL: Reset scroll to top
    resetAllScrollPositions()
    
    // 4. ✅ NAVIGATE: Change tab
    setActiveTab("overview")
    
    // 5. ✅ FEEDBACK: Optional visual feedback
    toast.success("🏠 Đã quay về trang tổng quan")
    
  }, [clearAllExpandedForPage, resetAllScrollPositions])

  const isActuallyLoading = hierarchyLoading || isStoreRefreshing || isManualRefreshing

  // ✅ FIXED: Show loading only when really loading and no data
  if (isActuallyLoading && !hierarchyData) {
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
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.2 }}
    >
      {/* ✅ ADD: Loading overlay like AdminOverview */}
      {isManualRefreshing && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <ScreenLoading 
            size="md" 
            variant="dual-ring" 
            text="Đang làm mới dữ liệu..." 
            fullScreen={false}
          />
        </div>
      )}

      <HierarchyHeader
        filterDisplayText={filterDisplayText}
        filters={filters}
        onFiltersChange={handleFiltersChangeWithRefetch}
        onRefresh={handleRefresh}
      />

      {/* ✅ ADD: Opacity transition like AdminOverview */}
      <div className="px-1 sm:px-0 transition-opacity duration-300" style={{ opacity: isStoreRefreshing ? 0.7 : 1 }}>
        {summary && <HierarchySummaryCards summary={summary} />}
      </div>

      {/* ✅ OPTIMIZED: Main content with smooth transitions */}
      <Card className="border-border/50 dark:border-border/90 shadow-green-glow/20 transition-all duration-300">
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
                  onClick={handleBackToOverview} // ✅ ENHANCED: Now includes reset logic
                  className="flex items-center gap-2 hover:bg-green-500/10 bg-green-gradient text-foreground w-fit text-sm transition-colors duration-150"
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
          {/* ✅ ADD: Opacity transition for content */}
          <div className="transition-opacity duration-300" style={{ opacity: isStoreRefreshing ? 0.7 : 1 }}>
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
                    // ✅ REMOVE: onEvaluationChange prop, let component handle itself
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
                    // ✅ REMOVE: onEvaluationChange prop, let component handle itself
                  />
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

HierarchyDashboard.displayName = "HierarchyDashboard"

export default HierarchyDashboard
