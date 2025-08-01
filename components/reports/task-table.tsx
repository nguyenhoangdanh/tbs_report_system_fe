'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Copy, Calendar, BarChart3, Upload } from 'lucide-react'
import { toast } from 'react-toast-kit'
import type { Task } from '@/types'
import { formatWorkWeek, isValidWeekForCreation, isValidWeekForEdit } from '@/utils/week-utils'
import useReportStore from '@/store/report-store'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConvertEvaluationTypeToVietNamese } from '@/utils'
import { EvaluationType } from '@/types'
import { ExcelImport } from './excel-import'

interface TaskTableProps {
  weekNumber: number
  year: number
  isEditable: boolean  
  onSave?: (reportData: any) => Promise<void>
}

// Enhanced Mobile Task Card Component
const TaskCard = memo(function TaskCard({
  task,
  index,
  isEditable,
  weekdays
}: {
  task: Task
  index: number
  isEditable: boolean
  weekdays: Array<{ key: string; label: string; short: string }>
}) {
  const [editingTask, setEditingTask] = useState(false)
  const [editingReason, setEditingReason] = useState(false)
  const { updateTask, removeTask } = useReportStore()

  const handleTaskNameEdit = useCallback((value: string) => {
    updateTask(task.id, 'taskName', value)
  }, [updateTask, task.id])

  const handleReasonEdit = useCallback((value: string) => {
    updateTask(task.id, 'reasonNotDone', value)
  }, [updateTask, task.id])

  const handleDayToggle = useCallback((day: string, checked: boolean) => {
    updateTask(task.id, day as keyof Task, checked)
  }, [updateTask, task.id])

  const handleCompletionToggle = useCallback((completed: boolean) => {
    updateTask(task.id, 'isCompleted', completed)
    if (completed) {
      updateTask(task.id, 'reasonNotDone', '')
    }
  }, [updateTask, task.id])

  const handleRemove = useCallback(() => {
    removeTask(task.id)
    toast.success('Đã xóa công việc')
  }, [removeTask, task.id])

  const handleDuplicate = useCallback(() => {
    const { addTask } = useReportStore.getState()
    addTask()
    
    const { currentTasks } = useReportStore.getState()
    const newTask = currentTasks[currentTasks.length - 1]
    
    if (newTask) {
      updateTask(newTask.id, 'taskName', `${task.taskName} (Copy)`)
      updateTask(newTask.id, 'monday', task.monday)
      updateTask(newTask.id, 'tuesday', task.tuesday)
      updateTask(newTask.id, 'wednesday', task.wednesday)
      updateTask(newTask.id, 'thursday', task.thursday)
      updateTask(newTask.id, 'friday', task.friday)
      updateTask(newTask.id, 'saturday', task.saturday)
    }

    toast.success('Đã sao chép công việc!')
  }, [task, updateTask])

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${
      task.isCompleted
        ? 'border-l-green-500 bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-950/30 dark:to-emerald-950/20'
        : 'border-l-orange-400 bg-gradient-to-br from-orange-50/80 to-amber-50/60 dark:from-orange-950/30 dark:to-amber-950/20'
    }`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className={`px-4 py-3 bg-gradient-to-r ${
          task.isCompleted 
            ? 'from-green-100/80 to-emerald-100/60 dark:from-green-900/40 dark:to-emerald-900/30' 
            : 'from-orange-100/80 to-amber-100/60 dark:from-orange-900/40 dark:to-amber-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
              task.isCompleted
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
            }`}>
              {index + 1}
            </div>

            {isEditable && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDuplicate}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  title="Sao chép"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                
                {(() => {
                  const hasEvaluations = task.evaluations && 
                                         Array.isArray(task.evaluations) && 
                                         task.evaluations.length > 0

                  if (!hasEvaluations) {
                    return (
                      <Button
                        onClick={handleRemove}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                📋 Tên công việc
              </div>
              <span className="text-red-500 text-xs">*</span>
            </div>
            {isEditable && editingTask ? (
              <Textarea
                value={task.taskName}
                onChange={(e) => handleTaskNameEdit(e.target.value)}
                onBlur={() => setEditingTask(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    setEditingTask(false)
                  }
                  if (e.key === 'Escape') {
                    setEditingTask(false)
                  }
                }}
                className="min-h-[60px] text-sm resize-none border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                autoFocus
                rows={2}
              />
            ) : (
              <div
                className={`text-sm leading-relaxed p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  !task.taskName.trim()
                    ? 'text-red-500 italic border-red-200 bg-red-50/80 dark:bg-red-950/20'
                    : 'border-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md'
                }`}
                onClick={() => isEditable && setEditingTask(true)}
                title={isEditable ? 'Nhấn để chỉnh sửa' : ''}
              >
                {task.taskName.trim() || 'Chưa có tên công việc'}
              </div>
            )}
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                📅 Ngày thực hiện trong tuần
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day) => (
                <div key={day.key} className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {day.short}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    task[day.key as keyof Task] as boolean
                      ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                    <Checkbox
                      checked={task[day.key as keyof Task] as boolean}
                      onCheckedChange={(checked) =>
                        isEditable && handleDayToggle(day.key, !!checked)
                      }
                      disabled={!isEditable}
                      className="w-5 h-5 border-0 bg-transparent data-[state=checked]:bg-transparent data-[state=checked]:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completion Status */}
          <div className="space-y-3">
            <div className={`rounded-xl p-4 ${
              task.isCompleted 
                ? 'bg-gradient-to-br from-green-100/80 to-emerald-100/60 dark:from-green-950/40 dark:to-emerald-950/30'
                : 'bg-gradient-to-br from-orange-100/80 to-amber-100/60 dark:from-orange-950/40 dark:to-amber-950/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {task.isCompleted ? '✅' : '⏳'} Trạng thái hoàn thành
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={task.isCompleted}
                    onCheckedChange={handleCompletionToggle}
                    disabled={!isEditable}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    task.isCompleted 
                      ? 'text-green-700 bg-green-200/80 dark:text-green-300 dark:bg-green-900/50' 
                      : 'text-orange-700 bg-orange-200/80 dark:text-orange-300 dark:bg-orange-900/50'
                  }`}>
                    {task.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                  </span>
                </div>
              </div>

              {/* Reason for not completion */}
              {!task.isCompleted && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      ❗ Lý do chưa hoàn thành
                    </div>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  {isEditable && editingReason ? (
                    <Textarea
                      value={task.reasonNotDone || ''}
                      onChange={(e) => handleReasonEdit(e.target.value)}
                      onBlur={() => setEditingReason(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          setEditingReason(false)
                        }
                        if (e.key === 'Escape') {
                          setEditingReason(false)
                        }
                      }}
                      placeholder="Nhập lý do chưa hoàn thành..."
                      className="min-h-[60px] text-sm resize-none border-2 border-orange-200 focus:border-orange-400 rounded-lg"
                      autoFocus
                      rows={2}
                    />
                  ) : (
                    <div
                      className={`text-sm leading-relaxed p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        !task.reasonNotDone?.trim()
                          ? 'text-red-500 italic border-red-200 bg-red-50/80 dark:bg-red-950/20'
                          : 'border-orange-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md'
                      }`}
                      onClick={() => isEditable && setEditingReason(true)}
                      title={isEditable ? 'Nhấn để chỉnh sửa' : ''}
                    >
                      {task.reasonNotDone?.trim() || 'Chưa nhập lý do'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🎯 Đánh giá từ cấp trên
              </div>
            </div>
            
            <div className={`rounded-xl p-4 ${
              task.evaluations && task.evaluations.length > 0
                ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border-2 border-blue-200/50'
                : 'bg-gradient-to-br from-gray-50/80 to-gray-100/60 dark:from-gray-800/40 dark:to-gray-900/30 border-2 border-gray-200/50'
            }`}>
              {task.evaluations && task.evaluations.length > 0 ? (
                <div className="space-y-4">
                  {task.evaluations
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((evalItem, evalIndex) => (
                    <div
                      key={evalItem.id}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        evalIndex === 0 
                          ? 'bg-gradient-to-br from-blue-100/90 to-indigo-100/70 dark:from-blue-900/50 dark:to-indigo-900/40 border-blue-300 dark:border-blue-600 shadow-md'
                          : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {/* Evaluator Info Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            evalIndex === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {evalItem.evaluator?.firstName?.charAt(0)}{evalItem.evaluator?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                              {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {evalItem.evaluator?.jobPosition?.position?.description || 'Quản lý'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <EvaluationTypeBadge type={evalItem.evaluationType} />
                          {evalIndex === 0 && (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-200/80 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                              Mới nhất
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evaluation Content */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Đánh giá trạng thái:
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            evalItem.evaluatedIsCompleted
                              ? 'bg-green-200/80 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-red-200/80 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                          }`}>
                            {evalItem.evaluatedIsCompleted ? '✅ Hoàn thành' : '❌ Chưa hoàn thành'}
                          </span>
                        </div>

                        {evalItem.evaluatedReasonNotDone && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              🔧 Nguyên nhân/Giải pháp:
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                {evalItem.evaluatedReasonNotDone}
                              </p>
                            </div>
                          </div>
                        )}

                        {evalItem.evaluatorComment && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              💭 Nhận xét từ cấp trên:
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50/90 to-amber-50/70 dark:from-yellow-900/30 dark:to-amber-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                {evalItem.evaluatorComment}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className={`text-xs flex items-center justify-between p-2 rounded-lg ${
                          evalIndex === 0 
                            ? 'bg-blue-200/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : 'bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>📅 Cập nhật: {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                          {evalIndex === 0 && (
                            <span className="font-bold">
                              (Đánh giá mới nhất)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200/80 dark:bg-gray-700/80 flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                    Chưa có đánh giá nào từ cấp trên
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Đánh giá sẽ xuất hiện khi có cấp trên review công việc này
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

const EvaluationTypeBadge = ({ type }: { type: EvaluationType }) => {
  const typeText = ConvertEvaluationTypeToVietNamese(type);
  const colorClasses = useMemo(() => {
    switch (type) {
      case EvaluationType.REVIEW:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case EvaluationType.APPROVAL:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case EvaluationType.REJECTION:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, [type]);

  return (
    <Badge className={`text-xs font-medium ${colorClasses}`}>
      {typeText}
    </Badge>
  )
}

export const TaskTable = memo(function TaskTable({
  weekNumber,
  year,
  isEditable,
  onSave
}: TaskTableProps) {
  const {
    currentTasks,
    addTask,
    removeTask,
    updateTask,
    isSaving,
    selectedReport,
    setSaving,
  } = useReportStore()

  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingReason, setEditingReason] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const weekdays = useMemo(() => [
    { key: 'friday', label: 'Thứ 6', short: 'T6' },
    { key: 'saturday', label: 'Thứ 7', short: 'T7' },
    { key: 'monday', label: 'Thứ 2', short: 'T2' },
    { key: 'tuesday', label: 'Thứ 3', short: 'T3' },
    { key: 'wednesday', label: 'Thứ 4', short: 'T4' },
    { key: 'thursday', label: 'Thứ 5', short: 'T5' },
  ], [])

  const stats = useMemo(() => {
    const total = currentTasks.length
    const completed = currentTasks.filter(task => task.isCompleted).length
    const incomplete = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, incomplete, completionRate }
  }, [currentTasks])

  const weekDisplayTitle = useMemo(() => {
    return formatWorkWeek(weekNumber, year, 'full');
  }, [weekNumber, year]);

  const handleTaskNameEdit = useCallback((taskId: string, value: string) => {
    updateTask(taskId, 'taskName', value)
  }, [updateTask])

  const handleReasonEdit = useCallback((taskId: string, value: string) => {
    updateTask(taskId, 'reasonNotDone', value)
  }, [updateTask])

  const handleDayToggle = useCallback((taskId: string, day: string, checked: boolean) => {
    updateTask(taskId, day as keyof Task, checked)
  }, [updateTask])

  const handleCompletionToggle = useCallback((taskId: string, completed: boolean) => {
    updateTask(taskId, 'isCompleted', completed)
    if (completed) {
      updateTask(taskId, 'reasonNotDone', '')
    }
  }, [updateTask])

  const duplicateTask = useCallback((task: Task) => {
    addTask()
    
    const { currentTasks } = useReportStore.getState()
    const newTask = currentTasks[currentTasks.length - 1]
    
    if (newTask) {
      updateTask(newTask.id, 'taskName', `${task.taskName} (Copy)`)
      updateTask(newTask.id, 'monday', task.monday)
      updateTask(newTask.id, 'tuesday', task.tuesday)
      updateTask(newTask.id, 'wednesday', task.wednesday)
      updateTask(newTask.id, 'thursday', task.thursday)
      updateTask(newTask.id, 'friday', task.friday)
      updateTask(newTask.id, 'saturday', task.saturday)
    }

    toast.success('Đã sao chép công việc!')
  }, [addTask, updateTask])

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

  const canEditCurrentWeek = useMemo(() => {
    
    if (selectedReport) {
      const editValidation = isValidWeekForEdit(weekNumber, year)
      
      const canEdit = editValidation.isValid && !selectedReport.isLocked;
      
      return canEdit;
    } else {
      const creationValidation = isValidWeekForCreation(weekNumber, year)
      
      return creationValidation.isValid;
    }
  }, [selectedReport, weekNumber, year])

  const handleSave = useCallback(async () => {
    if (!validateTasks()) {
      return
    }

    // ✅ ENHANCED: Early exit if can't edit
    if (!canEditCurrentWeek) {
      console.error('❌ TaskTable: Cannot edit current week');
      toast.error('Không thể chỉnh sửa báo cáo cho tuần này')
      return
    }

    const isUpdateOperation = selectedReport && selectedReport.id && !selectedReport.id.startsWith('temp-')
    
    if (!isUpdateOperation) {
      // CREATE validation
      const validationResult = isValidWeekForCreation(weekNumber, year)
      if (!validationResult.isValid) {
        console.error('❌ TaskTable CREATE validation failed:', validationResult.reason);
        toast.error(validationResult.reason!)
        return
      }
    } else {
      // UPDATE validation  
      const editValidation = isValidWeekForEdit(weekNumber, year)
      if (!editValidation.isValid) {
        console.error('❌ TaskTable UPDATE validation failed:', editValidation.reason);
        toast.error(editValidation.reason!)
        return
      }

      // ✅ ENHANCED: Check locked status
      if (selectedReport.isLocked) {
        console.error('❌ TaskTable: Report is locked');
        toast.error('Báo cáo đã bị khóa, không thể chỉnh sửa')
        return
      }
    }

    setSaving(true)
    try {
      let reportData: any

      if (isUpdateOperation) {
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

      if (onSave) {
        
        // ✅ CRITICAL: Handle the result properly
        // const result = await onSave(reportData)
        await onSave(reportData)
        
        // Note: Don't sync here, let the parent handle it
      }

    } catch (error: any) {
      console.error('❌ TaskTable: Save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [validateTasks, selectedReport, weekNumber, year, currentTasks, onSave, setSaving, canEditCurrentWeek])

  if (currentTasks.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-6">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Chưa có công việc nào</h3>
              {isEditable && (  
                <p className="text-gray-600">Bắt đầu thêm công việc để tạo báo cáo tuần {weekDisplayTitle}</p>
              )}
            </div>
            {isEditable && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={addTask} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm công việc đầu tiên
                </Button>
                <Button 
                  onClick={() => setShowImportDialog(true)}
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import từ Excel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <ExcelImport
          weekNumber={weekNumber}
          year={year}
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
        />
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                Báo cáo công việc {weekDisplayTitle}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Kế hoạch: T6, T7, T2, T3, T4, T5 • Kết quả: T2, T3, T4, T5
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm">
                  <div className="font-bold text-blue-600">{stats.total}</div>
                  <div className="text-blue-600/70 text-xs">Tổng CV</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm">
                  <div className="font-bold text-green-600">{stats.completed}</div>
                  <div className="text-green-600/70 text-xs">Hoàn thành</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                <div className="text-sm">
                  <div className="font-bold text-orange-600">{stats.incomplete}</div>
                  <div className="text-orange-600/70 text-xs">Chưa hoàn thành</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <BarChart3 className="w-3 h-3 text-purple-600 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-bold text-purple-600">{stats.completionRate}%</div>
                  <div className="text-purple-600/70 text-xs">Tiến độ</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isEditable && (
                <>
                  <Button
                    onClick={addTask}
                    variant="outline"
                    className="flex-1 sm:flex-none bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm công việc
                  </Button>
                  <Button
                    onClick={() => setShowImportDialog(true)}
                    variant="outline"
                    className="flex-1 sm:flex-none bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile View - Cards */}
          <div className="block lg:hidden p-4 space-y-4">
            {currentTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                isEditable={isEditable}
                weekdays={weekdays}
              />
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      STT
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[200px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      KH-KQCV TUẦN
                    </th>
                    {weekdays.map((day) => (
                      <th
                        key={day.key}
                        className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs min-w-[40px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30"
                      >
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.short}</span>
                      </th>
                    ))}
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-green-700 dark:text-green-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      YES
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      NO
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      Nguyên nhân - giải pháp
                    </th>
                    {isEditable && (
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                        Thao tác
                      </th>
                    )}
                    <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                      Đánh giá
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentTasks.map((task, index) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center">
                        <Badge
                          variant={task.isCompleted ? "default" : "secondary"}
                          className={`w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs ${task.isCompleted
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          {index + 1}
                        </Badge>
                      </td>

                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                        {isEditable && editingTask === task.id ? (
                          <Textarea
                            value={task.taskName}
                            onChange={(e) => handleTaskNameEdit(task.id, e.target.value)}
                            onBlur={() => setEditingTask(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                setEditingTask(null)
                              }
                              if (e.key === 'Escape') {
                                setEditingTask(null)
                              }
                            }}
                            className="min-h-[60px] text-sm resize-none"
                            autoFocus
                            rows={2}
                          />
                        ) : (
                          <div
                            className={`text-sm leading-relaxed p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${!task.taskName.trim() ? 'text-red-500 italic' : ''
                              }`}
                            onClick={() => isEditable && setEditingTask(task.id)}
                            title={isEditable ? 'Click để chỉnh sửa' : ''}
                          >
                            {task.taskName.trim() || 'Chưa có tên công việc'}
                          </div>
                        )}
                      </td>

                      {weekdays.map((day) => (
                        <td key={day.key} className="border border-gray-300 dark:border-gray-600 px-2 py-3 text-center">
                          <Checkbox
                            checked={task[day.key as keyof Task] as boolean}
                            onCheckedChange={(checked) =>
                              isEditable && handleDayToggle(task.id, day.key, !!checked)
                            }
                            disabled={!isEditable}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-5 w-5 mx-auto"
                          />
                        </td>
                      ))}

                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={task.isCompleted}
                            onCheckedChange={(checked) =>
                              isEditable && handleCompletionToggle(task.id, checked)
                            }
                            disabled={!isEditable}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <span className={`text-xs font-medium ${task.isCompleted ? 'text-green-600' : 'text-orange-600'
                            }`}>
                            {task.isCompleted ? 'Xong' : 'Chưa'}
                          </span>
                        </div>
                      </td>

                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">
                        {!task.isCompleted && (
                          <div className="text-red-600 font-bold">
                            ✗
                          </div>
                        )}
                      </td>

                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                        {!task.isCompleted && (
                          <>
                            {isEditable && editingReason === task.id ? (
                              <Textarea
                                value={task.reasonNotDone || ''}
                                onChange={(e) => handleReasonEdit(task.id, e.target.value)}
                                onBlur={() => setEditingReason(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    setEditingReason(null)
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingReason(null)
                                  }
                                }}
                                placeholder="Nhập lý do chưa hoàn thành..."
                                className="min-h-[60px] text-sm resize-none"
                                autoFocus
                                rows={2}
                              />
                            ) : (
                              <div
                                className={`text-sm leading-relaxed p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${!task.reasonNotDone?.trim()
                                    ? 'text-red-500 italic border border-red-200 bg-red-50'
                                    : ''
                                  }`}
                                onClick={() => isEditable && setEditingReason(task.id)}
                                title={isEditable ? 'Click để chỉnh sửa' : ''}
                              >
                                {task.reasonNotDone?.trim() || 'Chưa nhập lý do'}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {isEditable && (
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => duplicateTask(task)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              title="Sao chép công việc"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            
                            {(() => {
                              const hasEvaluations = task.evaluations && 
                                                     Array.isArray(task.evaluations) && 
                                                     task.evaluations.length > 0

                              if (!hasEvaluations) {
                                return (
                                  <Button
                                    onClick={() => removeTask(task.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                    title="Xóa công việc"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </td>
                      )}

                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {task?.evaluations && task?.evaluations.length > 0 ? (
                          <div className="space-y-2 max-w-xs lg:max-w-sm">
                            {task.evaluations
                              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                              .map((evalItem, evalIndex) => (
                              <div
                                key={evalIndex}
                                className="break-words border-b last:border-b-0 pb-2 last:pb-0 border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs mb-1">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                                    {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                                  </span>
                                  <EvaluationTypeBadge type={evalItem.evaluationType} />
                                </div>
                                <div className="space-y-1">
                                  {evalItem.evaluatedReasonNotDone && (
                                    <div className="mt-1">
                                      <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                        Nguyên nhân/Giải pháp:
                                      </span>
                                      <p className="text-gray-800 dark:text-gray-200 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs break-words">
                                        {evalItem.evaluatedReasonNotDone}
                                      </p>
                                    </div>
                                  )}
                                  {evalItem.evaluatorComment && (
                                    <div className="mt-1">
                                      <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                        Nhận xét:
                                      </span>
                                      <p className="text-gray-800 dark:text-gray-200 mt-1 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs break-words">
                                        {evalItem.evaluatorComment}
                                      </p>
                                    </div>
                                  )}
                                    {evalIndex === 0 ? (
                                      <div className="text-xs flex items-center justify-between text-gray-400 dark:text-gray-500 bg-blue-400/10 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                        {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                          (Đánh giá mới nhất)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        Cập nhật: {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">Chưa có đánh giá nào</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Tổng cộng: <strong>{stats.total}</strong> công việc
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-600 font-medium">
                    {stats.completed} hoàn thành
                  </span>
                  <span className="text-orange-600 font-medium">
                    {stats.incomplete} chưa hoàn thành
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <span className="font-bold text-purple-600 text-sm min-w-[3rem]">
                    {stats.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExcelImport
        weekNumber={weekNumber}
        year={year}
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />
    </>
  )
})