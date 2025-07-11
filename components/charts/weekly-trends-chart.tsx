"use client"

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

interface WeeklyTrendsData {
  weekNumber: number
  year: number
  totalReports: number
  completedReports: number
  totalTasks: number
  completedTasks: number
  taskCompletionRate: number
  reportCompletionRate: number
}

interface WeeklyTrendsChartProps {
  data: WeeklyTrendsData[]
  title?: string
  height?: number
  className?: string
}

export const WeeklyTrendsChart = memo(({ 
  data, 
  title = 'Xu hướng hoàn thành theo tuần',
  height = 300,
  className = '' 
}: WeeklyTrendsChartProps) => {
  const { theme } = useTheme()
  
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      primary: isDark ? '#60a5fa' : '#3b82f6',
      secondary: isDark ? '#34d399' : '#10b981',
      text: isDark ? '#f8fafc' : '#1e293b',
      grid: isDark ? '#475569' : '#e2e8f0',
      gradient: {
        start: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        end: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'
      }
    }
  }, [theme])

  // Calculate trend with better algorithm
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { direction: 'neutral', change: 0 }
    
    const recent = data.slice(-3).map(d => d.completionRate)
    const older = data.slice(0, 3).map(d => d.completionRate)
    
    if (recent.length === 0 || older.length === 0) return { direction: 'neutral', change: 0 }
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const change = recentAvg - olderAvg
    
    return {
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'neutral',
      change: Math.abs(change)
    }
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[200px]">
          <p className="font-semibold text-foreground mb-3">{label}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tỷ lệ hoàn thành:</span>
              <span className="font-bold text-primary">{data.completionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hoàn thành:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {data.completedTasks}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tổng công việc:</span>
              <span className="font-medium text-muted-foreground">
                {data.totalTasks}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card className={`${className} border-0 shadow-sm bg-gradient-to-br from-background to-muted/20`}>
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            Xu hướng hoàn thành theo tuần
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <p className="font-medium">Không có dữ liệu xu hướng</p>
              <p className="text-sm">Dữ liệu xu hướng sẽ hiển thị khi có đủ thông tin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate trend direction
  const firstWeek = data[0]
  const lastWeek = data[data.length - 1]
  const taskTrend = lastWeek.taskCompletionRate - firstWeek.taskCompletionRate
  const reportTrend = lastWeek.reportCompletionRate - firstWeek.reportCompletionRate

  return (
    <Card className={`${className} border-0 shadow-sm bg-gradient-to-br from-background to-muted/20`}>
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            Xu hướng hoàn thành theo tuần
          </CardTitle>
          <div className="flex items-center gap-2">
            {trend.direction === 'up' && (
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{trend.change.toFixed(1)}%
              </Badge>
            )}
            {trend.direction === 'down' && (
              <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                -{trend.change.toFixed(1)}%
              </Badge>
            )}
            {trend.direction === 'neutral' && (
              <Badge variant="secondary" className="bg-slate-500 hover:bg-slate-600 text-white">
                <Minus className="w-3 h-3 mr-1" />
                Ổn định
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(data.reduce((sum, week) => sum + week.taskCompletionRate, 0) / data.length)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Trung bình Task</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(data.reduce((sum, week) => sum + week.reportCompletionRate, 0) / data.length)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Trung bình Báo cáo</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              {taskTrend > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">+{taskTrend.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">{taskTrend.toFixed(1)}%</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Xu hướng Task</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              {reportTrend > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">+{reportTrend.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">{reportTrend.toFixed(1)}%</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Xu hướng Báo cáo</div>
          </div>
        </div>

        {/* Weekly Data */}
        <div className="space-y-3" style={{ maxHeight: height - 150, overflowY: 'auto' }}>
          {data.map((week, index) => (
            <div key={`${week.year}-${week.weekNumber}`} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="min-w-[80px] text-sm font-medium">
                Tuần {week.weekNumber}/{week.year}
              </div>
              
              {/* Task Progress */}
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Tasks: {week.completedTasks}/{week.totalTasks}</span>
                  <span className="font-medium">{week.taskCompletionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${week.taskCompletionRate}%` }}
                  />
                </div>
              </div>

              {/* Report Progress */}
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Báo cáo: {week.completedReports}/{week.totalReports}</span>
                  <span className="font-medium">{week.reportCompletionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${week.reportCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

WeeklyTrendsChart.displayName = 'WeeklyTrendsChart'
