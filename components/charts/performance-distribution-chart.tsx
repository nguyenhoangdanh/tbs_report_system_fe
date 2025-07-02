"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { RankingDistribution, EmployeeRanking, getRankingLabel } from '@/services/ranking.service'

interface PerformanceDistributionChartProps {
  distribution: RankingDistribution
  size?: number
  showLegend?: boolean
  className?: string
}

export function PerformanceDistributionChart({
  distribution,
  size = 200,
  showLegend = true,
  className = ''
}: PerformanceDistributionChartProps) {
  // Định nghĩa màu trực tiếp thay vì gọi từ service
  const getRankingChartColor = (ranking: EmployeeRanking): string => {
    const colors = {
      [EmployeeRanking.EXCELLENT]: '#16a34a', // green-600
      [EmployeeRanking.GOOD]: '#22c55e', // green-500
      [EmployeeRanking.AVERAGE]: '#eab308', // yellow-500
      [EmployeeRanking.BELOW_AVERAGE]: '#f97316', // orange-500
      [EmployeeRanking.POOR]: '#dc2626' // red-600
    }
    return colors[ranking] || '#6b7280' // gray-500
  }

  const data = [
    {
      name: getRankingLabel(EmployeeRanking.EXCELLENT),
      value: distribution.excellent.count,
      color: getRankingChartColor(EmployeeRanking.EXCELLENT),
      percentage: distribution.excellent.percentage
    },
    {
      name: getRankingLabel(EmployeeRanking.GOOD),
      value: distribution.good.count,
      color: getRankingChartColor(EmployeeRanking.GOOD),
      percentage: distribution.good.percentage
    },
    {
      name: getRankingLabel(EmployeeRanking.AVERAGE),
      value: distribution.average.count,
      color: getRankingChartColor(EmployeeRanking.AVERAGE),
      percentage: distribution.average.percentage
    },
    {
      name: getRankingLabel(EmployeeRanking.BELOW_AVERAGE),
      value: distribution.belowAverage.count,
      color: getRankingChartColor(EmployeeRanking.BELOW_AVERAGE),
      percentage: distribution.belowAverage.percentage
    },
    {
      name: getRankingLabel(EmployeeRanking.POOR),
      value: distribution.poor.count,
      color: getRankingChartColor(EmployeeRanking.POOR),
      percentage: distribution.poor.percentage
    }
  ].filter(item => item.value > 0) // Only show categories with data
  
  const totalCount = data.reduce((sum, item) => sum + item.value, 0)
  
  if (totalCount === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: size }}>
        <p className="text-muted-foreground text-sm">Không có dữ liệu</p>
      </div>
    )
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm">
            Số lượng: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm">
            Tỷ lệ: <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={size / 2.5}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontWeight: 'medium' }}>
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
