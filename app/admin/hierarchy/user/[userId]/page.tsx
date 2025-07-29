"use client"

import { Suspense, useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useCurrentWeekFilters } from "@/hooks/use-hierarchy"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, RefreshCw, Calendar, BarChart3 } from 'lucide-react'
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toast-kit"
import { getCurrentWeek } from "@/utils/week-utils"
import { HierarchyService } from "@/services/hierarchy.service"
import { getPerformanceBadge, classifyPerformance } from "@/utils/performance-classification"
import { safeString, safeNumber } from "@/utils/type-guards"
import { UserDetailsResponse } from "@/types/hierarchy"
import { Role } from "@/types"
import { ExpandedReportDetails } from "@/components/hierarchy/expanded-report-details"
import { ScreenLoading } from "@/components/loading/screen-loading"

function UserDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = params?.userId as string

  const currentWeekData = useCurrentWeekFilters()
  const currentWeekInfo = getCurrentWeek()
  const currentWeek = currentWeekInfo.weekNumber
  const currentYear = currentWeekData.year ?? currentWeekInfo.year

  const urlWeek = searchParams.get("weekNumber")
  const urlYear = searchParams.get("year")

  const [selectedWeek, setSelectedWeek] = useState<number>(
    urlWeek ? parseInt(urlWeek) || currentWeek : currentWeek,
  )

  const [selectedYear, setSelectedYear] = useState<number>(
    urlYear ? parseInt(urlYear) || currentYear : currentYear,
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserDetailsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const queryClient = useQueryClient()

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("weekNumber", selectedWeek.toString())
    params.set("year", selectedYear.toString())
    const newUrl = `/admin/hierarchy/user/${userId}?${params.toString()}`

    router.replace(newUrl, { scroll: false })
  }, [selectedWeek, selectedYear, userId, router])

  useEffect(() => {
    if (urlWeek && urlYear) {
      const parsedWeek = parseInt(urlWeek)
      const parsedYear = parseInt(urlYear)

      if (parsedWeek >= 1 && parsedWeek <= 53 && parsedWeek !== selectedWeek) {
        setSelectedWeek(parsedWeek)
      }
      if (parsedYear >= 2020 && parsedYear <= 2030 && parsedYear !== selectedYear) {
        setSelectedYear(parsedYear)
      }
    }
  }, [urlWeek, urlYear, selectedWeek, selectedYear])

  const fetchUserDetails = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await HierarchyService.getUserDetails(userId, {
        weekNumber: selectedWeek,
        year: selectedYear,
      })

      if (response.success && response.data) {
        setUserData(response.data)
      }
    } catch (err: any) {
      console.error("[USER DETAILS] Error:", err)
      setError(err.message || "Có lỗi xảy ra khi tải chi tiết nhân viên")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId && selectedWeek && selectedYear) {
      fetchUserDetails()
    }
  }, [userId, selectedWeek, selectedYear])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: ["hierarchy", "user-details", userId],
      })
      await fetchUserDetails()
      toast.success("Dữ liệu đã được cập nhật")
    } catch (error) {
      toast.error("Có lỗi khi cập nhật dữ liệu")
    } finally {
      setIsRefreshing(false)
    }
  }

  const getBackUrl = () => {
    return `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`
  }

  if (!user || isLoading) return <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop />

  const allowedRoles = [Role.ADMIN, Role.SUPERADMIN, Role.USER]
  if (!allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Admin", href: "/admin" },
          { label: "Báo cáo KH & KQCV", href: "/admin/hierarchy" },
          { label: "Chi tiết nhân viên" },
        ]}
      >
        <div className="max-w-4xl mx-auto p-responsive">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Không có quyền truy cập</h2>
              <p className="text-destructive/80">Chỉ quản lý mới có thể xem chi tiết nhân viên.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (error || !userData) {
    return (
      <MainLayout title="Lỗi tải dữ liệu">
        <div className="max-w-4xl mx-auto p-responsive">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Không thể tải dữ liệu</h2>
              <p className="text-destructive/80 mb-4">{error || "Có lỗi xảy ra khi tải chi tiết nhân viên"}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const overallTaskCompletion = safeNumber(userData.overallStats.taskCompletionRate, 0)
  const taskPerformance = getPerformanceBadge(overallTaskCompletion)
  const filteredReports = userData.reports || []

  return (
    <MainLayout
      title={`${userData.user.firstName} ${userData.user.lastName}`}
      subtitle={`${userData.user.employeeCode} - ${userData.user.jobPosition?.jobName || "N/A"}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {userData.user.firstName.charAt(0)}
                  {userData.user.lastName.charAt(0)}
                </span>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {userData.user.firstName} {userData.user.lastName}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>Mã NV: {userData.user.employeeCode}</div>
                  <div>Chức vụ: {userData.user.jobPosition.position.description}</div>
                  <div>Phòng ban: {userData.user.jobPosition.department.name}</div>
                  <div>Văn phòng: {userData.user.office.name}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge className={taskPerformance.className}>{taskPerformance.label}</Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{overallTaskCompletion}%</div>
                  <div className="text-sm text-muted-foreground">Hiệu suất CV</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Chi tiết báo cáo */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Chi tiết báo cáo
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredReports.map((report: any, index: number) => {
                const reportTaskCompletion = safeNumber(report.stats?.taskCompletionRate, 0)
                const reportPerformance = getPerformanceBadge(reportTaskCompletion)
                const reportClassification = classifyPerformance(reportTaskCompletion)

                const reportId = safeString(report.id, `report-${index}`)
                const weekNumber = safeNumber(report.weekNumber, 0)
                const year = safeNumber(report.year, new Date().getFullYear())
                const totalTasks = safeNumber(report.stats?.totalTasks, 0)
                const completedTasks = safeNumber(report.stats?.completedTasks, 0)
                const incompleteTasks = safeNumber(report.stats?.incompleteTasks, 0)

                return (
                  <div key={reportId} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-lg">
                                Tuần {weekNumber}/{year}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={reportPerformance.className}>{reportPerformance.label}</Badge>
                                {report.isLocked && <Badge variant="outline">🔒 Đã khóa</Badge>}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div className="text-center p-3 bg-card rounded-lg border">
                              <div className="font-medium text-lg">{totalTasks}</div>
                              <div className="text-muted-foreground">Tổng CV</div>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border">
                              <div className="font-medium text-primary text-lg">{completedTasks}</div>
                              <div className="text-muted-foreground">Hoàn thành</div>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border">
                              <div className="font-medium text-destructive text-lg">{incompleteTasks}</div>
                              <div className="text-muted-foreground">Chưa hoàn thành</div>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border">
                              <div className="font-medium text-lg" style={{ color: reportClassification.color }}>
                                {reportTaskCompletion}%
                              </div>
                              <div className="text-muted-foreground">Tỷ lệ HT</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                            <div className="p-3 bg-card rounded-lg border">
                              <div className="text-muted-foreground mb-1">Ngày tạo báo cáo</div>
                              <div className="font-medium">
                                {report.createdAt ? new Date(report.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                              </div>
                            </div>
                            <div className="p-3 bg-card rounded-lg border">
                              <div className="text-muted-foreground mb-1">Cập nhật lần cuối</div>
                              <div className="font-medium">
                                {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString("vi-VN") : "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Tiến độ hoàn thành</span>
                              <span className="font-medium">{reportTaskCompletion}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-300"
                                style={{
                                  width: `${reportTaskCompletion}%`,
                                  backgroundColor: reportClassification.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ExpandedReportDetails userId={userId} reportId={reportId} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function UserDetailsPage() {
  return (
    <Suspense
      fallback={
        <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop />
      }
    >
      <UserDetailsContent />
    </Suspense>
  )
}
