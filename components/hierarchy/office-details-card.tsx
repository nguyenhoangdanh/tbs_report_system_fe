"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { Building2, BarChart3 } from 'lucide-react'
import type { OfficeDetails } from '@/types/hierarchy'

interface OfficeDetailsCardProps {
  data: OfficeDetails
}

export const OfficeDetailsCard = memo(function OfficeDetailsCard({ 
  data 
}: OfficeDetailsCardProps) {
  // Memoized calculations for performance
  const summaryStats = useMemo(() => ({
    totalDepartments: data.summary.totalDepartments,
    totalUsers: data.summary.totalUsers,
    totalReportsSubmitted: data.summary.totalReportsSubmitted,
    averageSubmissionRate: data.summary.averageSubmissionRate,
  }), [data.summary])

  const sortedDepartments = useMemo(() => 
    [...data.departments].sort((a, b) => 
      b.stats.reportSubmissionRate - a.stats.reportSubmissionRate
    ), [data.departments]
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
      {/* Office Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Building2 className="w-7 h-7 text-blue-600" />
                {data.office.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">
                  {data.office.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 'Văn phòng nhà máy'}
                </Badge>
                <Badge variant="secondary">
                  Tuần {data.weekNumber}/{data.year}
                </Badge>
              </div>
            </div>
            
            {/* Office Summary with Pie Chart */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <SimplePieChart
                  completed={summaryStats.totalReportsSubmitted}
                  incomplete={summaryStats.totalUsers - summaryStats.totalReportsSubmitted}
                  size={100}
                  strokeWidth={10}
                  showLabel
                />
                <p className="text-xs text-muted-foreground mt-2">Tỷ lệ nộp BC</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tỷ lệ nộp trung bình</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(summaryStats.averageSubmissionRate)}`}>
                  {summaryStats.averageSubmissionRate}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {data.office.description && (
          <CardContent>
            <p className="text-muted-foreground">{data.office.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Chi tiết các phòng ban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDepartments.map((department, index) => (
              <motion.div
                key={department.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ResponsiveCard
                  title={department.name}
                  subtitle={department.description}
                  badges={[
                    { 
                      label: getPerformanceBadge(department.stats.reportSubmissionRate).label,
                      variant: getPerformanceBadge(department.stats.reportSubmissionRate).variant
                    }
                  ]}
                  stats={[
                    { label: 'Nhân viên', value: department.stats.totalUsers },
                    { label: 'Đã nộp', value: department.stats.usersWithReports, color: 'text-green-600' },
                    { label: 'Hoàn thành', value: department.stats.completedReports, color: 'text-blue-600' },
                    { label: 'Tổng CV', value: department.stats.totalTasks }
                  ]}
                  completed={department.stats.usersWithReports}
                  total={department.stats.totalUsers}
                  completionRate={department.stats.reportSubmissionRate}
                  detailsUrl={`/admin/hierarchy/department/${department.id}`}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
