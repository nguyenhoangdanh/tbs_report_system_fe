'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Calendar, Clock, CheckCircle, Lock, Users, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getCurrentWeek, formatDateRange, getWeekDateRange } from '@/lib/date-utils'
import type { WeeklyReport } from '@/types'
import { toast } from 'react-hot-toast'

interface ReportsListProps {
  reports: WeeklyReport[]
  onViewReport: (report: WeeklyReport) => void
  onDeleteReport?: (reportId: string) => Promise<void>
  isLoading?: boolean
}

export const ReportsList = memo(function ReportsList({
  reports,
  onViewReport,
  onDeleteReport,
  isLoading = false
}: ReportsListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<WeeklyReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const currentWeek = getCurrentWeek()

  const handleDeleteClick = (report: WeeklyReport, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onViewReport
    setReportToDelete(report)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!reportToDelete || !onDeleteReport) return

    setIsDeleting(true)
    try {
      await onDeleteReport(reportToDelete.id)
      setShowDeleteDialog(false)
      setReportToDelete(null)
    } catch (error) {
      // Error is already handled in parent component
    } finally {
      setIsDeleting(false)
    }
  }

  const canDeleteReport = (report: WeeklyReport) => {
    const isCurrentWeek = report.weekNumber === currentWeek.weekNumber && report.year === currentWeek.year
    return isCurrentWeek && !report.isLocked && onDeleteReport
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Chưa có báo cáo nào</h3>
            <p className="text-sm">Bạn chưa tạo báo cáo nào. Hãy bắt đầu tạo báo cáo đầu tiên!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report, index) => {
          const { start, end } = getWeekDateRange(report.weekNumber, report.year)
          const dateRange = formatDateRange(start, end)
          const completedTasks = report.tasks?.filter(task => task.isCompleted).length || 0
          const totalTasks = report.tasks?.length || 0
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          const isCurrentWeek = report.weekNumber === currentWeek.weekNumber && report.year === currentWeek.year

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6" onClick={() => onViewReport(report)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCurrentWeek 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        <span className="text-white text-lg font-bold">
                          {report.weekNumber}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-card-foreground">
                          Báo cáo tuần {report.weekNumber}/{report.year}
                        </h3>
                        {isCurrentWeek && (
                          <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Tuần hiện tại
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {report.isLocked && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Đã khóa
                        </Badge>
                      )}
                      <Badge variant={completionRate === 100 ? "default" : "secondary"} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {completionRate}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {completedTasks}/{totalTasks} công việc hoàn thành
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Cập nhật {formatDistanceToNow(new Date(report.updatedAt), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Tạo {formatDistanceToNow(new Date(report.createdAt), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Tiến độ hoàn thành</span>
                      <span className="text-sm font-medium text-card-foreground">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          completionRate === 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {totalTasks > 0 && (
                        <div className="flex -space-x-1">
                          {report.tasks?.slice(0, 3).map((task, i) => (
                            <div 
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium ${
                                task.isCompleted 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                              }`}
                            >
                              {task.isCompleted ? '✓' : '○'}
                            </div>
                          ))}
                          {totalTasks > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                              +{totalTasks - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canDeleteReport(report) && (
                        <Button
                          onClick={(e) => handleDeleteClick(report, e)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewReport(report)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={() => setShowDeleteDialog(false)}
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
