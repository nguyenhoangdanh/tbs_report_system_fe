"use client"

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useCurrentWeekFilters, useDepartmentDetails } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Building2, Search, Filter, RefreshCw, Calendar, Eye, User, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toast-kit'
import { getCurrentWeek } from '@/utils/week-utils'
import { RankingSummaryCard } from '@/components/hierarchy/ranking-summary-card'
import { getPerformanceBadge, getPerformanceColor } from '@/utils/performance-classification'
import { Progress } from '@/components/ui/progress'
import { calculatePerformanceDistribution } from '@/utils/performance-classification'

function DepartmentDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const departmentId = params?.departmentId as string
  
  // Get current week/year with guaranteed fallbacks
  const currentWeekData = useCurrentWeekFilters()
  const currentWeekInfo = getCurrentWeek()
  const currentWeek = currentWeekInfo.weekNumber
  const currentYear = currentWeekData.year ?? currentWeekInfo.year

  // Parse URL parameters with simple fallbacks
  const urlWeek = searchParams.get('weekNumber')
  const urlYear = searchParams.get('year')
  
  const [selectedWeek, setSelectedWeek] = useState<number>(
    urlWeek ? parseInt(urlWeek) || currentWeek : currentWeek
  )
  
  const [selectedYear, setSelectedYear] = useState<number>(
    urlYear ? parseInt(urlYear) || currentYear : currentYear
  )

  // Update URL when week/year changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('weekNumber', selectedWeek.toString())
    params.set('year', selectedYear.toString())
    router.replace(`/admin/hierarchy/department/${departmentId}?${params.toString()}`)
  }, [selectedWeek, selectedYear, departmentId, router])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'no-report'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  // Ensure we pass valid numbers to the hook
  const { 
    data: departmentData, 
    isLoading, 
    error,
    refetch
  } = useDepartmentDetails(departmentId, {
    weekNumber: selectedWeek,
    year: selectedYear
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['hierarchy', 'department', departmentId] })
      await refetch()
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

  // Calculate ranking distribution for users based on their individual task completion rates
  const getUserRankingData = () => {
    if (!departmentData?.users) return null
    
    // Get individual user completion rates from backend
    const userRates = departmentData.users
      .filter(user => user.reportStatus?.hasReport) // Only count users who have reports
      .map(user => user.reportStatus?.taskCompletionRate || 0)
    
    if (userRates.length === 0) return null
    
    const distribution = calculatePerformanceDistribution(userRates)
    
    // Use backend calculated average directly
    const departmentAverage = departmentData.summary?.averageTaskCompletion || 0
    
    return {
      totalEntities: userRates.length, // Only count users with reports
      averageCompletionRate: departmentAverage, // Use backend calculated average
      ranking: {
        excellent: { count: distribution.excellent, percentage: distribution.excellentRate },
        good: { count: distribution.good, percentage: distribution.goodRate },
        average: { count: distribution.average, percentage: distribution.averageRate },
        poor: { count: distribution.poor, percentage: distribution.poorRate },
        fail: { count: distribution.fail, percentage: distribution.failRate }
      }
    }
  }

  const getStatusBadge = (user: any) => {
    if (!user.reportStatus.hasReport) {
      return { label: 'Chưa nộp', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
    }
    if (user.reportStatus.isCompleted) {
      return { label: 'Hoàn thành', variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
    }
    if (user.reportStatus.taskCompletionRate >= 70) {
      return { label: 'Đang làm', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
    }
    return { label: 'Cần theo dõi', variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
  }

  if (!user) return <AppLoading text="Đang xác thực..." />

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN']
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' },
          { label: 'Chi tiết phòng ban', href: '#' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600 dark:text-red-400">Chỉ quản lý mới có thể xem chi tiết phòng ban.</p>
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

  // Also fix error state breadcrumb
  if (error || !departmentData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          // { label: 'Dashboard', href: '/dashboard' },
          // { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo KH & KQCV', href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` },
          { label: 'Chi tiết phòng ban', href: '#' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {(error as any)?.message || 'Có lỗi xảy ra khi tải chi tiết phòng ban'}
              </p>
              <Link href={`/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`}>
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

  // Filter users based on search and status with null safety
  const filteredUsers = departmentData?.users?.filter(user => {
    const matchesSearch = searchTerm === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && user.reportStatus?.isCompleted) ||
      (statusFilter === 'pending' && user.reportStatus?.hasReport && !user.reportStatus?.isCompleted) ||
      (statusFilter === 'no-report' && !user.reportStatus?.hasReport)

    return matchesSearch && matchesStatus
  }) || []

  const statusCounts = {
    all: departmentData?.users?.length || 0,
    completed: departmentData?.users?.filter(u => u.reportStatus?.isCompleted).length || 0,
    pending: departmentData?.users?.filter(u => u.reportStatus?.hasReport && !u.reportStatus?.isCompleted).length || 0,
    noReport: departmentData?.users?.filter(u => !u.reportStatus?.hasReport).length || 0,
  }

  // Generate role-appropriate breadcrumb
  const getBreadcrumbItems = () => {
    const items = []
    
    // // Only show Admin breadcrumb for roles that can access admin area
    // if (user?.role && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    //   items.push({ label: 'Admin', href: '/admin' })
    // }
    items.push({ 
      label: 'Báo cáo KH & KQCV', 
      href: `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}` 
    })
    items.push({ 
      label: departmentData?.department?.name || 'Chi tiết phòng ban',
      href: `/admin/hierarchy/department/${departmentId}?weekNumber=${selectedWeek}&year=${selectedYear}`
    })
    
    return items
  }

  // Generate back URL based on user role and permissions
  const getBackUrl = () => {
    const userRole = user?.role
    
    // OFFICE_ADMIN should go back to their office page if they have access
    if (userRole === 'OFFICE_ADMIN' && departmentData?.department?.office) {
      // Check if this is their department
      const userDepartmentId = user.jobPosition?.department?.id || user.jobPosition?.departmentId
      if (userDepartmentId === departmentId) {
        // This is their own department, go back to dashboard
        return '/dashboard'
      }
      // Otherwise, they shouldn't be here, but if they are, go to dashboard
      return '/dashboard'
    }
    
    // OFFICE_MANAGER can go back to their office page
    if (userRole === 'OFFICE_MANAGER' && departmentData?.department?.office) {
      const userOfficeId = user.office?.id || user.officeId
      const departmentOfficeId = departmentData.department.office.id
      
      if (userOfficeId === departmentOfficeId) {
        return `/admin/hierarchy/office/${departmentOfficeId}?weekNumber=${selectedWeek}&year=${selectedYear}`
      }
      // If different office, go to dashboard (shouldn't happen)
      return '/dashboard'
    }
    
    // ADMIN and SUPERADMIN can choose office page or hierarchy page
    if (userRole && ['SUPERADMIN', 'ADMIN'].includes(userRole)) {
      // Prefer going back to office page if office data is available
      if (departmentData?.department?.office) {
        return `/admin/hierarchy/office/${departmentData.department.office.id}?weekNumber=${selectedWeek}&year=${selectedYear}`
      }
      return `/admin/hierarchy?weekNumber=${selectedWeek}&year=${selectedYear}`
    }
    
    // Default fallback
    return '/dashboard'
  }

  const getBackButtonText = () => {
    const userRole = user?.role
    
    if (userRole === 'OFFICE_ADMIN') {
      return 'Về Dashboard'
    }
    if (userRole === 'OFFICE_MANAGER') {
      return 'Về trang văn phòng'
    }
    if (departmentData?.department?.office) {
      return 'Quay lại văn phòng'
    }
    return 'Quay lại'
  }

  return (
    <MainLayout
      title={departmentData?.department?.name || 'Chi tiết phòng ban'}
      subtitle={`${departmentData?.department?.office?.name || ''} - Tuần ${selectedWeek}/${selectedYear}`}
      showBreadcrumb
      breadcrumbItems={getBreadcrumbItems()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <Link href={getBackUrl()}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{getBackButtonText()}</span>
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
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Chi tiết phòng ban - Tuần {selectedWeek}/{selectedYear}
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
        </Card>

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

        {/* Department Summary Cards - fixed display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center p-6">
            <div className="text-2xl font-bold">{departmentData.summary?.totalUsers || 0}</div>
            <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold text-green-600">{departmentData.summary?.usersWithReports || 0}</div>
            <div className="text-sm text-muted-foreground">Đã nộp BC</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold text-blue-600">{departmentData.summary?.completedReports || 0}</div>
            <div className="text-sm text-muted-foreground">BC hoàn thành</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-2xl font-bold text-purple-600">
              {(departmentData.summary?.averageTaskCompletion || 0).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Hiệu suất TB</div>
          </Card>
        </div>

        {/* Employee Ranking Summary - use frontend calculated ranking if backend doesn't provide */}
        {(() => {
          // First try to use backend ranking data if available
          const backendRanking = departmentData?.summary?.rankingDistribution
          
          // If backend provides ranking data, use it
          if (backendRanking) {
            const rankingData = {
              totalEntities: departmentData.users?.filter(u => u.reportStatus?.hasReport).length || 0,
              averageCompletionRate: departmentData.summary?.averageTaskCompletion || 0,
              ranking: backendRanking
            }
            
            return (
              <div className="mb-6">
                <RankingSummaryCard
                  title="Xếp loại nhân viên phòng ban"
                  data={rankingData}
                  entityType="employees"
                />
              </div>
            )
          }
          
          // Otherwise fall back to frontend calculation
          const frontendRanking = getUserRankingData()
          return frontendRanking ? (
            <div className="mb-6">
              <RankingSummaryCard
                title="Xếp loại nhân viên phòng ban"
                data={frontendRanking}
                entityType="employees"
              />
            </div>
          ) : null
        })()}

        {/* Enhanced Users List - use backend calculated taskCompletionRate */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết nhân viên với xếp loại cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Không tìm thấy nhân viên nào</p>
                </div>
              ) : (
                filteredUsers.map((userData: any, index: number) => {
                  // Use backend calculated taskCompletionRate directly
                  const userCompletionRate = userData.reportStatus?.taskCompletionRate || 0
                  const performanceBadge = getPerformanceBadge(userCompletionRate)
                  const performanceColor = getPerformanceColor(userCompletionRate)

                  return (
                    <motion.div
                      key={userData.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-medium">
                              {userData.firstName} {userData.lastName}
                            </div>
                            <Badge className={performanceBadge.className}>
                              {performanceBadge.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {userData.employeeCode} • {userData.jobPosition?.jobName || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={userData.reportStatus?.hasReport ? 'default' : 'destructive'}
                              className={userData.reportStatus?.hasReport ? 
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }
                            >
                              {userData.reportStatus?.hasReport ? 'Đã nộp' : 'Chưa nộp'}
                            </Badge>
                            {userData.reportStatus?.hasReport && (
                              <Badge 
                                variant={userData.reportStatus?.isCompleted ? 'default' : 'secondary'}
                                className={userData.reportStatus?.isCompleted ? 
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }
                              >
                                {userData.reportStatus?.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                              </Badge>
                            )}
                          </div>

                          {/* Progress Bar - show completion rate with 2 decimal places */}
                          {userData.reportStatus?.hasReport && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Hiệu suất cá nhân</span>
                                <span style={{ color: performanceColor.text }}>
                                  {userCompletionRate.toFixed(2)}%
                                </span>
                              </div>
                              <Progress value={userCompletionRate} className="h-2" />
                            </div>
                          )}
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-semibold text-lg" style={{ color: performanceColor.text }}>
                            {userCompletionRate.toFixed(2)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userData.reportStatus?.completedTasks || 0}/{userData.reportStatus?.totalTasks || 0} công việc
                          </div>
                          {(userData.reportStatus?.incompleteReasons?.length || 0) > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {userData.reportStatus.incompleteReasons.length} lý do chưa HT
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/hierarchy/user/${userData.id}?weekNumber=${selectedWeek}&year=${selectedYear}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
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
