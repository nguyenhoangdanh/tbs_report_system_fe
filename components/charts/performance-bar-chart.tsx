"use client"

import React, { memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { PERFORMANCE_LEVELS } from '@/utils/performance-classification'
import type { RankingDistribution } from '@/types/hierarchy'

interface PerformanceBarChartProps {
    distribution: RankingDistribution
    width?: number
    height?: number
    className?: string
    showLabels?: boolean
    compact?: boolean
}

export const PerformanceBarChart = memo(({
    distribution,
    width = 200,
    height = 60,
    className = '',
    showLabels = true,
    compact = false
}: PerformanceBarChartProps) => {

    const data = [
        {
            name: 'Giỏi',
            value: distribution.excellent?.count || 0,
            color: PERFORMANCE_LEVELS[0].color,
            shortName: distribution.excellent?.count || 0,
        },
        {
            name: 'Khá',
            value: distribution.good?.count || 0,
            color: PERFORMANCE_LEVELS[1].color,
            shortName: distribution.good?.count || 0,
        },
        {
            name: 'TB',
            value: distribution.average?.count || 0,
            color: PERFORMANCE_LEVELS[2].color,
            shortName: distribution.average?.count || 0
        },
        {
            name: 'Yếu',
            value: distribution.belowAverage?.count || 0,
            color: PERFORMANCE_LEVELS[3].color,
            shortName: distribution.belowAverage?.count || 0
        },
        {
            name: 'Kém',
            value: distribution.poor?.count || 0,
            color: PERFORMANCE_LEVELS[4].color,
            shortName: distribution.poor?.count || 0
        }
    ]

    const maxValue = Math.max(...data.map(d => d.value))
    const hasData = maxValue > 0

    if (!hasData) {
        return (
            <div
                className={`flex items-center justify-center text-xs text-gray-400 ${className}`}
                style={{ width, height }}
            >
                Chưa có dữ liệu
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 text-xs">
                    <p className="font-medium">{`${payload[0].payload.name}: ${payload[0].value} người`}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className={`flex flex-col items-center ${className}`}>
            {showLabels && !compact && (
                <div className="text-xs text-muted-foreground mb-1">Xếp loại</div>
            )}
            <div style={{ width, height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                        <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: compact ? 8 : 10 }}
                            axisLine={false}
                            tickLine={false}
                            height={compact ? 15 : 20}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[1, 1, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
})

PerformanceBarChart.displayName = 'PerformanceBarChart'
