'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Trash2, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { useUpdateTask, useDeleteTask } from '@/hooks/use-reports'
import type { TaskReport } from '@/types'
import { Checkbox } from '../ui/checkbox'

interface TaskRowProps {
  task: TaskReport
  weekNumber: number
  year: number
  taskIndex: number
  isEditable: boolean
  onTaskChange: (taskId: string, field: string, value: any) => void
  onRemoveTask: (taskId: string) => void
  onTaskSaved?: () => void
}

const TaskRow = memo(function TaskRow({
  task,
  weekNumber,
  year,
  taskIndex,
  isEditable,
  onTaskChange,
  onRemoveTask,
  onTaskSaved,
}: TaskRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  const weekdays = [
    { key: 'monday', label: 'T2' },
    { key: 'tuesday', label: 'T3' },
    { key: 'wednesday', label: 'T4' },
    { key: 'thursday', label: 'T5' },
    { key: 'friday', label: 'T6' },
    { key: 'saturday', label: 'T7' },
    { key: 'sunday', label: 'CN' }
  ]

  const handleDeleteConfirm = async () => {
    // If task has a real ID (saved to server), delete from server
    if (task.id && !task.id.startsWith('temp-')) {
      try {
        await deleteTaskMutation.mutateAsync(task.id)
        onRemoveTask(task.id)
      } catch {
        // Error already handled in hook with toast
      }
    } else {
      // If it's a temporary task (not saved yet), just remove from local state
      onRemoveTask(task.id)
      toast.success('Xóa công việc thành công!')
    }
    setShowDeleteDialog(false)
  }

  const handleQuickSave = async () => {
    if (!task.id || task.id.startsWith('temp-')) return
    
    // Simple validation
    if (!task.isCompleted && !task.reasonNotDone?.trim()) {
      toast.error('Vui lòng nhập lý do cho công việc chưa hoàn thành')
      return
    }

    try {
      const updateData = {
        taskName: task.taskName,
        monday: task.monday,
        tuesday: task.tuesday,
        wednesday: task.wednesday,
        thursday: task.thursday,
        friday: task.friday,
        saturday: task.saturday,
        sunday: task.sunday,
        isCompleted: task.isCompleted,
        reasonNotDone: task.isCompleted ? undefined : (task.reasonNotDone || undefined)
      }
      
      const updatedTask = await updateTaskMutation.mutateAsync({ taskId: task.id, data: updateData })
      
      // Update parent state with new data
      if (updatedTask && onTaskChange) {
        Object.entries(updatedTask).forEach(([key, value]) => {
          if (key !== 'id') {
            onTaskChange(task.id, key, value)
          }
        })
      }
      
      if (onTaskSaved) {
        onTaskSaved()
      }
    } catch {
      // Error already handled in hook with toast
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group"
      >
        <Card className="border-2 border-border hover:border-green-200 transition-colors duration-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with task number and action buttons */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="default" 
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center p-0 text-xs"
                >
                  <span className="text-white font-bold">
                    {taskIndex + 1}
                  </span>
                </Badge>
                
                <div className="flex items-center gap-2">
                  {/* Quick Save Button */}
                  {isEditable && task.id && !task.id.startsWith('temp-') && (
                    <Button
                      onClick={handleQuickSave}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20"
                      disabled={updateTaskMutation.isPending}
                    >
                      {updateTaskMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-600 rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Delete Button */}
                  {isEditable && (
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="outline"
                      size="sm"
                      className='text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Task Name */}
              <div className="space-y-2">
                <Label htmlFor={`task-${task.id}`} className="text-sm font-medium text-card-foreground">
                  Tên công việc <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`task-${task.id}`}
                  placeholder="Mô tả chi tiết công việc..."
                  value={task.taskName}
                  onChange={(e) => onTaskChange(task.id, 'taskName', e.target.value)}
                  disabled={!isEditable}
                  className="min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              {/* Weekdays Grid */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-card-foreground">
                  Ngày thực hiện trong tuần
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {weekdays.map(({ key, label }) => (
                    <div key={key} className="flex flex-col items-center space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <Checkbox
                        checked={task[key as keyof TaskReport] as boolean}
                        onCheckedChange={(checked) => onTaskChange(task.id, key, checked)}
                        disabled={!isEditable}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-card-foreground">
                    Trạng thái hoàn thành
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={task.isCompleted}
                      onCheckedChange={(checked) => {
                        onTaskChange(task.id, 'isCompleted', checked)
                        if (checked) {
                          onTaskChange(task.id, 'reasonNotDone', '')
                        }
                      }}
                      disabled={!isEditable}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-sm font-medium ${
                      task.isCompleted ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {task.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                    </span>
                  </div>
                </div>

                {/* Reason for not completion */}
                {!task.isCompleted && (
                  <div className="space-y-2">
                    <Label htmlFor={`reason-${task.id}`} className="text-sm font-medium text-card-foreground">
                      Lý do chưa hoàn thành <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`reason-${task.id}`}
                      placeholder="Giải thích lý do công việc chưa hoàn thành..."
                      value={task.reasonNotDone || ''}
                      onChange={(e) => onTaskChange(task.id, 'reasonNotDone', e.target.value)}
                      disabled={!isEditable}
                      className={`min-h-[60px] resize-none ${!task.reasonNotDone?.trim() && isEditable ? 'border-red-500' : ''}`}
                      rows={2}
                    />
                    {!task.reasonNotDone?.trim() && isEditable && (
                      <div className="text-xs text-red-600">Vui lòng nhập lý do nếu công việc chưa hoàn thành.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa công việc</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa công việc này? 
              {task.id && !task.id.startsWith('temp-') 
                ? ' Thao tác này sẽ xóa vĩnh viễn khỏi cơ sở dữ liệu và không thể hoàn tác.'
                : ' Thao tác này không thể hoàn tác.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteTaskMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTaskMutation.isPending}
              className="flex items-center gap-2"
            >
              {deleteTaskMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Xóa công việc
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

TaskRow.displayName = 'TaskRow'

export { TaskRow }
