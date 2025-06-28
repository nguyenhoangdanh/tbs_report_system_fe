"use client"

import { Suspense, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useUserDetails, useCurrentWeekFilter } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { ArrowLeft, User, FileText, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Phone, Mail, Building, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { UserDetails } from '@/types/hierarchy'

function UserDetailsContent() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const userId = params?.userId as string
  const { weekNumber: currentWeek, year: currentYear } = useCurrentWeekFilter()
  
  const [selectedReportLimit] = useState(10)

  const { 
    data: userData, 
    isLoading, 
    error 
  } = useUserDetails(userId, {
    weekNumber: currentWeek,
    year: currentYear,
    limit: selectedReportLimit
  })

  if (!currentUser) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN']
  const canAccess = allowedRoles.includes(currentUser.role) || currentUser.id === userId

  if (!canAccess) {
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
              <p className="text-red-600 dark:text-red-400">Bạn không có quyền xem chi tiết nhân viên này.</p>
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
                {(error as any)?.message || 'Có lỗi xảy ra khi tải chi tiết nhân viên'}
              </p>
              <Link href="/admin/hierarchy">
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

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400'
    if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', variant: 'default' as const }
    if (rate >= 70) return { label: 'Tốt', variant: 'secondary' as const }
    return { label: 'Cần cải thiện', variant: 'destructive' as const }
  }

  return (
    <MainLayout
      title={`${userData.user.firstName} ${userData.user.lastName}`}
      subtitle={`${userData.user.employeeCode} - ${userData.user.jobPosition.department.name}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
        { label: `${userData.user.firstName} ${userData.user.lastName}` }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/admin/hierarchy">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại báo cáo phân cấp</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Profile Card */}
        <div className="block lg:hidden mb-6">
          <Card>
            <CardContent className="p-4">
              {/* Avatar and basic info */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {userData.user.firstName.charAt(0)}{userData.user.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">
                    {userData.user.firstName} {userData.user.lastName}
                  </h1>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">{userData.user.employeeCode}</Badge>
                    <Badge variant="secondary" className="text-xs">{userData.user.role}</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <SimplePieChart
                    completed={userData.overallStats.completedTasks}
                    incomplete={userData.overallStats.totalTasks - userData.overallStats.completedTasks}
                    size={50}
                    strokeWidth={6}
                    showPercentage={true}
                    showLabel={false}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Hoàn thành</div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{userData.user.email || 'Chưa có email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{userData.user.jobPosition.jobName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{userData.user.jobPosition.department.name}</span>
                </div>
              </div>

              {/* Mobile stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{userData.overallStats.totalReports}</div>
                  <div className="text-xs text-muted-foreground">Tổng BC</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{userData.overallStats.completedReports}</div>
                  <div className="text-xs text-muted-foreground">BC hoàn thành</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{userData.overallStats.totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Tổng CV</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className={`text-lg font-bold ${getPerformanceColor(userData.overallStats.taskCompletionRate)}`}>
                    {userData.overallStats.taskCompletionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Tỷ lệ HT</div>
                </div>
              </div>

              {/* Performance progress */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hoàn thành báo cáo</span>
                    <span className={getPerformanceColor(userData.overallStats.reportCompletionRate)}>
                      {userData.overallStats.reportCompletionRate}%
                    </span>
                  </div>
                  <Progress value={userData.overallStats.reportCompletionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hoàn thành công việc</span>
                    <span className={getPerformanceColor(userData.overallStats.taskCompletionRate)}>
                      {userData.overallStats.taskCompletionRate}%
                    </span>
                  </div>
                  <Progress value={userData.overallStats.taskCompletionRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Profile Card - Hidden on mobile */}
        <div className="hidden lg:block mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
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
                      <Badge variant={userData.user.isActive ? 'default' : 'destructive'}>
                        {userData.user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành CV</div>
                  <div className={`text-3xl font-bold ${getPerformanceColor(userData.overallStats.taskCompletionRate)}`}>
                    {userData.overallStats.taskCompletionRate}%
                  </div>
                  <Badge {...getPerformanceBadge(userData.overallStats.taskCompletionRate)} className="text-xs">
                    {getPerformanceBadge(userData.overallStats.taskCompletionRate).label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Thông tin cá nhân</h3>
                  <div className="space-y-2 text-sm">
                    <p>Email: {userData.user.email || 'Chưa có'}</p>
                    <p>Vị trí: {userData.user.jobPosition.jobName}</p>
                    <p>Chức danh: {userData.user.jobPosition.positionName}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Thông tin tổ chức</h3>
                  <div className="space-y-2 text-sm">
                    <p>Phòng ban: {userData.user.jobPosition.department.name}</p>
                    <p>Văn phòng: {userData.user.office.name}</p>
                    <p>Loại văn phòng: {userData.user.office.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 'Văn phòng nhà máy'}</p>
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userData.overallStats.totalReports}</div>
                  <div className="text-sm text-muted-foreground">Tổng báo cáo</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{userData.overallStats.completedReports}</div>
                  <div className="text-sm text-muted-foreground">BC hoàn thành</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userData.overallStats.totalTasks}</div>
                  <div className="text-sm text-muted-foreground">Tổng công việc</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{userData.overallStats.completedTasks}</div>
                  <div className="text-sm text-muted-foreground">CV hoàn thành</div>
                </div>
              </div>

              {/* Performance Progress */}
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tỷ lệ hoàn thành báo cáo</span>
                    <span className={getPerformanceColor(userData.overallStats.reportCompletionRate)}>
                      {userData.overallStats.reportCompletionRate}%
                    </span>
                  </div>
                  <Progress value={userData.overallStats.reportCompletionRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tỷ lệ hoàn thành công việc</span>
                    <span className={getPerformanceColor(userData.overallStats.taskCompletionRate)}>
                      {userData.overallStats.taskCompletionRate}%
                    </span>
                  </div>
                  <Progress value={userData.overallStats.taskCompletionRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports History - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline">Lịch sử báo cáo</span>
                <span className="sm:hidden">Báo cáo</span>
              </CardTitle>
              {/* Admin xem tất cả báo cáo của user này */}
              <Link href={`/admin/hierarchy/user/${userData.user.id}/reports`} passHref>
                <Button variant="outline" size="sm" className="text-xs">
                  <span className="hidden sm:inline">Xem tất cả</span>
                  <span className="sm:hidden">Tất cả</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {userData.reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có báo cáo nào</p>
                </div>
              ) : (
                userData.reports.map((report, index) => {
                  const performanceBadge = getPerformanceBadge(report.stats.taskCompletionRate)
                  
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {/* Mobile Layout */}
                          <div className="block lg:hidden">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-base">
                                    Tuần {report.weekNumber}/{report.year}
                                  </h3>
                                  <Badge 
                                    variant={performanceBadge.variant}
                                    className="text-xs"
                                  >
                                    {performanceBadge.label}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  {report.isCompleted && (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Hoàn thành
                                    </Badge>
                                  )}
                                  {report.isLocked && (
                                    <Badge variant="secondary" className="text-xs">
                                      🔒 Đã khóa
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  Cập nhật {formatDistanceToNow(new Date(report.updatedAt), {
                                    addSuffix: true,
                                    locale: vi
                                  })}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <SimplePieChart
                                  completed={report.stats.completedTasks}
                                  incomplete={report.stats.incompleteTasks}
                                  size={40}
                                  strokeWidth={4}
                                  showPercentage={true}
                                  showLabel={false}
                                />
                                {/* Admin chỉ có quyền xem, không sửa */}
                                <Link href={`/admin/hierarchy/user/${userData.user.id}/report/${report.id}`}>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    Xem
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            {/* Mobile stats grid */}
                            <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
                              <div>
                                <div className="font-semibold">{report.stats.totalTasks}</div>
                                <div className="text-muted-foreground">Tổng</div>
                              </div>
                              <div>
                                <div className="font-semibold text-green-600">{report.stats.completedTasks}</div>
                                <div className="text-muted-foreground">Xong</div>
                              </div>
                              <div>
                                <div className="font-semibold text-red-600">{report.stats.incompleteTasks}</div>
                                <div className="text-muted-foreground">Chưa</div>
                              </div>
                              <div>
                                <div className={`font-semibold ${getPerformanceColor(report.stats.taskCompletionRate)}`}>
                                  {report.stats.taskCompletionRate}%
                                </div>
                                <div className="text-muted-foreground">Tỷ lệ</div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <Progress value={report.stats.taskCompletionRate} className="h-2" />
                            </div>

                            {/* Work Days - Simplified for mobile */}
                            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Công việc theo ngày</div>
                              <div className="grid grid-cols-7 gap-1 text-xs">
                                {Object.entries(report.stats.tasksByDay).map(([day, count]) => (
                                  <div key={day} className="text-center">
                                    <div className="text-muted-foreground">
                                      {day === 'monday' ? 'T2' : 
                                       day === 'tuesday' ? 'T3' :
                                       day === 'wednesday' ? 'T4' :
                                       day === 'thursday' ? 'T5' :
                                       day === 'friday' ? 'T6' :
                                       day === 'saturday' ? 'T7' : 'CN'}
                                    </div>
                                    <div className="font-semibold text-xs">{count}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Incomplete Reasons - Collapsed for mobile */}
                            {report.stats.incompleteReasons.length > 0 && (
                              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                    Lý do chưa hoàn thành ({report.stats.incompleteReasons.length})
                                  </span>
                                </div>
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  {report.stats.incompleteReasons.slice(0, 2).map(reason => reason.reason).join(', ')}
                                  {report.stats.incompleteReasons.length > 2 && '...'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Desktop Layout - Hidden on mobile */}
                          <div className="hidden lg:block">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    Tuần {report.weekNumber}/{report.year}
                                  </h3>
                                  <Badge 
                                    variant={performanceBadge.variant}
                                    className="text-xs"
                                  >
                                    {performanceBadge.label}
                                  </Badge>
                                  {report.isCompleted && (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Hoàn thành
                                    </Badge>
                                  )}
                                  {report.isLocked && (
                                    <Badge variant="secondary" className="text-xs">
                                      🔒 Đã khóa
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Cập nhật {formatDistanceToNow(new Date(report.updatedAt), {
                                    addSuffix: true,
                                    locale: vi
                                  })}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <SimplePieChart
                                  completed={report.stats.completedTasks}
                                  incomplete={report.stats.incompleteTasks}
                                  size={60}
                                  strokeWidth={6}
                                  showLabel
                                />
                                
                                {/* Admin chỉ có quyền xem chi tiết, không sửa */}
                                <Link href={`/admin/hierarchy/user/${userData.user.id}/report/${report.id}`}>
                                  <Button variant="outline" size="sm">
                                    Xem chi tiết
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            {/* Desktop stats grid */}
                            <div className="grid grid-cols-4 gap-4 text-center text-sm mb-4">
                              <div>
                                <div className="font-semibold">{report.stats.totalTasks}</div>
                                <div className="text-muted-foreground">Tổng CV</div>
                              </div>
                              <div>
                                <div className="font-semibold text-green-600">{report.stats.completedTasks}</div>
                                <div className="text-muted-foreground">CV hoàn thành</div>
                              </div>
                              <div>
                                <div className="font-semibold text-red-600">{report.stats.incompleteTasks}</div>
                                <div className="text-muted-foreground">CV chưa hoàn thành</div>
                              </div>
                              <div>
                                <div className={`font-semibold ${getPerformanceColor(report.stats.taskCompletionRate)}`}>
                                  {report.stats.taskCompletionRate}%
                                </div>
                                <div className="text-muted-foreground">Tỷ lệ hoàn thành</div>
                              </div>
                            </div>

                            {/* Progress Bar - Desktop */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Tỷ lệ hoàn thành công việc</span>
                                <span className={getPerformanceColor(report.stats.taskCompletionRate)}>
                                  {report.stats.taskCompletionRate}%
                                </span>
                              </div>
                              <Progress value={report.stats.taskCompletionRate} className="h-2" />
                            </div>

                            {/* Work Days - Detailed for desktop */}
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Công việc theo ngày</div>
                              <div className="grid grid-cols-7 gap-2 text-xs">
                                {Object.entries(report.stats.tasksByDay).map(([day, count]) => (
                                  <div key={day} className="text-center">
                                    <div className="text-muted-foreground">
                                      {day === 'monday' ? 'Thứ 2' : 
                                       day === 'tuesday' ? 'Thứ 3' :
                                       day === 'wednesday' ? 'Thứ 4' :
                                       day === 'thursday' ? 'Thứ 5' :
                                       day === 'friday' ? 'Thứ 6' :
                                       day === 'saturday' ? 'Thứ 7' : 'CN'}
                                    </div>
                                    <div className="font-semibold">{count}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Incomplete Reasons - Expanded for desktop */}
                            {report.stats.incompleteReasons.length > 0 && (
                              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                    Lý do chưa hoàn thành ({report.stats.incompleteReasons.length})
                                  </span>
                                </div>
                                <div className="text-sm text-orange-600 dark:text-orange-400">
                                  {report.stats.incompleteReasons.map((reason, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span>{reason.reason}</span>
                                      <span className="font-semibold">{reason.count} lần</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
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
