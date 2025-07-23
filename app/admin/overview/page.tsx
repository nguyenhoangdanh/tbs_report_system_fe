"use client"

import { useState, useMemo, useEffect } from "react"
import { useManagerReports } from "@/hooks/use-hierarchy"
import { useCurrentWeekFilters } from "@/hooks/use-hierarchy"
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation  } from "@/hooks/use-task-evaluation"
import { useAuth } from "@/components/providers/auth-provider"
import { HierarchySummaryCards } from "@/components/hierarchy/hierarchy-summary-cards"
import { ScreenLoading } from "@/components/loading/screen-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AnimatedButton } from "@/components/ui/animated-button"
import { MainLayout } from "@/components/layout/main-layout"
import { ReportTemplate } from "@/components/reports/report-template"
import {
  Users,
  Building2,
  FileCheck,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
} from "lucide-react"
import { type TaskEvaluation, EvaluationType, type Task, type WeeklyReport } from "@/types"
import { Suspense } from "react"
import { useApproveTask, useRejectTask } from "@/hooks/use-reports"
import type { UserDetailsResponse, ManagerReportsEmployee } from "@/types/hierarchy"
import { toast } from "react-toast-kit"
import { useUserDetails } from "@/hooks/use-hierarchy"
import { useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"

interface EvaluationFormState {
  evaluatedIsCompleted: boolean
  evaluatedReasonNotDone: string
  evaluatorComment: string
  evaluationType: EvaluationType
}

// Transform employee detail data to WeeklyReport format for ReportTemplate
const transformToWeeklyReport = (data: UserDetailsResponse, weekNumber: number, year: number): WeeklyReport | null => {
  if (!data.reports || data.reports.length === 0) {
    return null
  }

  // Find the report for the specified week, or use the first available report
  const targetReport = data.reports.find((r) => r.weekNumber === weekNumber && r.year === year) || data.reports[0]

  return {
    id: targetReport.id,
    weekNumber: targetReport.weekNumber,
    year: targetReport.year,
    isCompleted: targetReport.isCompleted,
    isLocked: targetReport.isLocked,
    createdAt: targetReport.createdAt,
    updatedAt: targetReport.updatedAt,
    userId: data.user.id,
    tasks: targetReport.tasks || [],
    evaluations: targetReport.evaluations || [],
    user: data.user,
    totalTasks: targetReport.totalTasks,
    completedTasks: targetReport.completedTasks,
    taskCompletionRate: targetReport.taskCompletionRate,
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
    // Optionally add rankingDistribution or other fields if needed
  }
}

function AdminOverview() {
  const { user: currentUser } = useAuth()
  const filters = useCurrentWeekFilters()
  const queryClient = useQueryClient()

  // Thêm userId vào queryKey để cache tách biệt theo user
  const { data: overview, isLoading, error } = useManagerReports({ ...filters, userId: currentUser?.id })

  // Search state
  const [search, setSearch] = useState<string>("")

  // Evaluation modal states
  const [openEvalModal, setOpenEvalModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<ManagerReportsEmployee | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editEvaluation, setEditEvaluation] = useState<TaskEvaluation | null>(null)
  const [form, setForm] = useState<EvaluationFormState>({
    evaluatedIsCompleted: true,
    evaluatedReasonNotDone: "",
    evaluatorComment: "",
    evaluationType: EvaluationType.REVIEW,
  })

  // Employee detail modal states
  const [openEmployeeModal, setOpenEmployeeModal] = useState(false)
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<ManagerReportsEmployee | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)

  // Hooks for create/update/delete
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()

  // Use React Query for user details (always fresh after invalidation)
  const {
    data: employeeDetailData,
    isLoading: loadingEmployeeDetail,
    error: employeeDetailError,
    refetch: refetchEmployeeDetail,
  } = useUserDetails(
    selectedEmployeeDetail?.user?.id || "",
    openEmployeeModal ? { weekNumber: filters.weekNumber, year: filters.year, userId: currentUser?.id } : undefined,
  )

  // When employeeDetailData changes, update weeklyReport
  useMemo(() => {
    if (employeeDetailData && openEmployeeModal) {
      const report = transformToWeeklyReport(employeeDetailData, filters.weekNumber, filters.year)
      setWeeklyReport(report)
    }
  }, [employeeDetailData, filters.weekNumber, filters.year, openEmployeeModal])

  // Flatten all employees from groupedReports
  const allEmployees: ManagerReportsEmployee[] =
    overview?.groupedReports.flatMap((positionGroup) =>
      positionGroup.jobPositions.flatMap((jobPositionGroup) => jobPositionGroup.employees),
    ) || []

  // Department breakdown: aggregate from all employees
  const departmentMap = new Map<
    string,
    {
      id: string
      name: string
      totalSubordinates: number
      subordinatesWithReports: number
      subordinatesWithCompletedReports: number
      completedTasks: number
      totalTasks: number
    }
  >()
  allEmployees.forEach((emp) => {
    const dept = emp.user.jobPosition.department
    const deptId = dept.id
    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, {
        id: deptId,
        name: dept.name,
        totalSubordinates: 0,
        subordinatesWithReports: 0,
        subordinatesWithCompletedReports: 0,
        completedTasks: 0,
        totalTasks: 0,
      })
    }
    const d = departmentMap.get(deptId)!
    d.totalSubordinates++
    if (emp.stats.hasReport) d.subordinatesWithReports++
    if (emp.stats.isCompleted) d.subordinatesWithCompletedReports++
    d.completedTasks += emp.stats.completedTasks
    d.totalTasks += emp.stats.totalTasks
  })

  // Filter employees by search
  const filteredEmployees = search
    ? allEmployees.filter((emp) => {
      const name = `${emp.user.firstName} ${emp.user.lastName}`.toLowerCase()
      return name.includes(search.trim().toLowerCase())
    })
    : allEmployees

  // Open evaluation modal
  const handleOpenEval = (employee: ManagerReportsEmployee, task: Task) => {
    setSelectedEmployee(employee)
    setSelectedTask(task)
    const myEval = task.evaluations?.find((ev: TaskEvaluation) => ev.evaluatorId === currentUser?.id) || null
    setEditEvaluation(myEval)

    // Properly populate form with existing values or defaults
    setForm({
      evaluatedIsCompleted: myEval?.evaluatedIsCompleted ?? task.isCompleted,
      evaluatedReasonNotDone: myEval?.evaluatedReasonNotDone ?? task.reasonNotDone ?? "",
      evaluatorComment: myEval?.evaluatorComment ?? "",
      evaluationType: myEval?.evaluationType ?? EvaluationType.REVIEW,
    })
    setOpenEvalModal(true)
  }

  // Submit evaluation with task status update
  const handleSubmitEval = async () => {
    if (!selectedTask || !selectedEmployee) return

    try {
      let evaluationResult: TaskEvaluation
      const originalIsCompleted = selectedTask.isCompleted

      if (editEvaluation) {
        evaluationResult = await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data: form,
        })
      } else {
        evaluationResult = await createEval.mutateAsync({
          ...form,
          taskId: selectedTask.id,
        })
      }

      // Special logic: Check if manager changed the completion status
      if (currentUser?.isManager && form.evaluatedIsCompleted !== originalIsCompleted) {
        if (form.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
        }
      }

      // Invalidate manager-reports to force AdminOverviewPage to refetch new data
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: "all" })

      setOpenEvalModal(false)
      toast.success(editEvaluation ? "Đánh giá đã được cập nhật thành công!" : "Đánh giá đã được tạo thành công!")
    } catch (error) {
      console.error("Error submitting evaluation:", error)
      toast.error("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!")
    }
  }

  // Delete evaluation
  const handleDeleteEval = async () => {
    if (!editEvaluation) return

    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      // Invalidate manager-reports to force AdminOverviewPage to refetch new data
      queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: "all" })
      setOpenEvalModal(false)
      toast.success("Đánh giá đã được xóa thành công!")
    } catch (error) {
      console.error("Error deleting evaluation:", error)
      toast.error("Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!")
    }
  }

  // Open employee detail modal and trigger fetch
  const handleViewEmployee = (employee: ManagerReportsEmployee) => {
    if (!employee?.user?.id) {
      toast.error("Thông tin nhân viên không hợp lệ")
      return
    }
    setSelectedEmployeeDetail(employee)
    setOpenEmployeeModal(true)
    setWeeklyReport(null)
  }

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
          icon: CheckCircle2,
          text: "Hoàn thành",
        }
      case "incomplete":
        return {
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
          icon: Clock,
          text: "Chưa hoàn thành",
        }
      default:
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
          icon: AlertCircle,
          text: "Chưa nộp",
        }
    }
  }

  // Reset state & cache when user changes (logout/login)
  useEffect(() => {
    // Reset all local states
    setSearch("")
    setOpenEvalModal(false)
    setSelectedEmployee(null)
    setSelectedTask(null)
    setEditEvaluation(null)
    setForm({
      evaluatedIsCompleted: true,
      evaluatedReasonNotDone: "",
      evaluatorComment: "",
      evaluationType: EvaluationType.REVIEW,
    })
    setOpenEmployeeModal(false)
    setSelectedEmployeeDetail(null)
    setWeeklyReport(null)
    // Clear React Query cache for manager-reports and user-details
    queryClient.removeQueries({ queryKey: ["hierarchy", "manager-reports"] })
    queryClient.removeQueries({ queryKey: ["hierarchy", "user-details"] })
  }, [currentUser?.id, queryClient])

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

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Phân bổ phòng ban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(departmentMap.values()).map((dept) => (
              <div
                key={dept.id}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{dept.name}</h4>
                  <Badge variant="outline">{dept.totalSubordinates}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã nộp:</span>
                    <span className="font-medium">
                      {dept.subordinatesWithReports}/{dept.totalSubordinates}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hoàn thành:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {dept.subordinatesWithCompletedReports}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Công việc:</span>
                    <span className="font-medium">
                      {dept.completedTasks}/{dept.totalTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${dept.totalTasks > 0 ? (dept.completedTasks / dept.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <Input
          type="text"
          placeholder="Tìm kiếm nhân viên theo tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs"
        />
      </div>

      {/* Subordinates Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Danh sách nhân viên cấp dưới
            </div>
            <Badge variant="secondary">{filteredEmployees.length} nhân viên</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((sub) => {
              const statusInfo = getStatusInfo(sub.stats.status)
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={sub.user.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {`${sub.user.firstName} ${sub.user.lastName}`}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {sub.user.jobPosition?.department?.name || "No Department"}
                      </p>
                      <p className="text-xs text-muted-foreground">{sub.user.employeeCode}</p>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hoàn thành:</span>
                      <span className="font-medium">
                        {sub.stats.completedTasks}/{sub.stats.totalTasks}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tỷ lệ:</span>
                      <span
                        className={`font-medium ${sub.stats.taskCompletionRate >= 80
                            ? "text-green-600 dark:text-green-400"
                            : sub.stats.taskCompletionRate >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                      >
                        {sub.stats.taskCompletionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${sub.stats.taskCompletionRate >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : sub.stats.taskCompletionRate >= 60
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : "bg-gradient-to-r from-red-400 to-red-600"
                          }`}
                        style={{ width: `${sub.stats.taskCompletionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleViewEmployee(sub)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Employee Detail Modal with ReportTemplate - Fixed positioning */}
      <Dialog open={openEmployeeModal} onOpenChange={setOpenEmployeeModal}>
        <DialogContent
          className="w-full h-full sm:max-w-7xl sm:w-[95vw] sm:h-[90vh] overflow-y-auto rounded-none sm:rounded-xl p-0 m-0"
          style={{
            position: "fixed",
            top: "15vh",
            left: "0",
            right: "0",
            bottom: "0",
            transform: "none",
            maxHeight: "80vh",
            borderRadius: "12px",
            ...(window.innerWidth >= 640 && {
              top: "12vh",
              left: "50%",
              right: "auto",
              bottom: "auto",
              transform: "translateX(-50%)",
              maxHeight: "85vh",
              width: "95vw",
              // height: "90vh",
              borderRadius: "12px",
            }),
          }}
        >
          <DialogHeader className="p-3 sm:p-6 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">
                Báo cáo chi tiết nhân viên:{" "}
                {`${selectedEmployeeDetail?.user?.firstName || ""} ${selectedEmployeeDetail?.user?.lastName || ""}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          {loadingEmployeeDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Đang tải báo cáo nhân viên...</span>
              </div>
            </div>
          ) : employeeDetailError ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{String(employeeDetailError)}</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => refetchEmployeeDetail()}>
                Thử lại
              </Button>
            </div>
          ) : weeklyReport ? (
            <div className="space-y-4">
              {/* Display ReportTemplate */}
              <ReportTemplate report={weeklyReport} canEvaluation={true} className="border-0 shadow-none" />
            </div>
          ) : employeeDetailData ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                Nhân viên này chưa có báo cáo cho tuần {filters.weekNumber}/{filters.year}.
              </p>

              {/* Show available reports if any */}
              {employeeDetailData.reports && employeeDetailData.reports.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm mb-4">Các báo cáo có sẵn:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {employeeDetailData.reports.map((report) => (
                      <Button
                        key={report.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const transformedReport = transformToWeeklyReport(
                            employeeDetailData,
                            report.weekNumber,
                            report.year,
                          )
                          if (transformedReport) {
                            setWeeklyReport(transformedReport)
                          }
                        }}
                      >
                        Tuần {report.weekNumber}/{report.year}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Evaluation Modal */}
      <Dialog open={openEvalModal} onOpenChange={setOpenEvalModal}>
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

          <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trạng thái hoàn thành <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.evaluatedIsCompleted ? "true" : "false"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      evaluatedIsCompleted: e.target.value === "true",
                      evaluatedReasonNotDone: e.target.value === "true" ? "" : f.evaluatedReasonNotDone,
                    }))
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="true">✅ Hoàn thành</option>
                  <option value="false">❌ Chưa hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nguyên nhân/Giải pháp</label>
                <textarea
                  value={form.evaluatedReasonNotDone}
                  onChange={(e) => setForm((f) => ({ ...f, evaluatedReasonNotDone: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Nhập nguyên nhân nếu chưa hoàn thành..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
                <textarea
                  value={form.evaluatorComment}
                  onChange={(e) => setForm((f) => ({ ...f, evaluatorComment: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Nhập nhận xét, góp ý..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Loại đánh giá <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.evaluationType}
                  onChange={(e) => setForm((f) => ({ ...f, evaluationType: e.target.value as EvaluationType }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {Object.values(EvaluationType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setOpenEvalModal(false)}>
                Hủy
              </Button>
              {editEvaluation && (
                <Button variant="destructive" onClick={handleDeleteEval} disabled={deleteEval.isPending}>
                  Xóa đánh giá
                </Button>
              )}
              <AnimatedButton
                onClick={handleSubmitEval}
                loading={createEval.isPending || updateEval.isPending || approveTask.isPending || rejectTask.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editEvaluation ? "Cập nhật" : "Gửi đánh giá"}
              </AnimatedButton>
            </div>
          </div>
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
