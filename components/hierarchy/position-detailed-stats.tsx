"use client"

import React, { memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  const performanceTrend = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable"
  const trendValue = Math.floor(Math.random() * 10) + 1

  const getTrendIcon = () => {
    switch (performanceTrend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (performanceTrend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <motion.div
      className="space-y-4 p-4 glass-green rounded-lg border border-green-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-green-700 dark:text-green-300">Thống kê chi tiết - {positionName}</h4>
        <motion.div
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {getTrendIcon()}
          <span className={`text-xs ${getTrendColor()}`}>
            {performanceTrend === "up" ? "+" : performanceTrend === "down" ? "-" : ""}
            {performanceTrend !== "stable" ? `${trendValue}%` : "Ổn định"}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-green border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-green-gradient">
                  <Award className="h-4 w-4 text-white" />
                </div>
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

              <div className="pt-2 border-t border-green-500/20">
                <div className="text-xs text-muted-foreground mb-2">Phân bố hiệu suất:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.rankingDistribution).map(([rank, data]: [string, any]) =>
                    data.count > 0 ? (
                      <Badge key={rank} variant="outline" className="text-xs glass-green border-green-500/30">
                        {data.count}{" "}
                        {rank === "excellent"
                          ? "Giỏi"
                          : rank === "good"
                            ? "Khá"
                            : rank === "average"
                              ? "TB"
                              : rank === "poor"
                                ? "Yếu"
                                : "Kém"}
                      </Badge>
                    ) : null,
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-green border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-green-gradient">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                Phân bố theo văn phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.officeNames.map((officeName, index) => (
                  <motion.div
                    key={officeName}
                    className="flex items-center justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <span className="truncate flex-1">{officeName}</span>
                    <Badge variant="outline" className="text-xs glass-green border-green-500/30">
                      {Math.floor(stats.totalUsers / stats.officesCount)} người
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-green-500/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng văn phòng:</span>
                  <span className="font-medium">{stats.officesCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-green border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1 rounded bg-green-gradient">
                <Users className="h-4 w-4 text-white" />
              </div>
              Tóm tắt số liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { value: stats.totalUsers, label: "Tổng NV", color: "text-green-600" },
                { value: stats.usersWithReports, label: "Đã nộp", color: "text-emerald-600" },
                { value: stats.usersWithCompletedReports, label: "Hoàn thành", color: "text-teal-600" },
                { value: stats.usersWithoutReports, label: "Chưa nộp", color: "text-red-600" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

PositionDetailedStats.displayName = "PositionDetailedStats"
