"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Star } from 'lucide-react'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation } from '@/hooks/use-task-evaluation'
import { useApproveTask, useRejectTask } from '@/hooks/use-reports'
import { useAdminOverviewContext } from '@/contexts/admin-overview-context'
import { EvaluationType } from '@/types'
import { toast } from 'react-toast-kit'

const evaluationSchema = z.object({
  evaluatedIsCompleted: z.boolean(),
  evaluatedReasonNotDone: z.string().optional(),
  evaluatorComment: z.string().optional(),
  evaluationType: z.nativeEnum(EvaluationType),
})

type EvaluationFormData = z.infer<typeof evaluationSchema>

export function EvaluationForm() {
  const { user: currentUser } = useAuth()
  const { invalidateUserData, handleError } = useAdminOverviewContext()
  
  const {
    openEvalModal,
    selectedEmployee,
    selectedTask,
    editEvaluation,
    closeEvaluationModal,
  } = useAdminOverviewStore()
  
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()
  
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      evaluatedIsCompleted: true,
      evaluatedReasonNotDone: '',
      evaluatorComment: '',
      evaluationType: EvaluationType.REVIEW,
    },
  })
  
  // Reset form when modal opens with different data
  React.useEffect(() => {
    if (openEvalModal && selectedTask) {
      form.reset({
        evaluatedIsCompleted: editEvaluation?.evaluatedIsCompleted ?? selectedTask.isCompleted,
        evaluatedReasonNotDone: editEvaluation?.evaluatedReasonNotDone ?? selectedTask.reasonNotDone ?? '',
        evaluatorComment: editEvaluation?.evaluatorComment ?? '',
        evaluationType: editEvaluation?.evaluationType ?? EvaluationType.REVIEW,
      })
    }
  }, [openEvalModal, selectedTask, editEvaluation, form])
  
  const onSubmit = async (data: EvaluationFormData) => {
    if (!selectedTask || !selectedEmployee || !currentUser) return
    
    try {
      const originalIsCompleted = selectedTask.isCompleted
      
      if (editEvaluation) {
        await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data,
        })
      } else {
        await createEval.mutateAsync({
          ...data,
          taskId: selectedTask.id,
        })
      }
      
      // Handle task status change if manager changed completion status
      if (currentUser.isManager && data.evaluatedIsCompleted !== originalIsCompleted) {
        if (data.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
        }
      }
      
      // Invalidate cache
      await invalidateUserData(currentUser.id)
      
      closeEvaluationModal()
      toast.success(editEvaluation ? 'Đánh giá đã được cập nhật thành công!' : 'Đánh giá đã được tạo thành công!')
    } catch (error) {
      handleError(error, 'Có lỗi xảy ra khi gửi đánh giá')
    }
  }
  
  const handleDelete = async () => {
    if (!editEvaluation || !currentUser) return
    
    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      await invalidateUserData(currentUser.id)
      closeEvaluationModal()
      toast.success('Đánh giá đã được xóa thành công!')
    } catch (error) {
      handleError(error, 'Có lỗi xảy ra khi xóa đánh giá')
    }
  }
  
  const isLoading = createEval.isPending || updateEval.isPending || approveTask.isPending || rejectTask.isPending
  
  return (
    <Dialog open={openEvalModal} onOpenChange={() => closeEvaluationModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            {editEvaluation ? 'Chỉnh sửa đánh giá' : 'Đánh giá công việc'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Nhân viên:</span>{' '}
              {`${selectedEmployee?.user?.firstName || ''} ${selectedEmployee?.user?.lastName || ''}`}
            </div>
            <div>
              <span className="font-medium">Công việc:</span> {selectedTask?.taskName || 'N/A'}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {editEvaluation && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
                Đánh giá hiện tại:
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  Trạng thái:{' '}
                  <span className={editEvaluation.evaluatedIsCompleted ? 'text-green-600' : 'text-red-600'}>
                    {editEvaluation.evaluatedIsCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                  </span>
                </div>
                {editEvaluation.evaluatorComment && (
                  <div>Nhận xét: {editEvaluation.evaluatorComment}</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Trạng thái hoàn thành <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register('evaluatedIsCompleted', { 
                  setValueAs: (value) => value === 'true' 
                })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="true">✅ Hoàn thành</option>
                <option value="false">❌ Chưa hoàn thành</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nguyên nhân/Giải pháp</label>
              <textarea
                {...form.register('evaluatedReasonNotDone')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Nhập nguyên nhân nếu chưa hoàn thành..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
              <textarea
                {...form.register('evaluatorComment')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Nhập nhận xét, góp ý..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Loại đánh giá <span className="text-red-500">*</span>
              </label>
              <select
                {...form.register('evaluationType')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {Object.values(EvaluationType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={closeEvaluationModal}>
              Hủy
            </Button>
            {editEvaluation && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteEval.isPending}
              >
                Xóa đánh giá
              </Button>
            )}
            <AnimatedButton
              type="submit"
              loading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editEvaluation ? 'Cập nhật' : 'Gửi đánh giá'}
            </AnimatedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
