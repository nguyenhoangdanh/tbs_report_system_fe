'use client'

import { memo, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Target
} from 'lucide-react'
import type { WeeklyReport } from '@/types'

interface ReportStatsProps {
  reports: WeeklyReport[]
  isLoading?: boolean
}

interface StatsData {
  totalReports: number
  completedTasks: number
  incompleteTasks: number
  totalTasks: number
  completionRate: number
  averageTasksPerReport: number
  recentTrend: 'up' | 'down' | 'stable'
  thisWeekStats: {
    hasReport: boolean
    completionRate: number
    tasksCount: number
  }
}

export const ReportStats = memo(function ReportStats({ 
  reports, 
  isLoading = false 
}: ReportStatsProps) {
  const shouldReduceMotion = useReducedMotion()

  // Calculate comprehensive statistics
  const stats = useMemo((): StatsData => {
    if (!reports || reports.length === 0) {
      return {
        totalReports: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        totalTasks: 0,
        completionRate: 0,
        averageTasksPerReport: 0,
        recentTrend: 'stable',
        thisWeekStats: {
          hasReport: false,
          completionRate: 0,
          tasksCount: 0
        }
      }
    }

    const totalReports = reports.length
    let completedTasks = 0
    let totalTasks = 0

    // Calculate task statistics
    reports.forEach(report => {
      if (report.tasks && Array.isArray(report.tasks)) {
        totalTasks += report.tasks.length
        completedTasks += report.tasks.filter(task => task.isCompleted).length
      }
    })

    const incompleteTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const averageTasksPerReport = totalReports > 0 ? Math.round(totalTasks / totalReports) : 0

    // Calculate recent trend (last 3 reports vs previous 3)
    let recentTrend: 'up' | 'down' | 'stable' = 'stable'
    if (reports.length >= 6) {
      const sortedReports = [...reports].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      const recentReports = sortedReports.slice(0, 3)
      const previousReports = sortedReports.slice(3, 6)
      
      const recentRate = calculateGroupCompletionRate(recentReports)
      const previousRate = calculateGroupCompletionRate(previousReports)
      
      if (recentRate > previousRate + 5) recentTrend = 'up'
      else if (recentRate < previousRate - 5) recentTrend = 'down'
    }

    // This week statistics
    const currentWeek = getCurrentWeekNumber()
    const currentYear = new Date().getFullYear()
    const thisWeekReport = reports.find(r => 
      r.weekNumber === currentWeek && r.year === currentYear
    )

    const thisWeekStats = {
      hasReport: !!thisWeekReport,
      completionRate: thisWeekReport ? calculateReportCompletionRate(thisWeekReport) : 0,
      tasksCount: thisWeekReport?.tasks?.length || 0
    }

    return {
      totalReports,
      completedTasks,
      incompleteTasks,
      totalTasks,
      completionRate,
      averageTasksPerReport,
      recentTrend,
      thisWeekStats
    }
  }, [reports])

  // Helper functions
  function calculateGroupCompletionRate(reportGroup: WeeklyReport[]): number {
    let totalTasks = 0
    let completedTasks = 0
    
    reportGroup.forEach(report => {
      if (report.tasks) {
        totalTasks += report.tasks.length
        completedTasks += report.tasks.filter(t => t.isCompleted).length
      }
    })
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  }

  function calculateReportCompletionRate(report: WeeklyReport): number {
    if (!report.tasks || report.tasks.length === 0) return 0
    const completed = report.tasks.filter(t => t.isCompleted).length
    return Math.round((completed / report.tasks.length) * 100)
  }

  function getCurrentWeekNumber(): number {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  }

  const getTrendIcon = () => {
    switch (stats.recentTrend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (stats.recentTrend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-green border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Thống kê báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: 'Tổng báo cáo',
      value: stats.totalReports,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: `${stats.completionRate}%`,
      icon: Target,
      color: stats.completionRate >= 80 ? 'text-green-600' : stats.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: stats.completionRate >= 80 ? 'bg-green-50 dark:bg-green-950/20' : stats.completionRate >= 60 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20'
    },
    {
      title: 'Công việc hoàn thành',
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      title: 'Công việc chưa xong',
      value: stats.incompleteTasks,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    }
  ]

  return (
    <motion.div
      className="space-y-6"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.2 }}
    >
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? {} : { duration: 0.15, delay: index * 0.05 }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
          >
            <Card className={`${stat.bgColor} border-border/50 hover:shadow-lg transition-all duration-200`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analytics */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { duration: 0.2, delay: 0.2 }}
      >
        <Card className="glass-green border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Phân tích chi tiết
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-sm ${getTrendColor()}`}>
                  {stats.recentTrend === 'up' && 'Xu hướng tăng'}
                  {stats.recentTrend === 'down' && 'Xu hướng giảm'}  
                  {stats.recentTrend === 'stable' && 'Ổn định'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến độ hoàn thành công việc</span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
                <div className="text-sm text-muted-foreground">Tổng công việc</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.averageTasksPerReport}</div>
                <div className="text-sm text-muted-foreground">CV/Báo cáo</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.thisWeekStats.hasReport ? stats.thisWeekStats.completionRate : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Tuần này</div>
              </div>
            </div>

            {/* This Week Status */}
            <div className="p-4 rounded-lg border-2 border-dashed">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Báo cáo tuần này</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.thisWeekStats.hasReport 
                      ? `${stats.thisWeekStats.tasksCount} công việc` 
                      : 'Chưa có báo cáo'
                    }
                  </p>
                </div>
                <Badge 
                  variant={stats.thisWeekStats.hasReport ? "default" : "secondary"}
                  className={stats.thisWeekStats.hasReport ? "bg-green-600" : ""}
                >
                  {stats.thisWeekStats.hasReport ? 'Đã nộp' : 'Chưa nộp'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})
