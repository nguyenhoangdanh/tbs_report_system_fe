"use client"

import { useState, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Check, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type WeeklyReport, type TaskEvaluation, EvaluationType, type Task } from "@/types"
import { getWorkWeekRange } from "@/utils/week-utils"
import {
  useCreateTaskEvaluation,
  useUpdateTaskEvaluation,
  useDeleteTaskEvaluation,
} from "@/hooks/use-task-evaluation"
import { useAuth } from "@/components/providers/auth-provider"
import { useApproveTask, useRejectTask } from "@/hooks/use-reports"
import { toast } from "react-toast-kit"
import { useQueryClient } from "@tanstack/react-query"
import { ConvertEvaluationTypeToVietNamese, exportToExcel } from "@/utils"
import { Badge } from "../ui/badge"
import { QUERY_KEYS } from "@/hooks/query-key"
import { hierarchyStoreActions } from '@/store/hierarchy-store'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { EvaluationForm } from '../admin/evaluation-form'
import { z } from 'zod'

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

  // ✅ FIXED: Use the ORIGINAL AdminOverviewStore interface
  const { setEvaluationModal } = useAdminOverviewStore()

  // Remove local state for evaluation modal
  // const [openEvalModal, setOpenEvalModal] = useState(false)
  // const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  // const [editEvaluation, setEditEvaluation] = useState<TaskEvaluation | null>(null)

  // Remove form setup since it's now in EvaluationForm
  // const form = useForm<EvaluationFormData>({...})

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

  // ✅ FIXED: Use the correct setEvaluationModal signature
  const handleOpenEval = useCallback((task: Task) => {
    const myEval = task.evaluations?.find((ev: TaskEvaluation) => ev.evaluatorId === currentUser?.id) || null
    
    // Create ManagerReportsEmployee-compatible object for the report user
    const employeeForModal: ManagerReportsEmployee = {
      user: user, // Pass the report user
      stats: {
        hasReport: true,
        isCompleted: task.isCompleted,
        totalTasks: 1,
        completedTasks: task.isCompleted ? 1 : 0,
        taskCompletionRate: task.isCompleted ? 100 : 0
      }
    }
    
    // ✅ FIXED: Use the ORIGINAL setEvaluationModal signature
    setEvaluationModal(true, employeeForModal, task, myEval)
  }, [currentUser?.id, user, setEvaluationModal])

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

      {/* ✅ REPLACED: Use EvaluationForm component instead of custom dialog */}
      <EvaluationForm />

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
