"use client"

import { useState, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Check, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type WeeklyReport, type TaskEvaluation, EvaluationType, type Task } from "@/types"
import { getWorkWeekRange } from "@/utils/week-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  useCreateTaskEvaluation,
  useUpdateTaskEvaluation,
  useDeleteTaskEvaluation,
  broadcastEvaluationChange, // ✅ Use simplified version
} from "@/hooks/use-task-evaluation"
import { AnimatedButton } from "../ui/animated-button"
import { useAuth } from "@/components/providers/auth-provider"
import { useApproveTask, useRejectTask } from "@/hooks/use-reports"
import { toast } from "react-toast-kit"
import { useQueryClient } from "@tanstack/react-query"
import { ConvertEvaluationTypeToVietNamese, exportToExcel } from "@/utils"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"

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

interface ReportTemplateProps {
  report: WeeklyReport
  className?: string
  canEvaluation?: boolean
}

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

// Extracted component for evaluation display
const EvaluationDisplay = ({ evaluations, currentUserId }: { evaluations: TaskEvaluation[], currentUserId?: string }) => {
  const sortedEvaluations = useMemo(() => 
    evaluations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [evaluations]
  )

  if (!evaluations.length) {
    return (
      <div className="text-center py-2">
        <span className="text-gray-400 dark:text-gray-500 text-xs">Chưa có đánh giá nào</span>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-w-xs lg:max-w-sm">
      {sortedEvaluations.map((evalItem, evalIndex) => (
        <div
          key={evalItem.id}
          className="break-words border-b last:border-b-0 pb-2 last:pb-0 border-gray-200 dark:border-gray-600"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs mb-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
              {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
            </span>
            <EvaluationTypeBadge type={evalItem.evaluationType} />
          </div>
          <div className="space-y-1">
            {/* <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                Trạng thái:
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  evalItem.evaluatedIsCompleted
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}
              >
                {evalItem.evaluatedIsCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
              </span>
            </div> */}
            {evalItem.evaluatedReasonNotDone && (
              <div className="mt-1">
                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                  Nguyên nhân/Giải pháp:
                </span>
                <p className="text-gray-800 dark:text-gray-200 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs break-words">
                  {evalItem.evaluatedReasonNotDone}
                </p>
              </div>
            )}
            {evalItem.evaluatorComment && (
              <div className="mt-1">
                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">
                  Nhận xét:
                </span>
                <p className="text-gray-800 dark:text-gray-200 mt-1 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs break-words">
                  {evalItem.evaluatorComment}
                </p>
              </div>
            )}
            {evalIndex === 0 ? (
              <div className="text-xs flex items-center justify-between text-gray-400 dark:text-gray-500 bg-blue-400/10 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  (Đánh giá mới nhất)
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Cập nhật: {format(new Date(evalItem.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReportTemplate({ report, className = "", canEvaluation }: ReportTemplateProps) {
  const user = report.user
  const tasks = report.tasks || []
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // State management
  const [openEvalModal, setOpenEvalModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editEvaluation, setEditEvaluation] = useState<TaskEvaluation | null>(null)

  // Hooks for mutations
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
  })

  // Memoized calculations
  const { displayInfo } = useMemo(() => getWorkWeekRange(report.weekNumber, report.year), [report.weekNumber, report.year])
  
  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.isCompleted).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    return { totalTasks, completedTasks, completionRate }
  }, [tasks])

  const dayHeaders = useMemo(() => [
    { key: "friday", label: "Thứ 6", shortLabel: "T6" },
    { key: "saturday", label: "Thứ 7", shortLabel: "T7" },
    { key: "monday", label: "Thứ 2", shortLabel: "T2" },
    { key: "tuesday", label: "Thứ 3", shortLabel: "T3" },
    { key: "wednesday", label: "Thứ 4", shortLabel: "T4" },
    { key: "thursday", label: "Thứ 5", shortLabel: "T5" },
  ], [])

  // Event handlers
  const handleExportToExcel = useCallback(async () => {
    try {
      await exportToExcel(report)
      toast.success("Xuất file Excel thành công!")
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xuất file Excel")
    }
  }, [report])

  const handleOpenEval = useCallback((task: Task) => {
    setSelectedTask(task)
    const myEval = task.evaluations?.find((ev: TaskEvaluation) => ev.evaluatorId === currentUser?.id) || null
    setEditEvaluation(myEval)

    // Reset form with current evaluation data
    form.reset({
      evaluatedIsCompleted: myEval?.evaluatedIsCompleted ?? task.isCompleted,
      evaluatorComment: myEval?.evaluatorComment ?? "",
      evaluationType: myEval?.evaluationType ?? EvaluationType.REVIEW,
    })
    setOpenEvalModal(true)
  }, [currentUser?.id, form]
  )

  const handleSubmitEval = useCallback(async (data: EvaluationFormData) => {
    if (!selectedTask) return

    try {
      const originalIsCompleted = selectedTask.isCompleted

      console.log('🔄 ReportTemplate: Starting evaluation submission...', {
        taskId: selectedTask.id,
        data,
        isUpdate: !!editEvaluation
      })

      // ✅ STEP 1: Preemptively remove admin-overview cache
      await Promise.all([
        queryClient.removeQueries({ queryKey: ["admin-overview", "manager-reports"] }),
      ])

      if (editEvaluation) {
        console.log('🔄 ReportTemplate: Updating evaluation:', editEvaluation.id)
        await updateEval.mutateAsync({
          evaluationId: editEvaluation.id,
          data,
        })
        console.log('✅ ReportTemplate: Update evaluation completed')
      } else {
        console.log('🔄 ReportTemplate: Creating new evaluation')
        await createEval.mutateAsync({
          ...data,
          taskId: selectedTask.id,
        })
        console.log('✅ ReportTemplate: Create evaluation completed')
      }

      // ✅ Handle task approval/rejection if manager
      if (currentUser?.isManager && data.evaluatedIsCompleted !== originalIsCompleted) {
        console.log('🔄 ReportTemplate: Manager handling task status change')
        if (data.evaluatedIsCompleted) {
          await approveTask.mutateAsync(selectedTask.id)
          console.log('✅ ReportTemplate: Task approved')
        } else {
          await rejectTask.mutateAsync(selectedTask.id)
          console.log('✅ ReportTemplate: Task rejected')
        }
      }

      console.log('✅ ReportTemplate: All operations completed successfully')
      setOpenEvalModal(false)
      
      // ✅ STEP 2: Force invalidation after success (backup)
      setTimeout(async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['admin-overview', 'manager-reports'],
            refetchType: 'all'
          }),
        ])
      }, 100)
      
    } catch (error) {
      console.error("❌ ReportTemplate: Error submitting evaluation:", error)
      toast.error("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!")
    }
  }, [selectedTask, editEvaluation, updateEval, createEval, currentUser?.isManager, approveTask, rejectTask, queryClient])

  const handleDeleteEval = useCallback(async () => {
    if (!editEvaluation) return

    try {
      console.log('🔄 ReportTemplate: Starting evaluation deletion...', editEvaluation.id)
      
      await deleteEval.mutateAsync(editEvaluation.id)
      
      console.log('✅ ReportTemplate: Delete evaluation completed')
      setOpenEvalModal(false)
    } catch (error) {
      console.error("❌ ReportTemplate: Error deleting evaluation:", error)
      toast.error("Có lỗi xảy ra khi xóa đánh giá. Vui lòng thử lại!")
    }
  }, [editEvaluation, deleteEval])

  const handleCompletionStatusChange = useCallback((value: string) => {
    const isCompleted = value === "true"
    form.setValue("evaluatedIsCompleted", isCompleted)
    form.setValue("evaluationType", isCompleted ? EvaluationType.APPROVAL : EvaluationType.REJECTION)
    if (isCompleted) {
      form.setValue("evaluatorComment", "")
    }
  }, [form])

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header with Logo and Export Button */}
      <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
          <div className="flex-shrink-0">
            <img
              src="/images/logo.png"
              alt="TBS Group Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                target.nextElementSibling!.textContent = "TBS"
              }}
            />
            <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-lg hidden">TBS</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              KQ CÔNG VIỆC CHI TIẾT NGÀY - {displayInfo.weekTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{displayInfo.dateRange}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{displayInfo.workDaysText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
        </div>
      </div>

      {/* Employee Information */}
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                HỌ TÊN:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-medium text-sm sm:text-base">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                CD - VTCV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {user?.jobPosition?.position.name} - {user?.jobPosition?.jobName}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                MSNV:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">
                {user?.employeeCode}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="font-semibold w-full sm:w-32 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                BP/PB/LINE:
              </span>
              <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {user?.jobPosition?.department?.office?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              {/* Table Header */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    STT
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[200px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    KH-KQCV TUẦN
                  </th>
                  {dayHeaders.map((day) => (
                    <th
                      key={day.key}
                      className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs min-w-[40px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30"
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.shortLabel}</span>
                    </th>
                  ))}
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-green-700 dark:text-green-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    YES
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    NO
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    Nguyên nhân - giải pháp
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-w-[150px] sticky top-0 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
                    Đánh giá
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {tasks.map((task, index) => {
                  const myEval = task.evaluations?.find((ev) => ev.evaluatorId === currentUser?.id)
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="break-words">{task.taskName}</div>
                      </td>
                      {dayHeaders.map((day) => (
                        <td
                          key={day.key}
                          className="border border-gray-300 dark:border-gray-600 px-1 sm:px-2 py-2 sm:py-3 text-center"
                        >
                          {task[day.key as keyof typeof task] && (
                            <div className="flex justify-center">
                              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center">
                        {task.isCompleted && (
                          <div className="flex justify-center">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 font-bold" />
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-center">
                        {!task.isCompleted && (
                          <div className="flex justify-center">
                            <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 font-bold" />
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="break-words max-w-xs">{task.reasonNotDone}</div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {task?.evaluations && task?.evaluations.length > 0 ? (
                          <EvaluationDisplay 
                            evaluations={task.evaluations} 
                            currentUserId={currentUser?.id} 
                          />
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">Chưa có đánh giá nào</span>
                          </div>
                        )}

                        {canEvaluation && (
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full text-xs ${
                                myEval
                                  ? "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                                  : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                              }`}
                              onClick={() => handleOpenEval(task)}
                            >
                              {myEval ? "Chỉnh sửa đánh giá" : "Đánh giá"}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      <Dialog open={openEvalModal} onOpenChange={setOpenEvalModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editEvaluation ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá công việc"}
            </DialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Công việc:</span> {selectedTask?.taskName}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form đánh giá */}
            <div className="space-y-4">
              {editEvaluation && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-orange-800">
                      Đánh giá hiện tại của bạn:
                    </span>
                    <EvaluationTypeBadge type={editEvaluation.evaluationType} />
                  </div>
                  <div className="space-y-2 text-sm">
                    {editEvaluation.evaluatorComment && (
                      <div>
                        <span className="font-medium">Nhận xét:</span>
                        <p className="bg-white p-2 rounded mt-1">{editEvaluation.evaluatorComment}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Cập nhật: {format(new Date(editEvaluation.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </div>
                  </div>
                </div>
              )}

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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" type="button" onClick={() => setOpenEvalModal(false)}>
                      Hủy
                    </Button>
                    {editEvaluation && (
                      <Button variant="destructive" type="button" onClick={handleDeleteEval} disabled={deleteEval.isPending}>
                        Xóa đánh giá
                      </Button>
                    )}
                    <AnimatedButton
                      type="submit"
                      loading={createEval.isPending || updateEval.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {editEvaluation ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                    </AnimatedButton>
                  </div>
                </form>
              </Form>
            </div>

            {/* Danh sách đánh giá khác để tham khảo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {`Đánh giá khác để tham khảo (${selectedTask?.evaluations?.filter((ev) => ev.evaluatorId !== currentUser?.id).length || 0})`}
              </h3>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {selectedTask?.evaluations && selectedTask.evaluations.length > 0 ? (
                  selectedTask.evaluations
                    .filter((evalItem) => evalItem.evaluatorId !== currentUser?.id)
                    .map((evalItem) => (
                      <div key={evalItem.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
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

      {/* Summary Section */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-yellow-200 dark:border-yellow-700">
            <div className="text-center font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
              SỐ ĐẦU VIỆC HOÀN THÀNH/CHƯA HOÀN THÀNH
            </div>
            <div className="flex justify-center items-center gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedTasks}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Hoàn thành</div>
              </div>
              <div className="text-xl sm:text-2xl text-gray-400">/</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.totalTasks - stats.completedTasks}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chưa hoàn thành</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md border border-blue-200 dark:border-blue-700">
            <div className="text-center font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
              (%) KẾT QUẢ CÔNG VIỆC HOÀN THÀNH
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">{stats.completionRate}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
