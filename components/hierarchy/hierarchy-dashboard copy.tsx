"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Users, BarChart3, AlertTriangle, Calendar, FileText, TrendingUp, RefreshCw, Trophy } from 'lucide-react'
import { useCurrentWeekFilters, useMyHierarchyView } from '@/hooks/use-hierarchy'
import { useAuth } from '@/components/providers/auth-provider'
import { AppLoading } from '@/components/ui/app-loading'
import { EmployeesWithoutReports } from './employees-without-reports'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCurrentWeek } from '@/utils/week-utils'
import { getPerformanceBadge, getPerformanceColor } from '@/utils/performance-classification'

// Define interfaces for type safety
interface OfficeData {
  id: string
  name: string
  type: string
  description?: string
  stats: {
    totalDepartments: number
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
    totalTasks: number
    completedTasks: number
    reportSubmissionRate: number
    reportCompletionRate: number
    taskCompletionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }
}

interface DepartmentData {
  id: string
  name: string
  description?: string
  stats: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
    totalTasks: number
    completedTasks: number
    reportSubmissionRate: number
    reportCompletionRate: number
    taskCompletionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
    }>
  }
}

interface UserData {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  jobPosition: {
    id: string
    jobName: string
    positionName: string
  }
  reportStatus: {
    hasReport: boolean
    reportId?: string
    isCompleted: boolean
    isLocked: boolean
    totalTasks: number
    completedTasks: number
    workDaysCount: number
    taskCompletionRate: number
    incompleteReasons: Array<{
      taskName: string
      reason: string
    }>
  }
}

export function HierarchyDashboard() {
  const { user } = useAuth()
  const currentWeekData = useCurrentWeekFilters()
  const currentWeekInfo = getCurrentWeek()

  const defaultWeek = currentWeekData.weekNumber ?? currentWeekInfo.weekNumber
  const defaultYear = currentWeekData.year ?? currentWeekInfo.year

  const [selectedWeek, setSelectedWeek] = useState<number>(defaultWeek)
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  // Use the hierarchy hook to fetch data from backend
  const {
    data: hierarchyData,
    isLoading,
    error,
    refetch
  } = useMyHierarchyView({
    weekNumber: selectedWeek,
    year: selectedYear
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Dữ liệu đã được cập nhật')
    } catch (error) {
      toast.error('Có lỗi khi cập nhật dữ liệu')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!user) {
    return <AppLoading text="Đang xác thực..." />
  }

  if (isLoading) {
    return <AppLoading text="Đang tải dữ liệu hierarchy..." />
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-red-600">{(error as any)?.message || 'Có lỗi xảy ra'}</p>
        </CardContent>
      </Card>
    )
  }

  // Render offices overview using backend data
  const renderOfficesOverview = (data: any) => {
    if (!data?.offices || data.offices.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có văn phòng nào</h2>
            <p className="text-gray-500">Chưa có dữ liệu văn phòng cho tuần {selectedWeek}/{selectedYear}</p>
          </CardContent>
        </Card>
      )
    }

    const { offices, summary } = data

    return (
      <div className="space-y-6">
        {/* Summary Cards using backend data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {summary.totalOffices}
              </div>
              <div className="text-sm font-medium text-muted-foreground">Văn phòng</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {summary.totalUsers}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Tổng nhân viên
                  </div>
                  <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {summary.totalUsersWithReports} đã nộp BC
                  </div>
                </div>
                <SimplePieChart
                  completedPercentage={summary.averageSubmissionRate}
                  size={56}
                  strokeWidth={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {summary.totalUsersWithReports}
              </div>
              <div className="text-sm font-medium text-muted-foreground">Đã nộp báo cáo</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <div className={`text-3xl font-bold mb-2 ${getPerformanceColor(summary.averageCompletionRate).text}`}>
                {summary.averageCompletionRate}%
              </div>
              <div className="text-sm font-medium text-muted-foreground">Hoàn thành TB</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {summary.averageSubmissionRate}%
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Tỷ lệ nộp TB</div>
              <div className="mt-2">
                <Badge className={getPerformanceBadge(summary.averageSubmissionRate).className}>
                  {getPerformanceBadge(summary.averageSubmissionRate).label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Distribution Summary - corrected to show office-level distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Phân bố xếp loại văn phòng
              <Badge variant="outline" className="ml-2">
                Dựa trên hiệu suất trung bình phòng ban của mỗi văn phòng
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {offices.filter((o: any) => o.stats.taskCompletionRate === 100).length}
                </div>
                <div className="text-sm text-purple-600 font-medium">GIỎI (100%)</div>
                <div className="text-xs text-muted-foreground mt-1">Văn phòng xuất sắc</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-500">
                  {offices.filter((o: any) => {
                    const rate = o.stats.taskCompletionRate || 0;
                    return rate >= 95 && rate < 100;
                  }).length}
                </div>
                <div className="text-sm text-green-500 font-medium">KHÁ (95-99%)</div>
                <div className="text-xs text-muted-foreground mt-1">Văn phòng tốt</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-500">
                  {offices.filter((o: any) => {
                    const rate = o.stats.taskCompletionRate || 0;
                    return rate >= 90 && rate < 95;
                  }).length}
                </div>
                <div className="text-sm text-yellow-500 font-medium">TB (90-94%)</div>
                <div className="text-xs text-muted-foreground mt-1">Văn phòng trung bình</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-500">
                  {offices.filter((o: any) => {
                    const rate = o.stats.taskCompletionRate || 0;
                    return rate >= 85 && rate < 90;
                  }).length}
                </div>
                <div className="text-sm text-orange-500 font-medium">YẾU (85-89%)</div>
                <div className="text-xs text-muted-foreground mt-1">Văn phòng cần cải thiện</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {offices.filter((o: any) => (o.stats.taskCompletionRate || 0) < 85).length}
                </div>
                <div className="text-sm text-red-600 font-medium">KÉM (&lt;85%)</div>
                <div className="text-xs text-muted-foreground mt-1">Văn phòng yêu cầu cải thiện ngay</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              * Xếp loại văn phòng dựa trên hiệu suất trung bình của tất cả phòng ban trong văn phòng đó
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Offices List with Rankings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Chi tiết các văn phòng với xếp loại hiệu suất
                <Badge variant="outline" className="ml-2">
                  Tuần {selectedWeek}/{selectedYear}
                </Badge>
              </CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              Hiệu suất văn phòng = Trung bình hiệu suất của tất cả phòng ban trong văn phòng đó
            </div>
            <div className="grid grid-cols-1 gap-4">
              {offices.map((office: any, index: number) => {
                const performanceBadge = getPerformanceBadge(office.stats.taskCompletionRate)
                const performanceColor = getPerformanceColor(office.stats.taskCompletionRate)

                return (
                  <motion.div
                    key={office.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <ResponsiveCard
                      title={office.name}
                      subtitle={office.description}
                      badges={[
                        {
                          label: performanceBadge.label,
                          variant: performanceBadge.variant,
                          className: performanceBadge.className
                        }
                      ]}
                      stats={[
                        {
                          label: 'Phòng ban',
                          value: office.stats.totalDepartments,
                          color: 'text-blue-600'
                        },
                        {
                          label: 'Nhân viên',
                          value: office.stats.totalUsers
                        },
                        {
                          label: 'Đã nộp BC',
                          value: office.stats.usersWithReports,
                          color: 'text-green-600'
                        },
                        {
                          label: 'BC hoàn thành',
                          value: office.stats.usersWithCompletedReports,
                          color: 'text-purple-600'
                        },
                        {
                          label: 'Tỷ lệ HT',
                          value: `${office.stats.taskCompletionRate}%`,
                          color: performanceColor.text
                        }
                      ]}
                      completed={office.stats.usersWithReports}
                      total={office.stats.totalUsers}
                      completionRate={office.stats.taskCompletionRate}
                      reportSubmissionRate={office.stats.reportSubmissionRate}
                      detailsUrl={`/admin/hierarchy/office/${office.id}?weekNumber=${selectedWeek}&year=${selectedYear}`}
                    />
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOfficeDetails = (data: any) => {
    if (!data?.office) {
      return <div>Không có dữ liệu văn phòng</div>
    }

    const { office, departments, summary } = data
    const performanceBadge = getPerformanceBadge(summary.averageCompletionRate)
    const performanceColor = getPerformanceColor(summary.averageCompletionRate)

    return (
      <div className="space-y-6">
        {/* Office Overview using backend data */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {office.name}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{office.description}</p>
              </div>
              <div className="text-right">
                <Badge className={performanceBadge.className}>
                  {performanceBadge.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalDepartments}</div>
                <div className="text-sm text-muted-foreground">Phòng ban</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Nhân viên</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalUsersWithReports}</div>
                <div className="text-sm text-muted-foreground">Đã nộp BC</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.averageSubmissionRate}%</div>
                <div className="text-sm text-muted-foreground">Tỷ lệ nộp TB</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${performanceColor.text}`}>
                  {summary.averageCompletionRate}%
                </div>
                <div className="text-sm text-muted-foreground">Điểm xếp loại</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments List using backend data */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết các phòng ban với xếp loại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {departments?.map((dept: any, index: number) => {
                const deptPerformanceBadge = getPerformanceBadge(dept.stats.taskCompletionRate)
                const deptPerformanceColor = getPerformanceColor(dept.stats.taskCompletionRate)

                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ResponsiveCard
                      title={dept.name}
                      subtitle={dept.description}
                      badges={[
                        {
                          label: deptPerformanceBadge.label,
                          variant: deptPerformanceBadge.variant,
                          className: deptPerformanceBadge.className
                        }
                      ]}
                      stats={[
                        { label: 'Nhân viên', value: dept.stats.totalUsers },
                        { label: 'Đã nộp BC', value: dept.stats.usersWithReports, color: 'text-green-600' },
                        { label: 'BC hoàn thành', value: dept.stats.usersWithCompletedReports, color: 'text-blue-600' },
                        {
                          label: 'Tỷ lệ HT',
                          value: `${dept.stats.taskCompletionRate}%`,
                          color: deptPerformanceColor.text
                        }
                      ]}
                      completed={dept.stats.usersWithReports}
                      total={dept.stats.totalUsers}
                      completionRate={dept.stats.taskCompletionRate}
                      reportSubmissionRate={dept.stats.reportSubmissionRate}
                      detailsUrl={`/admin/hierarchy/department/${dept.id}?weekNumber=${selectedWeek}&year=${selectedYear}`}
                    />
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDepartmentDetails = (data: any) => {
    if (!data?.department) {
      return <div>Không có dữ liệu phòng ban</div>
    }

    const { department, users, summary } = data
    const deptPerformanceBadge = getPerformanceBadge(summary.averageTaskCompletion)
    const deptPerformanceColor = getPerformanceColor(summary.averageTaskCompletion)

    return (
      <div className="space-y-6">
        {/* Department Overview using backend data */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {department.name}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{department.description}</p>
                <p className="text-sm text-muted-foreground">
                  Thuộc: {department.office?.name}
                </p>
              </div>
              <div className="text-right">
                <Badge className={deptPerformanceBadge.className}>
                  {deptPerformanceBadge.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Nhân viên</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.usersWithReports}</div>
                <div className="text-sm text-muted-foreground">Đã nộp BC</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.completedReports}</div>
                <div className="text-sm text-muted-foreground">BC hoàn thành</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${deptPerformanceColor.text}`}>
                  {summary.averageTaskCompletion}%
                </div>
                <div className="text-sm text-muted-foreground">HT công việc TB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List using backend data */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết nhân viên với xếp loại cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {users?.map((userData: any, index: number) => {
                const userCompletionRate = userData.reportStatus?.taskCompletionRate || 0
                const userPerformanceBadge = getPerformanceBadge(userCompletionRate)
                const userPerformanceColor = getPerformanceColor(userCompletionRate)

                return (
                  <div key={userData.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {userData.firstName} {userData.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userData.employeeCode} • {userData.jobPosition?.jobName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {userData.reportStatus?.hasReport ? 'Đã nộp' : 'Chưa nộp'} •
                          {userData.reportStatus?.isCompleted ? ' Hoàn thành' : ' Chưa hoàn thành'}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className={`font-semibold text-lg ${userPerformanceColor.text}`}>
                            {userCompletionRate}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userData.reportStatus?.completedTasks || 0}/{userData.reportStatus?.totalTasks || 0} công việc
                          </div>
                        </div>
                        <Badge className={userPerformanceBadge.className}>
                          {userPerformanceBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderUserDetails = (data: any) => {
    if (!data?.user) {
      return <div>Không có dữ liệu người dùng</div>
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">
                  {data.user.firstName} {data.user.lastName}
                </h3>
                <p className="text-muted-foreground">
                  {data.user.employeeCode} • {data.user.jobPosition?.positionName}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.overallStats?.totalReports || 0}</div>
                  <div className="text-sm text-muted-foreground">Tổng báo cáo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.overallStats?.completedReports || 0}</div>
                  <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.overallStats?.reportCompletionRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{data.overallStats?.taskCompletionRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Hoàn thành công việc</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports using backend data */}
        {data.reports && data.reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.reports.slice(0, 5).map((report: any) => {
                  const reportPerformanceColor = getPerformanceColor(report.stats.taskCompletionRate)

                  return (
                    <div key={report.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Tuần {report.weekNumber}/{report.year}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.stats.completedTasks}/{report.stats.totalTasks} công việc hoàn thành
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${reportPerformanceColor.text}`}>
                            {report.stats.taskCompletionRate}%
                          </div>
                          <Badge variant={report.isCompleted ? 'default' : 'secondary'}>
                            {report.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Render based on user role with proper null checking using backend data
  const renderContent = () => {
    if (!hierarchyData) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có dữ liệu</h2>
            <p className="text-gray-500">Không thể tải dữ liệu hierarchy cho tuần {selectedWeek}/{selectedYear}</p>
          </CardContent>
        </Card>
      )
    }

    switch (user.role) {
      case 'SUPERADMIN':
      case 'ADMIN':
        // Check if we have offices data from backend
        if ('offices' in hierarchyData && Array.isArray(hierarchyData.offices)) {
          return renderOfficesOverview(hierarchyData)
        }
        return <div>Không có dữ liệu offices</div>

      case 'OFFICE_MANAGER':
        // Check if we have office details from backend
        if ('office' in hierarchyData && 'departments' in hierarchyData) {
          return renderOfficeDetails(hierarchyData)
        }
        return <div>Không có dữ liệu office details</div>

      case 'OFFICE_ADMIN':
        // Check if we have department details from backend
        if ('department' in hierarchyData && 'users' in hierarchyData) {
          return renderDepartmentDetails(hierarchyData)
        }
        return <div>Không có dữ liệu department details</div>

      case 'USER':
        // Check if we have user details from backend
        if ('user' in hierarchyData) {
          return renderUserDetails(hierarchyData)
        }
        return <div>Không có dữ liệu user details</div>

      default:
        return <div>Không có quyền truy cập</div>
    }
  }

  // Generate dynamic year options
  const generateYearOptions = () => {
    const years = []
    const startYear = defaultYear - 2
    const endYear = defaultYear + 2

    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
    return years
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo Cáo Phân Cấp</h1>
          <p className="text-muted-foreground">
            Xem và quản lý báo cáo theo cấu trúc tổ chức
          </p>
        </div>
      </div>

      {/* Week/Year Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Báo cáo phân cấp
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">Tuần:</span>
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
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">Năm:</span>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="missing-reports" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Chưa nộp BC</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderContent()}
        </TabsContent>

        <TabsContent value="missing-reports">
          <EmployeesWithoutReports
            weekNumber={selectedWeek}
            year={selectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default HierarchyDashboard
