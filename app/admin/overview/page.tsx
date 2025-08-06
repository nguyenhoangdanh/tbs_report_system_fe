"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useAdminOverview, useAdminOverviewFilters } from "@/hooks/use-hierarchy"
import { useAuth } from "@/components/providers/auth-provider"
import { HierarchySummaryCards } from "@/components/hierarchy/hierarchy-summary-cards"
import { ScreenLoading } from "@/components/loading/screen-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import {
  Users,
  Building2,
  Calendar,
  ArrowLeft,
  Crown,
  BarChart3,
} from "lucide-react"
import { Suspense } from "react"
import { Input } from "@/components/ui/input"
import { AdminOverviewHeader } from "@/components/hierarchy/admin-overview-header"
import { PositionGroupsList } from "@/components/hierarchy/position-groups-list"
import useAdminOverviewStore from "@/store/admin-overview-store"
import { OverviewCard } from "@/components/hierarchy/hierarchy-overview-card"

// REWRITE: Transform ManagerReports data để tương thích với PositionCard
function transformManagerReportsToPositionCardFormat(overview: any) {
  if (!overview?.groupedReports) return []

  const positionCards: any[] = []

  overview.groupedReports.forEach((positionGroup: any, positionIndex: number) => {
    const position = positionGroup.position

    // Helper function để tính toán stats
    const calculateStats = (employees: any[]) => {
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
        // fail: { count: 0, percentage: 0 },
      }

      employees.forEach(emp => {
        const rate = emp.stats.taskCompletionRate
        // if (rate === 100) rankingDistribution.excellent.count++
        // else if (rate >= 95) rankingDistribution.good.count++
        // else if (rate >= 90) rankingDistribution.average.count++
        // else if (rate >= 85) rankingDistribution.poor.count++
        // else rankingDistribution.fail.count++
        if (rate > 90) rankingDistribution.excellent.count++
        else if (rate >= 80) rankingDistribution.good.count++
        else if (rate >= 70) rankingDistribution.average.count++
        else rankingDistribution.poor.count++
      })

      // Convert to percentages
      Object.keys(rankingDistribution).forEach(key => {
        const item = rankingDistribution[key as keyof typeof rankingDistribution]
        item.percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0
      })

      return {
        totalUsers,
        usersWithReports,
        usersWithCompletedReports,
        usersWithoutReports,
        submissionRate,
        totalTasks,
        completedTasks,
        averageCompletionRate,
        rankingDistribution,
      }
    }

    // Helper function để transform users
    const transformUsers = (employees: any[]) => {
      return employees.map(emp => ({
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
        // Thêm thông tin report nếu có
        report: emp.report || null,
      }))
    }

    // LOGIC CHÍNH: Phân biệt Management vs Employee
    if (position?.isManagement && positionGroup.employees) {
      // ========== CẤP QUẢN LÝ ==========
      // employees trực tiếp trong positionGroup, jobPositions = null
      const employees = positionGroup.employees || []
      const transformedUsers = transformUsers(employees)
      const stats = calculateStats(employees)

      // Tạo một card cho position này
      positionCards.push({
        position: {
          id: position.id,
          name: position.name,
          level: position.level,
          description: position.description,
          isManagement: position.isManagement,
        },
        jobPosition: null, // Management không có jobPosition
        stats: {
          ...stats,
          users: transformedUsers,
        },
        userCount: transformedUsers.length,
        users: transformedUsers,
        _uniqueKey: `mgmt-${position.id}-${positionIndex}`,
        _type: 'management',
        // Metadata for debugging
        _debugInfo: {
          positionIndex,
          originalData: {
            positionName: position.name,
            employeeCount: employees.length,
            isManagement: position.isManagement,
          }
        }
      })

    } else if (!position?.isManagement && positionGroup.jobPositions) {
      // ========== CẤP NHÂN VIÊN ==========  
      // jobPositions array chứa các nhóm, employees = null
      positionGroup.jobPositions.forEach((jobPositionGroup: any, jobIndex: number) => {
        const employees = jobPositionGroup.employees || []
        const transformedUsers = transformUsers(employees)
        const stats = calculateStats(employees)

        // Tạo một card cho mỗi jobPosition
        positionCards.push({
          position: {
            id: position.id,
            name: position.name,
            level: position.level,
            description: position.description,
            isManagement: position.isManagement,
          },
          jobPosition: {
            id: jobPositionGroup.jobPosition?.id || '',
            jobName: jobPositionGroup.jobPosition?.jobName || '',
            code: jobPositionGroup.jobPosition?.code || '',
            description: jobPositionGroup.jobPosition?.description || '',
            department: {
              id: jobPositionGroup.jobPosition?.department?.id || '',
              name: jobPositionGroup.jobPosition?.department?.name || '',
              description: jobPositionGroup.jobPosition?.department?.description || '',
              office: jobPositionGroup.jobPosition?.department?.office,
            },
          },
          stats: {
            ...stats,
            users: transformedUsers,
          },
          userCount: transformedUsers.length,
          users: transformedUsers,
          _uniqueKey: `emp-${position.id}-${jobPositionGroup.jobPosition?.id || jobIndex}-${positionIndex}-${jobIndex}`,
          _type: 'employee',
          // Metadata for debugging
          _debugInfo: {
            positionIndex,
            jobIndex,
            originalData: {
              positionName: position.name,
              jobPositionName: jobPositionGroup.jobPosition?.jobName,
              departmentName: jobPositionGroup.jobPosition?.department?.name,
              employeeCount: employees.length,
              isManagement: position.isManagement,
            }
          }
        })
      })

    } else {
      // ========== FALLBACK ==========
      // Trường hợp không xác định được structure

      // Thử xử lý dữ liệu có sẵn
      const fallbackEmployees = positionGroup.employees || []
      if (fallbackEmployees.length > 0) {
        const transformedUsers = transformUsers(fallbackEmployees)
        const stats = calculateStats(fallbackEmployees)

        positionCards.push({
          position: {
            id: position?.id || `fallback-${positionIndex}`,
            name: position?.name || 'Vị trí không xác định',
            level: position?.level || 999,
            description: position?.description || '',
            isManagement: position?.isManagement || false,
          },
          jobPosition: null,
          stats: {
            ...stats,
            users: transformedUsers,
          },
          userCount: transformedUsers.length,
          users: transformedUsers,
          _uniqueKey: `fallback-${positionIndex}`,
          _type: 'fallback',
          _debugInfo: {
            positionIndex,
            originalData: position,
            warning: 'Fallback processing used',
          }
        })
      }
    }
  })

  return positionCards
}

// Group positions for overview cards (similar to HierarchyDashboard)
function groupPositionsForOverview(positionCards: any[]) {
  const managementGroups = new Map<string, any[]>()
  const jobPositionGroups = new Map<string, any[]>()

  positionCards.forEach((card) => {
    const isManagement = card.position?.isManagement ||
      card.position?.name?.toLowerCase().includes("trưởng") ||
      card.position?.name?.toLowerCase().includes("giám đốc") ||
      card.position?.name?.toLowerCase().includes("phó")

    if (isManagement) {
      const key = card.position?.name || 'Vị trí quản lý'
      if (!managementGroups.has(key)) {
        managementGroups.set(key, [])
      }
      managementGroups.get(key)!.push(card)
    } else {
      const key = card.jobPosition?.jobName || card.position?.name || 'Vị trí công việc'
      if (!jobPositionGroups.has(key)) {
        jobPositionGroups.set(key, [])
      }
      jobPositionGroups.get(key)!.push(card)
    }
  })

  return {
    managementTabs: Array.from(managementGroups.entries()).map(([key, cards], index) => ({
      id: `mgmt-${index}-${key.toLowerCase().replace(/\s+/g, "-")}`,
      label: key,
      positions: cards,
      isManagement: true,
    })),
    jobPositionTabs: Array.from(jobPositionGroups.entries()).map(([key, cards], index) => ({
      id: `job-${index}-${key.toLowerCase().replace(/\s+/g, "-")}`,
      label: key,
      positions: cards,
      isManagement: false,
    }))
  }
}

// Transform backend summary to UI summary for HierarchySummaryCards
function transformManagerReportsSummaryForCards(summary: any): any {
  // ✅ FIXED: Add null check for summary
  if (!summary) {
    return {
      totalPositions: 0,
      totalJobPositions: 0,
      totalUsers: 0,
      totalUsersWithReports: 0,
      totalUsersWithCompletedReports: 0,
      totalUsersWithoutReports: 0,
      averageSubmissionRate: 0,
      averageCompletionRate: 0,
    }
  }

  return {
    totalPositions: summary.totalPositions ?? 0,
    totalJobPositions: summary.totalJobPositions ?? 0,
    totalUsers: summary.totalSubordinates ?? 0,
    totalUsersWithReports: summary.subordinatesWithReports ?? 0,
    totalUsersWithCompletedReports: summary.subordinatesWithCompletedReports ?? 0,
    totalUsersWithoutReports: summary.subordinatesWithoutReports ?? 0,
    averageSubmissionRate: summary.reportSubmissionRate ?? 0,
    averageCompletionRate: summary.overallTaskCompletionRate ?? 0,
  }
}

function AdminOverview() {
  const { user: currentUser } = useAuth()
  const { filters, apiFilters, filterDisplayText, handleFiltersChange } = useAdminOverviewFilters()
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false)
  const { search, setSearch } = useAdminOverviewStore()

  // ✅ FIXED: Better hook usage with stable references
  const {
    data: overview,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchAdminOverview,
    isStoreRefreshing,
  } = useAdminOverview(apiFilters)

  // ✅ NEW: Force refresh on component mount to ensure fresh data
  useEffect(() => {
    // Small delay to ensure store is initialized
    const timer = setTimeout(() => {
      refetchAdminOverview()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [refetchAdminOverview]) // Only run on mount

  // ✅ FIXED: Stable handlers to prevent re-renders
  const handleFiltersChangeWithRefetch = useCallback(
    (newFilters: any) => {
      handleFiltersChange(newFilters)
      // ✅ REMOVED: Automatic refetch - let hook handle it
    },
    [handleFiltersChange],
  )

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true)
    try {
      await refetchAdminOverview()
    } finally {
      // ✅ OPTIMIZED: Shorter manual refresh state
      setTimeout(() => {
        setIsManualRefreshing(false)
      }, 500)
    }
  }, [refetchAdminOverview])

  // ✅ STABLE: Memoized transforms to prevent unnecessary re-calculations
  const positionCards = useMemo(() => {
    // ✅ KEEP ORIGINAL: Use overview.data instead of overview directly
    if (!overview) return []
    return transformManagerReportsToPositionCardFormat(overview)
  }, [overview])

  const { managementTabs, jobPositionTabs } = useMemo(() => {
    return groupPositionsForOverview(positionCards)
  }, [positionCards])

  // ✅ STABLE: Memoized tabs to prevent re-renders
  const availableTabs = useMemo(() => {
    const tabs: Array<{
      id: string
      label: string
      icon: any
      show: boolean
      positions?: any[]
      isManagement?: boolean
    }> = [
        {
          id: "overview",
          label: "Tổng quan",
          icon: BarChart3,
          show: true,
        },
      ]

    managementTabs.forEach(tab => {
      tabs.push({
        id: tab.id,
        label: tab.label,
        icon: Crown,
        show: true,
        positions: tab.positions,
        isManagement: true,
      })
    })

    jobPositionTabs.forEach(tab => {
      tabs.push({
        id: tab.id,
        label: tab.label,
        icon: Users,
        show: true,
        positions: tab.positions,
        isManagement: false,
      })
    })

    return tabs.filter(tab => tab.show)
  }, [managementTabs, jobPositionTabs])

  // ✅ STABLE: Current tab logic
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

  // ✅ STABLE: Callback handlers
  const handleBackToOverview = useCallback(() => {
    setActiveTab("overview")
  }, [])

  // ✅ STABLE: Filtered tabs for search
  const filteredManagementTabs = useMemo(() => {
    if (!search) return managementTabs
    return managementTabs.filter(tab =>
      tab.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [managementTabs, search])

  const filteredJobPositionTabs = useMemo(() => {
    if (!search) return jobPositionTabs
    return jobPositionTabs.filter(tab =>
      tab.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [jobPositionTabs, search])

  // ✅ IMPROVED: Better loading state detection
  const isActuallyLoading = hierarchyLoading || isStoreRefreshing || isManualRefreshing

  // ✅ FIXED: Show loading only when really loading and no data
  if (isActuallyLoading && !overview) {
    return (
      <ScreenLoading 
        size="md" 
        variant="grid"
        text="Đang tải tổng quan quản lý..." 
        fullScreen 
      />
    )
  }

  if (hierarchyError && !overview) { // ✅ Only show error if no cached data
    return (
      <div className="max-w-xl mx-auto mt-12 text-center py-8 bg-destructive/10 rounded-lg border border-destructive/20">
        <div className="text-destructive font-bold mb-2">Lỗi tải dữ liệu</div>
        <div className="text-muted-foreground">{String(hierarchyError)}</div>
        <Button onClick={handleRefresh} className="mt-4" disabled={isManualRefreshing}>
          {isManualRefreshing ? "Đang thử lại..." : "Thử lại"}
        </Button>
      </div>
    )
  }

  // ✅ FIXED: Only show "no data" if not loading and really no data
  if (!overview && !isActuallyLoading) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center py-8">
        <div className="text-muted-foreground mb-4">Không có dữ liệu</div>
        <Button onClick={handleRefresh} disabled={isManualRefreshing}>
          {isManualRefreshing ? "Đang tải..." : "Tải lại"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* ✅ OPTIMIZED: Add loading overlay for better UX */}
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

      <AdminOverviewHeader
        filterDisplayText={filterDisplayText}
        filters={filters}
        onFiltersChange={handleFiltersChangeWithRefetch}
        onRefresh={handleRefresh}
      />

      <div className="px-1 sm:px-0 transition-opacity duration-300" style={{ opacity: isStoreRefreshing ? 0.7 : 1 }}>
        <HierarchySummaryCards 
          // ✅ KEEP ORIGINAL: Use overview.data not overview directly
          summary={transformManagerReportsSummaryForCards(overview?.summary)}
        />
      </div>

      {/* ✅ OPTIMIZED: Main content with smooth transitions */}
      <Card className="border-border/50 dark:border-border/90 shadow-green-glow/20 transition-all duration-300">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          {effectiveActiveTab !== "overview" && (
            <div className="flex flex-col gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToOverview}
                className="flex items-center gap-2 hover:bg-green-500/10 bg-green-gradient text-foreground w-fit text-sm transition-all duration-200 hover:scale-[1.02]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Quay lại tổng quan</span>
                <span className="xs:hidden">Tổng quan</span>
              </Button>
            </div>
          )}

          {effectiveActiveTab === "overview" && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Tổng quan theo vị trí</span>
                  <span className="sm:hidden">Tổng quan</span>
                </CardTitle>

                <div className="w-full sm:w-auto sm:max-w-xs">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm transition-all duration-200 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="transition-opacity duration-300" style={{ opacity: isStoreRefreshing ? 0.7 : 1 }}>
            {effectiveActiveTab === "overview" ? (
              <div className="space-y-4 sm:space-y-6">
                {/* ✅ Rest of component unchanged but with optimized animations */}
                {filteredManagementTabs.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-warm-gradient shadow-green-glow transition-transform duration-200 hover:scale-105">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-green-gradient">Cấp quản lý</h3>
                      <Badge variant="outline" className="glass-green border-green-500/30 text-xs transition-colors">
                        {managementTabs.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filteredManagementTabs.map((tab) => (
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

                {filteredJobPositionTabs.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-green-gradient shadow-green-glow transition-transform duration-200 hover:scale-105">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-green-gradient">Vị trí công việc</h3>
                      <Badge variant="outline" className="glass-green border-green-500/30 text-xs transition-colors">
                        {jobPositionTabs.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filteredJobPositionTabs.map((tab) => (
                        <OverviewCard
                          key={tab.id}
                          title={tab.label}
                          count={tab.positions?.length || 0}
                          icon={Users}
                          onClick={() => setActiveTab(tab.id)}
                          description="Vị trí công việc"
                          variant="employee"
                          positions={tab.positions || []}
                          isJobPosition={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredManagementTabs.length === 0 && filteredJobPositionTabs.length === 0 && (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      {search ? "Không tìm thấy" : "Không có dữ liệu"}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                      {search
                        ? `Không tìm thấy vị trí phù hợp với "${search}"`
                        : "Không có dữ liệu với bộ lọc hiện tại"
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <PositionGroupsList
                  positions={currentTab?.positions || []}
                  filterDisplayText={filterDisplayText}
                  isManagement={true}
                  weekNumber={apiFilters.weekNumber || filters.weekNumber}
                  year={filters.year || new Date().getFullYear()}
                  canEvaluation={currentUser?.isManager}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminOverviewPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <ScreenLoading
            size="lg"
            variant="grid"
            fullScreen
            backdrop
          />
        }
      >
        <AdminOverview />
      </Suspense>
    </MainLayout>
  )
}
