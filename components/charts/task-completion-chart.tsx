"use client"

import { useMemo } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'

interface TaskCompletionChartProps {
  data: any[]
  type: 'bar' | 'line' | 'pie'
  title: string
  height?: number
  className?: string
}

export function TaskCompletionChart({ 
  data, 
  type, 
  title, 
  height = 300, 
  className 
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
      text: isDark ? '#f9fafb' : '#111827',
      grid: isDark ? '#374151' : '#e5e7eb',
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value}
              {item.name.includes('Tỷ lệ') ? '%' : ''}
            </p>
          ))}
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
      name: item.name || item.week || `Item ${data.indexOf(item) + 1}`
    }))
  }, [data])

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <div className="text-lg mb-2">📊</div>
            <p>Không có dữ liệu để hiển thị</p>
          </div>
        </div>
      )
    }

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
              />
              <YAxis 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="completed" 
                fill={colors.secondary} 
                name="Hoàn thành" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="uncompleted" 
                fill={colors.danger} 
                name="Chưa hoàn thành" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
              />
              <YAxis 
                tick={{ fill: colors.text, fontSize: 12 }}
                axisLine={{ stroke: colors.grid }}
                tickLine={{ stroke: colors.grid }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
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
      
      case 'pie': {
        // Transform data for pie chart
        const pieData = [
          { name: 'Hoàn thành', value: chartData.reduce((sum, item) => sum + item.completed, 0) },
          { name: 'Chưa hoàn thành', value: chartData.reduce((sum, item) => sum + item.uncompleted, 0) }
        ].filter(item => item.value > 0)

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(height * 0.35, 120)}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors.pieColors[index % colors.pieColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      }
      
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-6">
        {renderChart()}
      </CardContent>
    </Card>
  )
}
