"use client"

import { Suspense, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useUserReportsForAdmin } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Filter,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

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

  const getPerformanceColor = useMemo(() => (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getPerformanceBadge = useMemo(() => (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', variant: 'default' as const }
    if (rate >= 70) return { label: 'Tốt', variant: 'secondary' as const }
    return { label: 'Cần cải thiện', variant: 'destructive' as const }
  }, [])

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
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Báo cáo nhân viên' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-red-600 mx-auto mb-4" />
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
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
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

  return (
    <MainLayout
      title={`Báo cáo của ${userData?.firstName || 'N/A'} ${userData?.lastName || ''}`}
      subtitle={`${userData?.employeeCode || 'N/A'} - ${userData?.jobPosition?.department?.name || 'N/A'}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
        { 
          label: `${userData?.firstName || 'N/A'} ${userData?.lastName || ''}`, 
          href: `/admin/hierarchy/user/${userId}`
        },
        { label: 'Tất cả báo cáo' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button - Fixed navigation */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/admin/hierarchy/user/${userId}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại chi tiết nhân viên</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
          </Link>
        </div>

        {/* User Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(userData.firstName || 'U').charAt(0)}{(userData.lastName || 'N').charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle>{userData.firstName || 'N/A'} {userData.lastName || ''}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{userData.employeeCode || 'N/A'}</Badge>
                    <Badge variant="secondary" className="text-xs">{userData.role || 'N/A'}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tổng báo cáo</div>
                <div className="text-2xl font-bold">{summary.totalReports || 0}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{summary.totalReports || 0}</div>
                <div className="text-xs text-muted-foreground">Tổng báo cáo</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{summary.completedReports || 0}</div>
                <div className="text-xs text-muted-foreground">Hoàn thành</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{summary.taskCompletionRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Tỷ lệ HT TB</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{summary.totalTasks || 0}</div>
                <div className="text-xs text-muted-foreground">Tổng công việc</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
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
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
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
                  // Safe access to report stats with defaults - using direct properties from API
                  const totalTasks = report.totalTasks ?? 0
                  const completedTasks = report.completedTasks ?? 0
                  const incompleteTasks = report.incompleteTasks ?? 0
                  const taskCompletionRate = report.taskCompletionRate ?? 0
                  const incompleteReasons = report.incompleteReasons ?? []
                  
                  const performanceBadge = getPerformanceBadge(taskCompletionRate)
                  
                  return (
                    <motion.div
                      key={report.id || index}
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
                                  <h3 className="font-semibold">
                                    Tuần {report.weekNumber || 'N/A'}/{report.year || 'N/A'}
                                  </h3>
                                  <Badge variant={performanceBadge.variant} className="text-xs">
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
                                  {!report.isCompleted && !report.isLocked && (
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Đang làm
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  {report.updatedAt ? formatDistanceToNow(new Date(report.updatedAt), {
                                    addSuffix: true,
                                    locale: vi
                                  }) : 'Chưa cập nhật'}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <SimplePieChart
                                  completedPercentage={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                                  size={40}
                                  strokeWidth={4}
                                />
                                {/* Admin chỉ được xem, không được sửa */}
                                <Link 
                                  href={`/admin/hierarchy/user/${userId}/report/${report.id}${
                                    weekNumberFromUrl && yearFromUrl 
                                      ? `?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}` 
                                      : ''
                                  }`}
                                >
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Xem
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            {/* Mobile Stats */}
                            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                              <div>
                                <div className="font-semibold">{totalTasks}</div>
                                <div className="text-muted-foreground">Tổng</div>
                              </div>
                              <div>
                                <div className="font-semibold text-green-600">{completedTasks}</div>
                                <div className="text-muted-foreground">Xong</div>
                              </div>
                              <div>
                                <div className="font-semibold text-red-600">{incompleteTasks}</div>
                                <div className="text-muted-foreground">Chưa</div>
                              </div>
                              <div>
                                <div className={`font-semibold ${getPerformanceColor(taskCompletionRate)}`}>
                                  {taskCompletionRate}%
                                </div>
                                <div className="text-muted-foreground">Tỷ lệ</div>
                              </div>
                            </div>

                            <Progress value={taskCompletionRate} className="h-2" />
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden lg:block">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6 flex-1">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      Tuần {report.weekNumber}/{report.year}
                                    </h3>
                                    <Badge variant={performanceBadge.variant} className="text-xs">
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
                                
                                <div className="grid grid-cols-4 gap-6 text-center">
                                  <div>
                                    <div className="text-xl font-bold">{totalTasks}</div>
                                    <div className="text-sm text-muted-foreground">Tổng CV</div>
                                  </div>
                                  <div>
                                    <div className="text-xl font-bold text-green-600">{completedTasks}</div>
                                    <div className="text-sm text-muted-foreground">Hoàn thành</div>
                                  </div>
                                  <div>
                                    <div className="text-xl font-bold text-red-600">{incompleteTasks}</div>
                                    <div className="text-sm text-muted-foreground">Chưa xong</div>
                                  </div>
                                  <div>
                                    <div className={`text-xl font-bold ${getPerformanceColor(taskCompletionRate)}`}>
                                      {taskCompletionRate}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Tỷ lệ HT</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <SimplePieChart
                                  completedPercentage={completedTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                                  size={60}
                                  strokeWidth={6}
                                />
                                
                                {/* Admin chỉ được xem, không được sửa */}
                                <Link 
                                  href={`/admin/hierarchy/user/${userId}/report/${report.id}${
                                    weekNumberFromUrl && yearFromUrl 
                                      ? `?weekNumber=${weekNumberFromUrl}&year=${yearFromUrl}` 
                                      : ''
                                  }`}
                                >
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total || 0)} 
                  trong {pagination.total || 0} báo cáo
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
                  <span className="text-sm">
                    Trang {page} / {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages || 1, p + 1))}
                    disabled={page === (pagination.totalPages || 1)}
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
