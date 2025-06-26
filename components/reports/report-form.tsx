'use client'

import { useState, useCallback, useEffect, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Trash2, HelpCircle } from 'lucide-react'
import { TaskTable } from './task-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { getCurrentWeek, validateWeekYear, isValidWeekForCreation, isValidWeekForEdit, getNextWeek, getPreviousWeek } from '@/lib/date-utils'
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
  // Memoize week calculations
  const { currentWeek, nextWeek, previousWeek } = useMemo(() => ({
    currentWeek: getCurrentWeek(),
    nextWeek: getNextWeek(),
    previousWeek: getPreviousWeek()
  }), [])
  
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

  // Memoize validation and permissions
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
  }, [report, weekNumber, year, isLoading, onDelete])

  // Memoize week type info
  const weekTypeInfo = useMemo(() => {
    const isCurrentWeekReport = weekNumber === currentWeek.weekNumber && year === currentWeek.year
    const isNextWeekReport = weekNumber === nextWeek.weekNumber && year === nextWeek.year
    const isPreviousWeekReport = weekNumber === previousWeek.weekNumber && year === previousWeek.year

    if (isPreviousWeekReport) return { label: 'Tuần trước', color: 'text-orange-600' }
    if (isNextWeekReport) return { label: 'Tuần tiếp theo', color: 'text-blue-600' }
    if (isCurrentWeekReport) return { label: 'Tuần hiện tại', color: 'text-green-600' }
    return { label: '', color: 'text-muted-foreground' }
  }, [weekNumber, year, currentWeek, nextWeek, previousWeek])

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
      reportId: report?.id || ''
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
          reportId: report?.id || ''
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
      const validationResult = validateWeekYear(weekNumber, year)
      if (!validationResult.isValid) {
        toast.error(validationResult.error!)
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
      {/* Week Info Display */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Tuần {weekNumber} - {year}
            </h2>
            {weekTypeInfo.label && (
              <div className={`text-sm font-medium ${weekTypeInfo.color}`}>
                {weekTypeInfo.label}
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
          {/* Task Table - Full width */}
          <TaskTable
            tasks={tasks}
            weekNumber={weekNumber}
            year={year}
            isEditable={canEdit}
            onTaskChange={handleTaskChange}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTask}
            onSave={canEdit && tasks.length > 0 ? handleSave : undefined}
            isSaving={isSaving}
          />
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
