'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ReportForm } from '@/components/reports/report-form'
import { ReportsList } from '@/components/reports/reports-list'
import { Plus, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentWeek } from '@/lib/date-utils'
import { useMyReports, useCurrentWeekReport, useCreateWeeklyReport, useUpdateReport, useDeleteReport, useReportByWeek } from '@/hooks/use-reports'
import type { UpdateTaskReportDto, WeeklyReport } from '@/types'

type FilterTab = 'week' | 'month' | 'year'
type ViewMode = 'list' | 'form'

function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Parse URL params for initial filter state
  const initialFilter = useMemo(() => {
    const filter = searchParams.get('filter')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    if (filter === 'week') {
      return { tab: 'week' as FilterTab, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
    } else if (filter === 'month' && month && year) {
      return { tab: 'month' as FilterTab, month: parseInt(month), year: parseInt(year) }
    } else if (filter === 'year' && year) {
      return { tab: 'year' as FilterTab, month: new Date().getMonth() + 1, year: parseInt(year) }
    }
    
    return { tab: 'week' as FilterTab, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
  }, [searchParams])

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterTab, setFilterTab] = useState<FilterTab>(initialFilter.tab)
  const [selectedMonth, setSelectedMonth] = useState<number>(initialFilter.month)
  const [selectedYear, setSelectedYear] = useState<number>(initialFilter.year)
  
  // Report State
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(getCurrentWeek().weekNumber)
  const [currentYear, setCurrentYear] = useState<number>(getCurrentWeek().year)

  // Update URL when filter changes
  const updateURLParams = useCallback((tab: FilterTab, month?: number, year?: number) => {
    const params = new URLSearchParams()
    params.set('filter', tab)
    
    if (tab === 'month' && month && year) {
      params.set('month', month.toString())
      params.set('year', year.toString())
    } else if (tab === 'year' && year) {
      params.set('year', year.toString())
    }
    
    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [router])

  // Update URL when filter changes
  useEffect(() => {
    if (viewMode === 'list') {
      updateURLParams(filterTab, selectedMonth, selectedYear)
    }
  }, [filterTab, selectedMonth, selectedYear, viewMode, updateURLParams])

  // Query hooks
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useMyReports(1, 50)
  const { data: currentWeekReport, refetch: refetchCurrentWeek } = useCurrentWeekReport()
  const { data: weekReport, isLoading: weekReportLoading } = useReportByWeek(
    viewMode === 'form' ? currentWeekNumber : undefined,
    viewMode === 'form' ? currentYear : undefined
  )

  // Mutation hooks
  const createReportMutation = useCreateWeeklyReport()
  const updateReportMutation = useUpdateReport()
  const deleteReportMutation = useDeleteReport()

  // Memoized data processing
  const reports = useMemo(() => {
    return reportsData?.data || []
  }, [reportsData])

  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return []

    return reports.filter((report) => {
      if (!report?.createdAt) return false
      
      try {
        if (filterTab === 'week') {
          const current = getCurrentWeek()
          return report.weekNumber === current.weekNumber && report.year === current.year
        }
        if (filterTab === 'month') {
          const reportDate = new Date(report.createdAt)
          if (isNaN(reportDate.getTime())) return false
          return (
            reportDate.getMonth() + 1 === selectedMonth &&
            reportDate.getFullYear() === selectedYear
          )
        }
        if (filterTab === 'year') {
          const reportDate = new Date(report.createdAt)
          if (isNaN(reportDate.getTime())) return false
          return reportDate.getFullYear() === selectedYear
        }
      } catch {
        return false
      }
      return true
    })
  }, [reports, filterTab, selectedMonth, selectedYear])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(
      reports
        .filter(r => r?.createdAt)
        .map(r => {
          try {
            const date = new Date(r.createdAt)
            return isNaN(date.getTime()) ? null : date.getFullYear()
          } catch {
            return null
          }
        })
        .filter(year => year !== null)
    )).sort((a, b) => b - a)
    
    return years.length > 0 ? years : [new Date().getFullYear()]
  }, [reports])

  const currentWeek = useMemo(() => getCurrentWeek(), [])
  const hasCurrentWeekReport = currentWeekReport !== null

  // Effect to sync selected report with week report
  useEffect(() => {
    if (viewMode === 'form') {
      setSelectedReport(weekReport || null)
    }
  }, [weekReport, viewMode])

  // Event handlers
  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    setSelectedReport(null)
    setCurrentWeekNumber(newWeekNumber)
    setCurrentYear(newYear)
  }, [])

  const handleFilterTabChange = useCallback((tab: FilterTab) => {
    setFilterTab(tab)
    // Clear URL params when switching to week filter
    if (tab === 'week') {
      const params = new URLSearchParams()
      params.set('filter', 'week')
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false })
    }
  }, [router])

  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month)
  }, [])

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year)
  }, [])

  // Mutation handlers
  const handleCreateOrUpdateReport = useCallback(async (reportData: any): Promise<WeeklyReport> => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tạo báo cáo')
    }

    // Validation
    if (!reportData.tasks?.length) {
      throw new Error('Vui lòng thêm ít nhất một công việc')
    }

    const emptyTasks = reportData.tasks.filter((task: any) => !task.taskName?.trim())
    if (emptyTasks.length > 0) {
      throw new Error('Vui lòng nhập tên cho tất cả công việc')
    }

    const incompleteTasks = reportData.tasks.filter((task: any) => 
      !task.isCompleted && !task.reasonNotDone?.trim()
    )
    if (incompleteTasks.length > 0) {
      throw new Error('Vui lòng nhập lý do cho các công việc chưa hoàn thành')
    }

    try {
      let result: WeeklyReport

      if (selectedReport) {
        // Update existing report
        const updateData: UpdateTaskReportDto = {
          tasks: reportData.tasks.map((task: any) => ({
            taskName: task.taskName.trim(),
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            sunday: task.sunday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          }))
        }
        result = await updateReportMutation.mutateAsync({ id: selectedReport.id, data: updateData })
        toast.success('Cập nhật báo cáo thành công!')
      } else {
        // Create new report
        const createData = {
          weekNumber: Number(reportData.weekNumber),
          year: Number(reportData.year),
          tasks: reportData.tasks.map((task: any) => ({
            taskName: task.taskName.trim(),
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            sunday: task.sunday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          }))
        }

        result = await createReportMutation.mutateAsync(createData)
        toast.success('Tạo báo cáo thành công!')
      }

      // Refresh queries
      refetchReports()
      refetchCurrentWeek()

      // Go back to list view
      handleBackToList()

      return result
    } catch (error: any) {
      console.error('Save report error:', error)
      const message = error.message || 'Không thể lưu báo cáo. Vui lòng thử lại.'
      toast.error(message)
      throw error
    }
  }, [user, selectedReport, updateReportMutation, createReportMutation, refetchReports, refetchCurrentWeek])

  const handleViewReport = useCallback((report: WeeklyReport) => {
    setSelectedReport(report)
    setCurrentWeekNumber(report.weekNumber)
    setCurrentYear(report.year)
    setViewMode('form')
  }, [])

  const handleCreateNew = useCallback(() => {
    setSelectedReport(null)
    const current = getCurrentWeek()
    setCurrentWeekNumber(current.weekNumber)
    setCurrentYear(current.year)
    setViewMode('form')
  }, [])

  const handleCreatePreviousWeek = useCallback(() => {
    setSelectedReport(null)
    const current = getCurrentWeek()
    // Calculate previous week
    let prevWeek = current.weekNumber - 1
    let prevYear = current.year
    
    if (prevWeek < 1) {
      prevWeek = 52
      prevYear = current.year - 1
    }
    
    setCurrentWeekNumber(prevWeek)
    setCurrentYear(prevYear)
    setViewMode('form')
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedReport(null)
    setViewMode('list')
    // Re-apply filter params when returning to list
    updateURLParams(filterTab, selectedMonth, selectedYear)
  }, [filterTab, selectedMonth, selectedYear, updateURLParams])

  const handleDeleteReport = useCallback(async (reportId: string): Promise<void> => {
    try {
      // Sử dụng mutation để tự động invalidate cache
      await deleteReportMutation.mutateAsync(reportId)

      // Clear selected report if it was deleted
      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
        setViewMode('list')
      }

      // Note: Không cần manual refetch vì mutation đã tự động invalidate cache
      // dashboard sẽ tự động update
      
      // Chỉ refetch nếu cần thiết
      refetchReports()
      refetchCurrentWeek()
      
      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      console.error('Delete report error:', error)
      toast.error(error.message || 'Không thể xóa báo cáo. Vui lòng thử lại.')
      throw error
    }
  }, [selectedReport, deleteReportMutation, refetchReports, refetchCurrentWeek])

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const isFormLoading = createReportMutation.isPending || updateReportMutation.isPending || weekReportLoading

  // Check if previous week report exists
  const previousWeek = useMemo(() => {
    const current = getCurrentWeek()
    let prevWeek = current.weekNumber - 1
    let prevYear = current.year
    
    if (prevWeek < 1) {
      prevWeek = 52
      prevYear = current.year - 1
    }
    
    return { weekNumber: prevWeek, year: prevYear }
  }, [])

  const hasPreviousWeekReport = useMemo(() => {
    return reports.some(report => 
      report.weekNumber === previousWeek.weekNumber && 
      report.year === previousWeek.year
    )
  }, [reports, previousWeek])

  return (
    <MainLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Báo cáo của tôi' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'list' ? (
          // List View
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Báo cáo công việc
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý và theo dõi báo cáo công việc hàng tuần
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Create Previous Week Button - Only show if no previous week report */}
                {!hasPreviousWeekReport && (
                  <Button
                    onClick={handleCreatePreviousWeek}
                    variant="outline"
                    className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo báo cáo tuần {previousWeek.weekNumber}
                  </Button>
                )}
                
                <Button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  {hasCurrentWeekReport
                    ? 'Tạo báo cáo mới'
                    : `Tạo báo cáo tuần ${currentWeek.weekNumber}`}
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={filterTab === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterTabChange('week')}
                >
                  Theo tuần
                </Button>
                <Button
                  variant={filterTab === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterTabChange('month')}
                >
                  Theo tháng
                </Button>
                <Button
                  variant={filterTab === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterTabChange('year')}
                >
                  Theo năm
                </Button>
              </div>

              {filterTab === 'month' && (
                <>
                  <select
                    className="border rounded px-3 py-2 text-sm bg-background"
                    value={selectedMonth}
                    onChange={e => handleMonthChange(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-3 py-2 text-sm bg-background"
                    value={selectedYear}
                    onChange={e => handleYearChange(Number(e.target.value))}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </>
              )}
              
              {filterTab === 'year' && (
                <select
                  className="border rounded px-3 py-2 text-sm bg-background"
                  value={selectedYear}
                  onChange={e => handleYearChange(Number(e.target.value))}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Reports List */}
            <ReportsList
              reports={filteredReports}
              onViewReport={handleViewReport}
              onDeleteReport={handleDeleteReport}
              isLoading={reportsLoading}
            />
          </div>
        ) : (
          // Form View
          <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Trở về danh sách
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedReport ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedReport 
                    ? `Chỉnh sửa báo cáo tuần ${selectedReport.weekNumber}/${selectedReport.year}`
                    : `Tạo báo cáo tuần ${currentWeekNumber}/${currentYear}`
                  }
                </p>
              </div>
            </div>

            {/* Report Form */}
            <ReportForm
              report={selectedReport}
              onSave={handleCreateOrUpdateReport}
              onDelete={handleDeleteReport}
              onWeekChange={handleWeekChange}
              weekNumber={currentWeekNumber}
              year={currentYear}
              isLoading={isFormLoading}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}

ReportsPage.displayName = 'ReportsPage'

export default ReportsPage
