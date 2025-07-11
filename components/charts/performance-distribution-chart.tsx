"use client"

import React, { memo } from 'react'
import { PERFORMANCE_LEVELS } from '@/utils/performance-classification'
import type { RequiredRankingDistribution } from '@/types/hierarchy'

interface PerformanceDistributionChartProps {
  distribution: RequiredRankingDistribution
  size?: number
  showLegend?: boolean
  className?: string
}

export const PerformanceDistributionChart = memo(({
  distribution,
  size = 120,
  showLegend = true,
  className = ''
}: PerformanceDistributionChartProps) => {
  
  const total = Object.values(distribution).reduce((sum, item) => sum + item.count, 0)
  
  if (total === 0) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">Không có dữ liệu</span>
      </div>
    )
  }

  // Create segments based on PERFORMANCE_LEVELS
  const segments = [
    { key: 'excellent', data: distribution.excellent, ...PERFORMANCE_LEVELS[0] },
    { key: 'good', data: distribution.good, ...PERFORMANCE_LEVELS[1] },
    { key: 'average', data: distribution.average, ...PERFORMANCE_LEVELS[2] },
    { key: 'poor', data: distribution.poor, ...PERFORMANCE_LEVELS[3] },
    { key: 'fail', data: distribution.fail, ...PERFORMANCE_LEVELS[4] }
  ].filter(segment => segment.data.count > 0)

  const radius = size / 2 - 4
  const centerX = size / 2
  const centerY = size / 2
  
  let cumulativeAngle = 0
  
  const paths = segments.map(segment => {
    const angle = (segment.data.count / total) * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    
    cumulativeAngle += angle
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    return {
      ...segment,
      pathData,
      percentage: (segment.data.count / total) * 100
    }
  })

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="drop-shadow-sm">
        {paths.map(path => (
          <path
            key={path.key}
            d={path.pathData}
            fill={path.color}
            stroke="white"
            strokeWidth="2"
            className="transition-opacity hover:opacity-80"
          />
        ))}
      </svg>
      
      {showLegend && (
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          {segments.map(segment => (
            <div key={segment.key} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-gray-600">
                {segment.label}: {segment.data.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

PerformanceDistributionChart.displayName = 'PerformanceDistributionChart'
