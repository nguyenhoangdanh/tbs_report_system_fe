"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { Building2, Users, FileText, TrendingUp, BarChart3 } from 'lucide-react'
import type { OfficesOverview } from '@/types/hierarchy'

interface OfficesOverviewCardProps {
  data: OfficesOverview
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
      {/* Summary Cards with equal heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="text-center p-6 h-full summary-card">
            <div className="summary-card-content">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{summaryStats.totalOffices}</div>
              <div className="text-sm text-muted-foreground mt-auto">Tổng văn phòng</div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="text-2xl font-bold">{summaryStats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Tổng nhân viên</div>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {summaryStats.totalReportsSubmitted} đã nộp BC
                </div>
              </div>
              <div className="flex-shrink-0">
                <SimplePieChart
                  completed={summaryStats.totalReportsSubmitted}
                  incomplete={summaryStats.totalUsers - summaryStats.totalReportsSubmitted}
                  size={60}
                  strokeWidth={6}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="text-center p-6 h-full summary-card">
            <div className="summary-card-content">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{summaryStats.totalReportsSubmitted}</div>
              <div className="text-sm text-muted-foreground mt-auto">Báo cáo đã nộp</div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="text-center p-6 h-full summary-card">
            <div className="summary-card-content">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className={`text-2xl font-bold ${getPerformanceColor(summaryStats.submissionRate)}`}>
                {summaryStats.submissionRate}%
              </div>
              <div className="text-sm text-muted-foreground mt-auto">Tỷ lệ nộp TB</div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Offices List with equal heights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Chi tiết các văn phòng
            <Badge variant="outline">Tuần {data.weekNumber}/{data.year}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
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
                    { label: 'Phòng ban', value: office.stats.totalDepartments },
                    { label: 'Nhân viên', value: office.stats.totalUsers },
                    { label: 'Đã nộp', value: office.stats.usersWithReports, color: 'text-green-600' },
                    { label: 'Hoàn thành', value: office.stats.completedReports, color: 'text-blue-600' }
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
