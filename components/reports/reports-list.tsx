'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { WeeklyReport } from '@/types'
import { getCurrentWeek } from '@/utils/week-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Trash2, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toast-kit'

// Helper function to get next week
function getNextWeek() {
  const current = getCurrentWeek()
  let nextWeekNumber = current.weekNumber + 1
  let nextYear = current.year
  
  if (nextWeekNumber > 52) {
    nextWeekNumber = 1
    nextYear = current.year + 1
  }
  
  return { weekNumber: nextWeekNumber, year: nextYear }
}

// ✅ NEW: Helper function to check if report has evaluations
function hasReportEvaluations(report: WeeklyReport): boolean {
  return report.tasks?.some(task => 
    task.evaluations && Array.isArray(task.evaluations) && task.evaluations.length > 0
  ) || false
}

// ✅ NEW: Helper function to count total evaluations in report
function countReportEvaluations(report: WeeklyReport): number {
  return report.tasks?.reduce((total, task) => {
    return total + (task.evaluations?.length || 0)
  }, 0) || 0
}

interface ReportsListProps {
  reports: WeeklyReport[]
  onViewReport: (report: WeeklyReport) => void
  onEditReport: (report: WeeklyReport) => void
  onDeleteReport?: (reportId: string) => Promise<void>
  isLoading?: boolean
}

// Memoized ReportCard component with enhanced evaluation checks
const ReportCard = memo(function ReportCard({
  report,
  onView,
  onDelete,
  canDelete
}: {
  report: WeeklyReport
  onView: (report: WeeklyReport) => void
  onDelete?: (report: WeeklyReport, e: React.MouseEvent) => void
  canDelete: boolean
}) {
  const shouldReduceMotion = useReducedMotion()

  // Memoize calculations
  const stats = useMemo(() => {
    const completedTasks = report.tasks?.filter(task => task.isCompleted).length || 0
    const totalTasks = report.tasks?.length || 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const isReportCompleted = totalTasks > 0 && completedTasks === totalTasks

    // ✅ NEW: Calculate evaluation statistics
    const hasEvaluations = hasReportEvaluations(report)
    const totalEvaluations = countReportEvaluations(report)
    const evaluatedTasksCount = report.tasks?.filter(task => 
      task.evaluations && task.evaluations.length > 0
    ).length || 0

    return { 
      completedTasks, 
      totalTasks, 
      completionRate, 
      isReportCompleted,
      hasEvaluations,
      totalEvaluations,
      evaluatedTasksCount
    }
  }, [report.tasks])

  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { 
      addSuffix: true, 
      locale: vi 
    }) : 'Không xác định'
  }, [report.createdAt])

  const handleClick = useCallback(() => onView(report), [onView, report])
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    if (stats.hasEvaluations) {
      // Show warning about evaluations
      return
    }

    if (onDelete) {
      onDelete(report, e)
    }
  }, [onDelete, report, stats.hasEvaluations])

  return (
    <motion.div
      className="cursor-pointer"
      onClick={handleClick}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
      transition={shouldReduceMotion ? {} : { duration: 0.2 }}
    >
      <Card 
        className="hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Tuần {report.weekNumber}/{report.year}
            </CardTitle>
            
            {/* ✅ NEW: Show evaluation indicator */}
            {stats.hasEvaluations && (
              <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                <span>{stats.totalEvaluations} đánh giá</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            {formattedDate}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tiến độ công việc</span>
              <span className="font-medium">{stats.completedTasks}/{stats.totalTasks}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {stats.completedTasks} hoàn thành
              </div>
              {stats.totalTasks - stats.completedTasks > 0 && (
                <div className="flex items-center text-orange-500">
                  <XCircle className="w-4 h-4 mr-1" />
                  {stats.totalTasks - stats.completedTasks} chưa hoàn thành
                </div>
              )}
            </div>

            {/* ✅ NEW: Show evaluation summary */}
            {stats.hasEvaluations && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Có {stats.evaluatedTasksCount} công việc đã được đánh giá</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClick}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Xem
              </Button>
              
              {canDelete && onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className={`${stats.hasEvaluations 
                    ? 'text-gray-400 hover:text-gray-500 hover:bg-gray-50 cursor-not-allowed opacity-50' 
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                  disabled={stats.hasEvaluations}
                  title={stats.hasEvaluations 
                    ? `Không thể xóa do có ${stats.totalEvaluations} đánh giá` 
                    : 'Xóa báo cáo'
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

ReportCard.displayName = 'ReportCard'

export const ReportsList = memo(function ReportsList({
  reports,
  onViewReport,
  onEditReport,
  onDeleteReport,
  isLoading = false
}: ReportsListProps) {
  const shouldReduceMotion = useReducedMotion()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<WeeklyReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Memoize current week
  const currentWeek = useMemo(() => getCurrentWeek(), [])
  const nextWeek = useMemo(() => getNextWeek(), [])
  
  // ✅ ENHANCED: Enhanced canDeleteReport with evaluation check
  const canDeleteReport = useCallback((report: WeeklyReport): boolean => {
    const isCurrentWeek = (report.weekNumber === currentWeek.weekNumber && report.year === currentWeek.year) 
    || (report.weekNumber === nextWeek.weekNumber && report.year === nextWeek.year)
    
    const hasEvaluations = hasReportEvaluations(report)
    
    return isCurrentWeek && !report.isLocked && !!onDeleteReport && !hasEvaluations
  }, [currentWeek, nextWeek, onDeleteReport])

  // ✅ ENHANCED: Delete handlers with evaluation validation
  const handleDeleteClick = useCallback((report: WeeklyReport, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Double-check evaluations before showing dialog
    const hasEvaluations = hasReportEvaluations(report)
    const totalEvaluations = countReportEvaluations(report)
    
    if (hasEvaluations) {
      toast.error(
        `Không thể xóa báo cáo do có ${totalEvaluations} đánh giá từ cấp trên`,
      )
      return
    }

    setReportToDelete(report)
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!reportToDelete || !onDeleteReport) return

    // Final evaluation check before deletion
    const hasEvaluations = hasReportEvaluations(reportToDelete)
    if (hasEvaluations) {
      toast.error('Không thể xóa báo cáo do có đánh giá từ cấp trên')
      setShowDeleteDialog(false)
      setReportToDelete(null)
      return
    }

    setIsDeleting(true)
    try {
      await onDeleteReport(reportToDelete.id)
      setShowDeleteDialog(false)
      setReportToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }, [reportToDelete, onDeleteReport])

  const handleCloseDialog = useCallback(() => {
    setShowDeleteDialog(false)
    setReportToDelete(null)
  }, [])

  // Enhanced memoization with proper cache busting
  const validReports = useMemo(() => {
    const filtered = Array.isArray(reports)
      ? reports.filter(report => report?.id && typeof report.id === 'string')
      : []
    
    return filtered
  }, [reports])

  // ✅ FIX: Move reportStats calculation here - ALWAYS call useMemo unconditionally
  const reportStats = useMemo(() => {
    if (!reportToDelete) return null
    
    const hasEvaluations = hasReportEvaluations(reportToDelete)
    const totalEvaluations = countReportEvaluations(reportToDelete)
    const evaluatedTasksCount = reportToDelete.tasks?.filter(task => 
      task.evaluations && task.evaluations.length > 0
    ).length || 0

    return { hasEvaluations, totalEvaluations, evaluatedTasksCount }
  }, [reportToDelete]) // ✅ This is now always called, no conditional hook usage

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? false : { opacity: 1 }}
            transition={shouldReduceMotion ? {} : { delay: i * 0.05 }}
          />
        ))}
      </div>
    )
  }

  if (!validReports.length) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có báo cáo nào</h3>
          <p className="text-muted-foreground">
            Bạn chưa tạo báo cáo nào cho bộ lọc này. Hãy bắt đầu tạo báo cáo đầu tiên!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={shouldReduceMotion ? false : { opacity: 1 }}
      transition={shouldReduceMotion ? {} : { duration: 0.2 }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {validReports.map((report) => (
          <ReportCard
            key={`report-${report.id}-${report.updatedAt || report.createdAt}`}
            report={report}
            onView={onViewReport}
            onDelete={handleDeleteClick}
            canDelete={canDeleteReport(report)}
          />
        ))}
      </div>

      {/* ✅ ENHANCED: Delete Dialog with evaluation warnings */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reportStats?.hasEvaluations ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Không thể xóa báo cáo
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Xác nhận xóa báo cáo
                </>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {reportStats?.hasEvaluations ? (
                <div className="space-y-3">
                  <p className="text-amber-700 dark:text-amber-300">
                    Báo cáo tuần {reportToDelete?.weekNumber}/{reportToDelete?.year} không thể xóa vì:
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                      <li>• Có <strong>{reportStats.totalEvaluations} đánh giá</strong> từ cấp trên</li>
                      <li>• Trên <strong>{reportStats.evaluatedTasksCount} công việc</strong> đã được review</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Để bảo vệ dữ liệu đánh giá, báo cáo này không thể bị xóa.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    Bạn có chắc chắn muốn xóa báo cáo tuần {reportToDelete?.weekNumber}/{reportToDelete?.year}?
                  </p>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                      ⚠️ Thao tác này không thể hoàn tác và sẽ xóa tất cả công việc trong báo cáo.
                    </p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
            >
              {reportStats?.hasEvaluations ? 'Đóng' : 'Hủy'}
            </Button>
            {!reportStats?.hasEvaluations && (
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa báo cáo
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
})

ReportsList.displayName = 'ReportsList'
