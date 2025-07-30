"use client"

import { TaskEvaluationsService } from "@/services/report.service"
import type { CreateEvaluationDto, EvaluationType, Task, TaskEvaluation, UpdateEvaluationDto } from "@/types"
import { toast } from "react-toast-kit"
import { useApiMutation, useApiQuery } from "./use-api-query"
import { useAuth } from "@/components/providers/auth-provider"
import { useQueryClient } from "@tanstack/react-query"
import { INVALIDATION_PATTERNS, QUERY_KEYS } from "./query-key"
import { HierarchyService } from "@/services/hierarchy.service"

const handleError = (error: any, defaultMessage: string) => {
  const message = error?.message || defaultMessage
  toast.error(message)
}

export function useCreateTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useApiMutation<TaskEvaluation, CreateEvaluationDto, Error>({
    mutationFn: async (data: CreateEvaluationDto) => await TaskEvaluationsService.createTaskEvaluation(data),
    enableOptimistic: true,
    optimisticUpdate: {
      queryKey: ["task-evaluations", "{taskId}"],
      updater: (old: TaskEvaluation[] = [], variables) => {
        const optimisticEvaluation: TaskEvaluation = {
          id: `temp-${Date.now()}`,
          taskId: variables.taskId,
          evaluatorId: user?.id || '',
          originalIsCompleted: false,
          evaluatedIsCompleted: variables.evaluatedIsCompleted,
          evaluatedReasonNotDone: variables.evaluatedReasonNotDone,
          evaluatorComment: variables.evaluatorComment,
          evaluationType: variables.evaluationType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          evaluator: user || undefined
        }
        return [...old, optimisticEvaluation]
      }
    },
    onMutate: async (newEvaluation) => {
      if (!user?.id) return
      console.log('🔄 CREATE evaluation mutation started')
      
      // ✅ BLOCK all hierarchy queries during mutation
      queryClient.cancelQueries({
        queryKey: ['hierarchy'],
      })
    },
    onSuccess: (newEvaluation, variables) => {
      if (!user?.id) return
      
      console.log('✅ CREATE evaluation successful - NO auto invalidation')
      
      // ✅ CRITICAL: Do NOT invalidate here - let EvaluationForm handle it sequentially
      // This prevents race conditions with approve/reject mutations
      
      toast.success("Đánh giá nhiệm vụ thành công!")
    },
    onError: (error, variables) => {
      // ✅ NEW: Clear pending state on error
      // adminOverviewStoreActions.markComplete(variables.taskId, 'create')
      handleError(error, "Không thể đánh giá nhiệm vụ")
    },
    invalidation: {
      type: 'evaluation',
      userId: user?.id,
    },
    retry: 1,
  })
}

export function useUpdateTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useApiMutation<TaskEvaluation, { evaluationId: string; data: UpdateEvaluationDto }, Error>({
    mutationFn: async ({ evaluationId, data }) => await TaskEvaluationsService.updateTaskEvaluation(evaluationId, data),
    onMutate: async (variables) => {
      if (!user?.id) return
      console.log('🔄 UPDATE evaluation mutation started')
      
      // ✅ BLOCK all hierarchy queries during mutation
      queryClient.cancelQueries({
        queryKey: ['hierarchy'],
      })
    },
    onSuccess: (updatedEvaluation, variables) => {
      if (!user?.id) return
      
      console.log('✅ UPDATE evaluation successful - NO auto invalidation')
      
      // ✅ CRITICAL: Do NOT invalidate here - let EvaluationForm handle it sequentially
      
      toast.success("Cập nhật đánh giá thành công!")
    },
    onError: (error, variables) => {
      // adminOverviewStoreActions.markComplete(variables.evaluationId, 'update')
      handleError(error, "Không thể cập nhật đánh giá")
    },
    invalidation: {
      type: 'evaluation',
      userId: user?.id,
    },
    retry: 1,
  })
}

export function useDeleteTaskEvaluation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useApiMutation<{ message: string }, string, Error>({
    mutationFn: async (evaluationId: string) => await TaskEvaluationsService.deleteTaskEvaluation(evaluationId),
    onMutate: async (evaluationId) => {
      if (!user?.id) return
      console.log('🔄 DELETE evaluation mutation started')
      
      // ✅ BLOCK all hierarchy queries during mutation
      queryClient.cancelQueries({
        queryKey: ['hierarchy'],
      })
    },
    onSuccess: (result, deletedId) => {
      if (!user?.id) return
      
      console.log('✅ DELETE evaluation successful - NO auto invalidation')
      
      // ✅ CRITICAL: Do NOT invalidate here - let EvaluationForm handle it sequentially
      
      toast.success("Xóa đánh giá thành công!")
    },
    onError: (error, deletedId) => {
      // adminOverviewStoreActions.markComplete(deletedId, 'delete')
      handleError(error, "Không thể xóa đánh giá")
    },
    invalidation: {
      type: 'evaluation',
      userId: user?.id,
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