"use client"

import { memo } from "react"
import { FileText } from 'lucide-react'
import { useReportDetailsForAdmin } from "@/hooks/use-hierarchy"
import { IncompleteReasons } from "./incomplete-reasons"
import { ReportTaskItem } from "./report-task-item"
import { ScreenLoading } from "../loading/screen-loading"

interface ExpandedReportDetailsProps {
    userId: string
    reportId: string
}

export const ExpandedReportDetails = memo(function ExpandedReportDetails({
    userId,
    reportId,
}: ExpandedReportDetailsProps) {
    const { data: reportData, isLoading, error } = useReportDetailsForAdmin(userId, reportId)

    return (
        <div className="mt-4 border-t pt-4">
            <div className="space-y-4">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <ScreenLoading size="sm" variant="dual-ring" fullScreen backdrop text="Đang tải chi tiết..." />
                    </div>
                )}

                {error && (
                    <div className="text-center py-6 text-destructive text-sm bg-destructive/5 rounded-lg border border-destructive/20">
                        Không thể tải chi tiết báo cáo
                    </div>
                )}

                {reportData && (
                    <>
                        {Array.isArray(reportData.report?.tasks) && reportData.report.tasks.length > 0 ? (
                            <div className="space-y-3">
                                <h6 className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Danh sách công việc ({reportData.report.tasks.length})
                                </h6>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {reportData.report.tasks.map((task: any, index: number) => (
                                        <ReportTaskItem key={task?.id || index} task={task} index={index} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Không có công việc nào trong báo cáo này</p>
                            </div>
                        )}

                        <IncompleteReasons reasons={reportData.stats?.incompleteReasons || []} />
                    </>
                )}
            </div>
        </div>
    )
})
