import { useCallback, useEffect } from 'react'
import { useForm, ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation } from '@/hooks/use-task-evaluation'
import { useApproveTask, useRejectTask } from '@/hooks/use-reports'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation-schema'
import { EvaluationType } from '@/types'
import { toast } from 'react-toast-kit'

export function useEvaluationForm() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  const {
    selectedTask,
    selectedEmployee,
    editEvaluation,
    setEvaluationModal,
    isSubmittingEvaluation,
    setSubmittingEvaluation,
  } = useAdminOverviewStore()

  // Mutations
  const createEval = useCreateTaskEvaluation()
  const updateEval = useUpdateTaskEvaluation()
  const deleteEval = useDeleteTaskEvaluation()
  const approveTask = useApproveTask()
  const rejectTask = useRejectTask()

  // Form setup with react-hook-form + zod
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      evaluatedIsCompleted: true,
      evaluatedReasonNotDone: '',
      evaluatorComment: '',
      evaluationType: EvaluationType.REVIEW,
    },
    mode: 'onChange',
  })

  // Reset form when modal opens with new data
  useEffect(() => {
    if (selectedTask && editEvaluation) {
      form.reset({
        evaluatedIsCompleted: editEvaluation.evaluatedIsCompleted,
        evaluatedReasonNotDone: editEvaluation.evaluatedReasonNotDone || '',
        evaluatorComment: editEvaluation.evaluatorComment || '',
        evaluationType: editEvaluation.evaluationType,
      })
    } else if (selectedTask) {
      form.reset({
        evaluatedIsCompleted: selectedTask.isCompleted,
        evaluatedReasonNotDone: selectedTask.reasonNotDone || '',
        evaluatorComment: '',
        evaluationType: EvaluationType.REVIEW,
      })
    }
  }, [selectedTask, editEvaluation, form])

  // Submit evaluation
  const handleSubmitEvaluation = useCallback(async (data: EvaluationFormData) => {
    if (!selectedTask || !selectedEmployee || !currentUser?.id) return

    setSubmittingEvaluation(true)

    try {
      const originalIsCompleted = selectedTask.isCompleted

      // Create or update evaluation
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

      // Force refresh manager reports cache
      queryClient.removeQueries({ queryKey: ['hierarchy', 'managerReports'] })
      
      setEvaluationModal(false)
      toast.success(editEvaluation ? 'Đánh giá đã được cập nhật thành công!' : 'Đánh giá đã được tạo thành công!')
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!')
    } finally {
      setSubmittingEvaluation(false)
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
    setSubmittingEvaluation,
    setEvaluationModal,
    queryClient,
  ])

  // Delete evaluation
  const handleDeleteEvaluation = useCallback(async () => {
    if (!editEvaluation) return

    setSubmittingEvaluation(true)

    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      
      // Force refresh manager reports cache
      queryClient.removeQueries({ queryKey: ['hierarchy', 'managerReports'] })
      
      setEvaluationModal(false)
      toast.success('Đánh giá đã được xóa thành công!')
    } catch (error) {
      console.error('Error deleting evaluation:', error)
      toast.error('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!')
    } finally {
      setSubmittingEvaluation(false)
    }
  }, [editEvaluation, deleteEval, setSubmittingEvaluation, setEvaluationModal, queryClient])

  return {
    form,
    isSubmitting: isSubmittingEvaluation,
    handleSubmitEvaluation: form.handleSubmit(handleSubmitEvaluation),
    handleDeleteEvaluation,
    selectedTask,
    selectedEmployee,
    editEvaluation,
  }
}

// Export type for field render props
export type FormFieldRenderProps<T extends FieldValues, K extends FieldPath<T>> = ControllerRenderProps<T, K>
