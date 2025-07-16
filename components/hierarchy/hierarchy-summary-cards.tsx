"use client"

import { memo } from "react"
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
      fail: { count: number; percentage: number }
    }
  }
}

export const HierarchySummaryCards = memo(({ summary }: HierarchySummaryCardsProps) => {
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
      color: "text-foreground",
    },
    {
      title: "Tổng nhân viên",
      value: totalUsers,
      subtitle: "nhân viên",
      icon: Users,
      color: "text-foreground",
    },
    {
      title: "Đã nộp báo cáo",
      value: totalUsersWithReports,
      subtitle: `${Math.round(averageSubmissionRate)}% tỷ lệ nộp`,
      icon: FileCheck,
      color: "text-foreground",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${Math.round(averageCompletionRate)}%`,
      subtitle: "trung bình",
      icon: TrendingUp,
      color:
        averageCompletionRate >= 90
          ? "text-primary"
          : averageCompletionRate >= 70
            ? "text-warning"
            : "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <card.icon className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

HierarchySummaryCards.displayName = "HierarchySummaryCards"
