'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/hooks/use-statistics'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarCheck2, CalendarDays, BarChart3, Clock3, CheckCircle2, AlertTriangle, FileText, Info, Zap, Plus, Calendar } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/services/statistics.service'
import { getCurrentWeek, formatWorkWeek, getWorkWeekRange, isInReportingPeriod } from '@/utils/week-utils'
import { useCurrentWeekReport } from '@/hooks/use-reports'
import Link from 'next/link'
import { ScreenLoading } from '../loading/screen-loading'

// --- Main DashboardPage ---
function DashboardPage() {
    const { user, isAuthenticated } = useAuth()
    const { data: dashboardData, isLoading: isDashboardLoading, error, refetch } = useDashboardData()
    const { data: currentWeekReport, refetch: refetchCurrentWeek } = useCurrentWeekReport()

    // Refetch data when user changes
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            refetch()
            refetchCurrentWeek()
        }
    }, [user?.id, isAuthenticated, refetch, refetchCurrentWeek])

    // Work week info using the new logic with debug
    const workWeekInfo = useMemo(() => {
        if (!user?.id) return null
        
        const current = getCurrentWeek()
        
        const { displayInfo } = getWorkWeekRange(current.weekNumber, current.year)
        const isReportingTime = isInReportingPeriod()
        
        return {
            ...current,
            ...displayInfo,
            isReportingTime,
            hasReport: !!currentWeekReport,
            reportingStatus: isReportingTime ? 'active' : 'waiting'
        }
    }, [currentWeekReport, user?.id])

    const now = useMemo(() => new Date(), [])
    const currentYear = useMemo(() => now.getFullYear(), [now])
    const currentMonth = useMemo(() => now.getMonth() + 1, [now])

    // Fixed data destructuring with null checks
    const { 
        dashboardStats, 
        activities = [], 
        weeklyTaskStats, 
        monthlyTaskStats, 
        yearlyTaskStats 
    } = dashboardData || {}

    // Enhanced stats with user context
    const weeklyIncompleteReasons = useMemo(() => {
        return weeklyTaskStats?.incompleteReasonsAnalysis || []
    }, [weeklyTaskStats])

    const monthStat = useMemo(() => {
        if (!monthlyTaskStats?.monthlyStats || !Array.isArray(monthlyTaskStats.monthlyStats)) {
            return { month: currentMonth, completed: 0, uncompleted: 0, total: 0, topIncompleteReasons: [] }
        }
        
        const stat = monthlyTaskStats.monthlyStats.find((item: any) => item.month === currentMonth)
        return stat || { month: currentMonth, completed: 0, uncompleted: 0, total: 0, topIncompleteReasons: [] }
    }, [monthlyTaskStats, currentMonth])
    
    const yearStat = useMemo(() => {
        if (!yearlyTaskStats?.yearlyStats || !Array.isArray(yearlyTaskStats.yearlyStats)) {
            return { year: currentYear, completed: 0, uncompleted: 0, total: 0, topIncompleteReasons: [] }
        }
        
        const stat = yearlyTaskStats.yearlyStats.find((item: any) => item.year === currentYear)
        return stat || { year: currentYear, completed: 0, uncompleted: 0, total: 0, topIncompleteReasons: [] }
    }, [yearlyTaskStats, currentYear])

    // Utility functions for activities
    const getActivityColor = useCallback((activity: RecentActivity) => {
        if (activity.isCompleted) return 'bg-green-500'
        if (activity.stats.incompleteTasks > 0) return 'bg-orange-500'
        return 'bg-blue-500'
    }, [])

    const getActivityIcon = useCallback((activity: RecentActivity) => {
        if (activity.isCompleted) return <CheckCircle2 className="text-green-500 w-5 h-5" />
        if (activity.stats.incompleteTasks > 0) return <AlertTriangle className="text-orange-500 w-5 h-5" />
        return <FileText className="text-blue-500 w-5 h-5" />
    }, [])

    const getActivityTitle = useCallback((activity: RecentActivity) => {
        return formatWorkWeek(activity.weekNumber, activity.year, 'full')
    }, [])

    const getActivityDescription = useCallback((activity: RecentActivity) => {
        const { totalTasks, completedTasks, incompleteTasks } = activity.stats
        if (activity.isCompleted) {
            return `Hoàn thành tất cả ${totalTasks} công việc`
        }
        return `${completedTasks}/${totalTasks} công việc hoàn thành • ${incompleteTasks} chưa hoàn thành`
    }, [])

    // Handle authentication and loading states
    if (!isAuthenticated || !user) {
        return <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
    }

    if (isDashboardLoading || !workWeekInfo) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-6 py-6">
                        <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (error) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-6 py-6">
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                            <CardContent className="p-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                                        Không thể tải dữ liệu dashboard
                                    </h3>
                                    <p className="text-red-600 dark:text-red-400 mb-4">
                                        Vui lòng thử lại sau hoặc liên hệ quản trị viên
                                    </p>
                                    <Button onClick={() => refetch()} variant="outline">
                                        Thử lại
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </MainLayout>
        )
    }


    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-6 py-6 space-y-8">
                    {/* Header with user-specific greeting */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-2"
                    >
                        <h1 className="text-3xl font-bold text-foreground">
                            Chào mừng, {user.firstName} {user.lastName}! 👋
                        </h1>
                        <p className="text-muted-foreground">
                            Tổng quan về hoạt động báo cáo công việc tuần
                        </p>
                    </motion.div>

                    {/* Work Week Status Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                                            <Calendar className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                    {workWeekInfo.weekTitle}
                                                </h3>
                                                <Badge className={`${
                                                    workWeekInfo.isReportingTime 
                                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                                        : 'bg-blue-100 text-blue-700 border-blue-200'
                                                }`}>
                                                    {workWeekInfo.isReportingTime ? 'Đang báo cáo' : 'Chu kỳ chờ'}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                <p><strong>Khoảng thời gian:</strong> {workWeekInfo.dateRange}</p>
                                                <p><strong>Ngày làm việc:</strong> {workWeekInfo.workDaysText}</p>
                                                {/* <p><strong>Ngày báo cáo:</strong> {workWeekInfo.resultDaysText}</p> */}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-row items-center gap-3">
                                        {workWeekInfo.hasReport ? (
                                            <>
                                                <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-center">
                                                    ✅ Đã có báo cáo
                                                </Badge>
                                                <Link href="/reports?filter=week">
                                                    <Button size="sm" className="w-full sm:w-auto">
                                                        Xem báo cáo
                                                    </Button>
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-2 text-center">
                                                    ⏳ Chưa có báo cáo
                                                </Badge>
                                                <Link href="/reports">
                                                    <Button size="sm" className="w-full sm:w-auto flex items-center gap-2">
                                                        <Plus className="w-4 h-4" />
                                                        Tạo báo cáo
                                                    </Button>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* {workWeekInfo.isReportingTime && (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                            <Info className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                Kết quả sẽ được đánh giá vào cuối thứ 5.
                                            </span>
                                        </div>
                                    </div>
                                )} */}
                            </CardContent>
                        </Card>
                    </motion.div>


                    {/* Stats Cards Grid */}
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {/* Weekly Stats */}
                        <StatsCard
                            title="Công việc tuần này"
                            subtitle={`${workWeekInfo.weekTitle}`}
                            total={Number(weeklyTaskStats?.total) || 0}
                            completed={Number(weeklyTaskStats?.completed) || 0}
                            uncompleted={Number(weeklyTaskStats?.uncompleted) || 0}
                            period={workWeekInfo.weekTitle}
                            link="/reports"
                            linkFilter="week"
                            icon={<CalendarDays className="w-6 h-6 text-green-600 dark:text-green-400" />}
                            color="text-green-600"
                            bgColor="bg-green-50 dark:bg-green-950/20"
                            incompleteReasons={weeklyIncompleteReasons}
                            isLoading={!weeklyTaskStats}
                        />

                        {/* Monthly Stats */}
                        <StatsCard
                            title="Công việc tháng này"
                            subtitle={`Tháng ${currentMonth}/${currentYear}`}
                            total={Number(monthStat?.total) || 0}
                            completed={Number(monthStat?.completed) || 0}
                            uncompleted={Number(monthStat?.uncompleted) || 0}
                            period={`Tháng ${currentMonth}/${currentYear}`}
                            link="/reports"
                            linkFilter={`month&month=${currentMonth}&year=${currentYear}`}
                            icon={<CalendarCheck2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                            color="text-blue-600"
                            bgColor="bg-blue-50 dark:bg-blue-950/20"
                            incompleteReasons={monthStat?.topIncompleteReasons || []}
                            isLoading={!monthlyTaskStats}
                        />

                        {/* Yearly Stats */}
                        <StatsCard
                            title="Công việc năm nay"
                            subtitle={`Năm ${currentYear}`}
                            total={Number(yearStat?.total) || 0}
                            completed={Number(yearStat?.completed) || 0}
                            uncompleted={Number(yearStat?.uncompleted) || 0}
                            period={`Năm ${currentYear}`}
                            link="/reports"
                            linkFilter={`year&year=${currentYear}`}
                            icon={<BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                            color="text-purple-600"
                            bgColor="bg-purple-50 dark:bg-purple-950/20"
                            incompleteReasons={yearStat?.topIncompleteReasons || []}
                            isLoading={!yearlyTaskStats}
                        />
                    </motion.div>

                    {/* Recent Activity Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Clock3 className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-foreground">Hoạt động gần đây</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {Array.isArray(activities) ? activities.length : 0} báo cáo gần đây
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {Array.isArray(activities) && activities.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {activities.map((activity: RecentActivity, index: number) => {
                                            const activityTitle = getActivityTitle(activity)
                                            const activityDescription = getActivityDescription(activity)
                                            const topReason = activity.stats.topIncompleteReasons?.[0]
                                            
                                            return (
                                                <motion.div
                                                    key={activity.reportId}
                                                    className="flex items-start space-x-4 p-6 hover:bg-muted/30 transition-colors"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                >
                                                    <div className={`w-3 h-3 ${getActivityColor(activity)} rounded-full mt-2 flex-shrink-0`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-foreground font-medium">{activityTitle}</p>
                                                            {/* <Badge 
                                                                variant={activity.isCompleted ? "default" : "secondary"}
                                                                className={`text-xs ${
                                                                    activity.isCompleted 
                                                                        ? "bg-green-100 text-green-700 border-green-200" 
                                                                        : "bg-orange-100 text-orange-700 border-orange-200"
                                                                }`}
                                                            >
                                                                {activity.isCompleted ? "Hoàn thành" : "Chưa xong"}
                                                            </Badge> */}
                                                        </div>
                                                        <p className="text-muted-foreground text-sm">{activityDescription}</p>
                                                        
                                                        {activity.stats.incompleteTasks > 0 && topReason && (
                                                            <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Zap className="w-4 h-4 text-orange-500" />
                                                                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                                                        {activity.stats.incompleteTasks} công việc chưa hoàn thành
                                                                    </span>
                                                                    {activity.stats.completionRate !== undefined && (
                                                                        <>
                                                                            <span className="text-orange-400">•</span>
                                                                            <span className="text-xs text-orange-600 dark:text-orange-400">
                                                                                {activity.stats.completionRate}% hoàn thành
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                                                    <span className="font-medium">Lý do chính:</span>{' '}
                                                                    &quot;{topReason.reason}&quot;
                                                                    {topReason.count > 1 && ` (${topReason.count} lần)`}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        <p className="text-muted-foreground text-xs mt-2">
                                                            {formatDistanceToNow(new Date(activity.updatedAt), {
                                                                addSuffix: true,
                                                                locale: vi
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-lg flex-shrink-0">{getActivityIcon(activity)}</div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock3 className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Chưa có hoạt động nào</h3>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    )
}

DashboardPage.displayName = 'DashboardPage'

export default DashboardPage
