"use client"

import { memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Target,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { UserDetails } from '@/types/hierarchy'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import { PerformanceBadge } from '@/components/ui/performance-badge'
import { getPerformanceColor, classifyPerformance } from '@/utils/performance-classification'

interface UserDetailsCardProps {
  data: UserDetails
}

export const UserDetailsCard = memo(function UserDetailsCard({ 
  data 
}: UserDetailsCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWeek = searchParams.get('weekNumber')
  const currentYear = searchParams.get('year')

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
    const colors = getPerformanceColor(rate)
    return colors.text
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

  // Preserve state when navigating to report details - FIXED
  const handleReportNavigation = useCallback((reportId: string) => {
    const params = new URLSearchParams()
    
    // Always preserve current filters from URL
    if (currentWeek) params.set('weekNumber', currentWeek)
    if (currentYear) params.set('year', currentYear)
    
    // Add return destination flag
    params.set('returnTo', 'user-details')
    
    console.log('[USER DETAILS CARD] Navigation params:', {
      currentWeek,
      currentYear,
      reportId,
      finalUrl: `/admin/hierarchy/user/${data.user.id}/report/${reportId}?${params.toString()}`
    })
    
    router.push(`/admin/hierarchy/user/${data.user.id}/report/${reportId}?${params.toString()}`)
  }, [data.user.id, currentWeek, currentYear, router])

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
            <div className="text-sm text-muted-foreground mt-1">
              <p>{data.user.jobPosition?.jobName} - {data.user.jobPosition?.department?.name}</p>
              <p>{data.user.office?.name}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:text-right">
          <div className="text-sm text-muted-foreground">Tỷ lệ hoàn thành CV</div>
          <div className={`text-3xl font-bold ${getPerformanceColor(data.overallStats.taskCompletionRate)}`}>
            {data.overallStats.taskCompletionRate}%
          </div>
          <PerformanceBadge 
            percentage={data.overallStats.taskCompletionRate}
            size="sm"
            showIcon={true}
          />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-6">
          <div className="text-2xl font-bold">{overallStats.totalReports}</div>
          <div className="text-sm text-muted-foreground">Tổng báo cáo</div>
        </Card>
        <Card className="text-center p-6">
          <div className="text-2xl font-bold text-emerald-600">{overallStats.completedReports}</div>
          <div className="text-sm text-muted-foreground">BC hoàn thành</div>
        </Card>
        <Card className="text-center p-6">
          <div className="text-2xl font-bold text-blue-600">{overallStats.reportCompletionRate}%</div>
          <div className="text-sm text-muted-foreground">Tỷ lệ HT BC</div>
        </Card>
        <Card className="text-center p-6">
          <div className="text-2xl font-bold text-purple-600">{overallStats.taskCompletionRate}%</div>
          <div className="text-sm text-muted-foreground">Tỷ lệ HT CV</div>
        </Card>
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {sortedReports.length} báo cáo
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {sortedReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có báo cáo nào</p>
              </div>
            ) : (
              sortedReports.map((report, index) => {
                const classification = classifyPerformance(report.stats.taskCompletionRate)
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-background to-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                Tuần {report.weekNumber}/{report.year}
                              </h3>
                              <PerformanceBadge 
                                percentage={report.stats.taskCompletionRate}
                                size="sm"
                                showIcon={true}
                              />
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
                          
                          <div className="flex items-center gap-4">
                            <SimplePieChart
                              completed={report.stats.completedTasks}
                              incomplete={report.stats.incompleteTasks}
                              size={56}
                              strokeWidth={6}
                              className="hidden sm:block"
                            />
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleReportNavigation(report.id)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Xem chi tiết</span>
                              <span className="sm:hidden">Xem</span>
                            </Button>
                          </div>
                        </div>

                        {/* Report Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-lg font-bold">{report.stats.totalTasks}</div>
                            <div className="text-xs text-muted-foreground">Tổng CV</div>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <div className="text-lg font-bold text-emerald-600">{report.stats.completedTasks}</div>
                            <div className="text-xs text-muted-foreground">Hoàn thành</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-lg font-bold text-red-600">{report.stats.incompleteTasks}</div>
                            <div className="text-xs text-muted-foreground">Chưa xong</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className={`text-lg font-bold ${getPerformanceColor(report.stats.taskCompletionRate)}`}>
                              {report.stats.taskCompletionRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">Tỷ lệ HT</div>
                          </div>
                        </div>

                        {/* Work Days Breakdown */}
                        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Phân bổ công việc theo ngày
                          </h4>
                          <div className="grid grid-cols-7 gap-2 text-xs">
                            {Object.entries(report.stats.tasksByDay).map(([day, count]) => (
                              <div key={day} className="text-center">
                                <p className="text-muted-foreground capitalize mb-1">
                                  {day === 'monday' ? 'T2' : 
                                   day === 'tuesday' ? 'T3' :
                                   day === 'wednesday' ? 'T4' :
                                   day === 'thursday' ? 'T5' :
                                   day === 'friday' ? 'T6' :
                                   day === 'saturday' ? 'T7' : 'CN'}
                                </p>
                                <p className="font-semibold text-foreground">{count}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Incomplete Reasons */}
                        {report.stats.incompleteReasons.length > 0 && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Lý do chưa hoàn thành ({report.stats.incompleteReasons.length})
                              </span>
                            </div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {report.stats.incompleteReasons.slice(0, 3).map((reason, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium text-amber-800 dark:text-amber-200">
                                    {reason.reason}:
                                  </span>
                                  <span className="text-amber-700 dark:text-amber-300 ml-1">
                                    {reason.count} lần ({reason.tasks.slice(0, 2).join(', ')})
                                  </span>
                                </div>
                              ))}
                              {report.stats.incompleteReasons.length > 3 && (
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                  và {report.stats.incompleteReasons.length - 3} lý do khác...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
