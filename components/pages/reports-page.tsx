'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ReportForm } from '@/components/reports/report-form'
import { ReportsList } from '@/components/reports/reports-list'
import { ReportTemplate } from '@/components/reports/report-template'
import { Plus, ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'react-toast-kit'
import { getCurrentWeek, isValidWeekForCreation } from '@/utils/week-utils'
import { useMyReports, useCurrentWeekReport, useCreateWeeklyReport, useUpdateReport, useDeleteReport, useReportByWeek } from '@/hooks/use-reports'
import { WeeklyReport } from '@/types'

type FilterTab = 'week' | 'month' | 'year'
type ViewMode = 'list' | 'form' | 'template'

interface UpdateReportDto {
  tasks?: Array<{
    taskName?: string
    monday?: boolean
    tuesday?: boolean
    wednesday?: boolean
    thursday?: boolean
    friday?: boolean
    saturday?: boolean
    isCompleted?: boolean
    reasonNotDone?: string
  }>
  isCompleted?: boolean
}

interface ReportData {
  weekNumber: number
  year: number
  tasks: Array<{
    id?: string
    taskName: string
    monday?: boolean
    tuesday?: boolean
    wednesday?: boolean
    thursday?: boolean
    friday?: boolean
    saturday?: boolean
    isCompleted?: boolean
    reasonNotDone?: string
  }>
}

function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL params for initial filter state - ONLY for UI state, not API calls
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

  // Query hooks - NEVER pass filter parameters to API
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useMyReports(1, 50)
  const { data: currentWeekReport, refetch: refetchCurrentWeek } = useCurrentWeekReport()
  const { data: weekReport, isLoading: weekReportLoading } = useReportByWeek(
    viewMode === 'form' && currentWeekNumber ? currentWeekNumber : 0,
    viewMode === 'form' && currentYear ? currentYear : 0
  )

  // Mutation hooks
  const createReportMutation = useCreateWeeklyReport()
  const updateReportMutation = useUpdateReport()
  const deleteReportMutation = useDeleteReport()

  // Memoized data processing - FIX: Handle API response structure correctly
  const reports = useMemo(() => {
    // Backend returns paginated response with 'data' property
    if (reportsData && typeof reportsData === 'object' && 'data' in reportsData) {
      return Array.isArray(reportsData.data) ? reportsData.data : []
    }
    // Handle direct array response
    if (Array.isArray(reportsData)) {
      return reportsData
    }
    return []
  }, [reportsData])

  console.log('🔄 Reports data:', reportsData)
  console.log('🔄 Processed reports:', reports)

  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return []

    return reports.filter((report: any) => {
      try {
        if (filterTab === 'week') {
          const current = getCurrentWeek()
          return report?.weekNumber === current.weekNumber && report?.year === current.year
        }
        
        if (filterTab === 'month') {
          if (!report?.createdAt) return false
          const reportDate = new Date(report.createdAt)
          const reportMonth = reportDate.getMonth() + 1
          const reportYear = reportDate.getFullYear()
          
          return reportMonth === selectedMonth && reportYear === selectedYear
        }
        
        if (filterTab === 'year') {
          return report?.year === selectedYear
        }
      } catch (error) {
        console.error('Filter error:', error, 'Report:', report)
        return false
      }
      return true
    })
  }, [reports, filterTab, selectedMonth, selectedYear])

  const availableYears = useMemo(() => {
    if (!Array.isArray(reports)) return [new Date().getFullYear()]
    
    const yearsFromReportYear = reports
      .filter((r: any) => r?.year && typeof r.year === 'number')
      .map((r: any) => r.year)
    
    const yearsFromCreatedAt = reports
      .filter((r: any) => r?.createdAt && typeof r.createdAt === 'string')
      .map((r: any) => {
        try {
          return new Date(r.createdAt).getFullYear()
        } catch {
          return null
        }
      })
      .filter((year): year is number => year !== null)

    const allYears = [...new Set([...yearsFromReportYear, ...yearsFromCreatedAt])]
      .sort((a, b) => b - a)

    return allYears.length > 0 ? allYears : [new Date().getFullYear()]
  }, [reports])

  // Effect to sync selected report with week report
  useEffect(() => {
    if (viewMode === 'form') {
      setSelectedReport(weekReport || null)
    }
  }, [weekReport, viewMode])

  // CRITICAL: Use shallow routing to prevent API calls - FIXED with stable dependencies
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
    
    // Use replace to avoid adding to history
    window.history.replaceState(null, '', newURL)
    
    console.log('🔄 URL updated (client-side only):', newURL)
  }, []) // Remove router dependency to prevent re-renders

  // Event handlers with stable references
  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    setSelectedReport(null)
    setCurrentWeekNumber(newWeekNumber)
    setCurrentYear(newYear)
  }, [])

  const handleFilterTabChange = useCallback((tab: FilterTab) => {
    setFilterTab(tab)
    updateURLParams(tab, selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, updateURLParams])

  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month)
    updateURLParams(filterTab, month, selectedYear)
  }, [filterTab, selectedYear, updateURLParams])

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year)
    updateURLParams(filterTab, selectedMonth, year)
  }, [filterTab, selectedMonth, updateURLParams])

  // FIXED: Remove handleBackToList dependency to prevent infinite loops
  const handleCreateOrUpdateReport = useCallback(async (reportData: ReportData): Promise<WeeklyReport> => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tạo báo cáo');
    }

    // CRITICAL: Validate week for creation
    if (!selectedReport) {
      const weekValidation = isValidWeekForCreation(
        Number(reportData.weekNumber),
        Number(reportData.year)
      );
      
      if (!weekValidation.isValid) {
        throw new Error(weekValidation.reason || 'Tuần được chọn không hợp lệ');
      }
    }

    // Validation
    if (!reportData.tasks?.length) {
      throw new Error('Vui lòng thêm ít nhất một công việc');
    }

    const emptyTasks = reportData.tasks.filter((task: any) => !task.taskName?.trim());
    if (emptyTasks.length > 0) {
      throw new Error('Vui lòng nhập tên cho tất cả công việc');
    }

    const incompleteTasks = reportData.tasks.filter((task: any) =>
      !task.isCompleted && !task.reasonNotDone?.trim()
    );
    if (incompleteTasks.length > 0) {
      throw new Error('Vui lòng nhập lý do cho các công việc chưa hoàn thành');
    }

    try {
      let result: WeeklyReport;

      if (selectedReport) {
        const updateData: UpdateReportDto = {
          tasks: reportData.tasks.map((task: any) => ({
            taskName: task.taskName.trim(),
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          }))
        };
        result = await updateReportMutation.mutateAsync({ id: selectedReport.id, data: updateData });
        toast.success('Cập nhật báo cáo thành công!');
      } else {
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
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          }))
        };

        result = await createReportMutation.mutateAsync(createData);
        toast.success('Tạo báo cáo thành công!');
      }

      // FIXED: Call refetch and navigation directly instead of through dependency
      refetchReports();
      refetchCurrentWeek();
      
      // Navigate back to list
      setSelectedReport(null);
      setViewMode('list');
      updateURLParams(filterTab, selectedMonth, selectedYear);

      return result;
    } catch (error: any) {
      console.error('Save report error:', error);
      const message = error.message || 'Không thể lưu báo cáo. Vui lòng thử lại.';
      toast.error(message);
      throw error;
    }
  }, [user, selectedReport, updateReportMutation, createReportMutation, refetchReports, refetchCurrentWeek, filterTab, selectedMonth, selectedYear, updateURLParams])

  const handleViewReport = useCallback((report: WeeklyReport) => {
    setSelectedReport(report)
    setCurrentWeekNumber(report.weekNumber)
    setCurrentYear(report.year)
    setViewMode('template')
  }, [])

  const handleEditReport = useCallback((report: WeeklyReport) => {
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

  const handleBackToList = useCallback(() => {
    setSelectedReport(null)
    setViewMode('list')
    updateURLParams(filterTab, selectedMonth, selectedYear)
  }, [filterTab, selectedMonth, selectedYear, updateURLParams])

  const handleDeleteReport = useCallback(async (reportId: string): Promise<void> => {
    try {
      await deleteReportMutation.mutateAsync(reportId)

      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
        setViewMode('list')
      }

      refetchReports()
      refetchCurrentWeek()

      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      console.error('Delete report error:', error)
      if (error.message.includes('tuần hiện tại') || error.message.includes('tuần tiếp theo')) {
        toast.error('Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo')
      } else {
        toast.error(error.message || 'Không thể xóa báo cáo. Vui lòng thử lại.')
      }
      throw error
    }
  }, [selectedReport, deleteReportMutation, refetchReports, refetchCurrentWeek])

  // Calculate week availability - FIX: Type safety for reports
  const weekAvailability = useMemo(() => {
    const current = getCurrentWeek()
    
    // Calculate previous week
    let prevWeek = current.weekNumber - 1
    let prevYear = current.year
    if (prevWeek < 1) {
      prevWeek = 52
      prevYear = current.year - 1
    }

    // Calculate next week
    let nextWeekNum = current.weekNumber + 1
    let nextYear = current.year
    if (nextWeekNum > 52) {
      nextWeekNum = 1
      nextYear = current.year + 1
    }

    // Check which weeks have existing reports - FIX: Type safety
    const hasPreviousWeekReport = Array.isArray(reports) && reports.some((report: any) =>
      report?.weekNumber === prevWeek && report?.year === prevYear
    )
    const hasCurrentWeekReport = Array.isArray(reports) && reports.some((report: any) =>
      report?.weekNumber === current.weekNumber && report?.year === current.year
    )
    const hasNextWeekReport = Array.isArray(reports) && reports.some((report: any) =>
      report?.weekNumber === nextWeekNum && report?.year === nextYear
    )

    // Check if weeks are still creatable
    const isPreviousWeekCreatable = isValidWeekForCreation(prevWeek, prevYear).isValid
    const isCurrentWeekCreatable = isValidWeekForCreation(current.weekNumber, current.year).isValid
    const isNextWeekCreatable = isValidWeekForCreation(nextWeekNum, nextYear).isValid

    return {
      previous: {
        weekNumber: prevWeek,
        year: prevYear,
        hasReport: hasPreviousWeekReport,
        isCreatable: isPreviousWeekCreatable,
        shouldShow: !hasPreviousWeekReport && isPreviousWeekCreatable
      },
      current: {
        weekNumber: current.weekNumber,
        year: current.year,
        hasReport: hasCurrentWeekReport,
        isCreatable: isCurrentWeekCreatable,
        shouldShow: !hasCurrentWeekReport && isCurrentWeekCreatable
      },
      next: {
        weekNumber: nextWeekNum,
        year: nextYear,
        hasReport: hasNextWeekReport,
        isCreatable: isNextWeekCreatable,
        shouldShow: !hasNextWeekReport && isNextWeekCreatable
      }
    }
  }, [reports])

  const handleCreateForWeek = useCallback((weekNumber: number, year: number, weekType: 'previous' | 'current' | 'next') => {
    setSelectedReport(null)
    setCurrentWeekNumber(weekNumber)
    setCurrentYear(year)
    setViewMode('form')
    
    console.log(`Creating report for ${weekType} week: ${weekNumber}/${year}`)
  }, [])

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

  return (
    <MainLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Báo cáo của tôi', href: '/reports' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {viewMode === 'list' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Báo cáo công việc
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý và theo dõi báo cáo công việc hàng tuần
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Create Previous Week Button */}
                {weekAvailability.previous.shouldShow && (
                  <Button
                    onClick={() => handleCreateForWeek(
                      weekAvailability.previous.weekNumber, 
                      weekAvailability.previous.year, 
                      'previous'
                    )}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-xs sm:text-sm"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Tuần {weekAvailability.previous.weekNumber}</span>
                    <span className="xs:hidden">T{weekAvailability.previous.weekNumber}</span>
                    <span className="hidden sm:inline">(Trước)</span>
                  </Button>
                )}

                {/* Create Current Week Button */}
                {weekAvailability.current.shouldShow && (
                  <Button
                    onClick={() => handleCreateForWeek(
                      weekAvailability.current.weekNumber, 
                      weekAvailability.current.year, 
                      'current'
                    )}
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Tuần {weekAvailability.current.weekNumber}</span>
                    <span className="xs:hidden">T{weekAvailability.current.weekNumber}</span>
                    <span className="hidden sm:inline">(Hiện tại)</span>
                  </Button>
                )}

                {/* Create Next Week Button */}
                {weekAvailability.next.shouldShow && (
                  <Button
                    onClick={() => handleCreateForWeek(
                      weekAvailability.next.weekNumber, 
                      weekAvailability.next.year, 
                      'next'
                    )}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs sm:text-sm"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Tuần {weekAvailability.next.weekNumber}</span>
                    <span className="xs:hidden">T{weekAvailability.next.weekNumber}</span>
                    <span className="hidden sm:inline">(Tiếp theo)</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto">
                <Button
                  variant={filterTab === 'week' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm whitespace-nowrap"
                  onClick={() => handleFilterTabChange('week')}
                >
                  Theo tuần
                </Button>
                <Button
                  variant={filterTab === 'month' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm whitespace-nowrap"
                  onClick={() => handleFilterTabChange('month')}
                >
                  Theo tháng
                </Button>
                <Button
                  variant={filterTab === 'year' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm whitespace-nowrap"
                  onClick={() => handleFilterTabChange('year')}
                >
                  Theo năm
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {filterTab === 'month' && (
                  <>
                    <select
                      className="border rounded px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background min-w-0"
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
                      className="border rounded px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background min-w-0"
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
                    className="border rounded px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-background min-w-0"
                    value={selectedYear}
                    onChange={e => handleYearChange(Number(e.target.value))}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <ReportsList
              reports={filteredReports}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              isLoading={reportsLoading}
            />
          </div>
        ) : viewMode === 'template' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={handleBackToList}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Trở về danh sách</span>
                </Button>
                
                {selectedReport && (
                  <Button
                    onClick={() => handleEditReport(selectedReport)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Chỉnh sửa</span>
                  </Button>
                )}
              </div>
            </div>

            {selectedReport && (
              <ReportTemplate 
                report={selectedReport}
                className="print:max-w-none"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={handleBackToList}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 w-fit"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Trở về danh sách</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {selectedReport ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {selectedReport
                    ? `Chỉnh sửa báo cáo tuần ${selectedReport.weekNumber}/${selectedReport.year}`
                    : `Tạo báo cáo tuần ${currentWeekNumber}/${currentYear}`
                  }
                </p>
              </div>
            </div>

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