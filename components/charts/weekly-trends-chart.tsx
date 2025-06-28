"use client"

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface WeeklyTrendsChartProps {
  data: Array<{
    week: string
    completionRate: number
    totalTasks: number
    completedTasks: number
  }>
  className?: string
}

export function WeeklyTrendsChart({ data, className }: WeeklyTrendsChartProps) {
  const { theme } = useTheme()
  
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      primary: isDark ? '#60a5fa' : '#3b82f6',
      secondary: isDark ? '#34d399' : '#10b981',
      text: isDark ? '#f9fafb' : '#111827',
      grid: isDark ? '#374151' : '#e5e7eb',
      gradient: {
        start: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        end: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'
      }
    }
  }, [theme])

  // Calculate trend
  const trend = useMemo(() => {
    if (!data || data.length < 2) return { direction: 'neutral', change: 0 }
    
    const recent = data.slice(-3).map(d => d.completionRate)
    const older = data.slice(-6, -3).map(d => d.completionRate)
    
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
        <div className="bg-background border border-border rounded-lg shadow-lg p-4">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p style={{ color: payload[0].color }}>
              Tỷ lệ hoàn thành: {data.completionRate}%
            </p>
            <p className="text-muted-foreground">
              Hoàn thành: {data.completedTasks}/{data.totalTasks}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Xu hướng hoàn thành theo tuần</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-6">
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg mb-2">📈</div>
              <p>Không có dữ liệu xu hướng</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Xu hướng hoàn thành theo tuần</CardTitle>
          <div className="flex items-center gap-2">
            {trend.direction === 'up' && (
              <Badge variant="default" className="bg-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{trend.change.toFixed(1)}%
              </Badge>
            )}
            {trend.direction === 'down' && (
              <Badge variant="destructive">
                <TrendingDown className="w-3 h-3 mr-1" />
                -{trend.change.toFixed(1)}%
              </Badge>
            )}
            {trend.direction === 'neutral' && (
              <Badge variant="secondary">Ổn định</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-6">
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="completionRate"
              stroke={colors.primary}
              strokeWidth={3}
              fill="url(#colorCompletion)"
              dot={{ r: 6, fill: colors.primary }}
              activeDot={{ r: 8, fill: colors.secondary }}
              name="Tỷ lệ hoàn thành (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
