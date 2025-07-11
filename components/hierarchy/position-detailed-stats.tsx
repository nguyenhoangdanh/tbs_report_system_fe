'use client'

import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Building2, Users, Award } from 'lucide-react'

interface PositionDetailedStatsProps {
  positionId: string
  positionName: string
  stats: {
    totalUsers: number
    usersWithReports: number
    usersWithCompletedReports: number
    usersWithoutReports: number
    reportSubmissionRate: number
    reportCompletionRate: number
    rankingDistribution: any
    officesCount: number
    officeNames: string[]
  }
}

export const PositionDetailedStats = memo(({ positionId, positionName, stats }: PositionDetailedStatsProps) => {
  // Calculate performance trends (mock data - in real app would come from API)
  const performanceTrend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
  const trendValue = Math.floor(Math.random() * 10) + 1

  const getTrendIcon = () => {
    switch (performanceTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (performanceTrend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Thống kê chi tiết - {positionName}
        </h4>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`text-xs ${getTrendColor()}`}>
            {performanceTrend === 'up' ? '+' : performanceTrend === 'down' ? '-' : ''}
            {performanceTrend !== 'stable' ? `${trendValue}%` : 'Ổn định'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Overview */}
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Tỷ lệ hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tỷ lệ nộp báo cáo</span>
                <span className="font-medium">{stats.reportSubmissionRate}%</span>
              </div>
              <Progress value={stats.reportSubmissionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tỷ lệ hoàn thành</span>
                <span className="font-medium">{stats.reportCompletionRate}%</span>
              </div>
              <Progress value={stats.reportCompletionRate} className="h-2" />
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">Phân bố hiệu suất:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.rankingDistribution).map(([rank, data]: [string, any]) => (
                  data.count > 0 && (
                    <Badge
                      key={rank}
                      variant="outline"
                      className="text-xs"
                    >
                      {data.count} {
                        rank === 'excellent' ? 'Giỏi' :
                        rank === 'good' ? 'Khá' :
                        rank === 'average' ? 'TB' :
                        rank === 'poor' ? 'Yếu' : 'Kém'
                      }
                    </Badge>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="bg-white dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Phân bố theo văn phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.officeNames.map((officeName, index) => (
                <div key={officeName} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{officeName}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.floor(stats.totalUsers / stats.officesCount)} người
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng văn phòng:</span>
                <span className="font-medium">{stats.officesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tóm tắt số liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Tổng NV</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.usersWithReports}</div>
              <div className="text-xs text-muted-foreground">Đã nộp</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.usersWithCompletedReports}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.usersWithoutReports}</div>
              <div className="text-xs text-muted-foreground">Chưa nộp</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

PositionDetailedStats.displayName = 'PositionDetailedStats'
