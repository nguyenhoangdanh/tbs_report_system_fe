"use client"

import { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useReportDetailsForAdmin } from "@/hooks/use-hierarchy"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, CheckCircle2, Clock, Calendar, FileText, BarChart3, Target } from "lucide-react"
import Link from "next/link"
import { getPerformanceBadge, classifyPerformance } from "@/utils/performance-classification"
import { SimplePieChart } from "@/components/charts/simple-pie-chart"
import { safeNumber, safeString, safeArray } from "@/utils/type-guards"
import { ScreenLoading } from "@/components/loading/screen-loading"

function ReportDetailsContent() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const userId = params?.userId as string
  const reportId = params?.reportId as string

  const weekNumberFromUrl = searchParams.get("weekNumber")
  const yearFromUrl = searchParams.get("year")
  const returnTo = searchParams.get("returnTo")

  const { data: reportData, isLoading, error } = useReportDetailsForAdmin(userId, reportId)

  if (!currentUser) {
    return <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop text="Đang xác thực..." />
  }

  const allowedRoles = ["SUPERADMIN", "ADMIN", "OFFICE_MANAGER", "OFFICE_ADMIN"]
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Admin", href: "/admin" },
          { label: "Báo cáo KH & KQCV", href: "/admin/hierarchy" },
          { label: "Chi tiết báo cáo" },
        ]}
      >
        <div className="max-w-4xl mx-auto p-responsive">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Không có quyền truy cập</h2>
              <p className="text-destructive/80">Bạn không có quyền xem chi tiết báo cáo này.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-8xl mx-auto p-responsive">
          <ScreenLoading text="Đang tải chi tiết báo cáo..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !reportData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[{ label: "Báo cáo KH & KQCV", href: "/admin/hierarchy" }, { label: "Chi tiết báo cáo" }]}
      >
        <div className="max-w-4xl mx-auto p-responsive">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Không thể tải dữ liệu</h2>
              <p className="text-destructive/80 mb-4">
                {(error as any)?.message || "Có lỗi xảy ra khi tải chi tiết báo cáo"}
              </p>
              <Link href={`/admin/hierarchy/user/${userId}/reports`}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const { report, user: userInfo, stats } = reportData

  const getBackUrl = () => {
    if (returnTo === "user-details" && weekNumberFromUrl && yearFromUrl) {
      return `/admin/hierarchy/user/${userId}?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}`
    }
    return `/admin/hierarchy/user/${userId}/reports${weekNumberFromUrl && yearFromUrl ? `?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}` : ""
      }`
  }

  const getDayName = (day: string) => {
    const dayNames: Record<string, string> = {
      monday: "Thứ 2",
      tuesday: "Thứ 3",
      wednesday: "Thứ 4",
      thursday: "Thứ 5",
      friday: "Thứ 6",
      saturday: "Thứ 7",
    }
    return dayNames[day] || day
  }

  const taskCompletionRate = safeNumber(stats?.taskCompletionRate, 0)
  const performanceBadge = getPerformanceBadge(taskCompletionRate)
  const classification = classifyPerformance(taskCompletionRate)

  const totalTasks = safeNumber(stats?.totalTasks, 0)
  const completedTasks = safeNumber(stats?.completedTasks, 0)
  const incompleteTasks = safeNumber(stats?.incompleteTasks, 0)
  const tasksByDay = stats?.tasksByDay || {}

  return (
    <MainLayout
      title={`Chi tiết báo cáo: Tuần ${report?.weekNumber || "N/A"}/${report?.year || "N/A"}`}
      subtitle={`${userInfo?.firstName || "N/A"} ${userInfo?.lastName || ""} - ${userInfo?.employeeCode || "N/A"}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: "Báo cáo KH & KQCV", href: "/admin/hierarchy" },
        {
          label: `${userInfo?.firstName || "N/A"} ${userInfo?.lastName || ""}`,
          href:
            weekNumberFromUrl && yearFromUrl
              ? `/admin/hierarchy/user/${userId}?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}`
              : `/admin/hierarchy/user/${userId}`,
        },
        { label: `Tuần ${report?.weekNumber || "N/A"}/${report?.year || "N/A"}` },
      ]}
    >
      <div className="max-w-8xl mx-auto p-responsive space-y-6">
        {/* Navigation */}
        <div>
          <Link href={getBackUrl()}>
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </Link>
        </div>

        {/* Report Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Báo cáo Tuần {report?.weekNumber || "N/A"}/{report?.year || "N/A"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {userInfo?.firstName || "N/A"} {userInfo?.lastName || ""}
                    </Badge>
                    <Badge variant="secondary">{userInfo?.employeeCode || "N/A"}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{taskCompletionRate}%</div>
                  <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                  <Badge className={`${performanceBadge.className} mt-2`}>{performanceBadge.label}</Badge>
                </div>
                <SimplePieChart completedPercentage={taskCompletionRate} size={80} strokeWidth={8} />
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Overview */}
        <div className="grid grid-responsive-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng công việc</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">Được giao trong tuần</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% tổng công việc
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chưa hoàn thành</CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{incompleteTasks}</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks > 0 ? Math.round((incompleteTasks / totalTasks) * 100) : 0}% tổng công việc
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ngày làm việc</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasksByDay ? Object.values(tasksByDay).filter((count: any) => safeNumber(count, 0) > 0).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Có công việc</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái báo cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-responsive-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Trạng thái</div>
                <Badge variant={report?.isCompleted ? "default" : "secondary"}>
                  {report?.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
                </Badge>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Khóa báo cáo</div>
                <Badge variant={report?.isLocked ? "destructive" : "outline"}>
                  {report?.isLocked ? "Đã khóa" : "Có thể chỉnh sửa"}
                </Badge>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Cập nhật lần cuối</div>
                <div className="text-sm font-medium">
                  {report?.updatedAt ? new Date(report.updatedAt).toLocaleString("vi-VN") : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chi tiết công việc ({Array.isArray(report?.tasks) ? report.tasks.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(report?.tasks) && report.tasks.length > 0 ? (
              <div className="space-y-4">
                {report.tasks.map((task: any, index: number) => {
                  const taskId = safeString(task?.id, `task-${index}`)
                  const taskName = safeString(task?.taskName, "Công việc không xác định")
                  const isCompleted = Boolean(task?.isCompleted)
                  const reasonNotDone = safeString(task?.reasonNotDone, "")
                  const updatedAt = safeString(task?.updatedAt, new Date().toISOString())

                  return (
                    <div key={taskId} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{taskName}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={isCompleted ? "default" : "secondary"}>
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Hoàn thành
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Chưa hoàn thành
                                </>
                              )}
                            </Badge>
                            {!isCompleted && reasonNotDone && (
                              <Badge variant="outline" className="text-xs">
                                Lý do: {reasonNotDone}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Cập nhật: {new Date(updatedAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => (
                          <div
                            key={day}
                            className={`text-center p-2 rounded text-xs border ${task?.[day]
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-muted/50 text-muted-foreground border-border"
                              }`}
                          >
                            {getDayName(day)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Không có công việc nào trong báo cáo này</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incomplete Reasons Summary */}
        {Array.isArray(stats?.incompleteReasons) && stats.incompleteReasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Lý do chưa hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.incompleteReasons.map((reason: any, index: number) => {
                  const reasonText = safeString(reason?.reason, "Không có lý do")
                  const reasonCount = safeNumber(reason?.count, 0)
                  const reasonTasks = safeArray(reason?.tasks, [])

                  return (
                    <div key={index} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-destructive">{reasonText}</h4>
                        <Badge variant="outline" className="text-destructive border-destructive/30">
                          {reasonCount} công việc
                        </Badge>
                      </div>
                      <div className="text-sm text-destructive/80">
                        <strong>Các task:</strong> {reasonTasks.join(", ") || "Không có task"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

export default function ReportDetailsPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="max-w-8xl mx-auto p-responsive">
            <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop text="Đang tải dữ liệu..." />
          </div>
        </MainLayout>
      }
    >
      <ReportDetailsContent />
    </Suspense>
  )
}
