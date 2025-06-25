'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportForm } from '@/components/reports/report-form'
import { ReportsList } from '@/components/reports/reports-list'
import { ReportService } from '@/services/report.service'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentWeek } from '@/lib/date-utils'
import type { WeeklyReport } from '@/types'
import { useSearchParams, usePathname, useRouter as useNextRouter } from 'next/navigation'

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const nextRouter = useNextRouter()

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list')
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingWeekReport, setIsLoadingWeekReport] = useState(false)
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(getCurrentWeek().weekNumber)
  const [currentYear, setCurrentYear] = useState<number>(getCurrentWeek().year)

  // Thêm state cho tab filter
  const [filterTab, setFilterTab] = useState<'week' | 'month' | 'year'>('week')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Move filterKey and useEffect to the top, before any conditional or early return
  const [filterKey, setFilterKey] = useState(0)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReports()
      loadCurrentWeekReport()
    }
  }, [isAuthenticated, user])

  // Auto-load report when week changes in create/edit mode
  useEffect(() => {
    if (isAuthenticated && user && activeTab === 'create') {
      loadReportForWeek(currentWeekNumber, currentYear)
    }
  }, [currentWeekNumber, currentYear, activeTab, isAuthenticated, user])

  // --- Filter tab logic: sync with query param ---
  useEffect(() => {
    // Ưu tiên lấy từ query string nếu có
    const tab = searchParams.get('filter') as 'week' | 'month' | 'year' | null
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    if (tab === 'month' || tab === 'year' || tab === 'week') {
      setFilterTab(tab)
      if (tab === 'month' && month) setSelectedMonth(Number(month))
      if ((tab === 'month' || tab === 'year') && year) setSelectedYear(Number(year))
    }
    setFilterKey((k) => k + 1)
    // eslint-disable-next-line
  }, [searchParams])

  // Khi đổi filter tab, cập nhật query string để đồng bộ với DashboardPage link
  const handleFilterTabChange = (value: string) => {
    const tab = value as 'week' | 'month' | 'year'
    setFilterTab(tab)
    const params = new URLSearchParams(searchParams)
    params.set('filter', tab)
    if (tab === 'month') {
      params.set('month', String(selectedMonth))
      params.set('year', String(selectedYear))
    } else if (tab === 'year') {
      params.set('year', String(selectedYear))
      params.delete('month')
    } else {
      params.delete('month')
      params.delete('year')
    }
    nextRouter.replace(`${pathname}?${params.toString()}`)
  }

  // Khi đổi tháng/năm, cập nhật query string
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
    const params = new URLSearchParams(searchParams)
    params.set('filter', 'month')
    params.set('month', String(month))
    params.set('year', String(selectedYear))
    nextRouter.replace(`${pathname}?${params.toString()}`)
  }
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    const params = new URLSearchParams(searchParams)
    params.set('year', String(year))
    if (filterTab === 'month') params.set('filter', 'month')
    if (filterTab === 'year') params.set('filter', 'year')
    nextRouter.replace(`${pathname}?${params.toString()}`)
  }

  const loadReports = async () => {
    try {
      setIsLoading(true)
      const response = await ReportService.getMyReports(1, 50)
      setReports(response.data || [])
    } catch (error: any) {
      console.error('Failed to load reports:', error)
      toast.error('Không thể tải danh sách báo cáo')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentWeekReport = async () => {
    try {
      const report = await ReportService.getCurrentWeekReport()
      setCurrentReport(report)
    } catch (error: any) {
      console.error('Failed to load current week report:', error)
      // Don't show error for 404 (no current report)
      if (error.status !== 404) {
        toast.error('Không thể tải báo cáo tuần hiện tại')
      }
    }
  }

  const loadReportForWeek = async (weekNumber: number, year: number) => {
    if (!isAuthenticated || !user) return

    setIsLoadingWeekReport(true)
    try {

      // Always fetch from server to get latest data
      const reportResponse = await ReportService.getReportByWeek(weekNumber, year)

      if (reportResponse) {
        setSelectedReport(reportResponse)

        // Update reports list if this report is not in the current list
        setReports(prevReports => {
          const existingIndex = prevReports.findIndex(
            r => r.weekNumber === weekNumber && r.year === year
          )
          if (existingIndex >= 0) {
            // Update existing report
            const updatedReports = [...prevReports]
            updatedReports[existingIndex] = reportResponse
            return updatedReports
          } else {
            // Add new report to list
            return [reportResponse, ...prevReports]
          }
        })
      } else {
        setSelectedReport(null)
      }
    } catch (error: any) {
      console.error('Error loading report for week:', error)
      if (error.status === 404) {
        // No report exists for this week - that's fine
        setSelectedReport(null)
      } else {
        toast.error('Không thể tải báo cáo cho tuần này')
      }
    } finally {
      setIsLoadingWeekReport(false)
    }
  }

  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    setCurrentWeekNumber(newWeekNumber)
    setCurrentYear(newYear)
    // Clear current selection immediately to show loading state
    if (activeTab === 'create') {
      setSelectedReport(null)
    }
  }, [activeTab])

  const handleCreateOrUpdateReport = async (reportData: any): Promise<WeeklyReport> => {
    if (!user) {
      const error = new Error('Vui lòng đăng nhập để tạo báo cáo')
      toast.error(error.message)
      throw error
    }

    // Validate tasks
    if (!reportData.tasks || reportData.tasks.length === 0) {
      const error = new Error('Vui lòng thêm ít nhất một công việc')
      toast.error(error.message)
      throw error
    }

    const emptyTasks = reportData.tasks.filter((task: any) => !task.taskName || task.taskName.trim() === '')
    if (emptyTasks.length > 0) {
      const error = new Error('Vui lòng nhập tên cho tất cả công việc')
      toast.error(error.message)
      throw error
    }

    setIsSaving(true)
    try {
      let result: WeeklyReport

      if (selectedReport) {
        // Update existing report - only send tasks, NOT weekNumber and year
        const updateData = {
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
        result = await ReportService.updateReport(selectedReport.id, updateData)
        toast.success('Cập nhật báo cáo thành công!')
      } else {
        // Create new report - include weekNumber and year as NUMBERS
        const createData = {
          weekNumber: Number(reportData.weekNumber), // Ensure it's a number
          year: Number(reportData.year), // Ensure it's a number
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

        // Additional validation
        if (createData.weekNumber < 1 || createData.weekNumber > 53) {
          throw new Error('Số tuần phải từ 1 đến 53')
        }
        if (createData.year < 2020 || createData.year > 2030) {
          throw new Error('Năm phải từ 2020 đến 2030')
        }

        result = await ReportService.createWeeklyReport(createData)
        toast.success('Tạo báo cáo thành công!')
      }

      // Refresh data
      await loadReports()
      await loadCurrentWeekReport()

      // Switch to list view
      setActiveTab('list')
      setSelectedReport(null)

      return result
    } catch (error: any) {
      console.error('Error saving report:', error)

      if (error.status === 400) {
        // Check if it's a validation error
        if (error.message.includes('weekNumber') || error.message.includes('year')) {
          toast.error('Dữ liệu tuần/năm không hợp lệ. Vui lòng kiểm tra lại.')
        } else {
          toast.error(error.message || 'Dữ liệu báo cáo không hợp lệ')
        }
      } else if (error.status === 403) {
        toast.error('Báo cáo đã bị khóa hoặc quá hạn')
      } else if (error.status === 409) {
        toast.error('Báo cáo cho tuần này đã tồn tại')
      } else {
        toast.error(error.message || 'Không thể lưu báo cáo. Vui lòng thử lại.')
      }

      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewReport = (report: WeeklyReport) => {
    setSelectedReport(report)
    setCurrentWeekNumber(report.weekNumber)
    setCurrentYear(report.year)
    setActiveTab('create')
  }

  const handleCreateNew = () => {
    setSelectedReport(null)
    const current = getCurrentWeek()
    setCurrentWeekNumber(current.weekNumber)
    setCurrentYear(current.year)
    setActiveTab('create')
  }

  const handleDeleteReport = async (reportId: string): Promise<void> => {
    try {
      await ReportService.deleteReport(reportId)

      // Refresh data after deletion
      await loadReports()
      await loadCurrentWeekReport()

      // Switch to list view
      setActiveTab('list')
      setSelectedReport(null)

      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      console.error('Error deleting report:', error)

      if (error.status === 403) {
        toast.error('Không thể xóa báo cáo này. Báo cáo có thể đã bị khóa hoặc không phải của tuần hiện tại.')
      } else if (error.status === 404) {
        toast.error('Báo cáo không tồn tại')
      } else {
        toast.error(error.message || 'Không thể xóa báo cáo. Vui lòng thử lại.')
      }

      throw error
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  const currentWeek = getCurrentWeek()
  const hasCurrentWeekReport = currentReport !== null

  // Lọc báo cáo theo tuần/tháng/năm
  const filteredReports = reports.filter((report) => {
    if (filterTab === 'week') {
      // Chỉ hiển thị báo cáo của tuần hiện tại
      const current = getCurrentWeek()
      return report.weekNumber === current.weekNumber && report.year === current.year
    }
    if (filterTab === 'month') {
      const reportDate = new Date(report.createdAt)
      return (
        reportDate.getMonth() + 1 === selectedMonth &&
        reportDate.getFullYear() === selectedYear
      )
    }
    if (filterTab === 'year') {
      const reportDate = new Date(report.createdAt)
      return reportDate.getFullYear() === selectedYear
    }
    return true
  })

  return (
    <MainLayout
      // title="Báo cáo công việc"
      // subtitle="Quản lý và tạo báo cáo công việc hàng tuần"
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Báo cáo của tôi' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'create' | 'list')}
          key={filterKey}
        >
          {/* Tabs filter theo tuần/tháng/năm */}
          {activeTab === 'list' && (
            <div className="flex items-center justify-between mb-6 flex-wrap">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <Tabs value={filterTab} onValueChange={handleFilterTabChange}>
                  <TabsList>
                    <TabsTrigger value="week">Theo tuần</TabsTrigger>
                    <TabsTrigger value="month">Theo tháng</TabsTrigger>
                    <TabsTrigger value="year">Theo năm</TabsTrigger>
                  </TabsList>
                </Tabs>

                {filterTab === 'month' && (
                  <>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedMonth}
                      onChange={e => handleMonthChange(Number(e.target.value))}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Tháng {i + 1}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedYear}
                      onChange={e => handleYearChange(Number(e.target.value))}
                    >
                      {Array.from(new Set(reports.map(r => new Date(r.createdAt).getFullYear()))).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </>
                )}
                {filterTab === 'year' && (
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedYear}
                    onChange={e => handleYearChange(Number(e.target.value))}
                  >
                    {Array.from(new Set(reports.map(r => new Date(r.createdAt).getFullYear()))).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
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
          )}

          <TabsContent value="list" className="space-y-6" key={filterKey}>
            <ReportsList
              reports={filteredReports}
              onViewReport={handleViewReport}
              onDeleteReport={handleDeleteReport}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            {isLoadingWeekReport ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Đang tải báo cáo tuần {currentWeekNumber}/{currentYear}...
                  </p>
                </div>
              </div>
            ) : (
              <ReportForm
                report={selectedReport}
                onSave={handleCreateOrUpdateReport}
                onDelete={handleDeleteReport}
                onWeekChange={handleWeekChange}
                weekNumber={currentWeekNumber}
                year={currentYear}
                isLoading={isSaving}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
