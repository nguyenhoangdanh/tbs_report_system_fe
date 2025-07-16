'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Trash2, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getCurrentWeek } from '@/utils/week-utils'
import type { WeeklyReport } from '@/types'

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

interface ReportsListProps {
  reports: WeeklyReport[]
  onViewReport: (report: WeeklyReport) => void
  onEditReport: (report: WeeklyReport) => void
  onDeleteReport?: (reportId: string) => Promise<void>
  isLoading?: boolean
}

// Memoized ReportCard component with corrected prop types
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
  // Memoize calculations
  const stats = useMemo(() => {
    const completedTasks = report.tasks?.filter(task => task.isCompleted).length || 0
    const totalTasks = report.tasks?.length || 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const isReportCompleted = totalTasks > 0 && completedTasks === totalTasks

    return { completedTasks, totalTasks, completionRate, isReportCompleted }
  }, [report.tasks])

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    return report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { 
      addSuffix: true, 
      locale: vi 
    }) : 'Không xác định'
  }, [report.createdAt])

  const handleClick = useCallback(() => onView(report), [onView, report])
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(report, e)
    }
  }, [onDelete, report])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Tuần {report.weekNumber}/{report.year}
            </CardTitle>
            {/* <Badge 
              variant={stats.isReportCompleted ? "default" : "secondary"}
              className={stats.isReportCompleted ? "bg-green-100 text-green-800" : ""}
            >
              {stats.isReportCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
            </Badge> */}
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<WeeklyReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Memoize current week
  const currentWeek = useMemo(() => getCurrentWeek(), [])
  const nextWeek = useMemo(() => getNextWeek(), [])
  const canDeleteReport = useCallback((report: WeeklyReport): boolean => {
    const isCurrentWeek = (report.weekNumber === currentWeek.weekNumber && report.year === currentWeek.year) 
    || (report.weekNumber === nextWeek.weekNumber && report.year === nextWeek.year)
    return isCurrentWeek && !report.isLocked && !!onDeleteReport
  }, [currentWeek, nextWeek, onDeleteReport])

  // Optimized delete handlers - now takes report and event
  const handleDeleteClick = useCallback((report: WeeklyReport, e: React.MouseEvent) => {
    e.stopPropagation()
    setReportToDelete(report)
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!reportToDelete || !onDeleteReport) return

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
  }, [reports]) // Remove extra dependency, just use reports

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
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
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {validReports.map((report) => (
          <ReportCard
            key={`report-${report.id}-${report.updatedAt || report.createdAt}`} // Enhanced key for proper re-rendering
            report={report}
            onView={onViewReport}
            onDelete={handleDeleteClick}
            canDelete={canDeleteReport(report)}
          />
        ))}
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa báo cáo</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa báo cáo tuần {reportToDelete?.weekNumber}/{reportToDelete?.year}?
              <br />
              <span className="text-red-600 font-medium">
                Thao tác này không thể hoàn tác và sẽ xóa tất cả công việc trong báo cáo.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
            >
              Hủy
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

ReportsList.displayName = 'ReportsList'
