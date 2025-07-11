"use client"

import { memo, ReactNode, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { getPerformanceBadge, classifyPerformance } from '@/utils/performance-classification'
import { Users, Building, TrendingUp, Award } from 'lucide-react'

interface PerformanceStat {
  label: string
  value: number | string
  icon?: ReactNode
  color?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
  }
}

interface PerformanceContainerProps {
  title: string
  subtitle?: string
  completionRate: number
  totalItems: number
  completedItems: number
  stats?: PerformanceStat[]
  showChart?: boolean
  chartSize?: number
  className?: string
  children?: ReactNode
}

export const PerformanceContainer = memo(({
  title,
  subtitle,
  completionRate,
  totalItems,
  completedItems,
  stats = [],
  showChart = true,
  chartSize = 80,
  className = '',
  children
}: PerformanceContainerProps) => {
  const performanceBadge = useMemo(() => getPerformanceBadge(completionRate), [completionRate])
  const classification = useMemo(() => classifyPerformance(completionRate), [completionRate])

  const defaultStats = useMemo(() => [
    {
      label: 'Tổng số',
      value: totalItems,
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Hoàn thành',
      value: completedItems,
      icon: <Award className="w-4 h-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Tỷ lệ',
      value: `${completionRate}%`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: classification.color
    }
  ], [totalItems, completedItems, completionRate, classification.color])

  const displayStats = stats.length > 0 ? stats : defaultStats

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${performanceBadge.className} shrink-0`}>
              {performanceBadge.label}
            </Badge>
            {showChart && (
              <SimplePieChart
                completedPercentage={completionRate}
                size={chartSize}
                strokeWidth={6}
                primaryColor={classification.color}
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {displayStats.map((stat, index) => (
            <div 
              key={index}
              className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3 text-center transition-colors hover:bg-muted/70 dark:hover:bg-muted/50"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {stat.icon}
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </div>
              <div className={`text-lg font-bold ${stat.color || 'text-foreground'}`}>
                {stat.value}
              </div>
              {stat.trend && (
                <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                  stat.trend.direction === 'up' ? 'text-green-600' :
                  stat.trend.direction === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${
                    stat.trend.direction === 'down' ? 'rotate-180' : ''
                  }`} />
                  <span>{stat.trend.value}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ hoàn thành</span>
            <span className="font-medium" style={{ color: classification.color }}>
              {completionRate}%
            </span>
          </div>
          <Progress 
            value={completionRate} 
            className="h-2"
            style={{ 
              '--progress-background': classification.color 
            } as React.CSSProperties}
          />
        </div>

        {/* Custom content */}
        {children}
      </CardContent>
    </Card>
  )
})

PerformanceContainer.displayName = 'PerformanceContainer'
