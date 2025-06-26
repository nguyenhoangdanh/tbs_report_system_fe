'use client'

import { memo, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FileText, TrendingDown, BarChart3 } from 'lucide-react'
import type { IncompleteReasonData } from '@/services/statistics.service'

interface IncompleteReasonsDialogProps {
  title: string
  period: string
  reasons: IncompleteReasonData[]
  totalIncomplete: number
  totalTasks: number
  children: React.ReactNode
  icon?: React.ReactNode
  color?: string
}

const IncompleteReasonsDialog = memo(function IncompleteReasonsDialog({
  title,
  period,
  reasons,
  totalIncomplete,
  totalTasks,
  children,
  icon,
  color = 'text-orange-600'
}: IncompleteReasonsDialogProps) {
  
  const sortedReasons = useMemo(() => {
    return [...reasons].sort((a, b) => b.count - a.count)
  }, [reasons])

  const completionRate = useMemo(() => {
    return totalTasks > 0 ? Math.round(((totalTasks - totalIncomplete) / totalTasks) * 100) : 0
  }, [totalTasks, totalIncomplete])

  if (!reasons.length) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {icon || <TrendingDown className="w-6 h-6 text-orange-500" />}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Summary Section */}
            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Tổng quan - {period}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
                    <div className="text-sm text-muted-foreground">Tổng công việc</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{totalTasks - totalIncomplete}</div>
                    <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{totalIncomplete}</div>
                    <div className="text-sm text-muted-foreground">Chưa hoàn thành</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
                    <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reasons List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Phân tích lý do chưa hoàn thành ({sortedReasons.length} lý do)
              </h3>
              
              {sortedReasons.map((reasonData, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Reason Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              #{index + 1}
                            </Badge>
                            <Badge className={`${
                              reasonData.percentage >= 50 ? 'bg-red-100 text-red-700' :
                              reasonData.percentage >= 25 ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {reasonData.count} lần ({reasonData.percentage}%)
                            </Badge>
                          </div>
                          <h4 className="font-medium text-foreground mb-2">
                            &quot;{reasonData.reason}&quot;
                          </h4>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            reasonData.percentage >= 50 ? 'bg-red-500' :
                            reasonData.percentage >= 25 ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.max(reasonData.percentage, 5)}%` }}
                        />
                      </div>

                      {/* Sample Tasks */}
                      {reasonData.sampleTasks && reasonData.sampleTasks.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Ví dụ công việc ({reasonData.sampleTasks.length}/{reasonData.count}):
                          </div>
                          <div className="space-y-2">
                            {reasonData.sampleTasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">
                                    {task.taskName}
                                  </div>
                                  {task.weekNumber && task.year && (
                                    <div className="text-xs text-muted-foreground">
                                      Tuần {task.weekNumber}/{task.year}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {reasonData.count > reasonData.sampleTasks.length && (
                            <div className="text-xs text-muted-foreground mt-2">
                              + {reasonData.count - reasonData.sampleTasks.length} công việc khác...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Insights */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 Gợi ý cải thiện
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  {sortedReasons.length > 0 && (
                    <div>
                      • <strong>Lý do phổ biến nhất:</strong> &quot;{sortedReasons[0].reason}&quot; 
                      xuất hiện {sortedReasons[0].count} lần ({sortedReasons[0].percentage}%)
                    </div>
                  )}
                  {sortedReasons.length > 1 && (
                    <div>
                      • <strong>Đa dạng lý do:</strong> Có {sortedReasons.length} lý do khác nhau, 
                      cho thấy {sortedReasons.length > 3 ? 'cần phân tích sâu hơn' : 'tương đối tập trung'}
                    </div>
                  )}
                  <div>
                    • <strong>Khuyến nghị:</strong> Tập trung giải quyết {Math.min(3, sortedReasons.length)} lý do hàng đầu 
                    để cải thiện hiệu quả công việc
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
})

IncompleteReasonsDialog.displayName = 'IncompleteReasonsDialog'

export { IncompleteReasonsDialog }
