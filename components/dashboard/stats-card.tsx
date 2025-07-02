'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IncompleteReason, IncompleteReasonsDialog } from './incomplete-reasons-dialog'
import { ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { RankingBadge } from '@/components/ranking/ranking-badge'
import { EmployeeRanking, calculateRankingFromRate } from '@/services/ranking.service'
import { getPerformanceBadge, getPerformanceColor } from '@/utils/performance-classification'


// Fix: Define proper interface that matches API response
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
}

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
  incompleteReasons: WeeklyIncompleteReason[] | MonthlyIncompleteReason[]
  isLoading?: boolean
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
  isLoading = false
}: StatsCardProps) {
  
  const completionRate = useMemo(() => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }, [completed, total])

  // Calculate ranking based on completion rate
  const ranking = useMemo(() => {
    return calculateRankingFromRate(completionRate)
  }, [completionRate])

  const performanceBadge = useMemo(() => {
    return getPerformanceBadge(completionRate)
  }, [completionRate])

  const performanceColor = useMemo(() => {
    return getPerformanceColor(completionRate)
  }, [completionRate])

  const statusConfig = useMemo(() => {
    if (completionRate >= 90) {
      return {
        badgeColor: 'bg-green-100 text-green-700 border-green-200',
        statusText: 'Xuất sắc',
        statusIcon: <CheckCircle2 className="w-4 h-4" />
      }
    } else if (completionRate >= 70) {
      return {
        badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
        statusText: 'Tốt',
        statusIcon: <Clock className="w-4 h-4" />
      }
    } else {
      return {
        badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
        statusText: 'Cần cải thiện',
        statusIcon: <AlertTriangle className="w-4 h-4" />
      }
    }
  }, [completionRate])

  // Transform API data to match IncompleteReason interface
  const transformedReasons = useMemo((): IncompleteReason[] => {
    if (!incompleteReasons.length) return []
    
    return incompleteReasons.map((reason) => {
      // Check if it's WeeklyIncompleteReason (has percentage and sampleTasks)
      if ('percentage' in reason && 'sampleTasks' in reason) {
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
        // It's MonthlyIncompleteReason (only has reason and count)
        return {
          reason: reason.reason,
          count: reason.count,
          percentage: uncompleted > 0 ? Math.round((reason.count / uncompleted) * 100) : 0,
          sampleTasks: []
        }
      }
    })
  }, [incompleteReasons, uncompleted])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className={`${bgColor} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {/* Performance Ranking Badge */}
          <div className="flex flex-col items-end gap-2">
            <RankingBadge 
              ranking={ranking}
              size="sm"
              showIcon={false}
              className="shadow-sm"
            />
            <div className="text-xs text-muted-foreground">
              Xếp loại {period.toLowerCase()}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Stats Display with Performance Indicator */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-xs text-muted-foreground">Tổng</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <div className="text-xs text-muted-foreground">Hoàn thành</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{uncompleted}</div>
            <div className="text-xs text-muted-foreground">Chưa xong</div>
          </div>
          <div>
            <div 
              className="text-2xl font-bold" 
              style={{ color: performanceColor.text }}
            >
              {completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">Hiệu suất</div>
          </div>
        </div>

        {/* Progress Bar with Performance Color */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium flex items-center gap-1">
              {completionRate}%
              <Badge 
                className={`${performanceBadge.className} text-xs px-2 py-0.5`}
              >
                {performanceBadge.label}
              </Badge>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${completionRate}%`,
                backgroundColor: performanceColor.text
              }}
            />
          </div>
        </div>

        {/* Enhanced Status with Performance Info */}
        {/* <div className="flex items-center justify-between">
          <Badge className={`${statusConfig.badgeColor} flex items-center gap-1`}>
            {statusConfig.statusIcon}
            {statusConfig.statusText}
          </Badge>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              Xếp loại: <span className={`font-medium`} style={{ color: performanceColor.text }}>
                {performanceBadge.label}
              </span>
            </div>
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`${link}?filter=${linkFilter}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Xem chi tiết
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
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Lý do
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
