'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ReportForm } from '@/components/reports/report-form'
import { ReportsList } from '@/components/reports/reports-list'
import { ReportTemplate } from '@/components/reports/report-template'
import { Plus, ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'react-toast-kit'
import { getCurrentWeek, isValidWeekForCreation } from '@/utils/week-utils'
import { useMyReports, useCurrentWeekReport, useCreateWeeklyReport, useUpdateReport, useDeleteReport, useReportByWeek } from '@/hooks/use-reports'
import {  Task, UpdateTaskDto, WeeklyReport } from '@/types'
import { ScreenLoading } from '../loading/screen-loading'
import { UpdateReportDto } from '@/services/report.service'
import useReportStore from '@/store/report-store'
import { Card, CardContent } from '../ui/card'

type FilterTab = 'week' | 'month' | 'year'
type ViewMode = 'list' | 'form' | 'template'

interface ReportData {
  weekNumber: number
  year: number
  tasks: Task[]
}

function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()

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

  // Zustand store with user sync
  const {
    currentTasks,
    selectedReport: storeSelectedReport,
    currentWeekNumber: storeWeekNumber,
    currentYear: storeYear,
    isSaving,
    setCurrentUser,
    navigateToWeek,
    syncReportToStore,
    clearUserSpecificState,
    clearCacheForWeek,
    clearTasks
  } = useReportStore()

  // Sync user to store when user changes
  useEffect(() => {
    if (user?.id) {
      setCurrentUser(user.id)
    } else {
      setCurrentUser(null)
    }
  }, [user?.id, setCurrentUser])

  // Clear store state when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      clearUserSpecificState()
    }
  }, [isAuthenticated, authLoading, clearUserSpecificState])

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

    // Handle direct array response or paginated response
    if (Array.isArray(reportsData?.data)) {
      return reportsData.data
    }
    if (Array.isArray(reportsData)) {
      return reportsData
    }
    // Handle paginated response structure
    if (reportsData?.data && Array.isArray(reportsData.data)) {
      return reportsData.data
    }

    return []
  }, [reportsData])

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

  // Effect to sync selected report with week report - Enhanced with user validation
  useEffect(() => {
    // Only sync if we have a valid user
    if (!user?.id) {
      setSelectedReport(null)
      return
    }

    if (viewMode === 'form') {
      if (weekReport?.id) {
        setSelectedReport(weekReport)
      } else {
        setSelectedReport(null)
      }
    }
  }, [weekReport, viewMode, user?.id])

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

  }, []) // Remove router dependency to prevent re-renders

  // Event handlers with stable references
  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    if (!user?.id) {
      console.warn('⚠️ No user logged in, skipping week change')
      return
    }
    
    setIsOperationLoading(true)
    
    // STEP 1: Complete state cleanup
    setSelectedReport(null)
    syncReportToStore(null)
    clearTasks()
    setCurrentWeekNumber(newWeekNumber)
    setCurrentYear(newYear)
    
    // STEP 2: Clear cache for new week
    clearCacheForWeek(newWeekNumber, newYear)
    navigateToWeek(newWeekNumber, newYear, true)
    
    // STEP 3: Force refetch and verify state
    setTimeout(() => {
      refetchReports()
      setIsOperationLoading(false)
    }, 300)
  }, [user?.id, navigateToWeek, refetchReports, syncReportToStore, clearCacheForWeek, clearTasks])

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

  // FIXED: Remove handleBackToList dependency to prevent infinite loops
  const handleCreateOrUpdateReport = useCallback(async (reportData: ReportData): Promise<WeeklyReport> => {
    if (!user?.id) {
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

      const currentSelectedReport = selectedReport
      const isUpdating = currentSelectedReport && currentSelectedReport.id

      if (isUpdating) {
        const updateData: UpdateReportDto = {
          tasks: reportData.tasks.map((task) => ({
            id: task.id,
            taskName: task.taskName || '',
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.reasonNotDone || undefined,
            evaluations: task.evaluations || []
          }))
        };

        result = await updateReportMutation.mutateAsync({ id: selectedReport.id, data: updateData });
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
      }

      // Wait for mutations to complete and caches to update
      await new Promise(resolve => setTimeout(resolve, 300))

      // Force refetch to ensure UI updates
      await Promise.all([
        refetchReports(),
        refetchCurrentWeek()
      ])

      // ✅ NOW clear state and navigate back to list - AFTER API success
      setSelectedReport(null);
      syncReportToStore(null); // Clear store state
      setViewMode('list');
      updateURLParams(filterTab, selectedMonth, selectedYear);

      return result;
    } catch (error: any) {
      console.error('❌ Save report error for user:', user.id, error);
      const message = error.message || 'Không thể lưu báo cáo. Vui lòng thử lại.';
      toast.error(message);
      throw error;
    }
  }, [user?.id, selectedReport, updateReportMutation, createReportMutation, refetchReports, refetchCurrentWeek, filterTab, selectedMonth, selectedYear, updateURLParams, syncReportToStore])

  // Add missing handlers
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

  const handleBackToList = useCallback(() => {
    setSelectedReport(null)
    setViewMode('list')
    updateURLParams(filterTab, selectedMonth, selectedYear)
  }, [filterTab, selectedMonth, selectedYear, updateURLParams])

  // Add loading state for operations
  const [isOperationLoading, setIsOperationLoading] = useState(false)

  // Enhanced delete handler with complete state cleanup
  const handleDeleteReport = useCallback(async (reportId: string): Promise<void> => {
    setIsOperationLoading(true)
    try {
      // Get report info BEFORE deletion
      const reportToDelete = reports.find(r => r.id === reportId)
      
      // STEP 1: Clear ALL state immediately BEFORE deletion
      setSelectedReport(null)
      syncReportToStore(null)
      clearTasks()
      
      if (reportToDelete) {
        clearCacheForWeek(reportToDelete.weekNumber, reportToDelete.year)
        
        // If we're currently viewing this week, clear week navigation too
        if (currentWeekNumber === reportToDelete.weekNumber && currentYear === reportToDelete.year) {
          const currentWeek = getCurrentWeek()
          setCurrentWeekNumber(currentWeek.weekNumber)
          setCurrentYear(currentWeek.year)
          navigateToWeek(currentWeek.weekNumber, currentWeek.year, true)
        }
      }

      // STEP 2: Perform deletion
      await deleteReportMutation.mutateAsync(reportId)
      
      // STEP 3: Additional cleanup after deletion
      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
        setViewMode('list')
      }
      
      // STEP 4: Force clear Zustand store state
      syncReportToStore(null)
      clearTasks()
      
      // STEP 5: Wait for state to settle
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // STEP 6: Force refetch to ensure fresh data
      await Promise.all([
        refetchReports(),
        refetchCurrentWeek()
      ])
      
      // STEP 7: Navigate back to list view safely
      setViewMode('list')
      updateURLParams(filterTab, selectedMonth, selectedYear)
      
    } catch (error: any) {
      console.error('❌ Delete report error:', error)
      if (error.message.includes('tuần hiện tại') || error.message.includes('tuần tiếp theo')) {
        toast.error('Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo')
      } else {
        toast.error(error.message || 'Không thể xóa báo cáo. Vui lòng thử lại.')
      }
      throw error
    } finally {
      setIsOperationLoading(false)
    }
  }, [selectedReport, deleteReportMutation, refetchReports, refetchCurrentWeek, reports, clearCacheForWeek, syncReportToStore, clearTasks, currentWeekNumber, currentYear, navigateToWeek, filterTab, selectedMonth, selectedYear, updateURLParams])

  // Enhanced create handlers with complete state reset
  const handleCreateNew = useCallback(() => {
    if (!user?.id) {
      console.warn('⚠️ No user logged in, cannot create new report')
      toast.error('Vui lòng đăng nhập để tạo báo cáo')
      return
    }
    
    setIsOperationLoading(true)
    
    // STEP 1: Complete state reset
    setSelectedReport(null)
    syncReportToStore(null)
    clearTasks()
    
    const current = getCurrentWeek()
    setCurrentWeekNumber(current.weekNumber)
    setCurrentYear(current.year)
    
    // STEP 2: Clear cache for target week
    clearCacheForWeek(current.weekNumber, current.year)
    navigateToWeek(current.weekNumber, current.year, true)
    
    // STEP 3: Ensure state is completely clean
    setTimeout(() => {
      setViewMode('form')
      setIsOperationLoading(false)
    }, 200)
  }, [user?.id, navigateToWeek, syncReportToStore, clearCacheForWeek, clearTasks])

  const handleCreateForWeek = useCallback((weekNumber: number, year: number, weekType: 'previous' | 'current' | 'next') => {
    if (!user?.id) {
      console.warn('⚠️ No user logged in, cannot create report for week')
      toast.error('Vui lòng đăng nhập để tạo báo cáo')
      return
    }
    
    setIsOperationLoading(true)
    
    // STEP 1: Complete state reset
    setSelectedReport(null)
    syncReportToStore(null)
    clearTasks()
    setCurrentWeekNumber(weekNumber)
    setCurrentYear(year)
    
    // STEP 2: Clear cache for target week
    clearCacheForWeek(weekNumber, year)
    navigateToWeek(weekNumber, year, true)
    
    // STEP 3: Ensure state is completely clean
    setTimeout(() => {
      setViewMode('form')
      setIsOperationLoading(false)
    }, 200)
  }, [user?.id, navigateToWeek, syncReportToStore, clearCacheForWeek, clearTasks])

  const isFormLoading = useMemo(() => {
    return isOperationLoading || isSaving || weekReportLoading || reportsLoading
  }, [isOperationLoading, isSaving, weekReportLoading, reportsLoading])

  // Loading states
  if (authLoading) {
    return <ScreenLoading size="lg" variant="corner-squares" fullScreen backdrop />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Add a resetKey to force remount ReportForm when week changes
  const resetKey = useMemo(
    () => `${user?.id}-${currentWeekNumber}-${currentYear}-${selectedReport?.id ?? 'no-report'}`,
    [user?.id, currentWeekNumber, currentYear, selectedReport?.id]
  )

  return (
    <MainLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Báo cáo của tôi', href: '/reports' }
      ]}
    >
      <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Add operation loading overlay */}
        {isOperationLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </div>
            </div>
          </div>
        )}

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
                canEvaluation={user?.isManager}
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
                disabled={isOperationLoading}
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

            {/* Add loading state for form initialization */}
            {isOperationLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        Đang khởi tạo form báo cáo...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ReportForm
                key={resetKey}
                report={selectedReport}
                onSave={handleCreateOrUpdateReport}
                onDelete={handleDeleteReport}
                onWeekChange={handleWeekChange}
                weekNumber={currentWeekNumber}
                year={currentYear}
                isLoading={isFormLoading}
                tasks={selectedReport?.tasks ?? weekReport?.tasks}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

ReportsPage.displayName = 'ReportsPage'
export default ReportsPage