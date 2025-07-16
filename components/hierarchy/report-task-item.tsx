"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock } from 'lucide-react'
import { safeString } from "@/utils/type-guards"

interface ReportTaskItemProps {
  task: any
  index: number
}

const getDayName = (day: string) => {
  const dayNames: Record<string, string> = {
    friday: "Thứ 6",
    saturday: "Thứ 7",
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
  }
  return dayNames[day] || day
}

export const ReportTaskItem = memo(function ReportTaskItem({ task, index }: ReportTaskItemProps) {
  const taskId = safeString(task?.id, `task-${index}`)
  const taskName = safeString(task?.taskName, "Công việc không xác định")
  const isCompleted = Boolean(task?.isCompleted)
  const reasonNotDone = safeString(task?.reasonNotDone, "")
  const updatedAt = safeString(task?.updatedAt, new Date().toISOString())

  return (
    <div className="p-3 border rounded-lg hover:bg-muted/30 transition-colors bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h5 className="font-medium mb-2 text-sm">{taskName}</h5>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Hoàn thành
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Chưa hoàn thành
                </>
              )}
            </Badge>
            {!isCompleted && reasonNotDone && (
              <Badge variant="outline" className="text-xs">
                Lý do: {reasonNotDone}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{new Date(updatedAt).toLocaleDateString("vi-VN")}</div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1">
        {["friday", "saturday", "monday", "tuesday", "wednesday", "thursday"].map((day) => (
          <div
            key={day}
            className={`text-center p-1 rounded text-xs border ${task?.[day]
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted/50 text-muted-foreground border-border"
              }`}
          >
            {getDayName(day)}
          </div>
        ))}
      </div>
    </div>
  )
})
