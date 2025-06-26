'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Eye, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Link from 'next/link'
import { IncompleteReasonsDialog } from './incomplete-reasons-dialog'
import type { IncompleteReasonData } from '@/services/statistics.service'

interface StatsCardProps {
  title: string
  subtitle?: string
  total: number
  completed: number
  uncompleted: number
  period: string
  link?: string
  linkFilter?: string
  icon: React.ReactNode
  color: string
  bgColor: string
  incompleteReasons?: IncompleteReasonData[]
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
  incompleteReasons = [],
  isLoading = false
}: StatsCardProps) {
  const stats = useMemo(() => {
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const isExcellent = completionRate >= 90
    const isGood = completionRate >= 70
    
    return { completionRate, isExcellent, isGood }
  }, [total, completed])

  const chartData = useMemo(() => [
    { name: 'Hoàn thành', value: completed, fill: '#10b981' },
    { name: 'Chưa xong', value: uncompleted, fill: '#f59e0b' }
  ], [completed, uncompleted])

  const topReason = useMemo(() => {
    return incompleteReasons?.[0]
  }, [incompleteReasons])

  // Build proper link URL with filter params
  const linkHref = useMemo(() => {
    if (!link || !linkFilter) return link
    
    // Parse linkFilter to build proper URL params
    if (linkFilter.includes('&')) {
      // Handle cases like "month&month=6&year=2025"
      const [baseFilter, ...params] = linkFilter.split('&')
      const searchParams = new URLSearchParams()
      searchParams.set('filter', baseFilter)
      
      params.forEach(param => {
        const [key, value] = param.split('=')
        if (key && value) {
          searchParams.set(key, value)
        }
      })
      
      return `${link}?${searchParams.toString()}`
    } else {
      // Handle simple cases like "week" or "year"
      return `${link}?filter=${linkFilter}`
    }
  }, [link, linkFilter])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-gray-200 rounded-lg" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${bgColor} border-l-current`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor} shadow-sm`}>
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            
            {stats.isExcellent && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Xuất sắc!
              </Badge>
            )}
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total}</div>
              <div className="text-xs text-muted-foreground">Tổng cộng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{uncompleted}</div>
              <div className="text-xs text-muted-foreground">Chưa xong</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tiến độ</span>
              <span className={`text-sm font-semibold ${color}`}>
                {stats.completionRate}%
              </span>
            </div>
            <Progress 
              value={stats.completionRate} 
              className="h-2"
            />
          </div>

          {/* Mini Chart */}
          {total > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={25}
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quick Insight */}
              <div className="flex-1 text-sm">
                {stats.isExcellent ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>Hiệu suất xuất sắc!</span>
                  </div>
                ) : stats.isGood ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Activity className="w-4 h-4" />
                    <span>Tiến độ tốt</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <TrendingDown className="w-4 h-4" />
                    <span>Cần cải thiện</span>
                  </div>
                )}
                
                {topReason && uncompleted > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Lý do chính: &quot;{topReason.reason.length > 30 ? topReason.reason.substring(0, 30) + '...' : topReason.reason}&quot;
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {linkHref && (
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="flex-1"
              >
                <Link href={linkHref}>
                  <Eye className="w-4 h-4 mr-2" />
                  Xem báo cáo
                </Link>
              </Button>
            )}
            
            {uncompleted > 0 && incompleteReasons.length > 0 && (
              <IncompleteReasonsDialog
                title={`Lý do chưa hoàn thành - ${title}`}
                period={period}
                reasons={incompleteReasons}
                totalIncomplete={uncompleted}
                totalTasks={total}
                icon={icon}
                color={color}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Phân tích ({uncompleted})
                </Button>
              </IncompleteReasonsDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

export { StatsCard }
