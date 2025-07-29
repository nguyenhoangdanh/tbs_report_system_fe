'use client'

import { useState, useCallback, useEffect, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Trash2, ChevronLeft, ChevronRight, Calendar, Save } from 'lucide-react'
import { TaskTable } from './task-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-toast-kit'
import { getCurrentWeek, isValidWeekForCreation, WeekValidationResult, getWorkWeekRange, formatWorkWeek } from '@/utils/week-utils'
import type { Task, WeeklyReport } from '@/types'
import { SubmitButton } from '../ui/submit-button'
import useReportStore from '@/store/report-store'

// Helper functions for week validation
function isValidWeekForEdit(weekNumber: number, year: number): WeekValidationResult {
  return isValidWeekForCreation(weekNumber, year)
}

function isValidWeekForDeletion(weekNumber: number, year: number): WeekValidationResult {
  const current = getCurrentWeek()

  // Current week
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true }
  }

  // Next week
  let nextWeek = current.weekNumber + 1
  let nextYear = current.year
  if (nextWeek > 52) {
    nextWeek = 1
    nextYear = current.year + 1
  }

  if (weekNumber === nextWeek && year === nextYear) {
    return { isValid: true }
  }

  return {
    isValid: false,
    reason: 'Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo'
  }
}

// Mock function for getting available weeks
function getAvailableWeeksForReporting() {
  const current = getCurrentWeek()
  const weeks = []

  // Previous week
  let prevWeek = current.weekNumber - 1
  let prevYear = current.year
  if (prevWeek < 1) {
    prevWeek = 52
    prevYear = current.year - 1
  }

  weeks.push({
    weekNumber: prevWeek,
    year: prevYear,
    isCurrent: false,
    isPast: true,
    isFuture: false
  })

  // Current week
  weeks.push({
    weekNumber: current.weekNumber,
    year: current.year,
    isCurrent: true,
    isPast: false,
    isFuture: false
  })

  // Next week
  let nextWeek = current.weekNumber + 1
  let nextYear = current.year
  if (nextWeek > 52) {
    nextWeek = 1
    nextYear = current.year + 1
  }

  weeks.push({
    weekNumber: nextWeek,
    year: nextYear,
    isCurrent: false,
    isPast: false,
    isFuture: true
  })

  return weeks
}

interface ReportFormProps {
  report?: WeeklyReport | null
  onSave: (reportData: any) => Promise<WeeklyReport>
  onDelete?: (reportId: string) => Promise<void>
  onWeekChange?: (weekNumber: number, year: number) => void
  weekNumber?: number
  year?: number
  isLoading: boolean
  tasks?: Task[]
}

export const ReportForm = memo(function ReportForm({
  report,
  onSave,
  onDelete,
  onWeekChange,
  weekNumber: propWeekNumber,
  year: propYear,
  isLoading
}: ReportFormProps) {
  // Zustand store
  const {
    currentTasks,
    currentWeekNumber,
    currentYear,
    selectedReport,
    isSaving,
    navigateToWeek,
    syncReportToStore,
    setSaving,
    clearTasks,
  } = useReportStore()

  // Local UI state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Add local loading state for form operations
  const [isFormOperationLoading, setIsFormOperationLoading] = useState(false)

  // Get available weeks for display
  const availableWeeks = useMemo(() => getAvailableWeeksForReporting(), [])
  const defaultWeek = useMemo(() => getCurrentWeek(), [])

  // Use store values with fallbacks
  const weekNumber = propWeekNumber || currentWeekNumber || defaultWeek.weekNumber
  const year = propYear || currentYear || defaultWeek.year

  // Enhanced sync with better cleanup
  useEffect(() => {
    if (propWeekNumber !== undefined && propYear !== undefined) {
      navigateToWeek(propWeekNumber, propYear, false)
    }
  }, [propWeekNumber, propYear, navigateToWeek])

  // Enhanced report sync
  useEffect(() => {
    if (report) {
      syncReportToStore(report)
    } else {
      // Only clear if we're not loading
      if (!isLoading && !isFormOperationLoading) {
        syncReportToStore(null)
      }
    }
  }, [report, syncReportToStore, isLoading, isFormOperationLoading])

  // Force clear when no report and week changes - Enhanced
  useEffect(() => {
    if (!report && (propWeekNumber !== undefined || propYear !== undefined)) {
      setIsFormOperationLoading(true)
      
      setTimeout(() => {
        syncReportToStore(null)
        setIsFormOperationLoading(false)
      }, 100)
    }
  }, [report, propWeekNumber, propYear, syncReportToStore])

  // Validate permissions
  const { canEdit, validation } = useMemo(() => {
    let validationResult: WeekValidationResult
    if (selectedReport) {
      validationResult = isValidWeekForEdit(weekNumber, year)
    } else {
      validationResult = isValidWeekForCreation(weekNumber, year)
    }

    const canEditReport = !selectedReport?.isLocked && validationResult.isValid

    return {
      canEdit: canEditReport,
      validation: validationResult
    }
  }, [selectedReport, weekNumber, year])

  // Week type info
  const weekTypeInfo = useMemo(() => {
    const weekInfo = availableWeeks.find(w => w.weekNumber === weekNumber && w.year === year)

    if (weekInfo?.isCurrent) return { label: 'Tuần hiện tại', color: 'text-green-600' }
    if (weekInfo?.isPast) return { label: 'Tuần trước', color: 'text-orange-600' }
    if (weekInfo?.isFuture) return { label: 'Tuần tiếp theo', color: 'text-blue-600' }
    return { label: '', color: 'text-muted-foreground' }
  }, [weekNumber, year, availableWeeks])

  // Get work week display info
  const workWeekDisplayInfo = useMemo(() => {
    if (weekNumber && year) {
      return getWorkWeekRange(weekNumber, year).displayInfo;
    }
    return null;
  }, [weekNumber, year]);

  // Week navigation handlers
  const handlePreviousWeek = useCallback(() => {
    let newWeekNumber = weekNumber - 1
    let newYear = year

    if (newWeekNumber < 1) {
      newWeekNumber = 52
      newYear = year - 1
    }

    setIsFormOperationLoading(true)
    syncReportToStore(null)
    clearTasks()
    navigateToWeek(newWeekNumber, newYear, true)
    
    setTimeout(() => {
      onWeekChange?.(newWeekNumber, newYear)
      setIsFormOperationLoading(false)
    }, 100)
  }, [weekNumber, year, navigateToWeek, onWeekChange, syncReportToStore, clearTasks])

  const handleNextWeek = useCallback(() => {
    let newWeekNumber = weekNumber + 1
    let newYear = year

    if (newWeekNumber > 52) {
      newWeekNumber = 1
      newYear = year + 1
    }

    setIsFormOperationLoading(true)
    syncReportToStore(null)
    clearTasks()
    navigateToWeek(newWeekNumber, newYear, true)
    
    setTimeout(() => {
      onWeekChange?.(newWeekNumber, newYear)
      setIsFormOperationLoading(false)
    }, 100)
  }, [weekNumber, year, navigateToWeek, onWeekChange, syncReportToStore, clearTasks])

  const handleCurrentWeek = useCallback(() => {
    const current = getCurrentWeek()
    setIsFormOperationLoading(true)
    syncReportToStore(null)
    clearTasks()
    navigateToWeek(current.weekNumber, current.year, true)
    
    setTimeout(() => {
      onWeekChange?.(current.weekNumber, current.year)
      setIsFormOperationLoading(false)
    }, 100)
  }, [navigateToWeek, onWeekChange, syncReportToStore, clearTasks])

  // Check if navigation is available
  const navigationAvailable = useMemo(() => {
    const currentWeekInfo = getCurrentWeek()
    const isCurrentWeek = weekNumber === currentWeekInfo.weekNumber && year === currentWeekInfo.year

    return {
      canGoPrevious: true,
      canGoNext: true,
      canGoToCurrent: !isCurrentWeek
    }
  }, [weekNumber, year])

  // Check if report can be deleted
  const canDeleteReport = useMemo(() => {
    if (!selectedReport) return false

    const deletionValidation = isValidWeekForDeletion(selectedReport.weekNumber, selectedReport.year)
    return deletionValidation.isValid && !selectedReport.isLocked
  }, [selectedReport])

  // Check if current week can be edited
  const canEditCurrentWeek = useMemo(() => {
    if (selectedReport) {
      const editValidation = isValidWeekForEdit(weekNumber, year)
      return editValidation.isValid && !selectedReport.isLocked
    } else {
      const creationValidation = isValidWeekForCreation(weekNumber, year)
      return creationValidation.isValid
    }
  }, [selectedReport, weekNumber, year])

  const validateTasks = useCallback(() => {
    if (currentTasks.length === 0) {
      toast.error('Vui lòng thêm ít nhất một công việc')
      return false
    }

    const emptyTasks = currentTasks.filter(task => !task.taskName?.trim())
    if (emptyTasks.length > 0) {
      toast.error('Vui lòng nhập tên cho tất cả công việc')
      return false
    }

    const incompleteTasks = currentTasks.filter(task => !task.isCompleted && (!task.reasonNotDone?.trim()))
    if (incompleteTasks.length > 0) {
      toast.error('Vui lòng nhập lý do cho các công việc chưa hoàn thành')
      return false
    }

    return true
  }, [currentTasks])

  const handleSave = useCallback(async () => {
    if (!validateTasks()) {
      return
    }

    // CRITICAL: State verification before save
    const currentStoreState = useReportStore.getState()

    // Determine if this is an update or create operation
    const isUpdateOperation = selectedReport && selectedReport.id && !selectedReport.id.startsWith('temp-')
    
    if (!isUpdateOperation) {
      // This is a CREATE operation - verify week validity
      const validationResult = isValidWeekForCreation(weekNumber, year)
      if (!validationResult.isValid) {
        toast.error(validationResult.reason!)
        return
      }
    } else {
      // This is an UPDATE operation - verify edit permissions
      const editValidation = isValidWeekForEdit(weekNumber, year)
      if (!editValidation.isValid) {
        toast.error(editValidation.reason!)
        return
      }
    }

    setSaving(true)
    try {
      let reportData: any

      if (isUpdateOperation) {
        // UPDATE existing report
        reportData = {
          tasks: currentTasks.map(task => ({
            taskName: task.taskName.trim(),
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined),
            evaluations: task.evaluations,
          })),
          weekNumber,
          year,
        }
      } else {
        // CREATE new report
        reportData = {
          weekNumber: Number(weekNumber),
          year: Number(year),
          tasks: currentTasks.map(task => ({
            taskName: task.taskName.trim(),
            monday: task.monday || false,
            tuesday: task.tuesday || false,
            wednesday: task.wednesday || false,
            thursday: task.thursday || false,
            friday: task.friday || false,
            saturday: task.saturday || false,
            isCompleted: task.isCompleted || false,
            reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone?.trim() || undefined)
          })),
        }
      }

      await onSave(reportData)

    } catch (error: any) {
      console.error('❌ ReportForm: Save failed:', error)
      // Don't clear state on error - let user retry
    } finally {
      setSaving(false)
    }
  }, [validateTasks, selectedReport, weekNumber, year, currentTasks, onSave, setSaving, report?.id])

  const handleDelete = useCallback(async () => {
    if (!selectedReport || !onDelete) return

    try {
      await onDelete(selectedReport.id)
      setShowDeleteDialog(false)
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa báo cáo')
    }
  }, [selectedReport, onDelete])
  

  // Enhanced loading check
  const isAnyLoading = isLoading || isFormOperationLoading || isSaving

  return (
    <div className="space-y-6">
      {/* Week Info Display with Navigation */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {workWeekDisplayInfo?.weekTitle || `Tuần ${weekNumber} - ${year}`}
              </h2>
              {workWeekDisplayInfo && (
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {workWeekDisplayInfo.dateRange}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {workWeekDisplayInfo.workDaysText}
                  </div>
                </div>
              )}
              {weekTypeInfo.label && (
                <div className={`text-sm font-medium ${weekTypeInfo.color} mt-2`}>
                  {weekTypeInfo.label}
                </div>
              )}
            </div>

            {/* Week Navigation Buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={isLoading}
                className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                title={`Xem tuần ${weekNumber - 1 < 1 ? 52 : weekNumber - 1}/${weekNumber - 1 < 1 ? year - 1 : year}`}
              >
                <ChevronLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Trước</span>
              </Button>

              <Button
                variant={weekTypeInfo.color === 'text-green-600' ? 'default' : 'outline'}
                size="sm"
                onClick={handleCurrentWeek}
                disabled={!navigationAvailable.canGoToCurrent || isLoading}
                className={`flex items-center gap-1 ${weekTypeInfo.color === 'text-green-600'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20'
                  } ${!navigationAvailable.canGoToCurrent ? 'opacity-50' : ''}`}
                title="Xem tuần hiện tại"
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Hiện tại</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={isLoading}
                className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                title={`Xem tuần ${weekNumber + 1 > 52 ? 1 : weekNumber + 1}/${weekNumber + 1 > 52 ? year + 1 : year}`}
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Week information and restrictions */}
            {!selectedReport && (
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-center gap-2 flex-wrap">
                  {availableWeeks.map((week) => (
                    <span
                      key={`${week.weekNumber}-${week.year}`}
                      className={`px-2 py-1 rounded text-xs ${week.weekNumber === weekNumber && week.year === year
                        ? 'bg-primary text-primary-foreground'
                        : week.isCurrent
                          ? 'bg-green-100 text-green-700'
                          : week.isPast
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      Tuần {week.weekNumber}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-center">
                  {canEditCurrentWeek ? (
                    <span className="text-green-600">
                      ✓ Có thể tạo báo cáo cho tuần {weekNumber}/{year}
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      ⚠️ Chỉ có thể tạo báo cáo cho tuần hiện tại và tuần tiếp theo
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Edit restrictions notice for existing reports */}
            {selectedReport && (
              <div className="text-xs text-center">
                {canEditCurrentWeek ? (
                  <span className="text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded border border-green-200 dark:border-green-800">
                    ✓ Có thể chỉnh sửa báo cáo tuần {weekNumber}/{year}
                  </span>
                ) : (
                  <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded border border-amber-200 dark:border-amber-800">
                    ⚠️ Chỉ có thể chỉnh sửa báo cáo cho tuần hiện tại và tuần tiếp theo
                  </span>
                )}
              </div>
            )}

            {/* Delete restrictions notice */}
            {selectedReport && !canDeleteReport && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded border border-red-200 dark:border-red-800 text-center">
                🚫 Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {(!selectedReport && isAnyLoading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  {isFormOperationLoading 
                    ? 'Đang chuyển đổi tuần...' 
                    : 'Đang kiểm tra báo cáo tuần {weekNumber}/{year}...'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {(!isAnyLoading || selectedReport) && (
        <div className="space-y-6">
          <TaskTable
            weekNumber={weekNumber}
            year={year}
            isEditable={canEditCurrentWeek && !isAnyLoading}
            onSave={canEditCurrentWeek && currentTasks.length > 0 && !isAnyLoading ? handleSave : undefined}
          />
          <div className="flex justify-end items-center gap-2">
            {/* Save button */}
            {(currentTasks.length !== 0 && canEdit) && (
              <SubmitButton
                disabled={isSaving}
                onClick={canEditCurrentWeek && currentTasks.length > 0 ? handleSave : undefined}
                loading={isSaving}
                text='Lưu báo cáo'
                icon={<Save className="w-4 h-4" />}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              />
            )}

            {/* Delete button */}
            {selectedReport && canDeleteReport && onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa báo cáo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa báo cáo</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa báo cáo tuần {weekNumber}/{year}?
              Thao tác này không thể hoàn tác và sẽ xóa tất cả công việc trong báo cáo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})