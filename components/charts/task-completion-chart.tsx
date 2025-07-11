"use client"

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useTheme } from 'next-themes'

interface TaskCompletionData {
  name: string
  completed: number
  uncompleted: number
  total: number
  completionRate: number
}

interface TaskCompletionChartProps {
  data: TaskCompletionData[]
  type?: 'bar' | 'line' | 'pie'
  height?: number
  title?: string
}

export function TaskCompletionChart({ 
  data, 
  type = 'bar', 
  height = 300,
  title 
}: TaskCompletionChartProps) {
  const { theme } = useTheme()
  
  // Colors for light/dark mode
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      primary: isDark ? '#60a5fa' : '#3b82f6',
      secondary: isDark ? '#34d399' : '#10b981',
      danger: isDark ? '#f87171' : '#ef4444',
      warning: isDark ? '#fbbf24' : '#f59e0b',
      text: isDark ? '#f8fafc' : '#1e293b',
      grid: isDark ? '#475569' : '#e2e8f0',
      pieColors: [
        isDark ? '#60a5fa' : '#3b82f6',
        isDark ? '#34d399' : '#10b981',
        isDark ? '#f87171' : '#ef4444',
        isDark ? '#fbbf24' : '#f59e0b',
        isDark ? '#a78bfa' : '#8b5cf6',
        isDark ? '#fb7185' : '#ec4899',
      ]
    }
  }, [theme])

  // Custom tooltip with enhanced styling - Fix type compatibility
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[200px]">
          <p className="font-semibold text-foreground mb-3">{String(label)}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
                <span className="text-muted-foreground">Hoàn thành:</span>
              </div>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {data?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600" />
                <span className="text-muted-foreground">Chưa hoàn thành:</span>
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">
                {data?.uncompleted || 0}
              </span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tỷ lệ:</span>
                <span className="font-bold text-foreground">{data?.completionRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(item => ({
      ...item,
      completionRate: item.completionRate || 0,
      completed: item.completed || 0,
      uncompleted: item.uncompleted || 0,
      name: item.name || `Item ${data.indexOf(item) + 1}`
    }))
  }, [data])

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="font-medium">Không có dữ liệu để hiển thị</p>
            <p className="text-sm">Hãy kiểm tra lại bộ lọc đã chọn</p>
          </div>
        </div>
      )
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
                label={{ 
                  value: 'Số lượng', 
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
              <Bar 
                dataKey="completed" 
                name="Hoàn thành" 
                fill={colors.secondary} 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="uncompleted" 
                name="Chưa hoàn thành" 
                fill={colors.danger} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke={colors.primary} 
                strokeWidth={3}
                dot={{ r: 6, fill: colors.primary }}
                activeDot={{ r: 8, fill: colors.secondary }}
                name="Tỷ lệ hoàn thành (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: item.name,
          value: item.completionRate,
          fill: colors.pieColors[index % colors.pieColors.length]
        }))
        
        // Fix: Custom label function that matches Recharts PieLabelProps
        const renderCustomLabel = (props: any) => {
          const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
          if (percent < 0.05) return null; // Don't show label if less than 5%
          
          const RADIAN = Math.PI / 180;
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
          const x = cx + radius * Math.cos(-midAngle * RADIAN);
          const y = cy + radius * Math.sin(-midAngle * RADIAN);

          return (
            <text 
              x={x} 
              y={y} 
              fill="white" 
              textAnchor={x > cx ? 'start' : 'end'} 
              dominantBaseline="central"
              fontSize={12}
              fontWeight="bold"
            >
              {`${name}: ${(percent * 100).toFixed(0)}%`}
            </text>
          );
        };
        
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '12px',
                  color: colors.text 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`border-0 shadow-sm bg-gradient-to-br from-background to-muted/20`}>
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {renderChart()}
      </CardContent>
    </Card>
  )
}

// Export the component with memo for performance optimization
export const MemoizedTaskCompletionChart = memo(TaskCompletionChart)
export default TaskCompletionChart
