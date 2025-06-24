'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, Lock, AlertCircle, Trash2 } from 'lucide-react'
import { TaskRow } from './task-row'
import { WeekSelector } from './week-selector'
import { ReportStats } from './report-stats'
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

export function ReportForm({ 
  report, 
  onSave, 
  onDelete, 
  onWeekChange,
  weekNumber: propWeekNumber,
  year: propYear,
  isLoading 
}: ReportFormProps) {
  const currentWeek = getCurrentWeek()
  const nextWeek = getNextWeek()
  const previousWeek = getPreviousWeek()
  
  const [weekNumber, setWeekNumber] = useState(propWeekNumber || report?.weekNumber || currentWeek.weekNumber)
  const [year, setYear] = useState(propYear || report?.year || currentWeek.year)
  const [tasks, setTasks] = useState<TaskReport[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Sync with parent props - always update when props change
  useEffect(() => {
    if (propWeekNumber !== undefined && propYear !== undefined) {
      setWeekNumber(propWeekNumber)
      setYear(propYear)
    }
  }, [propWeekNumber, propYear])

  // Update tasks when report changes or is cleared
  useEffect(() => {
    if (report) {
      setTasks(report.tasks || [])
      // Only sync week/year if not controlled by parent
      if (propWeekNumber === undefined && propYear === undefined) {
        setWeekNumber(report.weekNumber)
        setYear(report.year)
      }
    } else {
      // Clear tasks when no report (switching to different week)
      setTasks([])
    }
  }, [report, propWeekNumber, propYear])

  const isEditable = !report?.isLocked && !isLoading
  const isCurrentWeekReport = weekNumber === currentWeek.weekNumber && year === currentWeek.year
  const isNextWeekReport = weekNumber === nextWeek.weekNumber && year === nextWeek.year
  const isPreviousWeekReport = weekNumber === previousWeek.weekNumber && year === previousWeek.year

  // Check if we can save/edit based on mode
  let validation
  if (report) {
    validation = isValidWeekForEdit(weekNumber, year)
  } else {
    validation = isValidWeekForCreation(weekNumber, year)
  }
  
  const canEdit = !report?.isLocked && validation.isValid
  const canDelete = report && validation.isValid && !report.isLocked && onDelete

  const handleWeekChange = useCallback((newWeekNumber: number, newYear: number) => {
    if (isEditable) {
      // Update local state immediately for better UX
      setWeekNumber(newWeekNumber)
      setYear(newYear)
      
      // Notify parent component about week change (this will trigger data loading)
      if (onWeekChange) {
        onWeekChange(newWeekNumber, newYear)
      }
    }
  }, [isEditable, onWeekChange])

  const handleAddTask = useCallback(() => {
    if (!isEditable) return

    const newTask: TaskReport = {
      id: `temp-${Date.now()}-${Math.random()}`, // Ensure unique ID
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
  }, [isEditable, report?.id])

  const handleTaskChange = useCallback((taskId: string, field: string, value: any) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        // Nếu chuyển sang hoàn thành, clear reasonNotDone
        if (field === 'isCompleted' && value === true) {
          return { ...task, [field]: value, reasonNotDone: '' }
        }
        return { ...task, [field]: value }
      })
    )
  }, [])

  const handleRemoveTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  const validateTasks = () => {
    if (tasks.length === 0) {
      toast.error('Vui lòng thêm ít nhất một công việc')
      return false
    }

    const emptyTasks = tasks.filter(task => !task.taskName?.trim())
    if (emptyTasks.length > 0) {
      toast.error('Vui lòng nhập tên cho tất cả công việc')
      return false
    }

    // Require reasonNotDone if not completed
    const incompleteTasks = tasks.filter(task => !task.isCompleted && (!task.reasonNotDone?.trim()))
    if (incompleteTasks.length > 0) {
      toast.error('Vui lòng nhập lý do cho các công việc chưa hoàn thành')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateTasks()) {
      return
    }

    // Additional check based on mode
    if (!report) {
      const validation = validateWeekYear(weekNumber, year)
      if (!validation.isValid) {
        toast.error(validation.error!)
        return
      }
    } else {
      // For existing reports, check edit validation
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
        // Updating existing report - only include tasks
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
        const numWeekNumber = Number(weekNumber)
        const numYear = Number(year)

        reportData = {
          weekNumber: numWeekNumber,
          year: numYear,
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
      
      // Update local state with saved data
      if (result && result.tasks) {
        setTasks(result.tasks)
      }
    } catch (error: any) {
      // Error is already handled in parent component
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!report || !onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(report.id)
      setShowDeleteDialog(false)
      toast.success('Xóa báo cáo thành công!')
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa báo cáo')
    } finally {
      setIsDeleting(false)
    }
  }

  const getWeekTypeLabel = () => {
    if (isPreviousWeekReport) return '(Tuần trước)'
    if (isNextWeekReport) return '(Tuần tiếp theo)'
    if (isCurrentWeekReport) return '(Tuần hiện tại)'
    return ''
  }

  const getWeekTypeColor = () => {
    if (isPreviousWeekReport) return 'text-orange-600'
    if (isNextWeekReport) return 'text-blue-600'
    if (isCurrentWeekReport) return 'text-green-600'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Week Selector - Always allow navigation */}
      <WeekSelector
        weekNumber={weekNumber}
        year={year}
        onWeekChange={handleWeekChange}
        disabled={isSaving} // Only disable during save operation
      />

      {/* Loading indicator when switching weeks */}
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

      {/* Report Status */}
      {/* {report && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">Trạng thái báo cáo:</span>
                <Badge variant={report.isLocked ? "destructive" : "default"}>
                  {report.isLocked ? 'Đã khóa' : 'Đang chỉnh sửa'}
                </Badge>
                {validation.type && (
                  <Badge variant="outline" className={getWeekTypeColor()}>
                    {validation.type === 'past' ? 'Tuần trước' : 
                     validation.type === 'next' ? 'Tuần tiếp theo' : 'Tuần hiện tại'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {report.isLocked && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Báo cáo đã được khóa</span>
                  </div>
                )}
                {canDelete && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa báo cáo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Validation Warning for non-editable weeks */}
      {!canEdit && !isLoading && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertCircle className="w-5 h-5" />
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

      {/* Tasks Section */}
      {(!isLoading || report) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Báo cáo công việc tuần {weekNumber}/{year}
                    {!report && (
                      <span className={`text-sm font-normal ml-2 ${getWeekTypeColor()}`}>
                        {getWeekTypeLabel()}
                      </span>
                    )}
                  </CardTitle>
                  {canEdit && (
                    <Button
                      onClick={handleAddTask}
                      className="flex items-center gap-2"
                      size="sm"
                      disabled={isLoading || isSaving}
                    >
                      <Plus className="w-4 h-4" />
                      Thêm công việc
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      {isLoading ? 'Đang tải dữ liệu...' : 'Chưa có công việc nào được thêm'}
                    </div>
                    {canEdit && !isLoading && (
                      <Button onClick={handleAddTask} variant="outline" disabled={isSaving}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm công việc đầu tiên
                      </Button>
                    )}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task, index) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        weekNumber={weekNumber}
                        year={year}
                        taskIndex={index} // Pass task index
                        isEditable={canEdit && !isSaving}
                        onTaskChange={handleTaskChange}
                        onRemoveTask={handleRemoveTask}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Save Button */}
                {canEdit && tasks.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      size="lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Đang lưu...' : (report ? 'Cập nhật báo cáo' : 'Lưu báo cáo')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <ReportStats tasks={tasks} />

            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Hướng dẫn</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Có thể xem báo cáo của bất kỳ tuần nào</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Chỉ có thể tạo báo cáo cho tuần hiện tại hoặc tuần tiếp theo</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span>Chỉ có thể chỉnh sửa báo cáo của tuần trước, hiện tại và tiếp theo</span>
                  </div>
                  {canDelete && (
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                      <span>Có thể xóa báo cáo trong khoảng thời gian cho phép chỉnh sửa</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa báo cáo</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa báo cáo tuần {weekNumber}/{year}? 
              Thao tác này không thể hoàn tác và sẽ xóa tất cả công việc trong báo cáo.
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
              onClick={handleDelete}
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
    </div>
  )
}
