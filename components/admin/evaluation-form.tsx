"use client"

import React, { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Star } from 'lucide-react'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation } from '@/hooks/use-task-evaluation'
import { useApproveTask, useRejectTask } from '@/hooks/use-reports'
import { EvaluationType, type TaskEvaluation } from '@/types'
import { toast } from 'react-toast-kit'
import { useQueryClient } from '@tanstack/react-query'
import { ConvertEvaluationTypeToVietNamese } from '@/utils'
import { QUERY_KEYS } from '@/hooks/query-key'
import { adminOverviewStoreActions } from '@/store/admin-overview-store'

// Validation schema
const evaluationSchema = z.object({
  evaluatedIsCompleted: z.boolean(),
  evaluatorComment: z.string().optional(),
  evaluationType: z.nativeEnum(EvaluationType),
}).refine((data) => {
  // If not completed and not review, comment is required
  if (!data.evaluatedIsCompleted && data.evaluationType !== EvaluationType.REVIEW && !data.evaluatorComment?.trim()) {
    return false
  }
  return true
}, {
  message: "Vui lòng nhập nhận xét khi đánh giá không hoàn thành!",
  path: ["evaluatorComment"]
})

type EvaluationFormData = z.infer<typeof evaluationSchema>

// Extracted component for evaluation type badge
const EvaluationTypeBadge = ({ type }: { type: EvaluationType }) => {
  const typeText = ConvertEvaluationTypeToVietNamese(type)
  const colorClasses = useMemo(() => {
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

// Extracted component for other evaluations display
const OtherEvaluationsDisplay = ({ 
  evaluations, 
  currentUserId 
}: { 
  evaluations: TaskEvaluation[], 
  currentUserId?: string 
}) => {
  const otherEvaluations = useMemo(() => 
    evaluations
      .filter((evalItem) => evalItem.evaluatorId !== currentUserId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [evaluations, currentUserId]
  )

  if (otherEvaluations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Chưa có đánh giá nào khác để tham khảo</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-3">
      {otherEvaluations.map((evalItem) => (
        <div key={evalItem.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
              </span>
              <span className="text-gray-400 text-sm">
                ({evalItem.evaluator?.jobPosition?.position?.description})
              </span>
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

            <div className="text-xs text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
              {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EvaluationForm() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  const {
    openEvalModal,
    selectedEmployee,
    selectedTask,
    editEvaluation,
    weeklyReport,
    setEvaluationModal,
  } = useAdminOverviewStore()
  
  // Mutation hooks
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()
  
  // Form setup
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      evaluatedIsCompleted: true,
      evaluatorComment: "",
      evaluationType: EvaluationType.REVIEW,
    },
    mode: 'onChange',
  })
  
  // Reset form when modal opens with different data
  React.useEffect(() => {
    if (openEvalModal && selectedTask) {
      const defaultValues = {
        evaluatedIsCompleted: editEvaluation?.evaluatedIsCompleted ?? selectedTask.isCompleted,
        evaluatorComment: editEvaluation?.evaluatorComment ?? "",
        evaluationType: editEvaluation?.evaluationType ?? EvaluationType.REVIEW,
      }
      
      form.reset(defaultValues)
    }
  }, [openEvalModal, selectedTask, editEvaluation, form])
  
  // Completion status change handler with auto-type selection
  const handleCompletionStatusChange = useCallback((value: string) => {
    const isCompleted = value === "true"
    form.setValue("evaluatedIsCompleted", isCompleted)
    form.setValue("evaluationType", isCompleted ? EvaluationType.APPROVAL : EvaluationType.REJECTION)
    if (isCompleted) {
      form.setValue("evaluatorComment", "")
    }
  }, [form])
  
  const handleSubmit = useCallback(async (data: EvaluationFormData) => {
    if (!selectedTask || !selectedEmployee || !currentUser) return

    try {
      const originalIsCompleted = selectedTask.isCompleted

      console.log('🔄 EvaluationForm: Starting evaluation submission...')

      if (editEvaluation) {
        await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data,
        })
        console.log('✅ EvaluationForm: Evaluation update completed')
      } else {
        await createEval.mutateAsync({
          ...data,
          taskId: selectedTask.id,
        })
        console.log('✅ EvaluationForm: Evaluation create completed')
      }

      if (currentUser.isManager && data.evaluatedIsCompleted !== originalIsCompleted) {
        console.log('🔄 EvaluationForm: Starting task status change...')
        if (data.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
          console.log('✅ EvaluationForm: Task approval completed')
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
          console.log('✅ EvaluationForm: Task rejection completed')
        }
        
        // ✅ REDUCE DELAY: From 1500ms to 1000ms
        console.log('⏰ EvaluationForm: Waiting for backend to process task status change...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // ✅ NOW broadcast after ensuring all changes are processed
      console.log('🔄 EvaluationForm: About to trigger broadcast...')
      adminOverviewStoreActions.onEvaluationChange()
      console.log('📡 EvaluationForm: Broadcast triggered successfully')

      setEvaluationModal(false)
      toast.success(editEvaluation ? 'Đánh giá đã được cập nhật thành công!' : 'Đánh giá đã được tạo thành công!')

    } catch (error) {
      console.error('❌ EvaluationForm: Error submitting evaluation:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!')
    }
  }, [
    selectedTask,
    selectedEmployee,
    editEvaluation,
    currentUser,
    updateEval,
    createEval,
    approveTask,
    rejectTask,
    setEvaluationModal,
  ])

  const handleDelete = useCallback(async () => {
    if (!editEvaluation || !currentUser) return
    
    try {
      console.log('🔄 EvaluationForm: Starting evaluation deletion...')
      
      await deleteEval.mutateAsync(editEvaluation.id)
      console.log('✅ EvaluationForm: Evaluation deletion completed')
      
      // ✅ Simple broadcast
      console.log('🔄 EvaluationForm: About to trigger delete broadcast...')
      adminOverviewStoreActions.onEvaluationChange()
      console.log('📡 EvaluationForm: Delete broadcast triggered successfully')
      
      setEvaluationModal(false)
      toast.success('Đánh giá đã được xóa thành công!')
      
    } catch (error) {
      console.error('EvaluationForm: Error deleting evaluation:', error)
      toast.error('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!')
    }
  }, [editEvaluation, deleteEval, setEvaluationModal, currentUser])
  
  // Loading state calculation
  const isLoading = useMemo(() => 
    createEval.isPending || updateEval.isPending || deleteEval.isPending || approveTask.isPending || rejectTask.isPending,
    [createEval.isPending, updateEval.isPending, deleteEval.isPending, approveTask.isPending, rejectTask.isPending]
  )

  return (
    <Dialog open={openEvalModal} onOpenChange={() => setEvaluationModal(false)}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              {editEvaluation ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá công việc"}
            </span>
            <span className="sm:hidden">
              {editEvaluation ? "Sửa đánh giá" : "Đánh giá"}
            </span>
          </DialogTitle>
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <div className="truncate">
              <span className="font-medium">NV:</span>{" "}
              {`${selectedEmployee?.user?.firstName || ""} ${selectedEmployee?.user?.lastName || ""}`}
            </div>
            <div className="line-clamp-2 sm:line-clamp-1">
              <span className="font-medium">CV:</span> {selectedTask?.taskName || "N/A"}
            </div>
          </div>
        </DialogHeader>

        {/* ✅ ENHANCED: Improved responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column: Evaluation Form */}
          <div className="space-y-4">
            {/* ✅ IMPROVED: Current evaluation display for edit mode */}
            {editEvaluation && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-orange-800 dark:text-orange-300 text-sm">
                    Đánh giá hiện tại của bạn:
                  </span>
                  <EvaluationTypeBadge type={editEvaluation.evaluationType} />
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    Trạng thái:{" "}
                    <span className={editEvaluation.evaluatedIsCompleted ? "text-green-600" : "text-red-600"}>
                      {editEvaluation.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                    </span>
                  </div>
                  {editEvaluation.evaluatedReasonNotDone && (
                    <div>
                      <span className="font-medium">Nguyên nhân/Giải pháp:</span>
                      <p className="bg-white dark:bg-gray-800 p-2 rounded mt-1 text-xs break-words">
                        {editEvaluation.evaluatedReasonNotDone}
                      </p>
                    </div>
                  )}
                  {editEvaluation.evaluatorComment && (
                    <div>
                      <span className="font-medium">Nhận xét:</span>
                      <p className="bg-white dark:bg-gray-800 p-2 rounded mt-1 text-xs break-words">
                        {editEvaluation.evaluatorComment}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-orange-200 dark:border-orange-600">
                    Cập nhật: {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ ENHANCED: Evaluation form with improved validation */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="evaluatedIsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Trạng thái hoàn thành <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={handleCompletionStatusChange}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Chọn trạng thái hoàn thành" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true" className="text-sm">
                            <span className="flex items-center gap-2">
                              <span className="text-green-600">✅</span>
                              <span>Hoàn thành</span>
                            </span>
                          </SelectItem>
                          <SelectItem value="false" className="text-sm">
                            <span className="flex items-center gap-2">
                              <span className="text-red-600">❌</span>
                              <span>Chưa hoàn thành</span>
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluatorComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nhận xét của bạn</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Nhập nhận xét, góp ý hoặc đánh giá chi tiết..."
                          className="w-full min-h-[60px] sm:min-h-[80px] resize-y text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ ENHANCED: Auto-managed evaluation type (hidden from user) */}
                <FormField
                  control={form.control}
                  name="evaluationType"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* ✅ IMPROVED: Mobile-optimized button layout */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setEvaluationModal(false)}
                    className="order-3 sm:order-1 text-sm py-2"
                    disabled={isLoading}
                  >
                    Hủy
                  </Button>
                  {editEvaluation && (
                    <Button 
                      variant="destructive" 
                      type="button"
                      onClick={handleDelete} 
                      disabled={isLoading}
                      className="order-2 text-sm py-2"
                    >
                      Xóa đánh giá
                    </Button>
                  )}
                  <AnimatedButton
                    type="submit"
                    loading={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-3 text-sm py-2"
                  >
                    {editEvaluation ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                  </AnimatedButton>
                </div>
              </form>
            </Form>
          </div>

          {/* Right Column: Other Evaluations for Reference */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2 text-sm sm:text-base">
              {`Đánh giá khác để tham khảo (${selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})`}
            </h3>

            <OtherEvaluationsDisplay 
              evaluations={selectedTask?.evaluations || []} 
              currentUserId={currentUser?.id} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
