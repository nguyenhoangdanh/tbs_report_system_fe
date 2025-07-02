"use client"

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface WeeklyTrendsChartProps {
  data: Array<{
    week: string
    completionRate: number
    totalTasks: number
    completedTasks: number
  }>
  className?: string
}

export const WeeklyTrendsChart = memo(({ data, className }: WeeklyTrendsChartProps) => {
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
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.gradient.start} />
                <stop offset="95%" stopColor={colors.gradient.end} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: colors.text, fontSize: 12 }}
              axisLine={{ stroke: colors.grid }}
              tickLine={{ stroke: colors.grid }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fill: colors.text, fontSize: 12 }}
              axisLine={{ stroke: colors.grid }}
              tickLine={{ stroke: colors.grid }}
              label={{ 
                value: 'Tỷ lệ (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: colors.text }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: '12px',
                color: colors.text 
              }}
            />
            <Area
              type="monotone"
              dataKey="completionRate"
              stroke={colors.primary}
              strokeWidth={3}
              fill="url(#colorCompletion)"
              dot={{ r: 6, fill: colors.primary, strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 8, fill: colors.secondary, strokeWidth: 2, stroke: '#ffffff' }}
              name="Tỷ lệ hoàn thành (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

WeeklyTrendsChart.displayName = 'WeeklyTrendsChart'
