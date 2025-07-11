"use client"

import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Users, FileText } from 'lucide-react'

interface IncompleteReason {
  reason: string
  count: number
  affectedUsers?: number
  percentage: number
  sampleTasks?: Array<{
    taskName: string
    userName?: string
    department?: string
    office?: string
  }>
}

interface IncompleteReasonsChartProps {
  data: IncompleteReason[]
  title?: string
  showDetails?: boolean
  maxItems?: number
  className?: string
}

export const IncompleteReasonsChart = memo(({ 
  data, 
  title = 'Lý do chưa hoàn thành',
  showDetails = true,
  maxItems = 10,
  className = '' 
}: IncompleteReasonsChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            Không có dữ liệu về lý do chưa hoàn thành
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayData = data.slice(0, maxItems)
  const totalCount = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {title}
          <Badge variant="outline" className="ml-auto">
            {totalCount} tasks
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayData.map((item, index) => (
            <div key={index} className="space-y-2">
              {/* Reason Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}. {item.reason}
                  </span>
                  {item.affectedUsers && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {item.affectedUsers} người
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Sample Tasks */}
              {showDetails && item.sampleTasks && item.sampleTasks.length > 0 && (
                <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Ví dụ một số task:
                  </div>
                  <div className="space-y-1">
                    {item.sampleTasks.slice(0, 3).map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                          {task.taskName}
                        </span>
                        {task.userName && (
                          <span className="text-gray-500 text-xs">
                            - {task.userName}
                          </span>
                        )}
                        {task.department && (
                          <Badge variant="outline" className="text-xs">
                            {task.department}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {item.sampleTasks.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        ... và {item.sampleTasks.length - 3} task khác
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {data.length > maxItems && (
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">
                Còn {data.length - maxItems} lý do khác...
              </span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Loại lý do khác nhau
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tổng tasks chưa hoàn thành
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

IncompleteReasonsChart.displayName = 'IncompleteReasonsChart'
