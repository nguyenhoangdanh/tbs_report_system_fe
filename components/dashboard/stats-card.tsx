'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IncompleteReason, IncompleteReasonsDialog } from './incomplete-reasons-dialog'
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { RankingBadge } from '@/components/ranking/ranking-badge'
import { EmployeeRanking, Ranking, calculateRankingFromRate } from '@/services/ranking.service'
import { getPerformanceBadge, getPerformanceColor, classifyPerformance } from '@/utils/performance-classification'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'

// Updated interface to match API response structure
interface WeeklyIncompleteReason {
  reason: string
  count: number
  percentage: number
  sampleTasks: Array<{
    taskName: string
    reason: string
  }>
}

interface MonthlyIncompleteReason {
  reason: string
  count: number
  percentage?: number // Make percentage optional for monthly data
}

// Union type for the incomplete reasons prop
type IncompleteReasonData = WeeklyIncompleteReason | MonthlyIncompleteReason

interface StatsCardProps {
  title: string
  subtitle?: string
  total: number
  completed: number
  uncompleted: number
  period: string
  link: string
  linkFilter: string
  icon: React.ReactNode
  color: string
  bgColor: string
  incompleteReasons: IncompleteReasonData[]
  isLoading?: boolean
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: number
    label?: string
  }
}

const StatsCard = memo(function StatsCard({
  title,
  subtitle,
  total,
  completed,
  uncompleted,
  period,
  link,
  linkFilter,
  icon,
  color,
  bgColor,
  incompleteReasons,
  isLoading = false,
  trend
}: StatsCardProps) {
  
  const completionRate = useMemo(() => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }, [completed, total])

  // Use performance classification instead of ranking calculation
  const performanceClassification = useMemo(() => {
    return classifyPerformance(completionRate)
  }, [completionRate])

  // Create ranking object compatible with RankingBadge
  const ranking = useMemo((): EmployeeRanking => {
    const perf = performanceClassification
    return {
      rank: perf.level as Ranking,
      label: perf.label,
      color: perf.color,
      bgColor: perf.bgColor,
      description: perf.description
    }
  }, [performanceClassification])

  // Transform API data to match IncompleteReason interface
  const transformedReasons = useMemo((): IncompleteReason[] => {
    if (!incompleteReasons || !Array.isArray(incompleteReasons) || incompleteReasons.length === 0) {
      return []
    }
    
    return incompleteReasons.map((reason: IncompleteReasonData) => {
      // Check if it's WeeklyIncompleteReason (has percentage and sampleTasks)
      if ('percentage' in reason && 'sampleTasks' in reason && reason.percentage !== undefined) {
        return {
          reason: reason.reason,
          count: reason.count,
          percentage: reason.percentage,
          sampleTasks: reason.sampleTasks.map(task => ({
            taskName: task.taskName,
            reason: task.reason
          }))
        }
      } else {
        // It's MonthlyIncompleteReason (only has reason and count, calculate percentage)
        const calculatedPercentage = uncompleted > 0 ? Math.round((reason.count / uncompleted) * 100) : 0
        return {
          reason: reason.reason,
          count: reason.count,
          percentage: reason.percentage || calculatedPercentage,
          sampleTasks: [] // Monthly data doesn't have sample tasks
        }
      }
    })
  }, [incompleteReasons, uncompleted]);

  const reportClassification = classifyPerformance(completionRate)

  // Trend icon and color
  const trendConfig = useMemo(() => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          label: `+${trend.value}%`
        }
      case 'down':
        return {
          icon: <TrendingDown className="w-4 h-4" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: `-${trend.value}%`
        }
      default:
        return {
          icon: <Minus className="w-4 h-4" />,
          color: 'text-slate-600 dark:text-slate-400',
          bgColor: 'bg-slate-50 dark:bg-slate-950/20',
          borderColor: 'border-slate-200 dark:border-slate-800',
          label: 'Ổn định'
        }
    }
  }, [trend])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border border-border/50 hover:border-primary/20 bg-gradient-to-br from-background via-background to-muted/20 shadow-md hover:scale-[1.02] relative overflow-hidden">
      {/* Add subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6 relative z-10">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border border-white/20 flex-shrink-0`}>
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Ranking Badge with enhanced shadow */}
          <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
            <RankingBadge 
              ranking={ranking}
              size="sm"
              showIcon={false}
              className="shadow-lg group-hover:shadow-xl transition-shadow duration-300"
            />
            {trendConfig && (
              <Badge 
                className={`${trendConfig.bgColor} ${trendConfig.color} ${trendConfig.borderColor} border-2 text-xs px-1.5 sm:px-2 py-1 flex items-center gap-1 shadow-md group-hover:shadow-lg transition-shadow duration-300`}
              >
                {trendConfig.icon}
                <span className="hidden sm:inline">{trendConfig.label}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6 relative z-10">
        {/* Main Chart and Stats with enhanced responsive styling */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-10">
          {/* Chart Section with shadow */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              <SimplePieChart 
                completedPercentage={completionRate}
                size={80}
                strokeWidth={5}
                className="drop-shadow-lg relative z-10"
                primaryColor={reportClassification.color}
              />
            </div>
          </div>
          
          {/* Key Metrics with responsive grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-8 text-center flex-1 w-full sm:w-auto">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {total}
              </div>
              <div className="text-xs text-muted-foreground">Tổng số</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completed}
              </div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Incomplete Tasks Indicator with responsive layout */}
        {uncompleted > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800 shadow-md group-hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0" />
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-300 truncate">
                {uncompleted} công việc chưa hoàn thành
              </span>
            </div>
            {transformedReasons.length > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full flex-shrink-0">
                {transformedReasons.length} lý do
              </div>
            )}
          </div>
        )}

        {/* Action Buttons with responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link href={`${link}?filter=${linkFilter}`} className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all duration-300 border-2 text-xs sm:text-sm"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">Xem chi tiết</span>
            </Button>
          </Link>
          
          {transformedReasons.length > 0 && (
            <IncompleteReasonsDialog
              title={`Phân tích lý do - ${title}`}
              period={period}
              reasons={transformedReasons}
              totalIncomplete={uncompleted}
              totalTasks={total}
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20 dark:hover:border-orange-700 hover:shadow-md transition-all duration-300 border-2 text-xs sm:text-sm flex-shrink-0"
              >
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                <span className="truncate">Phân tích</span>
              </Button>
            </IncompleteReasonsDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

export { StatsCard }
