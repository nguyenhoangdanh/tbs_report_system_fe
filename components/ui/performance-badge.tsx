"use client"

import { Badge } from '@/components/ui/badge'
import { classifyPerformance, getPerformanceBadge } from '@/utils/performance-classification'
import { cn } from '@/lib/utils'

interface PerformanceBadgeProps {
  percentage: number
  showIcon?: boolean
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PerformanceBadge({
  percentage,
  showIcon = false,
  showPercentage = true,
  size = 'md',
  className
}: PerformanceBadgeProps) {
  const classification = classifyPerformance(percentage)
  const badgeConfig = getPerformanceBadge(percentage)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  const getIcon = () => {
    switch (classification.level) {
      case 'EXCELLENT':
        return '🏆' // Trophy
      case 'GOOD':
        return '👍' // Thumbs up
      case 'AVERAGE':
        return '👌' // OK sign
      case 'POOR':
        return '⚠️' // Warning
      case 'FAIL':
        return '❌' // Cross mark
      default:
        return ''
    }
  }
  
  return (
    <Badge
      variant={badgeConfig.variant}
      className={cn(
        badgeConfig.className,
        sizeClasses[size],
        'font-semibold inline-flex items-center gap-1',
        className
      )}
    >
      {showIcon && <span>{getIcon()}</span>}
      <span>{badgeConfig.label}</span>
      {showPercentage && <span>({percentage}%)</span>}
    </Badge>
  )
}
