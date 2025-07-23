"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Check, X, Download, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { type WeeklyReport, type TaskEvaluation, EvaluationType, type Task } from "@/types"
import { getWorkWeekRange } from "@/utils/week-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AnimatedButton } from "../ui/animated-button"
import { useAuth } from "@/components/providers/auth-provider"

interface ReportTemplateMobileProps {
    report: WeeklyReport
    className?: string
    canEvaluation?: boolean
    onOpenEval: (task: Task) => void
    openEvalModal: boolean
    setOpenEvalModal: (open: boolean) => void
    selectedTask: Task | null
    editEvaluation: TaskEvaluation | null
    form: EvaluationFormState
    setForm: React.Dispatch<React.SetStateAction<EvaluationFormState>>
    handleSubmitEval: () => Promise<void>
    handleDeleteEval: () => Promise<void>
    createEval: any
    updateEval: any
    deleteEval: any
}

interface EvaluationFormState {
    evaluatedIsCompleted: boolean
    evaluatedReasonNotDone: string
    evaluatorComment: string
    evaluationType: EvaluationType
}

export function ReportTemplateMobile({
    report,
    className = "",
    canEvaluation,
    onOpenEval,
    openEvalModal,
    setOpenEvalModal,
    selectedTask,
    editEvaluation,
    form,
    setForm,
    handleSubmitEval,
    handleDeleteEval,
    createEval,
    updateEval,
    deleteEval,
}: ReportTemplateMobileProps) {
    const user = report.user
    const tasks = report.tasks || []
    const { user: currentUser } = useAuth()

    // Get work week display info
    const { displayInfo } = getWorkWeekRange(report.weekNumber, report.year)

    // Calculate completion stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.isCompleted).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const dayHeaders = [
        { key: "friday", label: "T6" },
        { key: "saturday", label: "T7" },
        { key: "monday", label: "T2" },
        { key: "tuesday", label: "T3" },
        { key: "wednesday", label: "T4" },
        { key: "thursday", label: "T5" },
    ]

    // State for task expansion
    const [expandedTasks, setExpandedTasks] = useState<{ [taskId: string]: boolean }>({})

    const handleToggleExpand = (taskId: string) => {
        setExpandedTasks((prev) => ({
            ...prev,
            [taskId]: !prev[taskId],
        }))
    }

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}>
            {/* Mobile Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                    <img
                        src="/images/logo.png"
                        alt="TBS Group Logo"
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                        }}
                    />
                    <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 min-w-0">
                        KQ CÔNG VIỆC CHI TIẾT NGÀY - {displayInfo.weekTitle}
                    </h1>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{displayInfo.dateRange}</p>
                <Button
                    onClick={() => {
                        /* Export function */
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                >
                    <Download className="w-3 h-3 mr-1" />
                    Xuất Excel
                </Button>
            </div>

            {/* Employee Information - Compact */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-xs space-y-2">
                <div>
                    <span className="font-semibold">HỌ TÊN:</span> {user?.firstName} {user?.lastName}
                </div>
                <div>
                    <span className="font-semibold">MSNV:</span> {user?.employeeCode}
                </div>
                <div>
                    <span className="font-semibold">CD - VTCV:</span> {user?.jobPosition?.position.name} -{" "}
                    {user?.jobPosition?.jobName}
                </div>
                <div>
                    <span className="font-semibold">BP/PB/LINE:</span> {user?.jobPosition?.department?.office?.name}
                </div>
            </div>

            {/* Tasks - Mobile Card Layout */}
            <div className="p-3 space-y-3">
                {tasks.map((task) => {
                    const myEval = task.evaluations?.find((ev) => ev.evaluatorId === currentUser?.id)
                    const isExpanded = expandedTasks[task.id] || false

                    return (
                        <Card key={task.id} className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="p-3 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs px-1 py-0">
                                                #{task.id}
                                            </Badge>
                                            <div className="flex gap-1">
                                                {task.isCompleted ? (
                                                    <Check className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <X className="w-3 h-3 text-red-600" />
                                                )}
                                            </div>
                                        </div>
                                        <CardTitle className="text-sm font-medium leading-tight">{task.taskName}</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleToggleExpand(task.id)}>
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </CardHeader>

                            <Collapsible open={isExpanded} onOpenChange={() => handleToggleExpand(task.id)}>
                                <CollapsibleContent>
                                    <CardContent className="p-3 pt-0 space-y-3">
                                        {/* Work Days */}
                                        <div>
                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ngày làm việc:</div>
                                            <div className="flex gap-1 flex-wrap">
                                                {dayHeaders.map((day) => (
                                                    <Badge
                                                        key={day.key}
                                                        variant={task[day.key as keyof typeof task] ? "default" : "outline"}
                                                        className="text-xs px-2 py-0"
                                                    >
                                                        {day.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        {task.reasonNotDone && (
                                            <div>
                                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nguyên nhân:</div>
                                                <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">{task.reasonNotDone}</div>
                                            </div>
                                        )}

                                        {/* Evaluations */}
                                        {task.evaluations && task.evaluations.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Đánh giá:</div>
                                                <div className="space-y-2">
                                                    {task.evaluations.map((evalItem) => (
                                                        <div key={evalItem.id} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                                    {evalItem.evaluator?.firstName} {evalItem.evaluator?.lastName}
                                                                </span>
                                                                <Badge
                                                                    variant={evalItem.evaluatedIsCompleted ? "default" : "destructive"}
                                                                    className="text-xs px-1 py-0"
                                                                >
                                                                    {evalItem.evaluatedIsCompleted ? "Hoàn thành" : "Chưa HT"}
                                                                </Badge>
                                                            </div>
                                                            {evalItem.evaluatorComment && (
                                                                <div className="text-gray-600 dark:text-gray-300 mt-1">{evalItem.evaluatorComment}</div>
                                                            )}
                                                            <div className="text-gray-400 text-xs mt-1">
                                                                {format(new Date(evalItem.updatedAt), "dd/MM HH:mm", { locale: vi })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Evaluation Button */}
                                        {canEvaluation && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs bg-transparent"
                                                onClick={() => onOpenEval(task)}
                                            >
                                                {myEval ? "Chỉnh sửa đánh giá" : "Đánh giá"}
                                            </Button>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    )
                })}
            </div>

            {/* Summary - Mobile */}
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Hoàn thành</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">{completionRate}%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Tỷ lệ HT</div>
                    </div>
                </div>
            </div>

            {/* Evaluation Modal - Mobile Optimized */}
            <Dialog open={openEvalModal} onOpenChange={setOpenEvalModal}>
                <DialogContent className="w-full h-full max-w-none rounded-none p-0 m-0">
                    <DialogHeader className="p-3 border-b">
                        <DialogTitle className="text-base">
                            {editEvaluation ? "Chỉnh sửa đánh giá" : "Đánh giá công việc"}
                        </DialogTitle>
                        <div className="text-xs text-gray-600 truncate">{selectedTask?.taskName}</div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Trạng thái hoàn thành</label>
                            <select
                                value={form.evaluatedIsCompleted ? "true" : "false"}
                                onChange={(e) => setForm((f) => ({ ...f, evaluatedIsCompleted: e.target.value === "true" }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="true">✅ Hoàn thành</option>
                                <option value="false">❌ Chưa hoàn thành</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Nguyên nhân/Giải pháp</label>
                            <textarea
                                value={form.evaluatedReasonNotDone}
                                onChange={(e) => setForm((f) => ({ ...f, evaluatedReasonNotDone: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Nhập nguyên nhân hoặc giải pháp..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Nhận xét</label>
                            <textarea
                                value={form.evaluatorComment}
                                onChange={(e) => setForm((f) => ({ ...f, evaluatorComment: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Nhập nhận xét..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Loại đánh giá</label>
                            <select
                                value={form.evaluationType}
                                onChange={(e) => setForm((f) => ({ ...f, evaluationType: e.target.value as EvaluationType }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {Object.values(EvaluationType).map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-3 border-t flex gap-2">
                        <Button variant="outline" onClick={() => setOpenEvalModal(false)} className="flex-1">
                            Hủy
                        </Button>
                        {editEvaluation && (
                            <Button variant="destructive" onClick={handleDeleteEval} disabled={deleteEval.isPending}>
                                Xóa
                            </Button>
                        )}
                        <AnimatedButton
                            onClick={handleSubmitEval}
                            loading={createEval.isPending || updateEval.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {editEvaluation ? "Cập nhật" : "Gửi"}
                        </AnimatedButton>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
