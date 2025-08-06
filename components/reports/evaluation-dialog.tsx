import { memo, useCallback, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { X } from "lucide-react"
import { useAuth } from "../providers/auth-provider"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  useCreateTaskEvaluation,
  useUpdateTaskEvaluation,
  useDeleteTaskEvaluation,
  broadcastEvaluationChange,
} from "@/hooks/use-task-evaluation"
import { useApproveTask, useRejectTask } from "@/hooks/use-reports"
import { toast } from "react-toast-kit"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { AnimatedButton } from "../ui/animated-button"
import { ConvertEvaluationTypeToVietNamese } from "@/utils"
import { EvaluationType } from "@/types"
import useEvaluationDialogStore from "@/store/evaluation-dialog-store"
import { useEvaluationScrollPreservation } from "@/hooks/use-scroll-preservation"

// Validation schema
const evaluationSchema = z.object({
  evaluatedIsCompleted: z.boolean(),
  evaluatorComment: z.string().optional(),
  evaluationType: z.nativeEnum(EvaluationType),
}).refine((data) => {
  if (!data.evaluatedIsCompleted && data.evaluationType !== EvaluationType.REVIEW && !data.evaluatorComment?.trim()) {
    return false
  }
  return true
}, {
  message: "Vui lòng nhập nhận xét khi đánh giá không hoàn thành!",
  path: ["evaluatorComment"]
})

type EvaluationFormData = z.infer<typeof evaluationSchema>

interface EvaluationDialogProps {
  onEvaluationChange?: () => void
}

// Evaluation type badge component
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

export const EvaluationDialog = memo(({ onEvaluationChange }: EvaluationDialogProps) => {
  const { user: currentUser } = useAuth()
  
  // ✅ SELECTIVE: Get state selectively to prevent re-renders
  const isOpen = useEvaluationDialogStore(state => state.isOpen)
  const report = useEvaluationDialogStore(state => state.report)
  const selectedTask = useEvaluationDialogStore(state => state.selectedTask)
  const editEvaluation = useEvaluationDialogStore(state => state.editEvaluation)
  const formData = useEvaluationDialogStore(state => state.formData)
  const isSubmitting = useEvaluationDialogStore(state => state.isSubmitting)
  const isDeleting = useEvaluationDialogStore(state => state.isDeleting)
  const isLocked = useEvaluationDialogStore(state => state.isLocked)
  const lockReason = useEvaluationDialogStore(state => state.lockReason)
  const shouldPersist = useEvaluationDialogStore(state => state.shouldPersist)
  const disablePersistence = useEvaluationDialogStore(state => state.disablePersistence)
  
  // ✅ ACTIONS: Get actions separately
  const closeDialog = useEvaluationDialogStore(state => state.closeDialog)
  const selectTask = useEvaluationDialogStore(state => state.selectTask)
  const setFormData = useEvaluationDialogStore(state => state.setFormData)
  const setSubmitting = useEvaluationDialogStore(state => state.setSubmitting)
  const setDeleting = useEvaluationDialogStore(state => state.setDeleting)
  const getTasks = useEvaluationDialogStore(state => state.getTasks)
  const getEvaluationProgress = useEvaluationDialogStore(state => state.getEvaluationProgress)
  const selectNextUnevaluatedTask = useEvaluationDialogStore(state => state.selectNextUnevaluatedTask)

  // ✅ MEMOIZED: Cache heavy computations
  const tasks = useMemo(() => getTasks(), [getTasks])
  const progress = useMemo(() => getEvaluationProgress(currentUser?.id), [getEvaluationProgress, currentUser?.id])

  // Hooks for mutations
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()

  // ✅ MEMOIZED: Form setup with store sync
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    values: useMemo(() => ({
      evaluatedIsCompleted: formData.evaluatedIsCompleted,
      evaluatorComment: formData.evaluatorComment,
      evaluationType: formData.evaluationType as EvaluationType,
    }), [formData])
  })

  // ✅ ENHANCED: Prevent ANY auto-close when shouldPersist is true
  const handleDialogOpenChange = useCallback((open: boolean) => {
    
    // ✅ CRITICAL: TRIPLE protection against auto-close
    if (!open && (isLocked || shouldPersist)) {
      return // NEVER close when locked OR persisting
    }
    
    // ✅ GLOBAL CHECK: Also check global flag
    if (!open && typeof window !== 'undefined' && (window as any).__EVALUATION_DIALOG_ACTIVE__) {
      return
    }
    
    // Only allow opening
    if (open) {
    }
  }, [isLocked, shouldPersist])

  // ✅ ENHANCED: Explicit close with persistence check
  const handleCloseDialog = useCallback(() => {
    if (isLocked || shouldPersist) {
      return
    }
    
    
    // ✅ DISABLE persistence before closing
    disablePersistence()
    closeDialog()
  }, [closeDialog, isLocked, shouldPersist, disablePersistence])

  // Handle task selection
  const handleTaskSelect = useCallback((task: any) => {
    selectTask(task, currentUser?.id)
  }, [selectTask, currentUser?.id])

  // Handle form data changes
  const handleCompletionStatusChange = useCallback((value: string) => {
    const isCompleted = value === "true"
    setFormData({
      evaluatedIsCompleted: isCompleted,
      evaluationType: isCompleted ? EvaluationType.APPROVAL : EvaluationType.REJECTION
    })
    
    if (isCompleted) {
      setFormData({ evaluatorComment: "" })
    }
  }, [setFormData])

  // ✅ NEW: Add scroll preservation for evaluation context
  const { saveCurrentPosition } = useEvaluationScrollPreservation('evaluation-dialog')

  // ✅ ENHANCED: Submit with scroll preservation
  const handleSubmitEval = useCallback(async (data: EvaluationFormData) => {
    if (!selectedTask) return

    try {
      setSubmitting(true)
      
      // ✅ SAVE: Save scroll position before any changes
      saveCurrentPosition()

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

      if (data.evaluatedIsCompleted) {
        await approveTask.mutateAsync(selectedTask.id)
      } else {
        await rejectTask.mutateAsync(selectedTask.id)
      }

      // ✅ SUCCESS: Broadcast changes to update data
      broadcastEvaluationChange()
      onEvaluationChange?.()

      // ✅ AUTO-NAVIGATION: Select next task and keep dialog open
      setTimeout(() => {
        const hasNext = selectNextUnevaluatedTask(currentUser?.id)
        
        if (hasNext) {
          toast.success("Đánh giá thành công! Chuyển sang task tiếp theo.")
        } else {
          toast.success("🎉 Đã hoàn thành đánh giá tất cả công việc!")
          handleCloseDialog()
        }
      }, 100)

    } catch (error) {
      console.error("❌ EvaluationDialog: Error submitting evaluation:", error)
      toast.error("Có lỗi xảy ra khi đánh giá. Vui lòng thử lại!")
    } finally {
      setSubmitting(false)
    }
  }, [selectedTask, editEvaluation, updateEval, createEval, approveTask, rejectTask, onEvaluationChange, selectNextUnevaluatedTask, setSubmitting, handleCloseDialog, saveCurrentPosition])

  // ✅ ENHANCED: Delete handler that preserves dialog state
  const handleDeleteEval = useCallback(async () => {
    if (!editEvaluation) return

    try {
      setDeleting(true)
      
      await deleteEval.mutateAsync(editEvaluation.id)

      // ✅ Broadcast changes to update data
      broadcastEvaluationChange()
      onEvaluationChange?.()

      toast.success("Xóa đánh giá thành công!")

      // ✅ Reset form but keep dialog open
      setFormData({
        evaluatedIsCompleted: selectedTask?.isCompleted ?? true,
        evaluatorComment: "",
        evaluationType: "REVIEW"
      })

    } catch (error) {
      console.error("❌ EvaluationDialog: Error deleting evaluation:", error)
      toast.error("Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!")
    } finally {
      setDeleting(false)
    }
  }, [editEvaluation, deleteEval, selectedTask, onEvaluationChange, setDeleting, setFormData])


  // ✅ ENHANCED: Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!report || !selectedTask) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
        <div className="sticky top-0 border-b flex items-center justify-between flex-shrink-0 rounded-sm">
          <DialogHeader className="flex-1 min-w-0">
            <DialogTitle className="text-base sm:text-lg font-semibold truncate">
              {editEvaluation ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá công việc"}
              {/* ✅ DEBUG: Show protection status */}
              {(isLocked || shouldPersist) && (
                <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  🔒 {isLocked ? lockReason : 'persistent'}
                </span>
              )}
            </DialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Công việc:</span> {selectedTask.taskName}
            </div>
          </DialogHeader>
          {/* ✅ Close button disabled when protected */}
          <button
            type="button"
            className={`ml-2 rounded-full p-1.5 sm:p-2 hover:bg-muted transition flex-shrink-0 ${
              (isLocked || shouldPersist) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Đóng"
            onClick={handleCloseDialog}
            disabled={isLocked || shouldPersist}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Task navigation */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Danh sách công việc:</div>
              <div className="flex flex-wrap gap-1">
                {tasks.map((task, index) => {
                  const hasMyEval = task.evaluations?.some(ev => ev.evaluatorId === currentUser?.id)
                  const isSelected = selectedTask?.id === task.id
                  
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 text-white' 
                          : hasMyEval 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      disabled={isSubmitting || isDeleting}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Current evaluation display */}
            {editEvaluation && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 dark:bg-orange-900/20 dark:border-orange-700">
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
                      <p className="bg-white p-2 rounded mt-1 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {editEvaluation.evaluatorComment}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t">
                    Cập nhật: {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitEval)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="evaluatedIsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái hoàn thành</FormLabel>
                      <Select
                        value={field.value ? "true" : "false"}
                        onValueChange={handleCompletionStatusChange}
                        disabled={isSubmitting || isDeleting}
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
                  name="evaluatorComment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhận xét của bạn</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Nhập nhận xét, góp ý hoặc đánh giá chi tiết..."
                          disabled={isSubmitting || isDeleting}
                          onChange={(e) => {
                            field.onChange(e)
                            setFormData({ evaluatorComment: e.target.value })
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={handleCloseDialog}
                    disabled={isSubmitting || isDeleting}
                  >
                    Đóng
                  </Button>
                  {editEvaluation && (
                    <Button 
                      variant="destructive" 
                      type="button" 
                      onClick={handleDeleteEval} 
                      disabled={isDeleting || isSubmitting}
                    >
                      Xóa đánh giá
                    </Button>
                  )}
                  <AnimatedButton
                    type="submit"
                    loading={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isDeleting}
                  >
                    {editEvaluation ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                  </AnimatedButton>
                </div>
              </form>
            </Form>
          </div>

          {/* Reference panel */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2 dark:text-gray-100">
              {`Đánh giá khác để tham khảo (${selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})`}
            </h3>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {selectedTask?.evaluations && selectedTask.evaluations.length > 0 ? (
                selectedTask.evaluations
                  .filter((evalItem) => evalItem.evaluatorId !== currentUser?.id)
                  .map((evalItem) => (
                    <div key={evalItem.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-gray-800 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">
                            {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                          </span>
                          <span className="text-gray-400 text-sm">({evalItem.evaluator?.jobPosition?.position?.description})</span>
                        </div>
                        <EvaluationTypeBadge type={evalItem.evaluationType} />
                      </div>

                      <div className="space-y-2">
                        {evalItem.evaluatedReasonNotDone && (
                          <div>
                            <span className="font-medium text-gray-600 text-sm">Nguyên nhân/Giải pháp:</span>
                            <p className="text-gray-800 text-sm bg-white p-2 rounded mt-1">
                              {evalItem.evaluatedReasonNotDone}
                            </p>
                          </div>
                        )}

                        {evalItem.evaluatorComment && (
                          <div>
                            <span className="font-medium text-gray-600 text-sm">Nhận xét:</span>
                            <p className="text-gray-800 text-sm bg-white p-2 rounded mt-1">
                              {evalItem.evaluatorComment}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 pt-1 border-t">
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
})

EvaluationDialog.displayName = "EvaluationDialog"
