"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { Building2, FileText, TrendingUp, BarChart3 } from 'lucide-react'
import type { OfficesOverviewResponse } from '@/types/hierarchy'

interface OfficesOverviewCardProps {
  data: OfficesOverviewResponse
}

export const OfficesOverviewCard = memo(function OfficesOverviewCard({ 
  data 
}: OfficesOverviewCardProps) {
  // Memoized calculations for performance
  const summaryStats = useMemo(() => ({
    totalUsers: data.summary.totalUsers,
    totalReportsSubmitted: data.summary.totalReportsSubmitted,
    submissionRate: data.summary.averageSubmissionRate,
    totalOffices: data.summary.totalOffices,
    totalDepartments: data.summary.totalDepartments,
  }), [data.summary])

  const sortedOffices = useMemo(() => 
    [...data.offices].sort((a, b) => 
      b.stats.reportSubmissionRate - a.stats.reportSubmissionRate
    ), [data.offices]
  )

  const getPerformanceColor = useMemo(() => (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getPerformanceBadge = useMemo(() => (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', variant: 'default' as const, color: 'bg-green-500' }
    if (rate >= 70) return { label: 'Tốt', variant: 'secondary' as const, color: 'bg-yellow-500' }
    return { label: 'Cần cải thiện', variant: 'destructive' as const, color: 'bg-red-500' }
  }, [])

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardContent className="relative p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{summaryStats.totalOffices}</div>
              <div className="text-sm font-medium text-muted-foreground">Tổng văn phòng</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{summaryStats.totalUsers}</div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Tổng nhân viên</div>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {summaryStats.totalReportsSubmitted} đã nộp BC
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <SimplePieChart
                    completed={summaryStats.totalReportsSubmitted}
                    incomplete={summaryStats.totalUsers - summaryStats.totalReportsSubmitted}
                    size={64}
                    strokeWidth={7}
                    className="drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <CardContent className="relative p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500/10 dark:bg-purple-400/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{summaryStats.totalReportsSubmitted}</div>
              <div className="text-sm font-medium text-muted-foreground">Báo cáo đã nộp</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <CardContent className="relative p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 dark:bg-orange-400/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1 ${getPerformanceColor(summaryStats.submissionRate)}`}>
                {summaryStats.submissionRate}%
              </div>
              <div className="text-sm font-medium text-muted-foreground">Tỷ lệ nộp TB</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Offices List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              Chi tiết các văn phòng
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium border-primary/20 text-primary">
                Tuần {data.weekNumber}/{data.year}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {sortedOffices.map((office, index) => (
              <motion.div
                key={office.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="h-full"
              >
                <ResponsiveCard
                  title={office.name}
                  subtitle={office.description}
                  badges={[
                    { 
                      label: getPerformanceBadge(office.stats.reportSubmissionRate).label,
                      variant: getPerformanceBadge(office.stats.reportSubmissionRate).variant
                    },
                    { 
                      label: office.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 'Văn phòng nhà máy',
                      variant: 'outline'
                    }
                  ]}
                  stats={[
                    { 
                      label: 'Phòng ban', 
                      value: office.stats.totalDepartments,
                      color: 'text-blue-600 dark:text-blue-400'
                    },
                    { 
                      label: 'Nhân viên', 
                      value: office.stats.totalUsers,
                      color: 'text-foreground'
                    },
                    { 
                      label: 'Đã nộp', 
                      value: office.stats.usersWithReports, 
                      color: 'text-emerald-600 dark:text-emerald-400' 
                    },
                    { 
                      label: 'Hoàn thành', 
                      value: office.stats.completedReports, 
                      color: 'text-purple-600 dark:text-purple-400' 
                    }
                  ]}
                  completed={office.stats.usersWithReports}
                  total={office.stats.totalUsers}
                  completionRate={office.stats.reportSubmissionRate}
                  detailsUrl={`/admin/hierarchy/office/${office.id}`}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
