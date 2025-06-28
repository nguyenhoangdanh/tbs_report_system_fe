"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  User, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { UserDetails } from '@/types/hierarchy'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'

interface UserDetailsCardProps {
  data: UserDetails
}

export const UserDetailsCard = memo(function UserDetailsCard({ 
  data 
}: UserDetailsCardProps) {
  // Memoized calculations for performance
  const overallStats = useMemo(() => ({
    totalReports: data.overallStats.totalReports,
    completedReports: data.overallStats.completedReports,
    reportCompletionRate: data.overallStats.reportCompletionRate,
    totalTasks: data.overallStats.totalTasks,
    completedTasks: data.overallStats.completedTasks,
    taskCompletionRate: data.overallStats.taskCompletionRate,
  }), [data.overallStats])

  const sortedReports = useMemo(() => 
    [...data.reports].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.weekNumber - a.weekNumber
    }), [data.reports]
  )

  const getPerformanceColor = useMemo(() => (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getPerformanceBadge = useMemo(() => (rate: number) => {
    if (rate >= 90) return { label: 'Xuất sắc', variant: 'default' as const }
    if (rate >= 70) return { label: 'Tốt', variant: 'secondary' as const }
    return { label: 'Cần cải thiện', variant: 'destructive' as const }
  }, [])

  // Calculate recent performance trend
  const recentTrend = useMemo(() => {
    if (sortedReports.length < 2) return 'stable'
    const recent = sortedReports.slice(0, 3)
    const avgRecent = recent.reduce((sum, r) => sum + r.stats.taskCompletionRate, 0) / recent.length
    
    if (recent.length < 3) return 'stable'
    const older = sortedReports.slice(3, 6)
    if (older.length === 0) return 'stable'
    
    const avgOlder = older.reduce((sum, r) => sum + r.stats.taskCompletionRate, 0) / older.length
    
    if (avgRecent > avgOlder + 5) return 'improving'
    if (avgRecent < avgOlder - 5) return 'declining'
    return 'stable'
  }, [sortedReports])

  const getTrendIcon = useMemo(() => {
    switch (recentTrend) {
      case 'improving': return { icon: TrendingUp, color: 'text-green-600', label: 'Đang cải thiện' }
      case 'declining': return { icon: TrendingUp, color: 'text-red-600 rotate-180', label: 'Cần chú ý' }
      default: return { icon: Target, color: 'text-blue-600', label: 'Ổn định' }
    }
  }, [recentTrend])

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {data.user.firstName.charAt(0)}{data.user.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {data.user.firstName} {data.user.lastName}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{data.user.employeeCode}</Badge>
              <Badge variant="secondary">{data.user.role}</Badge>
              <Badge variant={data.user.isActive ? 'default' : 'destructive'}>
                {data.user.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:text-right">
          <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành CV</div>
          <div className={`text-3xl font-bold ${getPerformanceColor(data.overallStats.taskCompletionRate)}`}>
            {data.overallStats.taskCompletionRate}%
          </div>
          <Badge {...getPerformanceBadge(data.overallStats.taskCompletionRate)} className="text-xs">
            {getPerformanceBadge(data.overallStats.taskCompletionRate).label}
          </Badge>
        </div>
      </div>

      {/* Reports History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Lịch sử báo cáo</span>
              <span className="sm:hidden">Báo cáo</span>
            </CardTitle>
            {/* Admin xem tất cả báo cáo của user này */}
            <Link href={`/admin/hierarchy/user/${data.user.id}/reports`} passHref>
              <Button variant="outline" size="sm" className="text-xs">
                <span className="hidden sm:inline">Xem tất cả</span>
                <span className="sm:hidden">Tất cả</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {data.reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có báo cáo nào</p>
              </div>
            ) : (
              data.reports.map((report, index) => {
                const performanceBadge = getPerformanceBadge(report.stats.taskCompletionRate)
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Mobile Layout */}
                        <div className="block lg:hidden">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">
                                  Tuần {report.weekNumber}/{report.year}
                                </h3>
                                <Badge 
                                  variant={performanceBadge.variant}
                                  className="text-xs"
                                >
                                  {performanceBadge.label}
                                </Badge>
                                {report.isCompleted && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Hoàn thành
                                  </Badge>
                                )}
                                {report.isLocked && (
                                  <Badge variant="secondary" className="text-xs">
                                    🔒 Đã khóa
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Cập nhật {formatDistanceToNow(new Date(report.updatedAt), {
                                  addSuffix: true,
                                  locale: vi
                                })}
                              </p>
                            </div>
                            <Link href={`/admin/hierarchy/user/${data.user.id}/report/${report.id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                Xem
                              </Button>
                            </Link>
                          </div>

                          {/* Report Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Tổng CV</p>
                              <p className="font-semibold">{report.stats.totalTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Hoàn thành</p>
                              <p className="font-semibold text-green-600">{report.stats.completedTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Chưa xong</p>
                              <p className="font-semibold text-red-600">{report.stats.incompleteTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Tỷ lệ HT</p>
                              <p className={`font-semibold ${getPerformanceColor(report.stats.taskCompletionRate)}`}>
                                {report.stats.taskCompletionRate}%
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <Progress value={report.stats.taskCompletionRate} className="h-2" />
                          </div>

                          {/* Work Days Breakdown */}
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Phân bổ công việc theo ngày</h4>
                            <div className="grid grid-cols-7 gap-2 text-xs">
                              {Object.entries(report.stats.tasksByDay).map(([day, count]) => (
                                <div key={day} className="text-center">
                                  <p className="text-muted-foreground capitalize">
                                    {day === 'monday' ? 'T2' : 
                                     day === 'tuesday' ? 'T3' :
                                     day === 'wednesday' ? 'T4' :
                                     day === 'thursday' ? 'T5' :
                                     day === 'friday' ? 'T6' :
                                     day === 'saturday' ? 'T7' : 'CN'}
                                  </p>
                                  <p className="font-semibold">{count}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Incomplete Reasons */}
                          {report.stats.incompleteReasons.length > 0 && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-700">
                                  Lý do chưa hoàn thành
                                </span>
                              </div>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {report.stats.incompleteReasons.slice(0, 3).map((reason, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium text-orange-800">{reason.reason}:</span>
                                    <span className="text-orange-600 ml-1">
                                      {reason.count} lần ({reason.tasks.slice(0, 2).join(', ')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout - Hidden on mobile */}
                        <div className="hidden lg:block">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">
                                  Tuần {report.weekNumber}/{report.year}
                                </h3>
                                <Badge 
                                  variant={performanceBadge.variant}
                                  className="text-xs"
                                >
                                  {performanceBadge.label}
                                </Badge>
                                {report.isCompleted && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Hoàn thành
                                  </Badge>
                                )}
                                {report.isLocked && (
                                  <Badge variant="secondary" className="text-xs">
                                    🔒 Đã khóa
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Cập nhật {formatDistanceToNow(new Date(report.updatedAt), {
                                  addSuffix: true,
                                  locale: vi
                                })}
                              </p>
                            </div>
                            <Link href={`/admin/hierarchy/user/${data.user.id}/report/${report.id}`}>
                              <Button variant="outline" size="sm">
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>

                          {/* Report Stats */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Tổng CV</p>
                              <p className="font-semibold">{report.stats.totalTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Hoàn thành</p>
                              <p className="font-semibold text-green-600">{report.stats.completedTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Chưa xong</p>
                              <p className="font-semibold text-red-600">{report.stats.incompleteTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Tỷ lệ HT</p>
                              <p className={`font-semibold ${getPerformanceColor(report.stats.taskCompletionRate)}`}>
                                {report.stats.taskCompletionRate}%
                              </p>
                            </div>
                          </div>

                          {/* Progress Chart */}
                          <div className="mb-4">
                            <SimplePieChart
                              completed={report.stats.completedTasks}
                              incomplete={report.stats.incompleteTasks}
                              size={60}
                              strokeWidth={6}
                              showLabel
                            />
                          </div>

                          {/* Work Days Breakdown */}
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Phân bổ công việc theo ngày</h4>
                            <div className="grid grid-cols-7 gap-2 text-xs">
                              {Object.entries(report.stats.tasksByDay).map(([day, count]) => (
                                <div key={day} className="text-center">
                                  <p className="text-muted-foreground capitalize">
                                    {day === 'monday' ? 'T2' : 
                                     day === 'tuesday' ? 'T3' :
                                     day === 'wednesday' ? 'T4' :
                                     day === 'thursday' ? 'T5' :
                                     day === 'friday' ? 'T6' :
                                     day === 'saturday' ? 'T7' : 'CN'}
                                  </p>
                                  <p className="font-semibold">{count}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Incomplete Reasons */}
                          {report.stats.incompleteReasons.length > 0 && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-700">
                                  Lý do chưa hoàn thành
                                </span>
                              </div>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {report.stats.incompleteReasons.slice(0, 3).map((reason, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium text-orange-800">{reason.reason}:</span>
                                    <span className="text-orange-600 ml-1">
                                      {reason.count} lần ({reason.tasks.slice(0, 2).join(', ')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
