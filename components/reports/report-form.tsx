'use client'

import { useState, useCallback, useEffect, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { TaskTable } from './task-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { getCurrentWeek, isValidWeekForCreation, isValidWeekForEdit, getAvailableWeeksForReporting, isValidWeekForDeletion } from '@/utils/week-utils'
import type { WeeklyReport, TaskReport } from '@/types'

interface ReportFormProps {
  report?: WeeklyReport | null
  onSave: (reportData: any) => Promise<WeeklyReport>
  onDelete?: (reportId: string) => Promise<void>
  onWeekChange?: (weekNumber: number, year: number) => void
  weekNumber?: number
  year?: number
  isLoading: boolean
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
  // Get available weeks for display
  const availableWeeks = useMemo(() => getAvailableWeeksForReporting(), [])
  const currentWeek = useMemo(() => getCurrentWeek(), [])
  
  const [weekNumber, setWeekNumber] = useState(propWeekNumber || report?.weekNumber || currentWeek.weekNumber)
  const [year, setYear] = useState(propYear || report?.year || currentWeek.year)
  const [tasks, setTasks] = useState<TaskReport[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Sync with parent props
  useEffect(() => {
    if (propWeekNumber !== undefined && propYear !== undefined) {
      setWeekNumber(propWeekNumber)
      setYear(propYear)
    }
  }, [propWeekNumber, propYear])

  // Update tasks when report changes
  useEffect(() => {
    if (report) {
      setTasks(report.tasks || [])
      if (propWeekNumber === undefined && propYear === undefined) {
        setWeekNumber(report.weekNumber)
        setYear(report.year)
      }
    } else {
      setTasks([])
    }
  }, [report, propWeekNumber, propYear])

  // Validate permissions
  const { canEdit, validation } = useMemo(() => {
    let validationResult
    if (report) {
      validationResult = isValidWeekForEdit(weekNumber, year)
    } else {
      validationResult = isValidWeekForCreation(weekNumber, year)
    }
    
    const canEditReport = !report?.isLocked && validationResult.isValid

    return {
      canEdit: canEditReport,
      validation: validationResult
    }
  }, [report, weekNumber, year])

  // Week type info
  const weekTypeInfo = useMemo(() => {
    const weekInfo = availableWeeks.find(w => w.weekNumber === weekNumber && w.year === year)
    
    if (weekInfo?.isCurrent) return { label: 'Tuần hiện tại', color: 'text-green-600' }
    if (weekInfo?.isPast) return { label: 'Tuần trước', color: 'text-orange-600' }
    if (weekInfo?.isFuture) return { label: 'Tuần tiếp theo', color: 'text-blue-600' }
    return { label: '', color: 'text-muted-foreground' }
  }, [weekNumber, year, availableWeeks])

  // Week navigation handlers - Allow navigation to any week in the year
  const handlePreviousWeek = useCallback(() => {
    let newWeekNumber = weekNumber - 1
    let newYear = year
    
    if (newWeekNumber < 1) {
      newWeekNumber = 52
      newYear = year - 1
    }
    
    setWeekNumber(newWeekNumber)
    setYear(newYear)
    onWeekChange?.(newWeekNumber, newYear)
    
    // Only clear tasks if creating new report
    if (!report) {
      setTasks([])
    }
  }, [weekNumber, year, report, onWeekChange])

  const handleNextWeek = useCallback(() => {
    let newWeekNumber = weekNumber + 1
    let newYear = year
    
    if (newWeekNumber > 52) {
      newWeekNumber = 1
      newYear = year + 1
    }
    
    setWeekNumber(newWeekNumber)
    setYear(newYear)
    onWeekChange?.(newWeekNumber, newYear)
    
    // Only clear tasks if creating new report
    if (!report) {
      setTasks([])
    }
  }, [weekNumber, year, report, onWeekChange])

  const handleCurrentWeek = useCallback(() => {
    const current = getCurrentWeek()
    setWeekNumber(current.weekNumber)
    setYear(current.year)
    onWeekChange?.(current.weekNumber, current.year)
    
    // Only clear tasks if creating new report
    if (!report) {
      setTasks([])
    }
  }, [report, onWeekChange])

  // Check if navigation is available - Allow navigation for viewing any week
  const navigationAvailable = useMemo(() => {
    const currentWeekInfo = getCurrentWeek()
    
    // Check previous week - always allow navigation
    let prevWeekNumber = weekNumber - 1
    let prevYear = year
    if (prevWeekNumber < 1) {
      prevWeekNumber = 52
      prevYear = year - 1
    }
    
    // Check next week - always allow navigation
    let nextWeekNumber = weekNumber + 1
    let nextYear = year
    if (nextWeekNumber > 52) {
      nextWeekNumber = 1
      nextYear = year + 1
    }
    
    // Check if current week is different
    const isCurrentWeek = weekNumber === currentWeekInfo.weekNumber && year === currentWeekInfo.year
    
    return {
      canGoPrevious: true, // Always allow navigation
      canGoNext: true, // Always allow navigation
      canGoToCurrent: !isCurrentWeek // Allow going to current week if not already there
    }
  }, [weekNumber, year])

  // Check if report can be deleted (only current week and next week)
  const canDeleteReport = useMemo(() => {
    if (!report) return false
    
    const deletionValidation = isValidWeekForDeletion(report.weekNumber, report.year)
    return deletionValidation.isValid && !report.isLocked
  }, [report])

  // Check if current week can be edited (only for creation/editing validation)
  const canEditCurrentWeek = useMemo(() => {
    if (report) {
      // For existing reports, check edit validation
      const editValidation = isValidWeekForEdit(weekNumber, year)
      return editValidation.isValid && !report.isLocked
    } else {
      // For new reports, check creation validation
      const creationValidation = isValidWeekForCreation(weekNumber, year)
      return creationValidation.isValid
    }
  }, [report, weekNumber, year])

  const handleAddTask = useCallback(() => {
    if (!canEdit) return

    const newTask: TaskReport = {
      id: `temp-${Date.now()}-${Math.random()}`,
      taskName: '',
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      isCompleted: false,
      reasonNotDone: '',
      reportId: report?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setTasks(prev => [...prev, newTask])
  }, [canEdit, report?.id])

  const handleTaskChange = useCallback((taskId: string, field: string, value: any) => {
    setTasks(prev => {
      const taskExists = prev.find(task => task.id === taskId)
      if (!taskExists) {
        const newTask: TaskReport = {
          id: taskId,
          taskName: field === 'taskName' ? value : '',
          monday: field === 'monday' ? value : false,
          tuesday: field === 'tuesday' ? value : false,
          wednesday: field === 'wednesday' ? value : false,
          thursday: field === 'thursday' ? value : false,
          friday: field === 'friday' ? value : false,
          saturday: field === 'saturday' ? value : false,
          sunday: field === 'sunday' ? value : false,
          isCompleted: field === 'isCompleted' ? value : false,
          reasonNotDone: field === 'reasonNotDone' ? value : '',
          reportId: report?.id || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return [...prev, newTask]
      }

      return prev.map(task => {
        if (task.id !== taskId) return task
        
        if (field === 'isCompleted' && value === true) {
          return { ...task, [field]: value, reasonNotDone: '' }
        }
        return { ...task, [field]: value }
      })
    })
  }, [report?.id])

  const handleRemoveTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  const validateTasks = useCallback(() => {
    if (tasks.length === 0) {
      toast.error('Vui lòng thêm ít nhất một công việc')
      return false
    }

    const emptyTasks = tasks.filter(task => !task.taskName?.trim())
    if (emptyTasks.length > 0) {
      toast.error('Vui lòng nhập tên cho tất cả công việc')
      return false
    }

    const incompleteTasks = tasks.filter(task => !task.isCompleted && (!task.reasonNotDone?.trim()))
    if (incompleteTasks.length > 0) {
      toast.error('Vui lòng nhập lý do cho các công việc chưa hoàn thành')
      return false
    }

    return true
  }, [tasks])

  const handleSave = useCallback(async () => {
    if (!validateTasks()) {
      return
    }

    if (!report) {
      const validationResult = isValidWeekForCreation(weekNumber, year)
      if (!validationResult.isValid) {
        toast.error(validationResult.reason!)
        return
      }
    } else {
      const editValidation = isValidWeekForEdit(weekNumber, year)
      if (!editValidation.isValid) {
        toast.error(editValidation.reason!)
        return
      }
    }

    setIsSaving(true)
    try {
      let reportData: any

      if (report) {
        reportData = {
          tasks: tasks.map(task => ({
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
      } else {
        reportData = {
          weekNumber: Number(weekNumber),
          year: Number(year),
          tasks: tasks.map(task => ({
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
      }

      const result = await onSave(reportData)
      
      if (result && result.tasks) {
        setTasks(result.tasks)
      }
    } catch (error: any) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [validateTasks, report, weekNumber, year, tasks, onSave])

  const handleDelete = useCallback(async () => {
    if (!report || !onDelete) return

    try {
      await onDelete(report.id)
      setShowDeleteDialog(false)
      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa báo cáo')
    }
  }, [report, onDelete])

  return (
    <div className="space-y-6">
      {/* Week Info Display with Navigation */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Tuần {weekNumber} - {year}
              </h2>
              {weekTypeInfo.label && (
                <div className={`text-sm font-medium ${weekTypeInfo.color}`}>
                  {weekTypeInfo.label}
                </div>
              )}
            </div>
            
            {/* Week Navigation Buttons - Always show */}
            <div className="flex items-center justify-center gap-2">
              {/* Previous Week Button */}
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

              {/* Current Week Button */}
              <Button
                variant={weekTypeInfo.color === 'text-green-600' ? 'default' : 'outline'}
                size="sm"
                onClick={handleCurrentWeek}
                disabled={!navigationAvailable.canGoToCurrent || isLoading}
                className={`flex items-center gap-1 ${
                  weekTypeInfo.color === 'text-green-600' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20'
                } ${!navigationAvailable.canGoToCurrent ? 'opacity-50' : ''}`}
                title="Xem tuần hiện tại"
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Hiện tại</span>
              </Button>

              {/* Next Week Button */}
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
            
            {/* Week information and creation/edit restrictions */}
            {!report && (
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-center gap-2 flex-wrap">
                  {availableWeeks.map((week) => (
                    <span
                      key={`${week.weekNumber}-${week.year}`}
                      className={`px-2 py-1 rounded text-xs ${
                        week.weekNumber === weekNumber && week.year === year
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
                      ⚠️ Chỉ có thể tạo báo cáo cho tuần trước, tuần hiện tại và tuần tiếp theo
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Edit restrictions notice for existing reports */}
            {report && (
              <div className="text-xs text-center">
                {canEditCurrentWeek ? (
                  <span className="text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded border border-green-200 dark:border-green-800">
                    ✓ Có thể chỉnh sửa báo cáo tuần {weekNumber}/{year}
                  </span>
                ) : (
                  <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded border border-amber-200 dark:border-amber-800">
                    ⚠️ Chỉ có thể chỉnh sửa báo cáo tuần trước, tuần hiện tại và tuần tiếp theo
                  </span>
                )}
              </div>
            )}

            {/* Delete restrictions notice for existing reports */}
            {report && !canDeleteReport && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded border border-red-200 dark:border-red-800 text-center">
                🚫 Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {!report && isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Đang kiểm tra báo cáo tuần {weekNumber}/{year}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warning */}
      {!canEdit && !isLoading && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {report ? 'Không thể chỉnh sửa báo cáo này' : 'Không thể tạo báo cáo cho tuần này'}
                </p>
                <p className="text-sm">
                  {validation.reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {(!isLoading || report) && (
        <div className="space-y-6">
          <TaskTable
            tasks={tasks}
            weekNumber={weekNumber}
            year={year}
            isEditable={canEditCurrentWeek} // Use new validation
            onTaskChange={handleTaskChange}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTask}
            onSave={canEditCurrentWeek && tasks.length > 0 ? handleSave : undefined} // Use new validation
            isSaving={isSaving}
          />

          {/* Delete button for existing reports - Updated condition */}
          {report && canDeleteReport && onDelete && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa báo cáo
              </Button>
            </div>
          )}
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
