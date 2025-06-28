"use client"

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useReportDetailsForAdmin } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Eye,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

function ReportDetailsContent() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const userId = params?.userId as string
  const reportId = params?.reportId as string

  const { 
    data: reportData, 
    isLoading, 
    error 
  } = useReportDetailsForAdmin(userId, reportId)

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
          { label: 'Chi tiết báo cáo' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600">Bạn không có quyền xem chi tiết báo cáo này.</p>
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
          <AppLoading text="Đang tải chi tiết báo cáo..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !reportData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Chi tiết báo cáo' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 mb-4">
                {(error as any)?.message || 'Có lỗi xảy ra khi tải chi tiết báo cáo'}
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

  const getDayName = (day: string) => {
    const dayNames: Record<string, string> = {
      monday: 'Thứ 2',
      tuesday: 'Thứ 3', 
      wednesday: 'Thứ 4',
      thursday: 'Thứ 5',
      friday: 'Thứ 6',
      saturday: 'Thứ 7',
      sunday: 'Chủ nhật'
    }
    return dayNames[day] || day
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <MainLayout
      title={`Chi tiết báo cáo: Tuần ${report.weekNumber}/${report.year}`}
      subtitle={`${userInfo.firstName} ${userInfo.lastName} - ${userInfo.employeeCode}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
        { label: `${userInfo.firstName} ${userInfo.lastName}`, href: `/admin/hierarchy/user/${userId}` },
        { label: 'Báo cáo', href: `/admin/hierarchy/user/${userId}/reports` },
        { label: `Tuần ${report.weekNumber}/${report.year}` }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/admin/hierarchy/user/${userId}/reports`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại danh sách báo cáo</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
          </Link>
        </div>

        {/* Admin Notice */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Chế độ xem cho Admin</AlertTitle>
          <AlertDescription>
            Bạn đang xem báo cáo của nhân viên {userInfo.firstName} {userInfo.lastName} với quyền quản trị. 
            Bạn chỉ có thể xem, không thể chỉnh sửa báo cáo này.
          </AlertDescription>
        </Alert>

        {/* Report Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <FileText className="w-7 h-7 text-blue-600" />
                  Báo cáo Tuần {report.weekNumber}/{report.year}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {report.isCompleted && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Hoàn thành
                    </Badge>
                  )}
                  {report.isLocked && (
                    <Badge variant="secondary">🔒 Đã khóa</Badge>
                  )}
                  {!report.isCompleted && !report.isLocked && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Đang thực hiện
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cập nhật {formatDistanceToNow(new Date(report.updatedAt), {
                    addSuffix: true,
                    locale: vi
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                <div className={`text-3xl font-bold ${getPerformanceColor(stats.taskCompletionRate)}`}>
                  {stats.taskCompletionRate}%
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Tổng công việc</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</div>
                <div className="text-sm text-muted-foreground">Hoàn thành</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.incompleteTasks}</div>
                <div className="text-sm text-muted-foreground">Chưa hoàn thành</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.workDaysCount}</div>
                <div className="text-sm text-muted-foreground">Ngày làm việc</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Tiến độ hoàn thành tổng thể</span>
                <span className={getPerformanceColor(stats.taskCompletionRate)}>
                  {stats.taskCompletionRate}%
                </span>
              </div>
              <Progress value={stats.taskCompletionRate} className="h-3" />
            </div>

            {/* Work Distribution by Days */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-3">Phân bổ công việc theo ngày</h4>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(stats.tasksByDay).map(([day, count]) => (
                  <div key={day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{getDayName(day)}</div>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 mx-auto">
                      {String(count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.tasks.map((task: any, index: number) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`border rounded-lg p-4 ${
                    task.isCompleted 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{task.taskName}</h3>
                        <Badge 
                          variant={task.isCompleted ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {task.isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Hoàn thành
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Chưa hoàn thành
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Work Days Grid */}
                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div
                            key={day}
                            className={`p-2 rounded text-center text-xs ${
                              task[day] 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {getDayName(day)}
                          </div>
                        ))}
                      </div>

                      {/* Incomplete Reason */}
                      {!task.isCompleted && task.reasonNotDone && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                              Lý do chưa hoàn thành:
                            </span>
                          </div>
                          <p className="text-sm text-orange-600 dark:text-orange-400">{task.reasonNotDone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Reasons Summary */}
        {stats.incompleteReasons && stats.incompleteReasons.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Tổng hợp lý do chưa hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.incompleteReasons.map((reason: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-orange-800 dark:text-orange-200">{reason.reason}</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Công việc: {reason.tasks.join(', ')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                      {reason.count} lần
                    </Badge>
                  </div>
                ))}
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
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết báo cáo..." />
        </div>
      </MainLayout>
    }>
      <ReportDetailsContent />
    </Suspense>
  )
}
