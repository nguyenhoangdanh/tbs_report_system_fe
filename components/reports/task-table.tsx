'use client'

import { memo, useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Save, Trash2, Copy, Calendar, BarChart3 } from 'lucide-react'
import { toast } from 'react-toast-kit'
import type { Task } from '@/types'
import { SubmitButton } from '../ui/submit-button'
import { formatWorkWeek } from '@/utils/week-utils'
import useReportStore from '@/store/report-store'

interface TaskTableProps {
  weekNumber: number
  year: number
  isEditable: boolean
  onSave?: () => void
}

// Mobile Task Card Component with Zustand integration
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
    const newTask: Task = {
      id: `temp-${Date.now()}-${Math.random()}`,
      taskName: `${task.taskName} (Copy)`,
      monday: task.monday,
      tuesday: task.tuesday,
      wednesday: task.wednesday,
      thursday: task.thursday,
      friday: task.friday,
      saturday: task.saturday,
      isCompleted: false,
      reasonNotDone: '',
      reportId: task.reportId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add the new task using store
    Object.entries(newTask).forEach(([key, value]) => {
      updateTask(newTask.id, key as keyof Task, value)
    })

    toast.success('Đã sao chép công việc!')
  }, [task, updateTask])

  return (
    <Card className={`border-2 transition-colors ${task.isCompleted
        ? 'border-green-200 bg-green-50/30 dark:bg-green-950/20'
        : 'border-gray-200 hover:border-green-200'
      }`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge
            variant={task.isCompleted ? "default" : "secondary"}
            className={`w-8 h-8 rounded-full flex items-center justify-center p-0 text-sm font-bold ${task.isCompleted
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700'
              }`}
          >
            {index + 1}
          </Badge>

          {isEditable && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDuplicate}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                title="Sao chép"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleRemove}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Task Name */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên công việc <span className="text-red-500">*</span>
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
              className="min-h-[60px] text-sm resize-none"
              autoFocus
              rows={2}
            />
          ) : (
            <div
              className={`text-sm leading-relaxed p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!task.taskName.trim()
                  ? 'text-red-500 italic border-red-200 bg-red-50'
                  : 'border-gray-200'
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
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ngày thực hiện trong tuần
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day) => (
              <div key={day.key} className="flex flex-col items-center space-y-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {day.short}
                </span>
                <Checkbox
                  checked={task[day.key as keyof Task] as boolean}
                  onCheckedChange={(checked) =>
                    isEditable && handleDayToggle(day.key, !!checked)
                  }
                  disabled={!isEditable}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Completion Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái hoàn thành
            </span>
            <div className="flex items-center space-x-3">
              <Switch
                checked={task.isCompleted}
                onCheckedChange={handleCompletionToggle}
                disabled={!isEditable}
                className="data-[state=checked]:bg-green-600"
              />
              <span className={`text-sm font-medium ${task.isCompleted ? 'text-green-600' : 'text-orange-600'
                }`}>
                {task.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
              </span>
            </div>
          </div>

          {/* Reason for not completion */}
          {!task.isCompleted && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Lý do chưa hoàn thành <span className="text-red-500">*</span>
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
                  className="min-h-[60px] text-sm resize-none"
                  autoFocus
                  rows={2}
                />
              ) : (
                <div
                  className={`text-sm leading-relaxed p-3 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!task.reasonNotDone?.trim()
                      ? 'text-red-500 italic border-red-200 bg-red-50'
                      : 'border-gray-200'
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
      </CardContent>
    </Card>
  )
})

export const TaskTable = memo(function TaskTable({
  weekNumber,
  year,
  isEditable,
  onSave
}: TaskTableProps) {
  // Zustand store - single source of truth
  const {
    currentTasks,
    addTask,
    removeTask,
    updateTask,
    isSaving,
    selectedReport
  } = useReportStore()

  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingReason, setEditingReason] = useState<string | null>(null)

  // Weekday headers
  const weekdays = useMemo(() => [
    { key: 'friday', label: 'Thứ 6', short: 'T6' },
    { key: 'saturday', label: 'Thứ 7', short: 'T7' },
    { key: 'monday', label: 'Thứ 2', short: 'T2' },
    { key: 'tuesday', label: 'Thứ 3', short: 'T3' },
    { key: 'wednesday', label: 'Thứ 4', short: 'T4' },
    { key: 'thursday', label: 'Thứ 5', short: 'T5' },
  ], [])

  // Calculate statistics from store
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

  // Task handlers using store actions
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
    const newTask: Task = {
      id: `temp-${Date.now()}-${Math.random()}`,
      taskName: `${task.taskName} (Copy)`,
      monday: task.monday,
      tuesday: task.tuesday,
      wednesday: task.wednesday,
      thursday: task.thursday,
      friday: task.friday,
      saturday: task.saturday,
      isCompleted: false,
      reasonNotDone: '',
      reportId: task.reportId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add task using store
    Object.entries(newTask).forEach(([key, value]) => {
      updateTask(newTask.id, key as keyof Task, value)
    })

    toast.success('Đã sao chép công việc!')
  }, [updateTask])

  if (currentTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-6">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Chưa có công việc nào</h3>
            <p className="text-gray-600">Bắt đầu thêm công việc để tạo báo cáo tuần {weekNumber}/{year}</p>
          </div>
          {isEditable && (
            <Button onClick={addTask} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Thêm công việc đầu tiên
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
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
              <Button
                onClick={addTask}
                variant="outline"
                className="flex-1 sm:flex-none bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm công việc
              </Button>
            )}
            {onSave && (
              <SubmitButton
                disabled={isSaving}
                onClick={onSave}
                loading={isSaving}
                text='Lưu báo cáo'
                icon={<Save className="w-4 h-4" />}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              />
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
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="sticky left-0 bg-gray-50 dark:bg-gray-900/50 border-r border-b px-4 py-3 text-left font-semibold text-sm w-16">
                  STT
                </th>
                <th className="sticky left-16 bg-gray-50 dark:bg-gray-900/50 border-r border-b px-4 py-3 text-left font-semibold text-sm min-w-[300px]">
                  Tên công việc
                </th>
                {weekdays.map((day) => (
                  <th key={day.key} className="border-r border-b px-2 py-3 text-center font-semibold text-sm w-16">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground">{day.short}</span>
                    </div>
                  </th>
                ))}
                <th className="border-r border-b px-4 py-3 text-center font-semibold text-sm w-24">
                  Trạng thái
                </th>
                <th className="border-r border-b px-4 py-3 text-left font-semibold text-sm min-w-[200px]">
                  Lý do chưa hoàn thành
                </th>
                {isEditable && (
                  <th className="border-b px-4 py-3 text-center font-semibold text-sm w-24">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {currentTasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 border-b ${task.isCompleted
                      ? 'bg-green-50/50 dark:bg-green-950/20'
                      : 'bg-white dark:bg-background'
                    }`}
                >
                  {/* STT */}
                  <td className="sticky left-0 bg-inherit border-r px-4 py-3 text-center">
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

                  {/* Task Name */}
                  <td className="sticky left-16 bg-inherit border-r px-4 py-3">
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

                  {/* Days of Week */}
                  {weekdays.map((day) => (
                    <td key={day.key} className="border-r px-2 py-3 text-center">
                      <Checkbox
                        checked={task[day.key as keyof Task] as boolean}
                        onCheckedChange={(checked) =>
                          isEditable && handleDayToggle(task.id, day.key, !!checked)
                        }
                        disabled={!isEditable}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </td>
                  ))}

                  {/* Completion Status */}
                  <td className="border-r px-4 py-3 text-center">
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

                  {/* Reason for Not Completion */}
                  <td className="border-r px-4 py-3">
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

                  {/* Actions */}
                  {isEditable && (
                    <td className="px-4 py-3 text-center">
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
                        <Button
                          onClick={() => removeTask(task.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Xóa công việc"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
  )
})