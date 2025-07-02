'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RankingBadge } from '@/components/ranking/ranking-badge'
import { Trophy, TrendingUp, Calendar, User, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import type { EmployeeRankingData } from '@/services/ranking.service'

interface UserRankingCardProps {
  rankingData?: EmployeeRankingData | null
  isLoading?: boolean
  error?: Error | null
}

export const UserRankingCard = memo(function UserRankingCard({
  rankingData,
  isLoading,
  error
}: UserRankingCardProps) {

  const myRanking = useMemo(() => {
    return rankingData // rankingData is already the individual employee data
  }, [rankingData])

  const performanceColor = useMemo(() => {
    if (!myRanking) return 'text-gray-500'
    
    const rate = myRanking.performance.completionRate
    if (rate >= 90) return 'text-purple-600'
    if (rate >= 80) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    if (rate >= 60) return 'text-orange-600'
    return 'text-red-600'
  }, [myRanking])

  const performanceBgColor = useMemo(() => {
    if (!myRanking) return 'bg-gray-50'
    
    const rate = myRanking.performance.completionRate
    if (rate >= 90) return 'bg-purple-50 dark:bg-purple-950/20'
    if (rate >= 80) return 'bg-green-50 dark:bg-green-950/20'
    if (rate >= 70) return 'bg-yellow-50 dark:bg-yellow-950/20'
    if (rate >= 60) return 'bg-orange-50 dark:bg-orange-950/20'
    return 'bg-red-50 dark:bg-red-950/20'
  }, [myRanking])

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !myRanking) {
    return (
      <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-600">Xếp loại hiệu suất</CardTitle>
              <p className="text-sm text-gray-500">Dữ liệu không khả dụng</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <p className="text-gray-500">Chưa có dữ liệu xếp loại</p>
            <p className="text-xs text-gray-400 mt-1">
              Hoàn thành báo cáo để được xếp loại
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { employee, performance } = myRanking

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-blue-200 ${performanceBgColor}`}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                  Xếp loại hiệu suất của tôi
                </CardTitle>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {performance.analysisPeriod.weeks} tuần gần đây
                </p>
              </div>
            </div>
            <RankingBadge 
              ranking={performance.ranking}
              size="lg"
              showIcon={true}
              className="shadow-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-foreground">Hiệu suất tổng thể</span>
                </div>
                <div className={`text-2xl font-bold ${performanceColor}`}>
                  {performance.completionRate.toFixed(1)}%
                </div>
              </div>
              
              <Progress 
                value={performance.completionRate} 
                className="h-3"
              />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-blue-600">
                    {performance.totalReports}
                  </div>
                  <div className="text-xs text-muted-foreground">Báo cáo</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-green-600">
                    {performance.completedTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">Hoàn thành</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-purple-600">
                    {performance.totalTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">Tổng CV</div>
                </div>
              </div>
            </div>

            {/* Analysis Period */}
            <div className="bg-white dark:bg-card rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Chu kỳ phân tích
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Từ tuần:</span>
                  <Badge variant="outline" className="text-xs">
                    {performance.analysisPeriod.from.weekNumber}/{performance.analysisPeriod.from.year}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>Đến tuần:</span>
                  <Badge variant="outline" className="text-xs">
                    {performance.analysisPeriod.to.weekNumber}/{performance.analysisPeriod.to.year}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Thông tin nhân viên
                </span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Mã NV: <span className="font-medium">{employee.employeeCode}</span></div>
                <div>Phòng ban: <span className="font-medium">{employee.jobPosition.department.name}</span></div>
                <div>Chức vụ: <span className="font-medium">{employee.jobPosition.jobName}</span></div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg">
              <div className="text-sm">
                {performance.completionRate >= 90 && (
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    🎉 Xuất sắc! Tiếp tục duy trì phong độ tốt!
                  </span>
                )}
                {performance.completionRate >= 80 && performance.completionRate < 90 && (
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    👍 Làm việc tốt! Cố gắng thêm một chút nữa!
                  </span>
                )}
                {performance.completionRate >= 70 && performance.completionRate < 80 && (
                  <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                    📊 Ổn! Hãy cải thiện hiệu suất hơn nữa!
                  </span>
                )}
                {performance.completionRate < 70 && (
                  <span className="text-orange-700 dark:text-orange-300 font-medium">
                    💪 Hãy cố gắng hoàn thành tốt hơn trong thời gian tới!
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
