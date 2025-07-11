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
import { ArrowLeft, User, RefreshCw, EyeIcon, Calendar, FileText, BarChart3, Filter,  } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toast-kit'
import { getCurrentWeek } from '@/utils/week-utils'
import { HierarchyService } from '@/services/hierarchy.service'
import { getPerformanceBadge,  classifyPerformance } from '@/utils/performance-classification'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, Trophy } from 'lucide-react'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { safeString, safeNumber} from '@/utils/type-guards'
import type { User as UserInfo } from '@/types'

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

  // Thêm state cho filter period
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('week')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3))

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState<UserInfo | null>(null)
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
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
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

  const overallTaskCompletion = safeNumber(userData.overallStats.taskCompletionRate, 0)
  
  // SỬA LỖI: Tính tỷ lệ báo cáo đúng theo backend mới
  const overallReportCompletion = userData.overallStats.totalReports > 0 
    ? Math.round((userData.overallStats.completedReports / userData.overallStats.totalReports) * 100)
    : 0
    
  const taskPerformance = getPerformanceBadge(overallTaskCompletion)
  const reportPerformance = getPerformanceBadge(overallReportCompletion)

  // Hàm lọc báo cáo theo period
  const getFilteredReports = () => {
    if (!Array.isArray(userData.reports)) return []
    
    return userData.reports.filter((report: any) => {
      const reportYear = safeNumber(report.year, 0)
      const reportWeek = safeNumber(report.weekNumber, 0)
      
      switch (filterPeriod) {
        case 'week':
          return reportWeek === selectedWeek && reportYear === selectedYear
        case 'month':
          // Tính toán tuần nào thuộc tháng nào
          const weekDate = new Date(reportYear, 0, 1 + (reportWeek - 1) * 7)
          return weekDate.getFullYear() === selectedYear && (weekDate.getMonth() + 1) === selectedMonth
        case 'quarter':
          const quarterWeekDate = new Date(reportYear, 0, 1 + (reportWeek - 1) * 7)
          const reportQuarter = Math.ceil((quarterWeekDate.getMonth() + 1) / 3)
          return quarterWeekDate.getFullYear() === selectedYear && reportQuarter === selectedQuarter
        case 'year':
          return reportYear === selectedYear
        default:
          return true
      }
    })
  }

  const filteredReports = getFilteredReports()

  return (
    <MainLayout 
      title={`${userData.user.firstName} ${userData.user.lastName}`}
      subtitle={`${userData.user.employeeCode} - ${userData.user.jobPosition?.jobName || 'N/A'}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Báo cáo KH & KQCV', href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` },
        {
          label: userData.user.jobPosition?.department?.name || 'Phòng ban',
          href: userData.user.jobPosition?.department?.id
            ? `/admin/hierarchy/department/${userData.user.jobPosition.department.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
            : '#'
        },
        { label: `${userData.user.firstName} ${userData.user.lastName}` }
      ]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={getBackUrl()}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </Link>
          
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

        {/* Statistics Overview - Fixed chart colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng báo cáo</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {userData.overallStats.totalReports}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Đã hoàn thành: {userData.overallStats.completedReports}
                    </p>
                  </div>
                  <SimplePieChart
                    completedPercentage={overallReportCompletion}
                    size={50}
                    showLabel={true}
                    primaryColor={classifyPerformance(overallReportCompletion).color}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tỷ lệ báo cáo</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: classifyPerformance(overallReportCompletion).color }}
                    >
                      {overallReportCompletion}%
                    </div>
                    <Badge className={reportPerformance.className}>
                      {reportPerformance.label}
                    </Badge>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={classifyPerformance(overallReportCompletion).color}
                        strokeWidth="3"
                        strokeDasharray={`${overallReportCompletion}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium" style={{ color: classifyPerformance(overallReportCompletion).color }}>
                        {overallReportCompletion}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng công việc</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {userData.overallStats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hoàn thành: {userData.overallStats.completedTasks}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (userData.overallStats.completedTasks / userData.overallStats.totalTasks) * 100)}%`,
                        backgroundColor: classifyPerformance((userData.overallStats.completedTasks / userData.overallStats.totalTasks) * 100).color
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hiệu suất task</CardTitle>
                <Trophy className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: classifyPerformance(overallTaskCompletion).color }}
                    >
                      {overallTaskCompletion}%
                    </div>
                    <Badge className={taskPerformance.className}>
                      {taskPerformance.label}
                    </Badge>
                  </div>
                  <SimplePieChart
                    completedPercentage={overallTaskCompletion}
                    size={50}
                    showLabel={true}
                    primaryColor={classifyPerformance(overallTaskCompletion).color}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chi tiết báo cáo với bộ lọc */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Chi tiết báo cáo ({filteredReports.length})
              </CardTitle>
              
              {/* Bộ lọc thời gian */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Theo tuần</SelectItem>
                    <SelectItem value="month">Theo tháng</SelectItem>
                    <SelectItem value="quarter">Theo quý</SelectItem>
                    <SelectItem value="year">Theo năm</SelectItem>
                  </SelectContent>
                </Select>

                {filterPeriod === 'week' && (
                  <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 53 }, (_, i) => i + 1).map(week => (
                        <SelectItem key={week} value={week.toString()}>
                          {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filterPeriod === 'month' && (
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          Tháng {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filterPeriod === 'quarter' && (
                  <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(quarter => (
                        <SelectItem key={quarter} value={quarter.toString()}>
                          Q{quarter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Không có báo cáo</h3>
                <p className="text-muted-foreground">
                  Không có báo cáo nào trong{' '}
                  {filterPeriod === 'week' && `tuần ${selectedWeek}/${selectedYear}`}
                  {filterPeriod === 'month' && `tháng ${selectedMonth}/${selectedYear}`}
                  {filterPeriod === 'quarter' && `quý ${selectedQuarter}/${selectedYear}`}
                  {filterPeriod === 'year' && `năm ${selectedYear}`}
                </p>
              </div>
            ) : (
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
                            showLabel={true}
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

                {/* Tóm tắt thống kê */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                  <h4 className="font-medium mb-3">
                    Tóm tắt {filterPeriod === 'week' && `tuần ${selectedWeek}/${selectedYear}`}
                    {filterPeriod === 'month' && `tháng ${selectedMonth}/${selectedYear}`}
                    {filterPeriod === 'quarter' && `quý ${selectedQuarter}/${selectedYear}`}
                    {filterPeriod === 'year' && `năm ${selectedYear}`}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{filteredReports.length}</div>
                      <div className="text-sm text-muted-foreground">Báo cáo</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {filteredReports.filter((r: any) => r.isCompleted).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Hoàn thành</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-orange-600">
                        {filteredReports.reduce((sum: number, r: any) => sum + safeNumber(r.stats?.totalTasks, 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Tổng task</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">
                        {filteredReports.length > 0 
                          ? Math.round(filteredReports.reduce((sum: number, r: any) => sum + safeNumber(r.stats?.taskCompletionRate, 0), 0) / filteredReports.length)
                          : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Hiệu suất TB</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
