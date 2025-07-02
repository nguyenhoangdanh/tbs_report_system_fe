'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Users, Building, TrendingUp } from 'lucide-react'

// Updated interface to match backend data structure
interface RankingData {
  totalEntities: number
  averageCompletionRate: number
  ranking: {
    excellent: { count: number; percentage: number }
    good: { count: number; percentage: number }
    average: { count: number; percentage: number }
    poor: { count: number; percentage: number }
    fail: { count: number; percentage: number }
  }
}

interface RankingSummaryCardProps {
  title: string
  data: RankingData
  entityType: 'offices' | 'departments' | 'employees'
  className?: string
}

export const RankingSummaryCard = memo(function RankingSummaryCard({
  title,
  data,
  entityType,
  className = ''
}: RankingSummaryCardProps) {
  
  const getEntityIcon = () => {
    switch (entityType) {
      case 'offices':
        return <Building className="w-5 h-5 text-blue-600" />
      case 'departments':
        return <Users className="w-5 h-5 text-green-600" />
      case 'employees':
        return <Users className="w-5 h-5 text-purple-600" />
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />
    }
  }

  const getEntityLabel = () => {
    switch (entityType) {
      case 'offices':
        return 'văn phòng'
      case 'departments':
        return 'phòng ban'
      case 'employees':
        return 'nhân viên'
      default:
        return 'đơn vị'
    }
  }

  const rankingItems = [
    {
      key: 'excellent',
      label: 'GIỎI',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      data: data.ranking.excellent
    },
    {
      key: 'good',
      label: 'KHÁ', 
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      data: data.ranking.good
    },
    {
      key: 'average',
      label: 'TB',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      data: data.ranking.average
    },
    {
      key: 'poor',
      label: 'YẾU',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      data: data.ranking.poor
    },
    {
      key: 'fail',
      label: 'KÉM',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      data: data.ranking.fail
    }
  ]

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              {getEntityIcon()}
            </div>
            <div>
              <CardTitle className="text-lg text-blue-800 dark:text-blue-200">{title}</CardTitle>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {data.totalEntities} {getEntityLabel()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {data.averageCompletionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Hiệu suất TB
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300 font-medium">Hiệu suất tổng thể</span>
              <span className="text-blue-600 dark:text-blue-400">{data.averageCompletionRate.toFixed(1)}%</span>
            </div>
            <Progress 
              value={data.averageCompletionRate} 
              className="h-2 bg-blue-100 dark:bg-blue-900"
            />
          </div>

          {/* Ranking Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Phân bổ xếp loại
            </h4>
            
            <div className="grid grid-cols-5 gap-2">
              {rankingItems.map((item) => (
                <div key={item.key} className={`${item.bgColor} rounded-lg p-3 text-center border`}>
                  <div className="space-y-1">
                    <div className={`w-4 h-4 ${item.color} rounded mx-auto`}></div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {item.label}
                    </div>
                    <div className={`text-lg font-bold ${item.textColor}`}>
                      {item.data.count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.data.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-bold text-green-600">
                  {data.ranking.excellent.count + data.ranking.good.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Xuất sắc</div>
              </div>
              <div>
                <div className="text-sm font-bold text-yellow-600">
                  {data.ranking.average.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Trung bình</div>
              </div>
              <div>
                <div className="text-sm font-bold text-red-600">
                  {data.ranking.poor.count + data.ranking.fail.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cần cải thiện</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
