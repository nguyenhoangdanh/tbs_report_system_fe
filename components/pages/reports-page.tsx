'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportForm } from '@/components/reports/report-form'
import { ReportsList } from '@/components/reports/reports-list'
import { ReportService } from '@/services/report.service'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getCurrentWeek } from '@/lib/date-utils'
import type { UpdateTaskReportDto, WeeklyReport } from '@/types'

export function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list')
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingWeekReport, setIsLoadingWeekReport] = useState(false)
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number>(getCurrentWeek().weekNumber)
  const [currentYear, setCurrentYear] = useState<number>(getCurrentWeek().year)

  // Filter states
  const [filterTab, setFilterTab] = useState<'week' | 'month' | 'year'>('week')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // ...existing useEffects and functions...

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReports()
      loadCurrentWeekReport()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user && activeTab === 'create') {
      loadReportForWeek(currentWeekNumber, currentYear)
    }
  }, [currentWeekNumber, currentYear, activeTab, isAuthenticated, user])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      const response = await ReportService.getMyReports(1, 50)
      setReports(response.data || [])
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách báo cáo')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentWeekReport = async () => {
    try {
      const report = await ReportService.getCurrentWeekReport()
      setCurrentReport(report)
    } catch (error: any) {
      if (error.status !== 404) {
        toast.error(error.message || 'Không thể tải báo cáo tuần hiện tại')
      }
    }
  }

  const loadReportForWeek = async (weekNumber: number, year: number) => {
    if (!isAuthenticated || !user) return

    setIsLoadingWeekReport(true)
    try {
      const reportResponse = await ReportService.getReportByWeek(weekNumber, year)

      if (reportResponse) {
        setSelectedReport(reportResponse)
        setReports(prevReports => {
          const existingIndex = prevReports.findIndex(
            r => r.weekNumber === weekNumber && r.year === year
          )
          if (existingIndex >= 0) {
            const updatedReports = [...prevReports]
            updatedReports[existingIndex] = reportResponse
            return updatedReports
          } else {
            return [reportResponse, ...prevReports]
          }
        })
      } else {
        setSelectedReport(null)
      }
    } catch (error: any) {
      if (error.status === 404) {
        setSelectedReport(null)
      } else {
        toast.error(error.message || 'Không thể tải báo cáo cho tuần này')
      }
    } finally {
      setIsLoadingWeekReport(false)
    }
  }

  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    setCurrentWeekNumber(newWeekNumber)
    setCurrentYear(newYear)
    if (activeTab === 'create') {
      setSelectedReport(null)
    }
  }, [activeTab])

  const handleCreateOrUpdateReport = async (reportData: any): Promise<WeeklyReport> => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tạo báo cáo')
    }

    if (!reportData.tasks || reportData.tasks.length === 0) {
      throw new Error('Vui lòng thêm ít nhất một công việc')
    }

    const emptyTasks = reportData.tasks.filter((task: any) => !task.taskName || task.taskName.trim() === '')
    if (emptyTasks.length > 0) {
      throw new Error('Vui lòng nhập tên cho tất cả công việc')
    }

    setIsSaving(true)
    try {
      let result: WeeklyReport

      if (selectedReport) {
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
        result = await ReportService.updateReport(selectedReport.id, updateData)
        toast.success('Cập nhật báo cáo thành công!')
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
            sunday: task.sunday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          }))
        }

        result = await ReportService.createWeeklyReport(createData)
        toast.success('Tạo báo cáo thành công!')
      }

      await loadReports()
      await loadCurrentWeekReport()

      setActiveTab('list')
      setSelectedReport(null)

      return result
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu báo cáo. Vui lòng thử lại.')
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

      await loadReports()
      await loadCurrentWeekReport()

      setActiveTab('list')
      setSelectedReport(null)

      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa báo cáo. Vui lòng thử lại.')
      throw error
    }
  }

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

  const currentWeek = getCurrentWeek()
  const hasCurrentWeekReport = currentReport !== null

  const filteredReports = reports.filter((report) => {
    if (filterTab === 'week') {
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
        >
          {activeTab === 'list' && (
            <div className="flex items-center justify-between mb-6 flex-wrap">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <Tabs value={filterTab} onValueChange={(value) => setFilterTab(value as 'week' | 'month' | 'year')}>
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
                      onChange={e => setSelectedMonth(Number(e.target.value))}
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
                      onChange={e => setSelectedYear(Number(e.target.value))}
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
                    onChange={e => setSelectedYear(Number(e.target.value))}
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

          <TabsContent value="list" className="space-y-6">
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
