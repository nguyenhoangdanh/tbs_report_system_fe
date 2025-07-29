import { useCallback, useEffect } from 'react'
import { useForm, ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { useCreateTaskEvaluation, useUpdateTaskEvaluation, useDeleteTaskEvaluation } from '@/hooks/use-task-evaluation'
import { useApproveTask, useRejectTask } from '@/hooks/use-reports'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation-schema'
import { EvaluationType, Role } from '@/types'
import { toast } from 'react-toast-kit'
import { QUERY_KEYS } from './query-key'
import { hierarchyStoreActions } from '@/store/hierarchy-store'

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
    weeklyReport
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
  const handleSubmitEvaluation = useCallback(async (data: EvaluationFormData): Promise<void> => {
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

      // ✅ CRITICAL: Force hierarchy store refresh FIRST
      console.log('🔄 Evaluation submitted, forcing hierarchy store refresh')
      hierarchyStoreActions.forceRefresh()

      // ✅ ENHANCED: Complete cache invalidation with specific targeting
      console.log('🔄 Starting complete cache invalidation...')
      
      // Step 1: Remove ALL hierarchy queries immediately
      queryClient.removeQueries({ 
        queryKey: ['hierarchy'], 
        exact: false 
      })
      
      // Step 2: Remove specific user-related queries  
      queryClient.removeQueries({ 
        queryKey: ['hierarchy', 'user-details'], 
        exact: false 
      })
      
      queryClient.removeQueries({ 
        queryKey: ['hierarchy', 'managerReports'], 
        exact: false 
      })
      
      // Step 3: Force invalidate with ALL refetch type
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy'], 
        exact: false,
        refetchType: 'all'
      })
      
      // Step 4: Specific invalidation for current user's myView with current filters
      if (weeklyReport?.year && weeklyReport?.weekNumber) {
        const currentFilters = {
          year: weeklyReport.year,
          weekNumber: weeklyReport.weekNumber,
        }
        
        // Remove and invalidate specific myView query
        const myViewQueryKey = QUERY_KEYS.hierarchy.myView(currentUser.id, currentFilters)
        console.log('🔄 Invalidating specific myView query:', myViewQueryKey)
        
        queryClient.removeQueries({ 
          queryKey: myViewQueryKey,
          exact: true 
        })
        
        await queryClient.invalidateQueries({ 
          queryKey: myViewQueryKey,
          exact: true,
          refetchType: 'all'
        })
        
        // Force refetch this specific query
        await queryClient.refetchQueries({ 
          queryKey: myViewQueryKey,
          exact: true
        })
      }
      
      // Step 5: Additional invalidation for user role-specific queries
      if (currentUser?.role !== 'USER') {
        const filters = {
          year: weeklyReport?.year,
          weekNumber: weeklyReport?.weekNumber,
        }
        const roleSpecificKey = QUERY_KEYS.hierarchy.myView(currentUser.id, filters)
        
        queryClient.removeQueries({ 
          queryKey: roleSpecificKey,
          exact: true 
        })
        
        await queryClient.invalidateQueries({ 
          queryKey: roleSpecificKey,
          exact: true,
          refetchType: 'all'
        })
      }
      
      // Step 6: Wait for cache to settle, then force comprehensive refetch
      setTimeout(async () => {
        console.log('🔄 Final comprehensive refetch after cache settlement')
        
        // Force refetch ALL active hierarchy queries
        await queryClient.refetchQueries({ 
          queryKey: ['hierarchy'], 
          type: 'active',
          exact: false
        })
        
        // Additional force refresh of hierarchy store
        hierarchyStoreActions.forceRefresh()
      }, 1000)
      
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
    weeklyReport
  ])

  // Delete evaluation
  const handleDeleteEvaluation = useCallback(async (): Promise<void> => {
    if (!editEvaluation) return

    setSubmittingEvaluation(true)

    try {
      await deleteEval.mutateAsync(editEvaluation.id)
      
      // ✅ ENHANCED: Same comprehensive invalidation for delete
      console.log('🔄 Evaluation deleted, forcing hierarchy store refresh')
      hierarchyStoreActions.forceRefresh()
      
      // Complete cache removal and invalidation
      queryClient.removeQueries({ 
        queryKey: ['hierarchy'], 
        exact: false 
      })
      
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy'], 
        exact: false,
        refetchType: 'all'
      })
      
      // Force refetch after delay
      setTimeout(async () => {
        await queryClient.refetchQueries({ 
          queryKey: ['hierarchy'], 
          type: 'active',
          exact: false
        })
        hierarchyStoreActions.forceRefresh()
      }, 1000)
      
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
