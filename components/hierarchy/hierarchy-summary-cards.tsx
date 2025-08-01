"use client"

import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Building2, FileCheck, TrendingUp } from "lucide-react"

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
    }
  }
}

export const HierarchySummaryCards = memo(({ summary }: HierarchySummaryCardsProps) => {
  const shouldReduceMotion = useReducedMotion()
  
  const totalPositions = summary.totalPositions || 0
  const totalJobPositions = summary.totalJobPositions || 0
  const totalUsers = summary.totalUsers || 0
  const totalUsersWithReports = summary.totalUsersWithReports || 0
  const averageSubmissionRate = summary.averageSubmissionRate || 0
  const averageCompletionRate = summary.averageCompletionRate || 0

  const isMixedView = summary.managementSummary && summary.staffSummary

  const cards = [
    {
      title: isMixedView ? "Tổng cấp bậc" : "Tổng vị trí",
      value: totalPositions + totalJobPositions,
      subtitle: isMixedView ? `${totalPositions} cấp quản lý, ${totalJobPositions} vị trí CV` : "vị trí",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Tổng nhân viên",
      value: totalUsers,
      subtitle: "nhân viên",
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Đã nộp báo cáo",
      value: totalUsersWithReports,
      subtitle: `${Math.round(averageSubmissionRate)}% tỷ lệ nộp`,
      icon: FileCheck,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${Math.round(averageCompletionRate)}%`,
      subtitle: "trung bình",
      icon: TrendingUp,
      color:
        averageCompletionRate >= 90
          ? "text-green-600 dark:text-green-400"
          : averageCompletionRate >= 70
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400",
      bgColor:
        averageCompletionRate >= 90
          ? "bg-green-50 dark:bg-green-900/20"
          : averageCompletionRate >= 70
            ? "bg-yellow-50 dark:bg-yellow-900/20"
            : "bg-red-50 dark:bg-red-900/20",
      iconBg:
        averageCompletionRate >= 90
          ? "bg-green-100 dark:bg-green-900/30"
          : averageCompletionRate >= 70
            ? "bg-yellow-100 dark:bg-yellow-900/30"
            : "bg-red-100 dark:bg-red-900/30",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : { 
            duration: 0.2,
            delay: index * 0.05
          }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.01, y: -2 }}
        >
          <Card
            className={`border-border/50 hover:shadow-lg transition-all duration-200 ${card.bgColor}`}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <motion.p 
                    className={`text-2xl sm:text-3xl font-bold ${card.color}`}
                    initial={shouldReduceMotion ? false : { scale: 0.8 }}
                    animate={shouldReduceMotion ? false : { scale: 1 }}
                    transition={shouldReduceMotion ? undefined : { 
                      duration: 0.15,
                      delay: index * 0.05 + 0.1
                    }}
                  >
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <motion.div 
                  className={`p-3 rounded-xl ${card.iconBg} transition-transform duration-150`}
                  whileHover={shouldReduceMotion ? undefined : { rotate: 5, scale: 1.05 }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.1 }}
                >
                  <card.icon className="w-6 h-6 text-muted-foreground" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
})

HierarchySummaryCards.displayName = "HierarchySummaryCards"
