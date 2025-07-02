"use client"

import React, { memo, useMemo } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'

interface IncompleteReasonsChartProps {
  data: Array<{
    reason: string
    count: number
    percentage: number
  }>
  type?: 'pie' | 'bar' | 'doughnut'
  title?: string
  height?: number
  className?: string
}

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
]

export const IncompleteReasonsChart = memo(({ 
  data, 
  type = 'pie', 
  title = 'Lý do chưa hoàn thành',
  height = 400,
  className 
}: IncompleteReasonsChartProps) => {
  const { theme } = useTheme()

  // Colors for light/dark mode
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      text: isDark ? '#f8fafc' : '#1e293b',
      grid: isDark ? '#475569' : '#e2e8f0',
      background: isDark ? '#1e293b' : '#ffffff',
      pieColors: COLORS.map(color => 
        isDark ? `${color}dd` : color
      )
    }
  }, [theme])

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((item, index) => ({
      name: item.reason.length > 20 ? item.reason.substring(0, 20) + '...' : item.reason,
      fullName: item.reason,
      value: item.count,
      percentage: item.percentage,
      fill: colors.pieColors[index % colors.pieColors.length]
    }))
  }, [data, colors.pieColors])

  // Custom tooltip with enhanced styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[200px]">
          <p className="font-semibold text-foreground mb-2">{data.payload.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Số lượng:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{data.value}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Tỷ lệ:</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{data.payload.percentage}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom label for pie chart
  const renderLabel = ({ percentage, name }: any) => {
    return percentage > 5 ? `${name}: ${percentage}%` : ''
  }

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="font-medium">Không có dữ liệu lý do chưa hoàn thành</p>
            <p className="text-sm">Hãy kiểm tra lại tuần/tháng đã chọn</p>
          </div>
        </div>
      )
    }

    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
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

      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={Math.min(height * 0.35, 120)}
                innerRadius={Math.min(height * 0.2, 60)}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
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
                dataKey="value" 
                name="Số lượng lỗi"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className={`${className} border-0 shadow-sm bg-gradient-to-br from-background to-muted/20`}>
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {renderChart()}
      </CardContent>
    </Card>
  )
})

IncompleteReasonsChart.displayName = 'IncompleteReasonsChart'
