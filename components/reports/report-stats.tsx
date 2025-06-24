'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { TaskReport } from '@/types'

interface ReportStatsProps {
  tasks: TaskReport[]
}

export const ReportStats = memo(function ReportStats({ tasks }: ReportStatsProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.isCompleted).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate weekly activity
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const weeklyActivity = dayKeys.map(day => {
    const activeTasks = tasks.filter(task => task[day as keyof TaskReport])
    return activeTasks.length
  })

  const maxActivity = Math.max(...weeklyActivity, 1)

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Thống kê tuần</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-sm text-muted-foreground">Tổng công việc</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalTasks - completedTasks}</div>
            <div className="text-sm text-muted-foreground">Chưa hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="space-y-3 gap-4 flex flex-col">
          <h4 className="font-medium text-sm">Hoạt động trong tuần</h4>
          <div className="flex items-end gap-2 h-20">
            {weeklyActivity.map((count, index) => {
              const height = (count / maxActivity) * 100
              const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gray-200 rounded-sm overflow-hidden" style={{ height: '60px' }}>
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0px' }}
                    />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">{dayNames[index]}</div>
                  <div className="text-xs text-muted-foreground">{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
