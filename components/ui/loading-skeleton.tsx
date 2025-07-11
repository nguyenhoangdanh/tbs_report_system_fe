"use client"

import { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'chart'
  count?: number
  className?: string
}

const SkeletonPulse = memo(({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
))

SkeletonPulse.displayName = 'SkeletonPulse'

export const LoadingSkeleton = memo(({ 
  type = 'card', 
  count = 1, 
  className = '' 
}: LoadingSkeletonProps) => {
  const renderCardSkeleton = () => (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <SkeletonPulse className="h-8 w-full" />
              <SkeletonPulse className="h-3 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-8 w-24" />
      </CardContent>
    </Card>
  )

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <SkeletonPulse className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
          <SkeletonPulse className="h-8 w-16" />
        </div>
      ))}
    </div>
  )

  const renderTableSkeleton = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4 p-3 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <SkeletonPulse key={j} className="h-4 w-3/4" />
          ))}
        </div>
      ))}
    </div>
  )

  const renderChartSkeleton = () => (
    <Card>
      <CardHeader>
        <SkeletonPulse className="h-4 w-1/3" />
      </CardHeader>
      <CardContent>
        <SkeletonPulse className="h-64 w-full" />
      </CardContent>
    </Card>
  )

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return renderListSkeleton()
      case 'table':
        return renderTableSkeleton()
      case 'chart':
        return renderChartSkeleton()
      case 'card':
      default:
        return renderCardSkeleton()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'
