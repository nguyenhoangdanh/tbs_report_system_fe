"use client"

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useCurrentWeekFilters } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, RefreshCw, EyeIcon, Calendar, FileText, BarChart3, Filter, } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toast-kit'
import { getCurrentWeek } from '@/utils/week-utils'
import { HierarchyService } from '@/services/hierarchy.service'
import { getPerformanceBadge, classifyPerformance } from '@/utils/performance-classification'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { safeString, safeNumber } from '@/utils/type-guards'
import { UserDetailsResponse } from '@/types/hierarchy'

function UserDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = params?.userId as string

  // Get current week/year with guaranteed fallbacks
  const currentWeekData = useCurrentWeekFilters()
  const currentWeekInfo = getCurrentWeek()
  const currentWeek = currentWeekInfo.weekNumber
  const currentYear = currentWeekData.year ?? currentWeekInfo.year

  // Parse URL parameters với better handling
  const urlWeek = searchParams.get('weekNumber')
  const urlYear = searchParams.get('year')

  const [selectedWeek, setSelectedWeek] = useState<number>(
    urlWeek ? parseInt(urlWeek) || currentWeek : currentWeek
  )

  const [selectedYear, setSelectedYear] = useState<number>(
    urlYear ? parseInt(urlYear) || currentYear : currentYear
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserDetailsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Update URL when week/year changes - PRESERVE scroll position
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('weekNumber', selectedWeek.toString())
    params.set('year', selectedYear.toString())
    const newUrl = `/admin/hierarchy/user/${userId}?${params.toString()}`

    router.replace(newUrl, { scroll: false })
  }, [selectedWeek, selectedYear, userId, router])

  // Update state when URL params change (from external navigation) - CRITICAL FIX
  useEffect(() => {
    if (urlWeek && urlYear) {
      const parsedWeek = parseInt(urlWeek)
      const parsedYear = parseInt(urlYear)

      // Only update if values are actually different to avoid loops
      if (parsedWeek >= 1 && parsedWeek <= 53 && parsedWeek !== selectedWeek) {
        setSelectedWeek(parsedWeek)
      }
      if (parsedYear >= 2020 && parsedYear <= 2030 && parsedYear !== selectedYear) {
        setSelectedYear(parsedYear)
      }
    }
  }, [urlWeek, urlYear, selectedWeek, selectedYear])

  // Fetch user details
  const fetchUserDetails = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await HierarchyService.getUserDetails(userId, {
        weekNumber: selectedWeek,
        year: selectedYear
      })

      setUserData(response)
    } catch (err: any) {
      console.error('[USER DETAILS] Error:', err)
      setError(err.message || 'Có lỗi xảy ra khi tải chi tiết nhân viên')
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    if (userId && selectedWeek && selectedYear) {
      fetchUserDetails()
    }
  }, [userId, selectedWeek, selectedYear])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: ['hierarchy', 'user-details', userId]
      })
      await fetchUserDetails()
      toast.success('Dữ liệu đã được cập nhật')
    } catch (error) {
      toast.error('Có lỗi khi cập nhật dữ liệu')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Generate back URL - với filter preservation
  const getBackUrl = () => {
    // if (userData?.user?.jobPosition?.department) {
    //   return `/admin/hierarchy/department/${userData.user.jobPosition.department.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
    // }
    // if (userData?.user?.office) {
    //   return `/admin/hierarchy/office/${userData.user.office.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
    // }
    return `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`
  }

  if (!user) return <AppLoading text="Đang xác thực..." />

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN']
  if (!allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
          { label: 'Chi tiết nhân viên' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600 dark:text-red-400">Chỉ quản lý mới có thể xem chi tiết nhân viên.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (isLoading) {
    return (
      <MainLayout title="Chi tiết nhân viên">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (error || !userData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error || 'Có lỗi xảy ra khi tải chi tiết nhân viên'}
              </p>
              <Link href={getBackUrl()}>
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

  const overallTaskCompletion = safeNumber(userData.overallStats.taskCompletionRate, 0)

  const taskPerformance = getPerformanceBadge(overallTaskCompletion)

  const filteredReports = userData.reports || [];

  return (
    <MainLayout
      title={`${userData.user.firstName} ${userData.user.lastName}`}
      subtitle={`${userData.user.employeeCode} - ${userData.user.jobPosition?.jobName || 'N/A'}`}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* <Link href={getBackUrl()}> */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
          {/* </Link> */}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            <Link href={`/admin/hierarchy/user/${userId}/reports`}>
              <Button size="sm" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tất cả báo cáo
              </Button>
            </Link>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {userData.user.firstName.charAt(0)}{userData.user.lastName.charAt(0)}
                </span>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {userData.user.firstName} {userData.user.lastName}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm opacity-90">
                  <div>Mã NV: {userData.user.employeeCode}</div>
                  <div>Email: {userData.user.email}</div>
                  <div>Vai trò: {userData.user.role}</div>
                  <div>Chức vụ: {userData.user.jobPosition.jobName}</div>
                  <div>Phòng ban: {userData.user.jobPosition.department.name}</div>
                  <div>Văn phòng: {userData.user.office.name}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge className={taskPerformance.className}>
                  {taskPerformance.label}
                </Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold">{overallTaskCompletion}%</div>
                  <div className="text-sm opacity-80">Hiệu suất task</div>
                </div>
              </div>
            </div>
          </div>
        </Card>


        {/* Chi tiết báo cáo với bộ lọc */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Chi tiết báo cáo
              </CardTitle>

              {/* Bộ lọc thời gian */}

            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <motion.div
                    key={reportId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-lg">
                              Tuần {weekNumber}/{year}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={reportPerformance.className}>
                                {reportPerformance.label}
                              </Badge>
                              <Badge variant={report.isCompleted ? 'default' : 'secondary'}>
                                {report.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                              </Badge>
                              {report.isLocked && (
                                <Badge variant="outline">
                                  🔒 Đã khóa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <div className="font-medium text-blue-600 text-lg">{totalTasks}</div>
                            <div className="text-muted-foreground">Tổng task</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <div className="font-medium text-green-600 text-lg">{completedTasks}</div>
                            <div className="text-muted-foreground">Hoàn thành</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                            <div className="font-medium text-orange-600 text-lg">{incompleteTasks}</div>
                            <div className="text-muted-foreground">Chưa hoàn thành</div>
                          </div>
                          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: reportClassification.bgColor }}>
                            <div
                              className="font-medium text-lg"
                              style={{ color: reportClassification.color }}
                            >
                              {reportTaskCompletion}%
                            </div>
                            <div className="text-muted-foreground">Tỷ lệ HT</div>
                          </div>
                        </div>

                        {/* Thông tin chi tiết bổ sung */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-muted-foreground mb-1">Ngày tạo báo cáo</div>
                            <div className="font-medium">
                              {report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-muted-foreground mb-1">Cập nhật lần cuối</div>
                            <div className="font-medium">
                              {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Tiến độ hoàn thành</span>
                            <span className="font-medium">{reportTaskCompletion}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${reportTaskCompletion}%`,
                                backgroundColor: reportClassification.color
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <SimplePieChart
                          completedPercentage={reportTaskCompletion}
                          size={60}
                          strokeWidth={6}
                          primaryColor={reportClassification.color}
                        />
                        <Link href={`/admin/hierarchy/user/${userId}/report/${reportId}`}>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="w-4 h-4 mr-2" />
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
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
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết nhân viên..." />
        </div>
      </MainLayout>
    }>
      <UserDetailsContent />
    </Suspense>
  )
}
