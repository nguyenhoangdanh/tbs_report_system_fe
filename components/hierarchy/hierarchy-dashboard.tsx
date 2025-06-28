"use client"

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useMyHierarchyView, useCurrentWeekFilter } from '@/hooks/use-hierarchy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppLoading } from '@/components/ui/app-loading'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp, 
  BarChart3,
  Eye,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface OfficeData {
  id: string
  name: string
  type: string
  stats: {
    totalDepartments: number
    totalUsers: number
    usersWithReports: number
    completedReports: number
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
  stats: {
    totalUsers: number
    usersWithReports: number
    completedReports: number
    totalTasks: number
    completedTasks: number
    reportSubmissionRate: number
    taskCompletionRate: number
    topIncompleteReasons: Array<{
      reason: string
      count: number
      sampleTasks: string[]
    }>
  }
  jobPositionsBreakdown: Array<{
    id: string
    jobName: string
    positionName: string
    totalUsers: number
    usersWithReports: number
    completedReports: number
  }>
}

interface UserData {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email?: string
  jobPosition: {
    id: string
    jobName: string
    positionName: string
  }
  reportStatus: {
    hasReport: boolean
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
  const { weekNumber, year } = useCurrentWeekFilter()
  const [selectedWeek, setSelectedWeek] = useState(weekNumber)
  const [selectedYear, setSelectedYear] = useState(year)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

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
      // Invalidate and refetch hierarchy data
      await queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
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

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', variant: 'default' as const }
    if (rate >= 70) return { label: 'Tốt', variant: 'secondary' as const }
    return { label: 'Cần cải thiện', variant: 'destructive' as const }
  }

  // Render based on user role
  const renderContent = () => {
    switch (user.role) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return renderOfficesOverview(hierarchyData.offices || [])
      
      case 'OFFICE_MANAGER':
        return renderOfficeDetails(hierarchyData)
      
      case 'OFFICE_ADMIN':
        return renderDepartmentDetails(hierarchyData)
      
      case 'USER':
        return renderUserDetails(hierarchyData)
      
      default:
        return <div>Không có quyền truy cập</div>
    }
  }

  const renderOfficesOverview = (offices: OfficeData[]) => {
    const totalUsers = offices.reduce((sum, office) => sum + office.stats.totalUsers, 0)
    const totalReportsSubmitted = offices.reduce((sum, office) => sum + office.stats.usersWithReports, 0)
    const avgCompletionRate = Math.round(offices.reduce((sum, office) => sum + office.stats.taskCompletionRate, 0) / offices.length)
    
    return (
      <div className="space-y-6">
        {/* Summary Cards - Responsive Grid with equal heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-center p-6 hover:shadow-md transition-shadow h-full">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{offices.length}</div>
                <div className="text-sm text-muted-foreground mt-auto">Văn phòng</div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-2xl font-bold">{totalUsers}</div>
                    <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
                  </div>
                  <div className="text-xs text-green-600 mt-2">
                    {totalReportsSubmitted} đã nộp BC
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <SimplePieChart
                    completed={totalReportsSubmitted}
                    incomplete={totalUsers - totalReportsSubmitted}
                    size={50}
                    strokeWidth={5}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="text-center p-6 hover:shadow-md transition-shadow h-full">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{totalReportsSubmitted}</div>
                <div className="text-sm text-muted-foreground mt-auto">Đã nộp báo cáo</div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="text-center p-6 hover:shadow-md transition-shadow h-full">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className={`text-2xl font-bold ${getPerformanceColor(avgCompletionRate)}`}>
                  {avgCompletionRate}%
                </div>
                <div className="text-sm text-muted-foreground mt-auto">Hoàn thành TB</div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Offices List with equal heights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Chi tiết các văn phòng
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
            <div className="grid grid-cols-1 gap-4">
              {offices.map((office, index) => (
                <motion.div
                  key={office.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="h-full"
                >
                  <ResponsiveCard
                    title={office.name}
                    code={office.type === 'HEAD_OFFICE' ? 'VP Chính' : 'VP Nhà máy'}
                    badges={[
                      { 
                        label: getPerformanceBadge(office.stats.taskCompletionRate).label,
                        variant: getPerformanceBadge(office.stats.taskCompletionRate).variant
                      }
                    ]}
                    stats={[
                      { label: 'Nhân viên', value: office.stats.totalUsers },
                      { label: 'Đã nộp BC', value: office.stats.usersWithReports, color: 'text-green-600' },
                      { label: 'BC hoàn thành', value: office.stats.completedReports, color: 'text-blue-600' },
                      { label: 'Tỷ lệ HT', value: `${office.stats.taskCompletionRate}%`, color: getPerformanceColor(office.stats.taskCompletionRate) }
                    ]}
                    completed={office.stats.usersWithReports}
                    total={office.stats.totalUsers}
                    completionRate={office.stats.taskCompletionRate}
                    detailsUrl={`/admin/hierarchy/office/${office.id}`}
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOfficeDetails = (data: any) => {
    // Implementation for office manager view
    return <div>Office Manager View - Coming Soon</div>
  }

  const renderDepartmentDetails = (data: any) => {
    // Implementation for office admin view
    return <div>Office Admin View - Coming Soon</div>
  }

  const renderUserDetails = (data: any) => {
    // Implementation for user view
    return <div>User View - Coming Soon</div>
  }

  return (
    <div className="space-y-6">
      {/* Week/Year Selector with Refresh - Responsive */}
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
                    {[2023, 2024, 2025].map(year => (
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
      {renderContent()}
    </div>
  )
}
