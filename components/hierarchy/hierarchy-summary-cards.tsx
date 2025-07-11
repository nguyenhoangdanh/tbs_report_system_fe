'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Building2, 
  FileCheck, 
  TrendingUp 
} from 'lucide-react'

interface HierarchySummaryCardsProps {
  summary: {
    totalPositions?: number
    totalJobPositions?: number
    totalUsers: number
    totalUsersWithReports: number
    totalUsersWithCompletedReports?: number
    totalUsersWithoutReports?: number
    averageSubmissionRate: number
    averageCompletionRate: number
    managementSummary?: any
    staffSummary?: any
    rankingDistribution?: {
      excellent: { count: number; percentage: number }
      good: { count: number; percentage: number }
      average: { count: number; percentage: number }
      poor: { count: number; percentage: number }
      fail: { count: number; percentage: number }
    }
  }
}

export const HierarchySummaryCards = memo(({ summary }: HierarchySummaryCardsProps) => {
  // Handle both mixed summary and single summary types
  const totalPositions = summary.totalPositions || 0
  const totalJobPositions = summary.totalJobPositions || 0
  const totalUsers = summary.totalUsers || 0
  const totalUsersWithReports = summary.totalUsersWithReports || 0
  const averageSubmissionRate = summary.averageSubmissionRate || 0
  const averageCompletionRate = summary.averageCompletionRate || 0

  // For mixed view, show breakdown
  const isMixedView = summary.managementSummary && summary.staffSummary
  
  console.log('Summary data:', {
    totalPositions,
    totalJobPositions,
    totalUsers,
    isMixedView
  })

  const cards = [
    {
      title: isMixedView ? 'Tổng cấp bậc' : 'Tổng vị trí',
      value: totalPositions + totalJobPositions,
      subtitle: isMixedView ? `${totalPositions} cấp quản lý, ${totalJobPositions} vị trí CV` : 'vị trí',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Tổng nhân viên',
      value: totalUsers,
      subtitle: 'nhân viên',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Đã nộp báo cáo',
      value: totalUsersWithReports,
      subtitle: `${Math.round(averageSubmissionRate)}% tỷ lệ nộp`,
      icon: FileCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: `${Math.round(averageCompletionRate)}%`,
      subtitle: 'trung bình',
      icon: TrendingUp,
      color: averageCompletionRate >= 90 ? 'text-green-600' : averageCompletionRate >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: averageCompletionRate >= 90 ? 'bg-green-50 dark:bg-green-900/20' : averageCompletionRate >= 70 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
})

HierarchySummaryCards.displayName = 'HierarchySummaryCards'
