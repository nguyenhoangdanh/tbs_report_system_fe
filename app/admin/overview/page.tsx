"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useManagerReports } from "@/hooks/use-hierarchy"
import { useCurrentWeekFilters } from "@/hooks/use-hierarchy"
import { useAuth } from "@/components/providers/auth-provider"
import { useAdminOverviewStore } from "@/store/admin-overview-store"
import { useEvaluationForm } from "@/hooks/use-evaluation-form"
import { HierarchySummaryCards } from "@/components/hierarchy/hierarchy-summary-cards"
import { ScreenLoading } from "@/components/loading/screen-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AnimatedButton } from "@/components/ui/animated-button"
import { MainLayout } from "@/components/layout/main-layout"
import { PositionCard } from "@/components/hierarchy/position-card"
import { OverviewCard } from "@/components/hierarchy/hierarchy-dashboard"
import { FormField } from "@/components/ui/form-field"
import {
  Users,
  Building2,
  Calendar,
  Star,
  ArrowLeft,
  Crown,
  BarChart3,
} from "lucide-react"
import { type TaskEvaluation, EvaluationType, type Task, type WeeklyReport } from "@/types"
import { Suspense } from "react"
import type { UserDetailsResponse, ManagerReportsEmployee } from "@/types/hierarchy"
import { toast } from "react-toast-kit"
import { useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField as ReactHookFormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

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
        fail: { count: 0, percentage: 0 },
      }

      employees.forEach(emp => {
        const rate = emp.stats.taskCompletionRate
        if (rate === 100) rankingDistribution.excellent.count++
        else if (rate >= 95) rankingDistribution.good.count++
        else if (rate >= 90) rankingDistribution.average.count++
        else if (rate >= 85) rankingDistribution.poor.count++
        else rankingDistribution.fail.count++
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
  const filters = useCurrentWeekFilters()
  const queryClient = useQueryClient()

  // Local state for view mode - Similar to HierarchyDashboard
  const [activeTab, setActiveTab] = useState<string>("overview")

  // ZUSTAND store for evaluation modal only
  const {
    search,
    setSearch,
    openEvalModal,
    setEvaluationModal,
    resetAllStates,
    lastUserId,
    setLastUserId,
  } = useAdminOverviewStore()

  // STABLE filters để tránh rerender
  const stableFilters = useMemo(() => ({
    ...filters, 
    userId: currentUser?.id
  }), [filters.weekNumber, filters.year, currentUser?.id])

  // STABLE query với memoized filters - GIỮ NGUYÊN LOGIC CŨ
  const { data: overview, isLoading, error } = useManagerReports(stableFilters)

  // Evaluation form hook với react-hook-form + zod
  const {
    form: evaluationForm,
    isSubmitting: isSubmittingEvaluation,
    handleSubmitEvaluation,
    handleDeleteEvaluation,
    selectedTask,
    selectedEmployee,
    editEvaluation,
  } = useEvaluationForm()

  // THAY ĐỔI: Transform data để tương thích với PositionCard
  const positionCards = useMemo(() => {
    if (!overview) return []
    return transformManagerReportsToPositionCardFormat(overview)
  }, [overview])

console.log('🔄 AdminOverview: positionCards transformed:', positionCards)

  // Group positions for overview display
  const { managementTabs, jobPositionTabs } = useMemo(() => {
    return groupPositionsForOverview(positionCards)
  }, [positionCards])

  // Available tabs similar to HierarchyDashboard
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

    // Add management tabs
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

    // Add job position tabs
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

  // Current tab logic
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

  // Handle back to overview
  const handleBackToOverview = useCallback(() => {
    setActiveTab("overview")
  }, [])

  // Filter by search
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

  // Reset state & cache when user changes (logout/login) - OPTIMIZED
  useEffect(() => {
    if (currentUser?.id !== lastUserId) {
      resetAllStates()
      setLastUserId(currentUser?.id || null)
      setActiveTab("overview")
      // TARGETED cache clearing - only clear specific queries
      queryClient.removeQueries({ queryKey: ["hierarchy"] })
    }
  }, [currentUser?.id, lastUserId, setLastUserId, queryClient, resetAllStates])

  if (isLoading) {
    return <ScreenLoading size="md" variant="dual-ring" text="Đang tải tổng quan quản lý..." fullScreen />
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center py-8 bg-destructive/10 rounded-lg border border-destructive/20">
        <div className="text-destructive font-bold mb-2">Lỗi tải dữ liệu</div>
        <div className="text-muted-foreground">{String(error)}</div>
      </div>
    )
  }

  if (!overview) {
    return <ScreenLoading size="md" variant="dual-ring" text="Đang xử lý dữ liệu..." fullScreen />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Manager Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">Quản lý:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {`${overview?.manager?.firstName || "N/A"} ${overview?.manager?.lastName || ""}`}
                  </span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <Badge variant="outline" className="w-fit">
                    {overview?.manager?.office?.name || "No Office"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {overview?.manager?.jobPosition?.position?.name || "No Position"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Tuần {filters.weekNumber}/{filters.year}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <HierarchySummaryCards summary={transformManagerReportsSummaryForCards(overview?.summary)} />

      {/* Main Content Card */}
      <Card className="border-border/50 dark:border-border/90 shadow-green-glow/20">
        <CardHeader>
          {effectiveActiveTab !== "overview" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToOverview}
                className="flex items-center gap-2 hover:bg-green-500/10 bg-green-gradient text-foreground w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại tổng quan
              </Button>
            </div>
          )}
          
          {effectiveActiveTab === "overview" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Tổng quan theo vị trí
              </CardTitle>
              <Input
                type="text"
                placeholder="Tìm kiếm theo vị trí..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {effectiveActiveTab === "overview" ? (
            <div className="space-y-6">
              {/* Management positions cards */}
              {filteredManagementTabs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-warm-gradient shadow-green-glow">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-gradient">Cấp quản lý</h3>
                    <Badge variant="outline" className="glass-green border-green-500/30">
                      {managementTabs.length} nhóm
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Job positions cards */}
              {filteredJobPositionTabs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-green-gradient shadow-green-glow">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-gradient">Vị trí công việc</h3>
                    <Badge variant="outline" className="glass-green border-green-500/30">
                      {jobPositionTabs.length} nhóm
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Fallback if no data */}
              {filteredManagementTabs.length === 0 && filteredJobPositionTabs.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {search ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                  </h3>
                  <p className="text-muted-foreground">
                    {search 
                      ? `Không tìm thấy vị trí nào phù hợp với "${search}"`
                      : "Không tìm thấy dữ liệu với bộ lọc hiện tại"
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* THAY ĐỔI: Sử dụng PositionCard để hiển thị chi tiết */}
              {currentTab?.positions?.map((position, index) => (
                <PositionCard
                  key={position._uniqueKey || position.position?.id || position.jobPosition?.id || index}
                  position={position}
                  weekNumber={filters.weekNumber}
                  year={filters.year}
                  canEvaluation={currentUser?.isManager}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Modal - GIỮ NGUYÊN */}
      <Dialog open={openEvalModal} onOpenChange={(open) => setEvaluationModal(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              {editEvaluation ? "Chỉnh sửa đánh giá" : "Đánh giá công việc"}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Nhân viên:</span>{" "}
                {`${selectedEmployee?.user?.firstName || ""} ${selectedEmployee?.user?.lastName || ""}`}
              </div>
              <div>
                <span className="font-medium">Công việc:</span> {selectedTask?.taskName || "N/A"}
              </div>
            </div>
          </DialogHeader>

          <Form {...evaluationForm}>
            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              {editEvaluation && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">Đánh giá hiện tại:</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      Trạng thái:{" "}
                      <span className={editEvaluation.evaluatedIsCompleted ? "text-green-600" : "text-red-600"}>
                        {editEvaluation.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                      </span>
                    </div>
                    {editEvaluation.evaluatorComment && <div>Nhận xét: {editEvaluation.evaluatorComment}</div>}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <ReactHookFormField
                  control={evaluationForm.control}
                  name="evaluatedIsCompleted"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>
                        Trạng thái hoàn thành <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span>{field.value ? "✅ Hoàn thành" : "❌ Chưa hoàn thành"}</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReactHookFormField
                  control={evaluationForm.control}
                  name="evaluatedReasonNotDone"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Nguyên nhân/Giải pháp</FormLabel>
                      <FormControl>
                        <FormField
                          id="evaluatedReasonNotDone"
                          type="text"
                          placeholder="Nhập nguyên nhân nếu chưa hoàn thành..."
                          {...field}
                          showPasswordToggle={false}
                          className="w-full min-h-[80px] resize-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReactHookFormField
                  control={evaluationForm.control}
                  name="evaluatorComment"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Nhận xét của bạn</FormLabel>
                      <FormControl>
                        <FormField
                          id="evaluatorComment"
                          type="text"
                          placeholder="Nhập nhận xét, góp ý..."
                          {...field}
                          showPasswordToggle={false}
                          className="w-full min-h-[80px] resize-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReactHookFormField
                  control={evaluationForm.control}
                  name="evaluationType"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>
                        Loại đánh giá <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại đánh giá" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EvaluationType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" type="button" onClick={() => setEvaluationModal(false)}>
                  Hủy
                </Button>
                {editEvaluation && (
                  <Button 
                    variant="destructive" 
                    type="button"
                    onClick={handleDeleteEvaluation} 
                    disabled={isSubmittingEvaluation}
                  >
                    Xóa đánh giá
                  </Button>
                )}
                <AnimatedButton
                  type="submit"
                  loading={isSubmittingEvaluation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editEvaluation ? "Cập nhật" : "Gửi đánh giá"}
                </AnimatedButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminOverviewPage() {
  return (
    <MainLayout
      showBreadcrumb
      breadcrumbItems={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Quản lý người dùng" }]}
    >
      <Suspense fallback={<ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />}>
        <AdminOverview />
      </Suspense>
    </MainLayout>
  )
}