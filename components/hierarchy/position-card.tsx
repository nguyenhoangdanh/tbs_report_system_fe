"use client"

import React, { memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PositionUsersTable } from "./position-users-table"
import { PerformancePieChart } from "@/components/charts"
import { classifyPerformance } from "@/utils/performance-classification"

interface PositionCardProps {
  position: {
    position?: {
      id: string
      name: string
      level?: number
      description?: string
      isManagement?: boolean
    }
    jobPosition?: {
      id: string
      jobName: string
      department?: {
        name: string
      }
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      needsImprovementCount?: number
      positionRanking?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR"
      rankingDistribution?: {
        excellent: { count: number; percentage: number }
        good: { count: number; percentage: number }
        average: { count: number; percentage: number }
        poor: { count: number; percentage: number }
      }
      users?: any[]
    }
    userCount: number
    departmentBreakdown?: any[]
    users?: any[]
  }
  weekNumber: number
  year: number
  canEvaluation?: boolean
}

export const PositionCard = memo(({ position, weekNumber, year, canEvaluation }: PositionCardProps) => {
  const positionInfo = {
    id: position.position?.id || position.jobPosition?.id || "",
    name: position.position?.name || position.jobPosition?.jobName || "Vị trí không xác định",
    description: position.position?.description || position.jobPosition?.department?.name || "",
    isManagement: position.position?.isManagement || false,
    departmentName: position.jobPosition?.department?.name || "",
    jobName: position.jobPosition?.jobName || "",
  }

  const completionRate = position.stats.averageCompletionRate || 0
  const positionClassification = classifyPerformance(completionRate)

  const rankingDistribution = position.stats.rankingDistribution || {
    excellent: { count: 0, percentage: 0 },
    good: { count: 0, percentage: 0 },
    average: { count: 0, percentage: 0 },
    poor: { count: 0, percentage: 0 },
    // fail: { count: 0, percentage: 0 },
  }

  const getRankingStats = () => {
    return {
      excellent: rankingDistribution.excellent?.count || 0,
      good: rankingDistribution.good?.count || 0,
      average: rankingDistribution.average?.count || 0,
      poor: rankingDistribution.poor?.count || 0,
      // fail: rankingDistribution.fail?.count || 0,
    }
  }

  const rankingStats = getRankingStats()

  const transformedUsers = (position.stats.users || position.users || []).map((user: any) => {
    return {
      id: user.id,
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      email: user.email,
      office: {
        id: user.office?.id || "",
        name: user.office?.name || "",
        type: user.office?.type || "",
      },
      jobPosition: {
        id: user.jobPosition?.id || "",
        jobName: user.jobPosition?.jobName || "",
        department: {
          id: user.jobPosition?.department?.id || "",
          name: user.jobPosition?.department?.name || "",
          office: user.jobPosition?.department?.office || undefined,
        },
      },
      position: {
        id: user.JobPosition?.position?.id || user.position?.id || "",
        name: user.jobPosition?.position?.name || user.position?.name || "",
        description: user.position?.description || user.jobPosition?.position?.description || "",
      },
      stats: {
        hasReport: user.stats?.hasReport || false,
        isCompleted: user.stats?.isCompleted || false,
        totalTasks: user.stats?.totalTasks || 0,
        completedTasks: user.stats?.completedTasks || 0,
        taskCompletionRate: user.stats?.taskCompletionRate || 0,
      },
    }
  })

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <Card className="glass-green border-green-500/20 hover:shadow-green-glow transition-all duration-300">
        {/* Main Card Content */}
        <CardContent className="p-4 sm:p-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Left Side - Position Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-green-700 dark:text-green-300 truncate">
                    {/* {positionInfo.name} */}
                    {positionInfo?.description || positionInfo.name} - {positionInfo.jobName}
                    {positionInfo.departmentName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Phòng ban: {positionInfo.departmentName}
                      </p>
                    )}
                  </h3>
                  {positionInfo.isManagement && (
                    <Badge variant="secondary" className="text-xs glass-green border-green-500/30">
                      Quản lý
                    </Badge>
                  )}
                </div>
                {/* {positionInfo.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">{positionInfo.description}</p>
                )} */}
                {/* <p className="text-xs text-muted-foreground mt-1">
                  {positionInfo.departmentName}
                </p> */}
                {/* {positionInfo.departmentName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Phòng ban: {positionInfo.departmentName}
                  </p>  
                )} */}
              </div>
            </div>

            {/* Center - Performance Charts */}
            <div className="flex flex-row gap-2 items-center mx-6">
              <PerformancePieChart
                distribution={rankingDistribution}
                width={120}
                height={120}
                showLabels={true}
                showLegend={true}
                compact={true}
                innerRadius={25}
                outerRadius={50}
              />
            </div>

            {/* Right Side - Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <div className="text-lg font-bold text-green-600">{position.stats.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Tổng NV</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <div className="text-lg font-bold text-emerald-600">{position.stats.usersWithReports}</div>
                  <div className="text-xs text-muted-foreground">Đã nộp</div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-300 truncate flex-1">
                  {positionInfo?.description || positionInfo.name} - {positionInfo.jobName}
                </h3>
                {positionInfo.isManagement && (
                  <Badge variant="secondary" className="text-xs glass-green border-green-500/30">
                    Quản lý
                  </Badge>
                )}
              </div>
              {/* {positionInfo.description && (
                <p className="text-xs text-muted-foreground truncate">{positionInfo.description}</p>
              )} */}
              {positionInfo.departmentName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Phòng ban: {positionInfo.departmentName}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                  <div className="text-lg font-bold text-green-600">{position.stats.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Tổng NV</div>
                </motion.div>
                <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                  <div className="text-sm font-bold text-emerald-600">{position.stats.usersWithReports}</div>
                  <div className="text-xs text-muted-foreground">Đã nộp</div>
                </motion.div>
              </div>

              <div className="flex flex-col gap-1">
                <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                  <div className="text-lg font-bold" style={{ color: positionClassification.color }}>
                    {Math.round(completionRate)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Hoàn thành</div>
                </motion.div>
                <div className="text-center">
                  <Badge variant="outline" className="text-xs glass-green border-green-500/30">
                    {position.stats.totalUsers} người
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Detailed Content */}
        <div className="border-t border-green-500/20 glass-green">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Mobile Stats Grid */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                {[
                  { icon: "✓", value: position.stats.usersWithReports, label: "Đã nộp", color: "text-green-600" },
                  { icon: "★", value: position.stats.usersWithCompletedReports, label: "Hoàn thành", color: "text-emerald-600" },
                  { icon: "✗", value: position.stats.usersWithoutReports, label: "Chưa nộp", color: "text-red-600" },
                  { icon: "%", value: `${Math.round(position.stats.averageCompletionRate || 0)}%`, label: "Tỷ lệ HT", color: "text-purple-600" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center p-3 glass-green rounded-lg border border-green-500/20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Performance Charts for Mobile Expanded View */}
              <div className="md:hidden p-3 glass-green rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-3 text-center">
                  Biểu đồ xếp loại chi tiết
                </p>
                <div className="flex justify-center">
                  <PerformancePieChart
                    distribution={rankingDistribution}
                    width={120}
                    height={120}
                    showLabels={true}
                    showLegend={true}
                    compact={true}
                    innerRadius={25}
                    outerRadius={50}
                  />
                </div>
              </div>

              {/* Full Ranking Distribution */}
              <div className="p-3 glass-green rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  {/* Phân loại xếp hạng chi tiết (Giỏi =100%, Khá ≥95%, TB ≥90%, Yếu ≥85%, Kém &lt;85%): */}
                  {` Phân loại xếp hạng chi tiết: (Giỏi > 90%, Khá ≥80%, TB ≥70%, Yếu <70%)`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {rankingStats.excellent > 0 && (
                    <Badge
                      style={{
                        backgroundColor: "#d946ef",
                        color: "white",
                        borderColor: "#d946ef",
                      }}
                    >
                      Giỏi: {rankingStats.excellent}
                    </Badge>
                  )}
                  {rankingStats.good > 0 && (
                    <Badge
                      style={{
                        backgroundColor: "#22c55e",
                        color: "white",
                        borderColor: "#22c55e",
                      }}
                    >
                      Khá: {rankingStats.good}
                    </Badge>
                  )}
                  {rankingStats.average > 0 && (
                    <Badge
                      style={{
                        backgroundColor: "#eab308",
                        color: "white",
                        borderColor: "#eab308",
                      }}
                    >
                      Trung bình: {rankingStats.average}
                    </Badge>
                  )}
                  {rankingStats.poor > 0 && (
                    <Badge
                      style={{
                        backgroundColor: "#f97316",
                        color: "white",
                        borderColor: "#f97316",
                      }}
                    >
                      Yếu: {rankingStats.poor}
                    </Badge>
                  )}
                  {/* {rankingStats.fail > 0 && (
                    <Badge
                      style={{
                        backgroundColor: "#dc2626",
                        color: "white",
                        borderColor: "#dc2626",
                      }}
                    >
                      Kém: {rankingStats.fail}
                    </Badge>
                  )} */}
                </div>
              </div>

              {/* Employee Details Table */}
              {transformedUsers.length > 0 && (
                <div className="glass-green rounded-lg border border-green-500/20 p-4">
                  <PositionUsersTable
                    weekNumber={weekNumber}
                    year={year}
                    users={transformedUsers}
                    positionName={positionInfo.name}
                    canEvaluation={canEvaluation}
                  />
                </div>
              )}

              {/* No users message */}
              {transformedUsers.length === 0 && (
                <motion.div
                  className="text-center py-8 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 text-xl">👥</span>
                  </div>
                  <p>Không có dữ liệu nhân viên</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
})

PositionCard.displayName = "PositionCard"
