"use client"

import React, { useCallback } from 'react'
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
import { EvaluationType } from '@/types'
import { toast } from 'react-toast-kit'
import { QUERY_KEYS } from '@/hooks/query-key'
import { hierarchyStoreActions } from '@/store/hierarchy-store'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConvertEvaluationTypeToVietNamese } from '@/utils'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'

const evaluationSchema = z.object({
  evaluatedIsCompleted: z.boolean(),
  evaluatedReasonNotDone: z.string().optional(),
  evaluatorComment: z.string().optional(),
  evaluationType: z.nativeEnum(EvaluationType),
})

type EvaluationFormData = z.infer<typeof evaluationSchema>

// ✅ NEW: Extracted component for evaluation type badge
const EvaluationTypeBadge = ({ type }: { type: EvaluationType }) => {
  const typeText = ConvertEvaluationTypeToVietNamese(type)
  const colorClasses = React.useMemo(() => {
    switch (type) {
      case EvaluationType.REVIEW:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case EvaluationType.APPROVAL:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case EvaluationType.REJECTION:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }, [type])

  return (
    <Badge className={`text-xs font-medium ${colorClasses}`}>
      {typeText}
    </Badge>
  )
}

export function EvaluationForm() {
  const { user: currentUser } = useAuth()
  
  const {
    openEvalModal,
    selectedEmployee,
    selectedTask,
    editEvaluation,
    closeEvaluationModal,
    weeklyReport
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
      
      // ✅ ENHANCED: Immediate hierarchy refresh with proper delay
      console.log('🔄 Evaluation submitted, forcing immediate hierarchy refresh')
      
      // Step 1: Force hierarchy store refresh immediately
      hierarchyStoreActions.forceRefresh()
      
      // // Step 2: Wait for the mutation to complete on server
      // await new Promise(resolve => setTimeout(resolve, 1000))
      
      // // Step 3: Force another refresh to ensure fresh data
      // hierarchyStoreActions.forceRefresh()
      
      closeEvaluationModal()
      toast.success(editEvaluation ? 'Đánh giá đã được cập nhật thành công!' : 'Đánh giá đã được tạo thành công!')
    } catch (error) {
      console.error('Error submitting evaluation in EvaluationForm:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!')
    }
  }
  
  const handleDelete = async () => {
    if (!editEvaluation || !currentUser) return
    
    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      
      // ✅ ENHANCED: Same enhanced refresh for delete
      console.log('🔄 Evaluation deleted, forcing immediate hierarchy refresh')
      
      // Force refresh immediately
      hierarchyStoreActions.forceRefresh()
      
      // Wait and force another refresh
      setTimeout(() => {
        hierarchyStoreActions.forceRefresh()
      }, 1000)
      
      closeEvaluationModal()
      toast.success('Đánh giá đã được xóa thành công!')
    } catch (error) {
      console.error('Error deleting evaluation in EvaluationForm:', error)
      toast.error('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!')
    }
  }

  // ✅ NEW: Handle completion status change
  const handleCompletionStatusChange = React.useCallback((value: string) => {
    const isCompleted = value === "true"
    form.setValue("evaluatedIsCompleted", isCompleted)
    form.setValue("evaluationType", isCompleted ? EvaluationType.APPROVAL : EvaluationType.REJECTION)
    if (isCompleted) {
      form.setValue("evaluatorComment", "")
    }
  }, [form])
  
  const isLoading = createEval.isPending || updateEval.isPending || approveTask.isPending || rejectTask.isPending
  
  return (
    <Dialog open={openEvalModal} onOpenChange={() => setEvaluationModal(false)}>
      <DialogContent className="max-w-4xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Star className="w-5 h-5" />
            {editEvaluation ? 'Chỉnh sửa đánh giá của bạn' : 'Đánh giá công việc'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Nhân viên:</span>{' '}
              {`${selectedEmployee?.user?.firstName || ''} ${selectedEmployee?.user?.lastName || ''}`}
            </div>
            <div>
              <span className="font-medium">Công việc:</span> {selectedTask?.taskName || 'N/A'}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form đánh giá */}
          <div className="space-y-4">
            {editEvaluation && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-orange-800 dark:text-orange-300">
                    Đánh giá hiện tại của bạn:
                  </span>
                  <EvaluationTypeBadge type={editEvaluation.evaluationType} />
                </div>
                <div className="space-y-2 text-sm">
                  {editEvaluation.evaluatorComment && (
                    <div>
                      <span className="font-medium">Nhận xét:</span>
                      <p className="bg-white dark:bg-gray-800 p-2 rounded mt-1">{editEvaluation.evaluatorComment}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Cập nhật: {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="evaluatedIsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái hoàn thành</FormLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={handleCompletionStatusChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái hoàn thành" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">
                            <span>Hoàn thành</span>
                          </SelectItem>
                          <SelectItem value="false">
                            <span>Chưa hoàn thành</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluatedReasonNotDone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nguyên nhân/Giải pháp</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Nhập nguyên nhân nếu chưa hoàn thành..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluatorComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhận xét của bạn</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Nhập nhận xét, góp ý hoặc đánh giá chi tiết..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" type="button" onClick={() => setEvaluationModal(false)}>
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
            </Form>
          </div>

          {/* ✅ NEW: Danh sách đánh giá khác để tham khảo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
              {`Đánh giá khác để tham khảo (${selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})`}
            </h3>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {selectedTask?.evaluations && selectedTask.evaluations.length > 0 ? (
                selectedTask.evaluations
                  .filter((evalItem) => evalItem.evaluatorId !== currentUser?.id)
                  .map((evalItem) => (
                    <div key={evalItem.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                          </span>
                          <span className="text-gray-400 text-sm">({evalItem.evaluator?.jobPosition?.position?.description})</span>
                        </div>
                        <EvaluationTypeBadge type={evalItem.evaluationType} />
                      </div>

                      <div className="space-y-2">
                        {evalItem.evaluatedReasonNotDone && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">Nguyên nhân/Giải pháp:</span>
                            <p className="text-gray-800 dark:text-gray-200 text-sm bg-white dark:bg-gray-700 p-2 rounded mt-1">
                              {evalItem.evaluatedReasonNotDone}
                            </p>
                          </div>
                        )}

                        {evalItem.evaluatorComment && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">Nhận xét:</span>
                            <p className="text-gray-800 dark:text-gray-200 text-sm bg-white dark:bg-gray-700 p-2 rounded mt-1">
                              {evalItem.evaluatorComment}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 pt-1 border-t border-gray-300 dark:border-gray-600">
                          {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Chưa có đánh giá nào khác để tham khảo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
