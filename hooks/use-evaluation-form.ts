"use client"
import { useCallback, useEffect } from 'react'
import { useForm, ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation } from '@/hooks/use-task-evaluation'
import { useApproveTask, useRejectTask } from '@/hooks/use-reports'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation-schema'
import { EvaluationType, Role } from '@/types'
import { toast } from 'react-toast-kit'

export function useEvaluationForm() {
  const { user: currentUser } = useAuth()
  
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

  // ✅ SIMPLIFIED: Submit handler without complex coordination
  const handleSubmitEvaluation = useCallback(async (data: EvaluationFormData): Promise<void> => {
    if (!selectedTask || !selectedEmployee || !currentUser?.id) return

    setSubmittingEvaluation(true)

    try {
      const originalIsCompleted = selectedTask.isCompleted

      console.log('🔄 useEvaluationForm: Starting evaluation submission...')

      if (editEvaluation) {
        await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data,
        })
        console.log('✅ useEvaluationForm: Evaluation update completed')
      } else {
        await createEval.mutateAsync({
          ...data,
          taskId: selectedTask.id,
        })
        console.log('✅ useEvaluationForm: Evaluation create completed')
      }

      if (currentUser.isManager && data.evaluatedIsCompleted !== originalIsCompleted) {
        console.log('🔄 useEvaluationForm: Starting task status change...')
        if (data.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
          console.log('✅ useEvaluationForm: Task approval completed')
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
          console.log('✅ useEvaluationForm: Task rejection completed')
        }
        
        // ✅ CRITICAL: Wait for backend to process task status change
        console.log('⏰ useEvaluationForm: Waiting for backend to process task status change...')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // ✅ NOW broadcast after ensuring all changes are processed
      console.log('🔄 useEvaluationForm: Triggering broadcast after all operations completed...')
      
      // ✅ FIX: Import động để tránh circular dependency
      try {
        const adminOverviewModule = await import('@/store/admin-overview-store')
        adminOverviewModule.adminOverviewStoreActions.onEvaluationChange()
      } catch (error) {
        console.warn('Could not import adminOverviewStoreActions:', error)
      }
      
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
  ])

  const handleDeleteEvaluation = useCallback(async (): Promise<void> => {
    if (!editEvaluation) return

    setSubmittingEvaluation(true)

    try {
      console.log('🔄 useEvaluationForm: Starting evaluation deletion...')
      
      await deleteEval.mutateAsync(editEvaluation.id)
      console.log('✅ useEvaluationForm: Evaluation deletion completed')
      
      // ✅ Simple broadcast
      try {
        const adminOverviewModule = await import('@/store/admin-overview-store')
        adminOverviewModule.adminOverviewStoreActions.onEvaluationChange()
      } catch (error) {
        console.warn('Could not import adminOverviewStoreActions:', error)
      }
      
      setEvaluationModal(false)
      toast.success('Đánh giá đã được xóa thành công!')
    } catch (error) {
      console.error('Error deleting evaluation:', error)
      toast.error('Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!')
    } finally {
      setSubmittingEvaluation(false)
    }
  }, [editEvaluation, deleteEval, setSubmittingEvaluation, setEvaluationModal])

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
