"use client"

import { Suspense, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, FileText, Filter, CheckCircle2, Clock, Eye, BarChart3, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getPerformanceBadge, getPerformanceColor, classifyPerformance } from '@/utils/performance-classification'
import { Progress } from '@/components/ui/progress'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { safeNumber, safeString, safeArray } from '@/utils/type-guards'

function UserReportsContent() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = params?.userId as string
  
  // Extract query parameters
  const weekNumberFromUrl = searchParams.get('weekNumber')
  const yearFromUrl = searchParams.get('year')
  
  const [yearFilter, setYearFilter] = useState<number>(
    yearFromUrl ? parseInt(yearFromUrl) : new Date().getFullYear()
  )
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'incomplete'>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { 
    data: reportsData, 
    isLoading, 
    error 
  } = useUserReportsForAdmin(userId, {
    page,
    limit,
    year: yearFilter
  })

  const filteredReports = useMemo(() => {
    if (!reportsData?.reports) return []
    return reportsData.reports.filter((report: any) => {
      switch (statusFilter) {
        case 'completed':
          return report.isCompleted
        case 'pending':
          return !report.isCompleted && !report.isLocked
        case 'incomplete':
          return !report.isCompleted
        default:
          return true
      }
    })
  }, [reportsData?.reports, statusFilter])

  if (!currentUser) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN']
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
          { label: 'Báo cáo nhân viên' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600">Bạn không có quyền xem báo cáo của nhân viên này.</p>
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
          <AppLoading text="Đang tải báo cáo nhân viên..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !reportsData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
          { label: 'Báo cáo nhân viên' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 mb-4">
                {(error as any)?.message || 'Có lỗi xảy ra khi tải báo cáo nhân viên'}
              </p>
              <div className="text-xs text-gray-500 mb-4">
                Debug: {JSON.stringify(error, null, 2)}
              </div>
              <Link href={`/admin/hierarchy/user/${userId}`}>
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

  // Safe access to data with fallbacks
  const userData = reportsData?.user || {}
  const reports = reportsData?.reports || []
  const pagination = reportsData?.pagination || {}
  const summary = reportsData?.summary || {
    totalReports: 0,
    completedReports: 0,
    averageCompletion: 0,
    totalTasks: 0
  }

  const overallTaskCompletion = summary.taskCompletionRate || 0
  const taskPerformance = getPerformanceBadge(overallTaskCompletion)

  return (
    <MainLayout
      title={`Báo cáo của ${userData?.firstName || 'N/A'} ${userData?.lastName || ''}`}
      subtitle={`${userData?.employeeCode || 'N/A'} - ${userData?.jobPosition?.department?.name || 'N/A'}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
        { 
          label: `${userData?.firstName || 'N/A'} ${userData?.lastName || ''}`, 
          href: `/admin/hierarchy/user/${userId}`
        },
        { label: 'Tất cả báo cáo' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/admin/hierarchy/user/${userId}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại chi tiết nhân viên</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
          </Link>
        </div>

        {/* Enhanced User Summary */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium">
                    {safeString(userData?.firstName, 'U').charAt(0)}{safeString(userData?.lastName, 'N').charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {safeString(userData?.firstName, 'N/A')} {safeString(userData?.lastName, '')}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm opacity-90">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {safeString(userData?.employeeCode, 'N/A')}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {safeString(userData?.role, 'N/A')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{safeNumber(summary?.totalReports, 0)}</div>
                  <div className="text-sm opacity-80">Tổng báo cáo</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1 text-green-300">{safeNumber(summary?.completedReports, 0)}</div>
                  <div className="text-sm opacity-80">Hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{overallTaskCompletion}%</div>
                  <div className="text-sm opacity-80">Hiệu suất TB</div>
                  <Badge className={`${taskPerformance.className} mt-1`}>
                    {taskPerformance.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-600">{safeNumber(summary?.totalReports, 0)}</div>
                <div className="text-xs text-muted-foreground">Tổng báo cáo</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-600">{safeNumber(summary?.completedReports, 0)}</div>
                <div className="text-xs text-muted-foreground">Hoàn thành</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-600">{overallTaskCompletion}%</div>
                <div className="text-xs text-muted-foreground">Tỷ lệ HT TB</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-600">{safeNumber(summary?.totalTasks, 0)}</div>
                <div className="text-xs text-muted-foreground">Tổng công việc</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Lọc:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="pending">Đang làm</SelectItem>
                    <SelectItem value="incomplete">Chưa hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                Hiển thị {filteredReports.length} / {reports.length} báo cáo
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Danh sách báo cáo ({filteredReports.length}/{reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Người dùng này chưa có báo cáo nào</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Không có báo cáo nào phù hợp với bộ lọc</p>
                </div>
              ) : (
                filteredReports.map((report: any, index: number) => {
                  const totalTasks = safeNumber(report?.totalTasks, 0)
                  const completedTasks = safeNumber(report?.completedTasks, 0)
                  const taskCompletionRate = safeNumber(report?.taskCompletionRate, 0)
                  const performanceBadge = getPerformanceBadge(taskCompletionRate)
                  const classification = classifyPerformance(taskCompletionRate)
                  const reportId = safeString(report?.id, `report-${index}`)
                  const weekNumber = safeNumber(report?.weekNumber, 0)
                  const year = safeNumber(report?.year, new Date().getFullYear())
                  
                  return (
                    <motion.div
                      key={reportId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <CardContent className="p-0">
                          {/* Enhanced Report Row */}
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold">
                                      Tuần {weekNumber}/{year}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {report?.updatedAt ? formatDistanceToNow(new Date(report.updatedAt), {
                                        addSuffix: true,
                                        locale: vi
                                      }) : 'Chưa cập nhật'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge className={performanceBadge.className}>
                                    {performanceBadge.label}
                                  </Badge>
                                  {report?.isCompleted && (
                                    <Badge variant="default" className="bg-green-500">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Hoàn thành
                                    </Badge>
                                  )}
                                  {report?.isLocked && (
                                    <Badge variant="secondary">
                                      🔒 Đã khóa
                                    </Badge>
                                  )}
                                  {!report?.isCompleted && !report?.isLocked && (
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Đang làm
                                    </Badge>
                                  )}
                                </div>

                                {/* Task Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <div className="text-lg font-bold">{totalTasks}</div>
                                    <div className="text-xs text-muted-foreground">Tổng task</div>
                                  </div>
                                  <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                                    <div className="text-xs text-muted-foreground">Hoàn thành</div>
                                  </div>
                                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                                    <div className="text-lg font-bold text-orange-600">{totalTasks - completedTasks}</div>
                                    <div className="text-xs text-muted-foreground">Chưa hoàn thành</div>
                                  </div>
                                  <div 
                                    className="text-center p-3 rounded-lg"
                                    style={{ backgroundColor: classification.bgColor }}
                                  >
                                    <div 
                                      className="text-lg font-bold"
                                      style={{ color: classification.color }}
                                    >
                                      {taskCompletionRate}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Tỷ lệ HT</div>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>Tiến độ hoàn thành</span>
                                    <span className="font-medium">{taskCompletionRate}%</span>
                                  </div>
                                  <Progress 
                                    value={taskCompletionRate} 
                                    className="h-3"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <SimplePieChart
                                  completedPercentage={taskCompletionRate}
                                  size={80}
                                  strokeWidth={8}
                                />
                                
                                <Link 
                                  href={`/admin/hierarchy/user/${userId}/report/${reportId}${
                                    weekNumberFromUrl && yearFromUrl 
                                      ? `?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}` 
                                      : ''
                                  }`}
                                >
                                  <Button className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Xem chi tiết
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Enhanced Pagination */}
            {pagination && safeNumber(pagination?.totalPages, 0) > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, safeNumber(pagination?.total, 0))} 
                  trong {safeNumber(pagination?.total, 0)} báo cáo
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="text-sm px-3 py-1 bg-muted rounded">
                    Trang {page} / {safeNumber(pagination?.totalPages, 1)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(safeNumber(pagination?.totalPages, 1), p + 1))}
                    disabled={page === safeNumber(pagination?.totalPages, 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function UserReportsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải báo cáo nhân viên..." />
        </div>
      </MainLayout>
    }>
      <UserReportsContent />
    </Suspense>
  )
}
