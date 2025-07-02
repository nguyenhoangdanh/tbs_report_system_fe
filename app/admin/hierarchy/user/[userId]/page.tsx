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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, RefreshCw, Calendar, FileText, CheckCircle2, AlertTriangle, Clock, EyeIcon } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCurrentWeek } from '@/utils/week-utils'
import { HierarchyService } from '@/services/hierarchy.service'
import { UserDetailsCard } from '@/components/hierarchy/user-details-card'
import type { UserDetails } from '@/types/hierarchy'
import { getPerformanceBadge, getPerformanceColor } from '@/utils/performance-classification'
import { Progress } from '@/components/ui/progress'

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

  console.log('[USER DETAILS PAGE] URL params:', { urlWeek, urlYear })

  const [selectedWeek, setSelectedWeek] = useState<number>(
    urlWeek ? parseInt(urlWeek) || currentWeek : currentWeek
  )

  const [selectedYear, setSelectedYear] = useState<number>(
    urlYear ? parseInt(urlYear) || currentYear : currentYear
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Update URL when week/year changes - PRESERVE scroll position
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('weekNumber', selectedWeek.toString())
    params.set('year', selectedYear.toString())
    const newUrl = `/admin/hierarchy/user/${userId}?${params.toString()}`

    console.log('[USER DETAILS PAGE] Updating URL to:', newUrl)
    router.replace(newUrl, { scroll: false })
  }, [selectedWeek, selectedYear, userId, router])

  // Update state when URL params change (from external navigation) - CRITICAL FIX
  useEffect(() => {
    console.log('[USER DETAILS PAGE] URL params changed:', { urlWeek, urlYear })

    if (urlWeek && urlYear) {
      const parsedWeek = parseInt(urlWeek)
      const parsedYear = parseInt(urlYear)

      // Only update if values are actually different to avoid loops
      if (parsedWeek >= 1 && parsedWeek <= 53 && parsedWeek !== selectedWeek) {
        console.log('[USER DETAILS PAGE] Updating selectedWeek from', selectedWeek, 'to', parsedWeek)
        setSelectedWeek(parsedWeek)
      }
      if (parsedYear >= 2020 && parsedYear <= 2030 && parsedYear !== selectedYear) {
        console.log('[USER DETAILS PAGE] Updating selectedYear from', selectedYear, 'to', parsedYear)
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

      console.log('[USER DETAILS] API Response:', response)
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

  const handleWeekChange = (value: string) => {
    const week = parseInt(value)
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week)
    }
  }

  const handleYearChange = (value: string) => {
    const year = parseInt(value)
    if (year >= 2020 && year <= 2030) {
      setSelectedYear(year)
    }
  }

  // Generate dynamic year options
  const generateYearOptions = () => {
    const years = []
    const startYear = currentYear - 2
    const endYear = currentYear + 2

    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
    return years
  }

  // Generate back URL - với filter preservation
  const getBackUrl = () => {
    if (userData?.user?.jobPosition?.department) {
      return `/admin/hierarchy/department/${userData.user.jobPosition.department.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
    }
    if (userData?.user?.office) {
      return `/admin/hierarchy/office/${userData.user.office.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
    }
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
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
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
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết nhân viên..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !userData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Chi tiết nhân viên' }
        ]}
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

  return (
    <MainLayout
      title={`${userData.user.firstName} ${userData.user.lastName}`}
      subtitle={`${userData.user.employeeCode} - ${userData.user.jobPosition?.jobName || 'N/A'}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` },
        {
          label: userData.user.jobPosition?.department?.name || 'Phòng ban',
          href: userData.user.jobPosition?.department?.id
            ? `/admin/hierarchy/department/${userData.user.jobPosition.department.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
            : '#'
        },
        { label: `${userData.user.firstName} ${userData.user.lastName}` }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <Link href={getBackUrl()}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Quay lại phòng ban</span>
                <span className="sm:hidden">Quay lại</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>

        {/* Week/Year Selector */}
        {/* <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Chi tiết nhân viên - Tuần {selectedWeek}/{selectedYear}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">Tuần:</span>
                  <Select value={selectedWeek.toString()} onValueChange={handleWeekChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map(week => (
                        <SelectItem key={week} value={week.toString()}>{week}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">Năm:</span>
                  <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card> */}

        {/* Enhanced User Details with Ranking */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {userData.user.firstName.charAt(0)}{userData.user.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {userData.user.firstName} {userData.user.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{userData.user.employeeCode}</Badge>
                    <Badge variant="secondary">{userData.user.role}</Badge>
                    {userData.overallStats?.taskCompletionRate && (
                      <Badge className={getPerformanceBadge(userData.overallStats.taskCompletionRate).className}>
                        {getPerformanceBadge(userData.overallStats.taskCompletionRate).label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {userData.user.jobPosition?.jobName} • {userData.user.jobPosition?.department?.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Hiệu suất tổng thể</div>
                <div className={`text-3xl font-bold ${userData.overallStats?.taskCompletionRate
                  ? getPerformanceColor(userData.overallStats.taskCompletionRate).text
                  : 'text-gray-400'
                  }`}>
                  {userData.overallStats?.taskCompletionRate || 0}%
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Performance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {userData.overallStats?.totalReports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tổng báo cáo</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {userData.overallStats?.completedReports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {userData.overallStats?.reportCompletionRate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành BC</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {userData.overallStats?.totalTasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tổng công việc</div>
              </div>
            </div>

            {/* Overall Performance Progress */}
            {userData.overallStats?.taskCompletionRate && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Hiệu suất làm việc tổng thể</span>
                  <span className={getPerformanceColor(userData.overallStats.taskCompletionRate).text}>
                    {userData.overallStats.taskCompletionRate}%
                  </span>
                </div>
                <Progress value={userData.overallStats.taskCompletionRate} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports with Performance Analysis */}
        {userData.reports && userData.reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo gần đây với phân tích hiệu suất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.reports.slice(0, 5).map((report: any, index: number) => {
                  const reportPerformance = getPerformanceBadge(report.stats.taskCompletionRate)
                  const reportColor = getPerformanceColor(report.stats.taskCompletionRate)

                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">
                              Tuần {report.weekNumber}/{report.year}
                            </h3>
                            <Badge className={reportPerformance.className}>
                              {reportPerformance.label}
                            </Badge>
                            <Badge variant={report.isCompleted ? 'default' : 'secondary'}>
                              {report.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {report.stats.completedTasks}/{report.stats.totalTasks} công việc hoàn thành
                          </div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Tiến độ báo cáo</span>
                            <span className={reportColor.text}>
                              {report.stats.taskCompletionRate}%
                            </span>
                          </div>
                          <Progress value={report.stats.taskCompletionRate} className="h-2" />
                        </div>
                        <div className="ml-4">
                          <Link
                            href={`/admin/hierarchy/user/${userData.user.id}/report/${report.id}?returnTo=user-details&weekNumber=${selectedWeek}&year=${selectedYear}`}
                          >
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

              {userData.reports.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href={`/admin/hierarchy/user/${userData.user.id}/reports`}>
                    <Button variant="outline">
                      Xem tất cả báo cáo ({userData.reports.length})
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
