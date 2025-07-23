"use client"

// TaskEvaluations hooks - FIXED VERSION

import { TaskEvaluationsService } from "@/services/report.service"
import type { CreateEvaluationDto, EvaluationType, Task, TaskEvaluation, UpdateEvaluationDto } from "@/types"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toast-kit"
import { useApiMutation, useApiQuery } from "./use-api-query"
import { useAuth } from "@/components/providers/auth-provider"

const handleError = (error: any, defaultMessage: string) => {
  const message = error?.message || defaultMessage
  toast.error(message)
}

export function useCreateTaskEvaluation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useApiMutation<TaskEvaluation, CreateEvaluationDto, Error>({
    mutationFn: async (data: CreateEvaluationDto) => await TaskEvaluationsService.createTaskEvaluation(data),
    onMutate: async (newEvaluation) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["task-evaluations", newEvaluation.taskId] })
      await queryClient.cancelQueries({ queryKey: ["reports"] })
      await queryClient.cancelQueries({ queryKey: ["hierarchy", "manager-reports"] })
      await queryClient.cancelQueries({ queryKey: ["hierarchy", "my-view"] })
      
      // Snapshot the previous value
      const previousEvaluations = queryClient.getQueryData(["task-evaluations", newEvaluation.taskId])
      
      // Optimistically update to the new value - tạm thời add evaluation với dữ liệu giả
      const optimisticEvaluation: TaskEvaluation = {
        id: `temp-${Date.now()}`,
        taskId: newEvaluation.taskId,
        evaluatorId: user?.id || '',
        originalIsCompleted: false,
        evaluatedIsCompleted: newEvaluation.evaluatedIsCompleted,
        evaluatedReasonNotDone: newEvaluation.evaluatedReasonNotDone,
        evaluatorComment: newEvaluation.evaluatorComment,
        evaluationType: newEvaluation.evaluationType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evaluator: user || undefined
      }
      
      queryClient.setQueryData(
        ["task-evaluations", newEvaluation.taskId],
        (old: TaskEvaluation[] = []) => [...old, optimisticEvaluation]
      )
      
      // Return a context object with the snapshotted value
      return { previousEvaluations, optimisticEvaluation }
    },
    onSuccess: (evaluation, variables) => {
      toast.success("Đánh giá nhiệm vụ thành công!")
      const invalidatePromises = [
        queryClient.invalidateQueries({ queryKey: ["task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["reports"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["my-task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["evaluable-tasks"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: 'all' }),
        // Invalidate all user-details queries to force refetch getUserDetails
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "user-details"], refetchType: 'all' }),
      ]
      
      // Execute all invalidations
      Promise.all(invalidatePromises).then(() => {
        // Force refetch active queries to ensure immediate UI update
        queryClient.refetchQueries({ type: "active" })
      })
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context && typeof context === 'object' && context !== null && 'previousEvaluations' in context) {
        queryClient.setQueryData(
          ["task-evaluations", variables.taskId],
          (context as any).previousEvaluations
        )
      }
      handleError(error, "Không thể đánh giá nhiệm vụ")
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ["task-evaluations"] })
    },
    retry: 1,
  })
}

export function useUpdateTaskEvaluation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useApiMutation<TaskEvaluation, { evaluationId: string; data: UpdateEvaluationDto }, Error>({
    mutationFn: async ({ evaluationId, data }) =>  await TaskEvaluationsService.updateTaskEvaluation(evaluationId, data),
    onMutate: async ({ evaluationId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task-evaluations"] })
      await queryClient.cancelQueries({ queryKey: ["reports"] })
      await queryClient.cancelQueries({ queryKey: ["hierarchy"] })
      
      // Find and update the evaluation optimistically
      const queryKeys = queryClient.getQueryCache().findAll({ queryKey: ["task-evaluations"] })
      
      queryKeys.forEach(query => {
        const evaluations = query.state.data as TaskEvaluation[] | undefined
        if (evaluations) {
          const updatedEvaluations = evaluations.map(evalItem => 
            evalItem.id === evaluationId 
              ? { 
                  ...evalItem, 
                  ...data,
                  updatedAt: new Date().toISOString() 
                }
              : evalItem
          )
          queryClient.setQueryData(query.queryKey, updatedEvaluations)
        }
      })
      
      return { evaluationId }
    },
    onSuccess: (evaluation, variables) => {
      toast.success("Cập nhật đánh giá thành công!")
      
      // Immediately invalidate and refetch all related queries
      const invalidatePromises = [
        queryClient.invalidateQueries({ queryKey: ["task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["reports"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["my-task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["evaluable-tasks"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "user-details"], refetchType: 'all' }),
      ]
      
      Promise.all(invalidatePromises).then(() => {
        queryClient.refetchQueries({ type: "active" })
      })
    },
    onError: (error, variables, context) => {
      handleError(error, "Không thể cập nhật đánh giá")
      // Rollback will be handled by invalidating queries
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task-evaluations"] })
    },
    retry: 1,
  })
}

export function useDeleteTaskEvaluation() {
  const queryClient = useQueryClient()
  
  return useApiMutation<{ message: string }, string, Error>({
    mutationFn: async (evaluationId: string) =>  await TaskEvaluationsService.deleteTaskEvaluation(evaluationId),
    onMutate: async (evaluationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["task-evaluations"] })
      await queryClient.cancelQueries({ queryKey: ["reports"] })
      await queryClient.cancelQueries({ queryKey: ["hierarchy"] })
      
      // Optimistically remove the evaluation from all relevant queries
      const queryKeys = queryClient.getQueryCache().findAll({ queryKey: ["task-evaluations"] })
      const previousData: { queryKey: any[], data: any }[] = []
      
      queryKeys.forEach(query => {
        const evaluations = query.state.data as TaskEvaluation[] | undefined
        if (evaluations) {
          previousData.push({ queryKey: [...query.queryKey], data: evaluations })
          const updatedEvaluations = evaluations.filter(evalItem => evalItem.id !== evaluationId)
          queryClient.setQueryData(query.queryKey, updatedEvaluations)
        }
      })
      
      return { previousData, evaluationId }
    },
    onSuccess: (result, evaluationId) => {
      toast.success("Xóa đánh giá thành công!")
      
      // Immediately invalidate and refetch all related queries
      const invalidatePromises = [
        queryClient.invalidateQueries({ queryKey: ["task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["reports"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["my-task-evaluations"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["evaluable-tasks"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "manager-reports"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy", "user-details"], refetchType: 'all' }),
      ]
      
      Promise.all(invalidatePromises).then(() => {
        queryClient.refetchQueries({ type: "active" })
      })
    },
    onError: (error, evaluationId, context) => {
      // Rollback optimistic updates
      if (context && typeof context === 'object' && context !== null && 'previousData' in context) {
        const typedContext = context as { previousData: { queryKey: any[], data: any }[] }
        typedContext.previousData.forEach(({ queryKey, data }: { queryKey: any[], data: any }) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      handleError(error, "Không thể xóa đánh giá")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task-evaluations"] })
    },
    retry: 1,
  })
}

export function useTaskEvaluations(taskId: string) {
  return useApiQuery<TaskEvaluation[], Error>({
    queryKey: ["task-evaluations", taskId],
    queryFn: async () => await TaskEvaluationsService.getTaskEvaluations(taskId),
    enabled: !!taskId,
    staleTime: 0, // Always consider stale to ensure fresh data
    gcTime: 1 * 60 * 1000, // Keep in cache for only 1 minute
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchOnMount: true, // Always refetch on mount
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
    staleTime: 0, // Always consider stale
    gcTime: 1 * 60 * 1000, // Keep in cache for only 1 minute
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchOnMount: true, // Always refetch on mount
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
    staleTime: 0, // Always consider stale
    gcTime: 1 * 60 * 1000, // Keep in cache for only 1 minute
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchOnMount: true, // Always refetch on mount
    throwOnError: false,
  })
}