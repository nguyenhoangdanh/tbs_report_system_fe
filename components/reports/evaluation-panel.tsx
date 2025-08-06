"use client"

import { memo, useCallback, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { AnimatedButton } from "../ui/animated-button"
import { ConvertEvaluationTypeToVietNamese } from "@/utils"
import { EvaluationType } from "@/types"
import useEvaluationDialogStore from "@/store/evaluation-dialog-store"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

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

interface EvaluationPanelProps {
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

export const EvaluationPanel = memo(({ onEvaluationChange }: EvaluationPanelProps) => {
  const { user: currentUser } = useAuth()
  
  // ✅ OPTIMIZED: Selective state subscription to prevent unnecessary re-renders
  const isOpen = useEvaluationDialogStore(state => state.isOpen)
  const report = useEvaluationDialogStore(state => state.report)
  const selectedTask = useEvaluationDialogStore(state => state.selectedTask)
  const editEvaluation = useEvaluationDialogStore(state => state.editEvaluation)
  const formData = useEvaluationDialogStore(state => state.formData)
  const isSubmitting = useEvaluationDialogStore(state => state.isSubmitting)
  const isDeleting = useEvaluationDialogStore(state => state.isDeleting)
  
  // ✅ OPTIMIZED: Get actions only once
  const closeDialog = useEvaluationDialogStore(state => state.forceClose)
  const selectTask = useEvaluationDialogStore(state => state.selectTask)
  const setFormData = useEvaluationDialogStore(state => state.setFormData)
  const setSubmitting = useEvaluationDialogStore(state => state.setSubmitting)
  const setDeleting = useEvaluationDialogStore(state => state.setDeleting)
  const getTasks = useEvaluationDialogStore(state => state.getTasks)
  const getEvaluationProgress = useEvaluationDialogStore(state => state.getEvaluationProgress)
  const selectNextUnevaluatedTask = useEvaluationDialogStore(state => state.selectNextUnevaluatedTask)

  // ✅ OPTIMIZED: Stable memoized computations
  const tasks = useMemo(() => getTasks(), [getTasks])
  const progress = useMemo(() => {
    if (!currentUser?.id) return { completed: 0, total: 0 }
    return getEvaluationProgress(currentUser.id)
  }, [getEvaluationProgress, currentUser?.id])

  // ✅ OPTIMIZED: Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Hooks for mutations
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()

  // ✅ OPTIMIZED: Form setup with minimal re-renders
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    values: useMemo(() => ({
      evaluatedIsCompleted: formData.evaluatedIsCompleted,
      evaluatorComment: formData.evaluatorComment,
      evaluationType: formData.evaluationType as EvaluationType,
    }), [formData]),
    mode: 'onChange', // Only validate on change, not on blur
  })

  // ✅ OPTIMIZED: Close handler
  const handleClosePanel = useCallback(() => {
    closeDialog()
  }, [closeDialog])

  // ✅ OPTIMIZED: Task selection
  const handleTaskSelect = useCallback((task: any) => {
    if (isSubmitting || isDeleting) return
    selectTask(task, currentUser?.id)
  }, [selectTask, currentUser?.id, isSubmitting, isDeleting])

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

  const handleSubmitEval = useCallback(async (data: EvaluationFormData) => {
    if (!selectedTask) return

    try {
      setSubmitting(true)
      
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

      // ✅ Broadcast changes
      broadcastEvaluationChange()
      onEvaluationChange?.()

      // ✅ Auto-navigation
      setTimeout(() => {
        const hasNext = selectNextUnevaluatedTask(currentUser?.id)
        
        if (hasNext) {
          toast.success("Đánh giá thành công! Chuyển sang task tiếp theo.")
        } else {
          toast.success("🎉 Đã hoàn thành đánh giá tất cả công việc!")
        }
      }, 100)

    } catch (error) {
      console.error("❌ EvaluationPanel: Error submitting evaluation:", error)
      toast.error("Có lỗi xảy ra khi đánh giá. Vui lòng thử lại!")
    } finally {
      setSubmitting(false)
    }
  }, [selectedTask, editEvaluation, updateEval, createEval, approveTask, rejectTask, onEvaluationChange, currentUser?.id, selectNextUnevaluatedTask, setSubmitting])

  const handleDeleteEval = useCallback(async () => {
    if (!editEvaluation) return

    try {
      setDeleting(true)
      
      await deleteEval.mutateAsync(editEvaluation.id)

      broadcastEvaluationChange()
      onEvaluationChange?.()

      toast.success("Xóa đánh giá thành công!")

      setFormData({
        evaluatedIsCompleted: selectedTask?.isCompleted ?? true,
        evaluatorComment: "",
        evaluationType: "REVIEW"
      })

    } catch (error) {
      console.error("❌ EvaluationPanel: Error deleting evaluation:", error)
      toast.error("Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!")
    } finally {
      setDeleting(false)
    }
  }, [editEvaluation, deleteEval, selectedTask, onEvaluationChange, setDeleting, setFormData])

  // ✅ Navigation helpers
  const currentTaskIndex = useMemo(() => {
    if (!selectedTask) return -1
    return tasks.findIndex(t => t.id === selectedTask.id)
  }, [selectedTask, tasks])

  const handlePrevTask = useCallback(() => {
    if (currentTaskIndex > 0) {
      handleTaskSelect(tasks[currentTaskIndex - 1])
    }
  }, [currentTaskIndex, tasks, handleTaskSelect])

  const handleNextTask = useCallback(() => {
    if (currentTaskIndex < tasks.length - 1) {
      handleTaskSelect(tasks[currentTaskIndex + 1])
    }
  }, [currentTaskIndex, tasks, handleTaskSelect])

  // ✅ EARLY RETURN: Don't render if not open or no data
  if (!isOpen || !report || !selectedTask) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* ✅ IMPROVED: Compact header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {editEvaluation ? "Chỉnh sửa đánh giá" : "Đánh giá công việc"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                <span className="font-medium">Công việc:</span> {selectedTask.taskName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Tiến độ: {progress.completed}/{progress.total} đã đánh giá
              </p>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevTask}
                disabled={currentTaskIndex <= 0 || isSubmitting || isDeleting}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 px-2 whitespace-nowrap">
                {currentTaskIndex + 1}/{tasks.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextTask}
                disabled={currentTaskIndex >= tasks.length - 1 || isSubmitting || isDeleting}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePanel}
                disabled={isSubmitting || isDeleting}
                className="p-2 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ IMPROVED: Main content area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2">
            {/* Left panel - Form */}
            <div className="border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Task navigation grid */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
                    Danh sách công việc:
                  </div>
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {tasks.map((task, index) => {
                      const hasMyEval = task.evaluations?.some(ev => ev.evaluatorId === currentUser?.id)
                      const isSelected = selectedTask?.id === task.id
                      
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskSelect(task)}
                          className={`aspect-square rounded text-xs font-medium transition-all ${
                            isSelected 
                              ? 'bg-blue-500 text-white shadow-md' 
                              : hasMyEval 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                          }`}
                          disabled={isSubmitting || isDeleting}
                          title={`Task ${index + 1}: ${task.taskName}`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Current evaluation display */}
                {editEvaluation && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-orange-800 dark:text-orange-300 text-sm">
                        Đánh giá hiện tại:
                      </span>
                      <EvaluationTypeBadge type={editEvaluation.evaluationType} />
                    </div>
                    {editEvaluation.evaluatorComment && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nhận xét:</p>
                        <p className="bg-white dark:bg-gray-800 p-2 rounded text-sm text-gray-800 dark:text-gray-200 border">
                          {editEvaluation.evaluatorComment}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cập nhật: {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>
                    )}
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
                          <FormLabel className="text-sm font-medium">Trạng thái hoàn thành</FormLabel>
                          <Select
                            value={field.value ? "true" : "false"}
                            onValueChange={handleCompletionStatusChange}
                            disabled={isSubmitting || isDeleting}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Chọn trạng thái" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">✓ Hoàn thành</SelectItem>
                              <SelectItem value="false">✗ Chưa hoàn thành</SelectItem>
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
                              rows={4}
                              placeholder="Nhập nhận xét, góp ý hoặc đánh giá chi tiết..."
                              disabled={isSubmitting || isDeleting}
                              className="resize-none"
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

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={handleClosePanel}
                        disabled={isSubmitting || isDeleting}
                        size="sm"
                      >
                        Đóng
                      </Button>
                      {editEvaluation && (
                        <Button 
                          variant="destructive" 
                          type="button" 
                          onClick={handleDeleteEval} 
                          disabled={isDeleting || isSubmitting}
                          size="sm"
                        >
                          Xóa
                        </Button>
                      )}
                      <AnimatedButton
                        type="submit"
                        loading={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isDeleting}
                        size="sm"
                      >
                        {editEvaluation ? "Cập nhật" : "Gửi đánh giá"}
                      </AnimatedButton>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Right panel - Reference evaluations */}
            <div className="p-4 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/50">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                  Đánh giá khác để tham khảo ({selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})
                </h3>

                <div className="space-y-3">
                  {selectedTask?.evaluations && selectedTask.evaluations.length > 0 ? (
                    selectedTask.evaluations
                      .filter((evalItem) => evalItem.evaluatorId !== currentUser?.id)
                      .map((evalItem) => (
                        <div key={evalItem.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                                {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                              </span>
                              <span className="text-gray-400 text-xs">
                                ({evalItem.evaluator?.jobPosition?.position?.description})
                              </span>
                            </div>
                            <EvaluationTypeBadge type={evalItem.evaluationType} />
                          </div>

                          <div className="space-y-2">
                            {evalItem.evaluatedReasonNotDone && (
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                  Nguyên nhân/Giải pháp:
                                </span>
                                <p className="text-gray-800 dark:text-gray-200 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 border">
                                  {evalItem.evaluatedReasonNotDone}
                                </p>
                              </div>
                            )}

                            {evalItem.evaluatorComment && (
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                                  Nhận xét:
                                </span>
                                <p className="text-gray-800 dark:text-gray-200 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded mt-1 border border-yellow-200 dark:border-yellow-700">
                                  {evalItem.evaluatorComment}
                                </p>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                              {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-2xl">💬</span>
                      </div>
                      <p className="text-sm">Chưa có đánh giá nào khác để tham khảo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

EvaluationPanel.displayName = "EvaluationPanel"
