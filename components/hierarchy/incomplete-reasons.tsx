"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock } from 'lucide-react'
import { safeString, safeNumber, safeArray } from "@/utils/type-guards"

interface IncompleteReasonsProps {
  reasons: any[]
}

export const IncompleteReasons = memo(function IncompleteReasons({ reasons }: IncompleteReasonsProps) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h6 className="flex items-center gap-2 text-sm font-medium">
        <Clock className="w-4 h-4 text-destructive" />
        Lý do chưa hoàn thành
      </h6>
      <div className="space-y-2">
        {reasons.map((reason: any, index: number) => {
          const reasonText = safeString(reason?.reason, "Không có lý do")
          const reasonCount = safeNumber(reason?.count, 0)
          const reasonTasks = safeArray(reason?.tasks, [])

          return (
            <div key={index} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-destructive">{reasonText}</span>
                <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                  {reasonCount} task
                </Badge>
              </div>
              <div className="text-sm text-destructive/80">
                <strong>Tasks:</strong> {reasonTasks.join(", ") || "Không có task"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
