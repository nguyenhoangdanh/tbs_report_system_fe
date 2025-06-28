"use client"

import { Suspense, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useDepartmentDetails, useCurrentWeekFilter } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { ArrowLeft, Building2, Search, Filter, Users, FileText, CheckCircle2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

function DepartmentDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const departmentId = params?.departmentId as string
  const { weekNumber: currentWeek, year: currentYear } = useCurrentWeekFilter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'no-report'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const { 
    data: departmentData, 
    isLoading, 
    error,
    refetch
  } = useDepartmentDetails(departmentId, {
    weekNumber: currentWeek,
    year: currentYear
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy', 'department-details', departmentId] 
      })
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
          { label: 'Chi tiết phòng ban' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600">Chỉ quản lý mới có thể xem chi tiết phòng ban.</p>
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
          <AppLoading text="Đang tải chi tiết phòng ban..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !departmentData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Chi tiết phòng ban' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 mb-4">
                {(error as any)?.message || 'Có lỗi xảy ra khi tải chi tiết phòng ban'}
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

  // Filter users based on search and status
  const filteredUsers = departmentData.users?.filter(user => {
    const matchesSearch = searchTerm === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && user.reportStatus.isCompleted) ||
      (statusFilter === 'pending' && user.reportStatus.hasReport && !user.reportStatus.isCompleted) ||
      (statusFilter === 'no-report' && !user.reportStatus.hasReport)

    return matchesSearch && matchesStatus
  }) || []

  const statusCounts = {
    all: departmentData.users?.length || 0,
    completed: departmentData.users?.filter(u => u.reportStatus.isCompleted).length || 0,
    pending: departmentData.users?.filter(u => u.reportStatus.hasReport && !u.reportStatus.isCompleted).length || 0,
    noReport: departmentData.users?.filter(u => !u.reportStatus.hasReport).length || 0,
  }

  const getStatusBadge = (user: any) => {
    if (!user.reportStatus.hasReport) {
      return { label: 'Chưa nộp', variant: 'secondary' as const }
    }
    if (user.reportStatus.isCompleted) {
      return { label: 'Hoàn thành', variant: 'default' as const }
    }
    if (user.reportStatus.taskCompletionRate >= 70) {
      return { label: 'Đang làm', variant: 'outline' as const }
    }
    return { label: 'Cần theo dõi', variant: 'destructive' as const }
  }

  return (
    <MainLayout
      title={departmentData.department.name}
      subtitle={`${departmentData.department.office.name} - Tuần ${departmentData.weekNumber}/${departmentData.year}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
        { label: departmentData.department.name }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <Link href="/admin/hierarchy">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Quay lại báo cáo phân cấp</span>
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

        {/* Mobile Department Summary */}
        <div className="block lg:hidden mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold truncate">{departmentData.department.name}</h1>
                  <p className="text-sm text-muted-foreground truncate">{departmentData.department.office.name}</p>
                </div>
                <div className="text-center">
                  <SimplePieChart
                    completed={departmentData.summary.usersWithReports}
                    incomplete={departmentData.summary.totalUsers - departmentData.summary.usersWithReports}
                    size={50}
                    strokeWidth={6}
                    showPercentage={true}
                    showLabel={false}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Nộp BC</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{departmentData.summary.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Nhân viên</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{departmentData.summary.usersWithReports}</div>
                  <div className="text-xs text-muted-foreground">Đã nộp</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{departmentData.summary.completedReports}</div>
                  <div className="text-xs text-muted-foreground">Hoàn thành</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{departmentData.summary.averageTaskCompletion}%</div>
                  <div className="text-xs text-muted-foreground">Tỷ lệ HT</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Department Summary - Hidden on mobile */}
        <div className="hidden lg:block mb-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Building2 className="w-7 h-7 text-purple-600" />
                    {departmentData.department.name}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline">{departmentData.department.office.name}</Badge>
                    <Badge variant="secondary">
                      Tuần {departmentData.weekNumber}/{departmentData.year}
                    </Badge>
                  </div>
                </div>
                
                {/* Department Summary */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <SimplePieChart
                      completed={departmentData.summary.usersWithReports}
                      incomplete={departmentData.summary.totalUsers - departmentData.summary.usersWithReports}
                      size={100}
                      strokeWidth={10}
                      showLabel
                    />
                    <p className="text-xs text-muted-foreground mt-2">Tỷ lệ nộp BC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành TB</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {departmentData.summary.averageTaskCompletion}%
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {departmentData.department.description && (
              <CardContent>
                <p className="text-muted-foreground">{departmentData.department.description}</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Search & Filter - Mobile Optimized */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm sm:hidden"
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredUsers.length}/{departmentData.users?.length || 0} nhân viên
              </span>
            </div>

            {/* Status Filter Badges - Collapsible on mobile */}
            <div className={`${showFilters ? 'block' : 'hidden sm:block'} space-y-2`}>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Badge 
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 text-center text-xs py-1"
                  onClick={() => setStatusFilter('all')}
                >
                  Tất cả ({statusCounts.all})
                </Badge>
                <Badge 
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-green-600/80 data-[variant=default]:bg-green-600 text-center text-xs py-1"
                  onClick={() => setStatusFilter('completed')}
                >
                  Hoàn thành ({statusCounts.completed})
                </Badge>
                <Badge 
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-yellow-600/80 data-[variant=default]:bg-yellow-600 text-center text-xs py-1"
                  onClick={() => setStatusFilter('pending')}
                >
                  Đang làm ({statusCounts.pending})
                </Badge>
                <Badge 
                  variant={statusFilter === 'no-report' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-red-600/80 data-[variant=default]:bg-red-600 text-center text-xs py-1"
                  onClick={() => setStatusFilter('no-report')}
                >
                  Chưa nộp ({statusCounts.noReport})
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Danh sách nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {departmentData.users?.length === 0 
                      ? 'Phòng ban này chưa có nhân viên nào' 
                      : 'Không tìm thấy nhân viên nào phù hợp'
                    }
                  </p>
                </div>
              ) : (
                filteredUsers.map((user, index) => {
                  const statusBadge = getStatusBadge(user)
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {/* Mobile Layout */}
                          <div className="block lg:hidden">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-medium text-sm">
                                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </span>
                              </div>
                              
                              {user.reportStatus.hasReport && (
                                <div className="flex-shrink-0">
                                  <SimplePieChart
                                    completed={user.reportStatus.completedTasks}
                                    incomplete={user.reportStatus.totalTasks - user.reportStatus.completedTasks}
                                    size={36}
                                    strokeWidth={4}
                                    showPercentage={true}
                                    showLabel={false}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate text-sm">{user.firstName} {user.lastName}</h3>
                                  <Badge variant={statusBadge.variant} className="text-xs flex-shrink-0">
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>Mã: {user.employeeCode}</p>
                                  <p className="truncate">{user.jobPosition.jobName}</p>
                                </div>
                              </div>
                            </div>

                            {user.reportStatus.hasReport && (
                              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                  <span className="text-muted-foreground">Tổng:</span>
                                  <span className="font-medium ml-1">{user.reportStatus.totalTasks}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Xong:</span>
                                  <span className="font-medium ml-1 text-green-600">{user.reportStatus.completedTasks}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Tỷ lệ:</span>
                                  <span className="font-medium ml-1">{user.reportStatus.taskCompletionRate}%</span>
                                </div>
                              </div>
                            )}

                            {!user.reportStatus.hasReport && (
                              <div className="text-center py-3 text-muted-foreground">
                                <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">Chưa nộp báo cáo</p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Link href={`/admin/hierarchy/user/${user.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full text-xs">
                                  Xem chi tiết
                                </Button>
                              </Link>
                              {user.reportStatus.hasReport && user.reportStatus.reportId && (
                                <Link href={`/admin/hierarchy/user/${user.id}/report/${user.reportStatus.reportId}`}>
                                  <Button variant="ghost" size="sm" className="text-xs">
                                    Báo cáo
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Desktop Layout - Hidden on mobile */}
                          <div className="hidden lg:block">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                  </span>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                                    <Badge variant={statusBadge.variant} className="text-xs">
                                      {statusBadge.label}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div>
                                      <p>Mã NV: {user.employeeCode}</p>
                                      <p>Email: {user.email || 'Chưa có'}</p>
                                    </div>
                                    <div>
                                      <p>Vị trí: {user.jobPosition.jobName}</p>
                                      <p>Chức danh: {user.jobPosition.positionName}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {user.reportStatus.hasReport && (
                                <div className="flex items-center gap-6">
                                  <SimplePieChart
                                    completed={user.reportStatus.completedTasks}
                                    incomplete={user.reportStatus.totalTasks - user.reportStatus.completedTasks}
                                    size={80}
                                    strokeWidth={8}
                                    showLabel
                                  />
                                  
                                  <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                      <div className="text-2xl font-bold">{user.reportStatus.totalTasks}</div>
                                      <div className="text-xs text-muted-foreground">Tổng CV</div>
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold text-green-600">{user.reportStatus.completedTasks}</div>
                                      <div className="text-xs text-muted-foreground">Hoàn thành</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="text-right">
                                {user.reportStatus.hasReport && (
                                  <div className="mb-3">
                                    <div className="text-sm text-muted-foreground">Tỷ lệ HT</div>
                                    <div className={`text-2xl font-bold ${
                                      user.reportStatus.taskCompletionRate >= 90 ? 'text-green-600' :
                                      user.reportStatus.taskCompletionRate >= 70 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {user.reportStatus.taskCompletionRate}%
                                    </div>
                                  </div>
                                )}
                                
                                <Link href={`/admin/hierarchy/user/${user.id}`}>
                                  <Button variant="outline" size="sm">
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function DepartmentDetailsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết phòng ban..." />
        </div>
      </MainLayout>
    }>
      <DepartmentDetailsContent />
    </Suspense>
  )
}
