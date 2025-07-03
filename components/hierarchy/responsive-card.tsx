"use client"

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { ExternalLink, Eye } from 'lucide-react'
import Link from 'next/link'

interface ResponsiveCardProps {
  title: string
  code?: string
  subtitle?: string
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
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
  onNavigate?: () => void
  reportSubmissionRate: number
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
  completionRate,
  onNavigate,
  reportSubmissionRate = 0
}: ResponsiveCardProps) {
  const incomplete = total - completed
  
  const getPerformanceColor = (rate?: number) => {
    if (!rate) return 'text-muted-foreground'
    if (rate === 100) return 'text-purple-600 dark:text-purple-400' // GIỎI - Màu tím
    if (rate >= 95) return 'text-green-600 dark:text-green-400' // KHÁ - Màu xanh lá
    if (rate >= 90) return 'text-yellow-600 dark:text-yellow-400' // TB - Màu vàng
    if (rate >= 85) return 'text-orange-600 dark:text-orange-400' // YẾU - Màu cam
    return 'text-red-600 dark:text-red-400' // KÉM - Màu đỏ
  }

  const getProgressBarColor = (rate?: number) => {
    if (!rate) return 'bg-muted'
    if (rate === 100) return 'bg-gradient-to-r from-purple-500 to-purple-600' // GIỎI - Màu tím
    if (rate >= 95) return 'bg-gradient-to-r from-green-500 to-green-600' // KHÁ - Màu xanh lá
    if (rate >= 90) return 'bg-gradient-to-r from-yellow-500 to-yellow-600' // TB - Màu vàng
    if (rate >= 85) return 'bg-gradient-to-r from-orange-500 to-orange-600' // YẾU - Màu cam
    return 'bg-gradient-to-r from-red-500 to-red-600' // KÉM - Màu đỏ
  }

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  // const completionPercentage = Math.round((completed / Math.max(total, 1)) * 100)

  return (
    <Card className="group relative overflow-hidden border border-border/60 bg-card hover:border-border hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
              {title}
            </CardTitle>
            {code && (
              <p className="text-xs sm:text-sm text-muted-foreground/80 mt-1 font-medium">{code}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
            {badges.map((badge, index) => (
              <Badge 
                key={index} 
                variant={badge.variant || 'secondary'} 
                className={`text-xs px-2 py-0.5 font-medium shadow-sm ${badge.className || ''}`}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative px-4 sm:px-6 pb-4">
        <div className="space-y-4">
          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group/stat relative overflow-hidden rounded-lg bg-muted/40 dark:bg-muted/20 p-3 transition-all duration-200 hover:bg-muted/60 dark:hover:bg-muted/30"
              >
                <div className="relative z-10">
                  <div className={`text-lg sm:text-xl font-bold transition-colors duration-200 ${stat.color || 'text-foreground group-hover/stat:text-primary'}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200" />
              </div>
            ))}
          </div>

          {/* Progress Section */}
          <div className="relative rounded-xl bg-gradient-to-br from-muted/30 to-muted/50 dark:from-muted/20 dark:to-muted/40 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tỷ lệ nộp báo cáo
                  </span>
                  <span className={`text-sm font-bold ${getPerformanceColor(reportSubmissionRate)}`}>
                    {reportSubmissionRate}%
                  </span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${getProgressBarColor(reportSubmissionRate)} shadow-sm`}
                    style={{ width: `${reportSubmissionRate}%` }}
                  >
                    <div className="h-full bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{completed} đã nộp</span>
                  <span>{total} tổng cộng</span>
                </div>
              </div>
              
              {/* Pie Chart - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:block ml-4">
                <SimplePieChart
                  completedPercentage={reportSubmissionRate}
                  size={56}
                  strokeWidth={6}
                  className="drop-shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          {(detailsUrl || onNavigate) && (
            <div className="pt-2">
              {onNavigate ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group/btn relative overflow-hidden border-border/60 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all duration-200"
                  onClick={handleNavigation}
                >
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <Eye className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                    <span className="font-medium">Xem chi tiết</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200" />
                </Button>
              ) : detailsUrl ? (
                <Link href={detailsUrl} className="block">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group/btn relative overflow-hidden border-border/60 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <Eye className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                      <span className="font-medium">Xem chi tiết</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200" />
                  </Button>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
