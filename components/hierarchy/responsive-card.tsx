"use client"

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface ResponsiveCardProps {
  title: string
  code?: string
  subtitle?: string
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
  }>
  stats: Array<{
    label: string
    value: string | number
    color?: string
    icon?: React.ReactNode
  }>
  completed: number
  total: number
  detailsUrl?: string
  completionRate?: number
}

export const ResponsiveCard = memo(function ResponsiveCard({
  title,
  code,
  subtitle,
  badges = [],
  stats,
  completed,
  total,
  detailsUrl,
  completionRate
}: ResponsiveCardProps) {
  const incomplete = total - completed
  
  const getPerformanceColor = (rate?: number) => {
    if (!rate) return 'text-gray-500'
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm h-full">
      <CardContent className="p-0 h-full">
        {/* Mobile Layout */}
        <div className="block lg:hidden h-full">
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base leading-tight truncate">{title}</h3>
                  {code && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {code}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{subtitle}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant || 'secondary'} className="text-xs">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Pie Chart - Fixed size */}
              <div className="ml-3 flex-shrink-0">
                <SimplePieChart
                  completed={completed}
                  incomplete={incomplete}
                  size={60}
                  strokeWidth={6}
                />
              </div>
            </div>

            {/* Stats Grid - Mobile */}
            <div className="grid grid-cols-2 gap-3 mb-3 flex-1">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-2 bg-muted/30 rounded-lg">
                  <div className={`text-lg font-bold ${stat.color || 'text-foreground'}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Completion Rate */}
            {completionRate !== undefined && (
              <div className="flex items-center justify-between mb-3 py-2 px-3 bg-muted/20 rounded-lg">
                <span className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</span>
                <span className={`font-bold ${getPerformanceColor(completionRate)}`}>
                  {completionRate}%
                </span>
              </div>
            )}

            {/* Action Button - Always at bottom */}
            <div className="mt-auto">
              {detailsUrl && (
                <Link href={detailsUrl}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block h-full">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-6 flex-1">
              {/* Left: Title and Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-xl truncate">{title}</h3>
                  {code && (
                    <Badge variant="outline" className="text-sm flex-shrink-0">
                      {code}
                    </Badge>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {badges.map((badge, index) => (
                      <Badge key={index} variant={badge.variant || 'secondary'} className="text-xs">
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {subtitle && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">{subtitle}</p>
                )}

                {/* Stats Grid - Desktop */}
                <div className="grid grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className={`text-2xl font-bold ${stat.color || 'text-foreground'}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: Pie Chart - Fixed size */}
              <div className="flex-shrink-0">
                <SimplePieChart
                  completed={completed}
                  incomplete={incomplete}
                  size={100}
                  strokeWidth={10}
                  showLabel
                />
              </div>

              {/* Right: Completion Rate and Action */}
              <div className="flex flex-col items-end gap-4 w-32 flex-shrink-0">
                {completionRate !== undefined && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Tỷ lệ hoàn thành</div>
                    <div className={`text-3xl font-bold ${getPerformanceColor(completionRate)}`}>
                      {completionRate}%
                    </div>
                  </div>
                )}
                
                {detailsUrl && (
                  <Link href={detailsUrl}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
