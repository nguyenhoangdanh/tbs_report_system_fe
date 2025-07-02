"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveCard } from '@/components/hierarchy/responsive-card'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { Building2, BarChart3, AlertCircle } from 'lucide-react'
import type { OfficeDetailsResponse } from '@/types/hierarchy'

interface OfficeDetailsCardProps {
  data: OfficeDetailsResponse | undefined
}

export const OfficeDetailsCard = memo(function OfficeDetailsCard({ 
  data 
}: OfficeDetailsCardProps) {
  // Early return if data is undefined
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không thể tải dữ liệu</h3>
            <p className="text-muted-foreground">
              Dữ liệu văn phòng không khả dụng. Vui lòng thử lại sau.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Memoized calculations for performance with safe defaults
  const summaryStats = useMemo(() => ({
    totalDepartments: data.summary?.totalDepartments ?? 0,
    totalUsers: data.summary?.totalUsers ?? 0,
    totalUsersWithReports: data.summary?.totalUsersWithReports ?? 0,
    averageSubmissionRate: data.summary?.averageSubmissionRate ?? 0,
  }), [data.summary])

  const sortedDepartments = useMemo(() => {
    if (!data.departments || !Array.isArray(data.departments)) {
      return []
    }
    return [...data.departments].sort((a, b) => 
      (b.stats?.reportSubmissionRate ?? 0) - (a.stats?.reportSubmissionRate ?? 0)
    )
  }, [data.departments])

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
                {data.office?.name ?? 'Văn phòng không xác định'}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">
                  {data.office?.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 'Văn phòng nhà máy'}
                </Badge>
                <Badge variant="secondary">
                  Tuần {data.weekNumber ?? 0}/{data.year ?? new Date().getFullYear()}
                </Badge>
              </div>
            </div>
            
            {/* Office Summary with Pie Chart */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <SimplePieChart
                  completed={summaryStats.totalUsersWithReports}
                  incomplete={summaryStats.totalUsers - summaryStats.totalUsersWithReports}
                  size={100}
                  strokeWidth={10}
                />
                <p className="text-xs text-muted-foreground mt-2">Tỷ lệ nộp BC</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tỷ lệ nộp trung bình</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(summaryStats.averageSubmissionRate)}`}>
                  {summaryStats.averageSubmissionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {data.office?.description && (
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
          {sortedDepartments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không có dữ liệu phòng ban</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDepartments.map((department, index) => (
                <motion.div
                  key={department.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ResponsiveCard
                    title={department.name ?? 'Phòng ban không xác định'}
                    subtitle={department.description}
                    badges={[
                      { 
                        label: getPerformanceBadge(department.stats?.reportSubmissionRate ?? 0).label,
                        variant: getPerformanceBadge(department.stats?.reportSubmissionRate ?? 0).variant
                      }
                    ]}
                    stats={[
                      { label: 'Nhân viên', value: department.stats?.totalUsers ?? 0 },
                      { label: 'Đã nộp', value: department.stats?.usersWithReports ?? 0, color: 'text-green-600' },
                      { label: 'Hoàn thành', value: department.stats?.usersWithCompletedReports ?? 0, color: 'text-blue-600' },
                      { label: 'Tổng CV', value: department.stats?.totalTasks ?? 0 }
                    ]}
                    completed={department.stats?.usersWithReports ?? 0}
                    total={department.stats?.totalUsers ?? 0}
                    completionRate={department.stats?.reportSubmissionRate ?? 0}
                    detailsUrl={`/admin/hierarchy/department/${department.id}`}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
