"use client"

import React, { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PERFORMANCE_LEVELS } from '@/utils/performance-classification'
import type { RankingDistribution } from '@/types/hierarchy'

interface PerformancePieChartProps {
    distribution: RankingDistribution
    width?: number
    height?: number
    className?: string
    showLabels?: boolean
    showLegend?: boolean
    compact?: boolean
    innerRadius?: number
    outerRadius?: number
}

export const PerformancePieChart = memo(({
    distribution,
    width = 200,
    height = 200,
    className = '',
    showLabels = true,
    showLegend = true,
    compact = false,
    innerRadius = 0,
    outerRadius = 80
}: PerformancePieChartProps) => {

    const allData = [
        {
            name: 'Giỏi',
            fullName: 'Giỏi',
            value: distribution.excellent?.count || 0,
            percentage: distribution.excellent?.percentage || 0,
            color: PERFORMANCE_LEVELS[0].color,
        },
        {
            name: 'Khá',
            fullName: 'Khá',
            value: distribution.good?.count || 0,
            percentage: distribution.good?.percentage || 0,
            color: PERFORMANCE_LEVELS[1].color,
        },
        {
            name: 'TB',
            fullName: 'Trung bình',
            value: distribution.average?.count || 0,
            percentage: distribution.average?.percentage || 0,
            color: PERFORMANCE_LEVELS[2].color,
        },
        {
            name: 'Yếu',
            fullName: 'Yếu',
            value: distribution.poor?.count || 0,
            percentage: distribution.poor?.percentage || 0,
            color: PERFORMANCE_LEVELS[3].color,
        },
        {
            name: 'Kém',
            fullName: 'Kém',
            value: distribution.fail?.count || 0,
            percentage: distribution.fail?.percentage || 0,
            color: PERFORMANCE_LEVELS[4].color,
        }
    ]

    // Filter data to only show segments with values > 0
    const data = allData.filter(item => item.value > 0)
    const totalCount = data.reduce((sum, item) => sum + item.value, 0)
    const hasData = totalCount > 0

    if (!hasData) {
        return (
            <div
                className={`flex items-center justify-center text-xs text-gray-400 ${className}`}
                style={{ width, height }}
            >
                <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-lg sm:text-xl">📊</span>
                    </div>
                    <div className="text-xs sm:text-sm">Chưa có dữ liệu</div>
                </div>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 sm:p-3 text-xs sm:text-sm z-50">
                    <div className="font-medium mb-1">{data.fullName}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                        Số lượng: <span className="font-medium">{data.value} người</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        Tỷ lệ: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
                    </div>
                </div>
            )
        }
        return null
    }

    const CustomLegend = () => {
        if (!showLegend || compact) return null
        
        return (
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-2 sm:mt-4 px-2">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1 min-w-0">
                        <div 
                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {entry.name} ({entry.value})
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    const renderLabel = (entry: any) => {
        if (!showLabels || compact) return null
        
        // Dynamic threshold based on screen size
        const threshold = compact ? 10 : 8
        if (entry.percentage < threshold) return null
        
        return compact ? `${entry.value}` : `${entry.value}`
    }

    // Responsive dimensions
    const getResponsiveDimensions = () => {
        if (compact) {
            return {
                chartWidth: Math.min(width * 0.9, 150),
                chartHeight: Math.min(height * 0.9, 150),
                outerRadius: Math.min(outerRadius * 0.8, 40),
                innerRadius: Math.min(innerRadius * 0.8, 15)
            }
        }
        return {
            chartWidth: width,
            chartHeight: height,
            outerRadius: outerRadius,
            innerRadius: innerRadius
        }
    }

    const { chartWidth, chartHeight, outerRadius: finalOuterRadius, innerRadius: finalInnerRadius } = getResponsiveDimensions()

    return (
        <div className={`flex flex-col items-center w-full ${className}`}>
            {showLabels && !compact && (
                <div className="text-xs sm:text-sm text-muted-foreground mb-1 text-center">
                    Phân bố xếp loại
                </div>
            )}
            
            <div 
                className="w-full flex justify-center"
                style={{ 
                    maxWidth: chartWidth, 
                    height: chartHeight,
                    minHeight: compact ? '100px' : '150px'
                }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderLabel}
                            outerRadius={finalOuterRadius}
                            innerRadius={finalInnerRadius}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            content={<CustomTooltip />}
                            wrapperStyle={{ zIndex: 1000 }}
                        />
                        {showLegend && !compact && (
                            <Legend 
                                content={<CustomLegend />}
                                wrapperStyle={{ paddingTop: '10px' }}
                            />
                        )}
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            {/* Compact mode summary */}
            {compact && (
                <div className="text-center mt-1">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {totalCount} người
                    </div>
                </div>
            )}
            
            {/* Mobile-friendly legend for compact mode */}
            {compact && showLegend && data.length > 0 && (
                <div className="mt-2 w-full">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                        {data.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1 min-w-0">
                                <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                    {entry.name}: {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
})

PerformancePieChart.displayName = 'PerformancePieChart'
