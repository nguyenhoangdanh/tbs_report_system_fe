"use client"

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'

interface IncompleteReasonsChartProps {
  data: Array<{
    reason: string
    count: number
    percentage: number
  }>
  type?: 'pie' | 'bar'
  className?: string
}

export function IncompleteReasonsChart({ 
  data, 
  type = 'pie', 
  className 
}: IncompleteReasonsChartProps) {
  const { theme } = useTheme()
  
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      text: isDark ? '#f9fafb' : '#111827',
      grid: isDark ? '#374151' : '#e5e7eb',
      pieColors: [
        isDark ? '#ef4444' : '#dc2626',    // Red
        isDark ? '#f59e0b' : '#d97706',    // Orange  
        isDark ? '#eab308' : '#ca8a04',    // Yellow
        isDark ? '#84cc16' : '#65a30d',    // Lime
        isDark ? '#06b6d4' : '#0891b2',    // Cyan
        isDark ? '#8b5cf6' : '#7c3aed',    // Violet
        isDark ? '#ec4899' : '#db2777',    // Pink
        isDark ? '#6b7280' : '#4b5563',    // Gray
      ]
    }
  }, [theme])

  // Process data - limit and group others
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const topReasons = data.slice(0, 6) // Top 6 reasons
    const others = data.slice(6)
    
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.count, 0)
      const othersPercentage = others.reduce((sum, item) => sum + item.percentage, 0)
      
      return [
        ...topReasons,
        {
          reason: 'Khác',
          count: othersTotal,
          percentage: othersPercentage
        }
      ]
    }
    
    return topReasons
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-medium text-foreground mb-1">{data.reason}</p>
          <p className="text-sm text-muted-foreground">
            Số lần: {data.count} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <div className="text-center">
            <div className="text-lg mb-2">📝</div>
            <p>Không có dữ liệu lý do chưa hoàn thành</p>
          </div>
        </div>
      )
    }

    if (type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              outerRadius={140}
              dataKey="count"
              label={({ reason, percentage }) => 
                `${reason.length > 15 ? reason.substring(0, 15) + '...' : reason}: ${percentage}%`
              }
              labelLine={false}
            >
              {processedData.map((entry, index) => (
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

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={processedData} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            type="number" 
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <YAxis 
            type="category" 
            dataKey="reason" 
            tick={{ fill: colors.text, fontSize: 11 }}
            width={90}
            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="count" 
            fill={colors.pieColors[0]}
            radius={[0, 4, 4, 0]}
            name="Số lần"
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const totalIncomplete = processedData.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Lý do chưa hoàn thành công việc
          </CardTitle>
          <Badge variant="outline">
            Tổng: {totalIncomplete} lần
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-6">
        {renderChart()}
      </CardContent>
    </Card>
  )
}
