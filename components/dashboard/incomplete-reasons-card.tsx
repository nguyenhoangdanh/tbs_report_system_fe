'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import type { IncompleteReasonData } from '@/services/statistics.service'

interface IncompleteReasonsCardProps {
  title: string
  reasons: IncompleteReasonData[]
  totalIncomplete: number
  period: string
  icon?: React.ReactNode
  color?: string
}

export const IncompleteReasonsCard = memo(function IncompleteReasonsCard({
  title,
  reasons,
  totalIncomplete,
  period,
  icon,
  color = 'text-orange-600'
}: IncompleteReasonsCardProps) {
  if (totalIncomplete === 0 || reasons.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              {icon || <Clock className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <CardTitle className="text-lg text-green-800 dark:text-green-200">{title}</CardTitle>
              <p className="text-sm text-green-600 dark:text-green-400">{period}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-green-600 mb-2">🎉</div>
            <p className="text-green-700 dark:text-green-300 font-medium">
              Tất cả công việc đã hoàn thành!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Không có công việc nào chưa hoàn thành trong {period.toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Limit to top 5 reasons for display
  const displayReasons = reasons.slice(0, 5)

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              {icon || <AlertTriangle className="w-5 h-5 text-orange-600" />}
            </div>
            <div>
              <CardTitle className={`text-lg ${color}`}>{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{period}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-100">
            {totalIncomplete} chưa xong
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Top {displayReasons.length} lý do phổ biến nhất:
          </div>
          
          <div className="space-y-3">
            {displayReasons.map((reason, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      #{index + 1}
                    </Badge>
                    <p className="text-sm font-medium text-foreground truncate">
                      {reason.reason}
                    </p>
                  </div>
                  
                  {reason.sampleTasks && reason.sampleTasks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Ví dụ:</p>
                      <div className="space-y-1">
                        {reason.sampleTasks.slice(0, 2).map((task, taskIndex) => (
                          <p key={taskIndex} className="text-xs text-muted-foreground italic pl-2 border-l-2 border-orange-200">
                            &quot;{task.taskName}&quot;
                          </p>
                        ))}
                        {reason.sampleTasks.length > 2 && (
                          <p className="text-xs text-muted-foreground pl-2">
                            ... và {reason.sampleTasks.length - 2} công việc khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-3">
                  <div className="text-lg font-bold text-orange-600">
                    {reason.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reason.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reasons.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                ... và {reasons.length - 5} lý do khác
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
