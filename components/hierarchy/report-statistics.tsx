"use client"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle2, Clock, BarChart3 } from 'lucide-react'
import { safeNumber } from "@/utils/type-guards"

interface ReportStatisticsProps {
    stats: any
    report: any
}

export const ReportStatistics = memo(function ReportStatistics({ stats, report }: ReportStatisticsProps) {
    const totalTasks = safeNumber(stats?.totalTasks, 0)
    const completedTasks = safeNumber(stats?.completedTasks, 0)
    const incompleteTasks = safeNumber(stats?.incompleteTasks, 0)
    const tasksByDay = stats?.tasksByDay || {}

    const statsData = [
        {
            title: "Tổng CV",
            value: totalTasks,
            icon: Target,
            color: "text-foreground",
            bgColor: "bg-muted/50",
            description: "Được giao",
        },
        {
            title: "Hoàn thành",
            value: completedTasks,
            icon: CheckCircle2,
            color: "text-primary",
            bgColor: "bg-primary/5",
            description: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
        },
        {
            title: "Chưa hoàn thành",
            value: incompleteTasks,
            icon: Clock,
            color: "text-destructive",
            bgColor: "bg-destructive/5",
            description: `${totalTasks > 0 ? Math.round((incompleteTasks / totalTasks) * 100) : 0}%`,
        },
        {
            title: "Ngày làm việc",
            value: tasksByDay ? Object.values(tasksByDay).filter((count: any) => safeNumber(count, 0) > 0).length : 0,
            icon: BarChart3,
            color: "text-foreground",
            bgColor: "bg-muted/50",
            description: "Có công việc",
        },
    ]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statsData.map((stat) => (
                    <div key={stat.title} className={`p-3 rounded-lg border ${stat.bgColor}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                        </div>
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.description}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-2">Trạng thái</div>
                    <Badge variant={report?.isCompleted ? "default" : "secondary"} className="text-xs">
                        {report?.isCompleted ? "Hoàn thành" : "Chưa hoàn thành"}
                    </Badge>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-2">Khóa báo cáo</div>
                    <Badge variant={report?.isLocked ? "destructive" : "outline"} className="text-xs">
                        {report?.isLocked ? "Đã khóa" : "Có thể sửa"}
                    </Badge>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-2">Cập nhật</div>
                    <div className="text-xs font-medium">
                        {report?.updatedAt ? new Date(report.updatedAt).toLocaleDateString("vi-VN") : "N/A"}
                    </div>
                </div>
            </div>
        </div>
    )
})
