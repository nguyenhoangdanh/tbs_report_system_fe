"use client"

import { TaskEvaluationsService } from "@/services/report.service"
import type { CreateEvaluationDto, EvaluationType, Task, TaskEvaluation, UpdateEvaluationDto } from "@/types"
import { toast } from "react-toast-kit"
import { useApiMutation, useApiQuery } from "./use-api-query"
import { useAuth } from "@/components/providers/auth-provider"
import { useQueryClient } from "@tanstack/react-query"
import { INVALIDATION_PATTERNS } from "./query-key"

const handleError = (error: any, defaultMessage: string) => {
  const message = error?.message || defaultMessage
  toast.error(message)
}

// ✅ FIXED: Add proper Window interface declaration
declare global {
  interface Window {
    __EVALUATION_SESSION_ID__?: string;
    __EVALUATION_DIALOG_ACTIVE__?: boolean;
  }
}

// ✅ ENHANCED: Safer broadcast with dialog protection
export const broadcastEvaluationChange = () => {
  try {
    const broadcastData = {
      type: 'evaluation-change',
      timestamp: Date.now(),
      source: window.location.pathname,
      userId: localStorage.getItem('currentUserId'),
      protectDialogs: true,
      sessionId: typeof window !== 'undefined' ? window.__EVALUATION_SESSION_ID__ : null
    }
    
    // ✅ SAME-TAB COMMUNICATION - Immediate
    window.dispatchEvent(new CustomEvent('evaluation-changed', {
      detail: broadcastData
    }))
    
    // ✅ CROSS-TAB COMMUNICATION
    localStorage.setItem('evaluation-broadcast', JSON.stringify(broadcastData))
    
    // ✅ CLEANUP
    setTimeout(() => {
      localStorage.removeItem('evaluation-broadcast')
    }, 2000)
    
  } catch (error) {
    console.warn('⚠️ Failed to broadcast evaluation change:', error)
  }
}

export function useCreateTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useApiMutation<TaskEvaluation, CreateEvaluationDto, Error>({
    mutationFn: async (data: CreateEvaluationDto) => await TaskEvaluationsService.createTaskEvaluation(data),
    onSuccess: (newEvaluation, variables) => {
      // ✅ IMMEDIATE: Broadcast change for real-time updates
      broadcastEvaluationChange()
      
      toast.success("Đánh giá nhiệm vụ thành công!")
    },
    onError: (error) => {
      console.error('❌ CREATE evaluation FAILED:', error)
      handleError(error, "Không thể đánh giá nhiệm vụ")
    },
    retry: 1,
  })
}

export function useUpdateTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  
  return useApiMutation<TaskEvaluation, { evaluationId: string; data: UpdateEvaluationDto }, Error>({
    mutationFn: async ({ evaluationId, data }) => await TaskEvaluationsService.updateTaskEvaluation(evaluationId, data),
    onSuccess: (updatedEvaluation, variables) => {

      if (!user?.id) return
      // ✅ IMMEDIATE: Cache updates first
      queryClient.invalidateQueries({
        queryKey: ["task-evaluations"]
      })
      
      queryClient.invalidateQueries({
        queryKey: ["hierarchy"]
      })

      queryClient.invalidateQueries({ 
          queryKey: INVALIDATION_PATTERNS.reports.userSpecific(user.id),
          exact: false,
          refetchType: 'all'
        })
      
      // ✅ IMMEDIATE: Broadcast for real-time updates
      broadcastEvaluationChange()
      
      // ✅ SUCCESS FEEDBACK
      toast.success("Cập nhật đánh giá thành công!")
    },
    onError: (error) => {
      console.error('❌ UPDATE evaluation FAILED:', error)
      handleError(error, "Không thể cập nhật đánh giá")
    },
    retry: 1,
  })
}

export function useDeleteTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useApiMutation<{ message: string }, string, Error>({
    mutationFn: async (evaluationId: string) => await TaskEvaluationsService.deleteTaskEvaluation(evaluationId),
    onSuccess: (result, deletedId) => {
      if (!user?.id) return
      // ✅ IMMEDIATE: Cache updates first
      queryClient.invalidateQueries({
        queryKey: ["task-evaluations"]
      })
      
      queryClient.invalidateQueries({
        queryKey: ["hierarchy"]
      })

      queryClient.invalidateQueries({
        queryKey: ["reports"]
      })

      queryClient.invalidateQueries({
          queryKey: INVALIDATION_PATTERNS.reports.userSpecific(user.id),
          exact: false,
          refetchType: 'all'
        })
      
      // ✅ IMMEDIATE: Broadcast for real-time updates
      broadcastEvaluationChange()
      
      toast.success("Xóa đánh giá thành công!")
    },
    onError: (error) => {
      console.error('❌ DELETE evaluation FAILED:', error)
      handleError(error, "Không thể xóa đánh giá")
    },
    retry: 1,
  })
}

export function useTaskEvaluations(taskId: string) {
  return useApiQuery<TaskEvaluation[], Error>({
    queryKey: ["task-evaluations", taskId],
    queryFn: async () => await TaskEvaluationsService.getTaskEvaluations(taskId),
    enabled: !!taskId,
    cacheStrategy: 'fresh', // Always fresh for evaluations
    throwOnError: false,
  })
}

export function useMyTaskEvaluations(params?: {
  weekNumber?: number
  year?: number
  userId?: string
  evaluationType?: EvaluationType
}) {
  const { user } = useAuth()
  return useApiQuery<TaskEvaluation[], Error>({
    queryKey: ["my-task-evaluations", user?.id, params],
    queryFn: async () => await TaskEvaluationsService.getMyEvaluations(params),
    enabled: !!user?.id,
    cacheStrategy: 'fresh',
    throwOnError: false,
  })
}

export function useEvaluableTasksForManager(params?: {
  weekNumber?: number
  year?: number
  userId?: string
  isCompleted?: boolean
}) {
  const { user } = useAuth()
  return useApiQuery<Task[], Error>({
    queryKey: ["evaluable-tasks", user?.id, params],
    queryFn: async () => await TaskEvaluationsService.getEvaluableTasksForManager(params),
    enabled: !!user?.id,
    cacheStrategy: 'fresh',
    throwOnError: false,
  })
}