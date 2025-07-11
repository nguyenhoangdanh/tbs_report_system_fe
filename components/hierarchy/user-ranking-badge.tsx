'use client'

import React, { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { getPerformanceBadge, classifyPerformance } from '@/utils/performance-classification'

interface UserRankingBadgeProps {
  ranking: {
    rank: 'excellent' | 'good' | 'average' | 'poor' | 'fail'
    label: string
    color: string
  }
  taskCompletionRate: number
  size?: 'sm' | 'md' | 'lg'
}

export const UserRankingBadge = memo(({ ranking, taskCompletionRate, size = 'md' }: UserRankingBadgeProps) => {
  // Use the PERFORMANCE_LEVELS classification instead of the ranking prop
  const performanceBadge = getPerformanceBadge(taskCompletionRate)
  const classification = classifyPerformance(taskCompletionRate)
  
  const sizeClass = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }[size]

  return (
    <Badge 
      className={`${performanceBadge.className} ${sizeClass} font-medium`}
      title={`${classification.label}: ${taskCompletionRate}%`}
    >
      {classification.label}
      <span className="ml-1 text-xs opacity-75">
        {taskCompletionRate}%
      </span>
    </Badge>
  )
})

UserRankingBadge.displayName = 'UserRankingBadge'
