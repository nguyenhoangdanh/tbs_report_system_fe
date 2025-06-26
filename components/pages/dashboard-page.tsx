'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardData } from '@/hooks/use-statistics'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarCheck2, CalendarDays, BarChart3, Clock3, CheckCircle2, Hourglass, FileText, Info, Activity, Zap } from 'lucide-react'
import { AppLoading } from '@/components/ui/app-loading'
import { StatsCard } from '@/components/dashboard/stats-card'
import type { RecentActivity } from '@/services/statistics.service'

// --- Main DashboardPage ---
function DashboardPage() {
    const { user } = useAuth()
    // Sử dụng query key consistent để automatic invalidation hoạt động
    const { data: dashboardData, isLoading: isDashboardLoading, error, refetch } = useDashboardData()

    // Always call useMemo hooks at the top level
    const now = useMemo(() => new Date(), [])
    const currentYear = useMemo(() => now.getFullYear(), [now])
    const currentMonth = useMemo(() => now.getMonth() + 1, [now])

    // Destructure data properly from the new structure
    const { dashboardStats, activities, weeklyTaskStats, monthlyTaskStats, yearlyTaskStats } = dashboardData || {}

    // Calculate overall dashboard stats - always call this hook
    const overallStats = useMemo(() => {
        const totalReports = dashboardStats?.totals?.totalReports || 0
        const completedReports = dashboardStats?.totals?.completedReports || 0
        const completionRate = dashboardStats?.totals?.completionRate || 0
        
        return {
            totalReports,
            completedReports,
            completionRate,
            isExcellent: completionRate >= 90,
            isGood: completionRate >= 70
        }
    }, [dashboardStats])

    // Utility functions - properly memoized with useCallback
    const getActivityColor = useCallback((activity: RecentActivity) => {
        switch (activity.status) {
            case 'completed':
                return 'bg-green-500'
            case 'pending':
                return 'bg-orange-500'
            default:
                return 'bg-blue-500'
        }
    }, [])

    const getActivityIcon = useCallback((activity: RecentActivity) => {
        switch (activity.status) {
            case 'completed':
                return <CheckCircle2 className="text-green-500 w-5 h-5" />
            case 'pending':
                return <Hourglass className="text-orange-500 w-5 h-5" />
            default:
                return <FileText className="text-blue-500 w-5 h-5" />
        }
    }, [])

    // Get month and year stats - always calculate these
    const monthStat = useMemo(() => 
        monthlyTaskStats?.stats?.find((item: any) => item.month === currentMonth),
        [monthlyTaskStats, currentMonth]
    )
    
    const yearStat = useMemo(() => 
        yearlyTaskStats?.stats?.find((item: any) => item.year === currentYear),
        [yearlyTaskStats, currentYear]
    )

    // Effect để handle manual refetch nếu cần thiết (optional)
    // Thường không cần vì cache invalidation tự động hoạt động
    useEffect(() => {
        // Có thể thêm logic để refetch khi cần thiết
        // Nhưng với invalidation đúng cách thì không cần
    }, [])

    // Now handle conditional rendering after all hooks
    if (!user) {
        return <AppLoading text="Đang xác thực..." />
    }

    if (isDashboardLoading) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-6 py-6">
                        <AppLoading text="Đang tải dữ liệu dashboard..." minimal={false} />
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
                        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-red-600 dark:text-red-400 mb-4">
                                        Không thể tải dữ liệu dashboard
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Thử lại
                                    </button>
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

                    {/* Current Week Alert */}
                    {dashboardStats?.currentWeek?.incompleteTasksAnalysis && 
                     dashboardStats.currentWeek.incompleteTasksAnalysis.totalIncompleteTasks > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Info className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                                                    📋 Thông báo tuần hiện tại
                                                </h3>
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                    Tuần {dashboardStats.currentWeek.weekNumber}/{dashboardStats.currentWeek.year}
                                                </Badge>
                                            </div>
                                            <p className="text-amber-700 dark:text-amber-300 mb-3">
                                                Bạn có <strong>{dashboardStats.currentWeek.incompleteTasksAnalysis.totalIncompleteTasks}</strong> công việc 
                                                chưa hoàn thành trong tổng số <strong>{dashboardStats.currentWeek.incompleteTasksAnalysis.totalTasks}</strong> công việc tuần này.
                                            </p>
                                            {dashboardStats.currentWeek.incompleteTasksAnalysis.reasons.length > 0 && (
                                                <div className="text-sm text-amber-600 dark:text-amber-400">
                                                    <strong>Lý do chính:</strong> &quot;{dashboardStats.currentWeek.incompleteTasksAnalysis.reasons[0].reason}&quot;
                                                    {dashboardStats.currentWeek.incompleteTasksAnalysis.reasons.length > 1 && 
                                                        ` và ${dashboardStats.currentWeek.incompleteTasksAnalysis.reasons.length - 1} lý do khác`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Stats Cards Grid */}
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Weekly Stats */}
                        <StatsCard
                            title="Công việc tuần này"
                            total={weeklyTaskStats?.total || 0}
                            completed={weeklyTaskStats?.completed || 0}
                            uncompleted={weeklyTaskStats?.uncompleted || 0}
                            period={`Tuần ${weeklyTaskStats?.weekNumber}/${weeklyTaskStats?.year}`}
                            link="/reports"
                            linkFilter="week"
                            icon={<CalendarDays className="w-6 h-6 text-green-600 dark:text-green-400" />}
                            color="text-green-600"
                            bgColor="bg-green-50 dark:bg-green-950/20"
                            incompleteReasons={weeklyTaskStats?.incompleteReasonsAnalysis || []}
                            isLoading={!weeklyTaskStats}
                        />

                        {/* Monthly Stats */}
                        <StatsCard
                            title="Công việc tháng này"
                            subtitle={`Tháng ${currentMonth}/${currentYear}`}
                            total={monthStat?.total || 0}
                            completed={monthStat?.completed || 0}
                            uncompleted={monthStat?.uncompleted || 0}
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
                            total={yearStat?.total || 0}
                            completed={yearStat?.completed || 0}
                            uncompleted={yearStat?.uncompleted || 0}
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
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Clock3 className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-foreground">Hoạt động gần đây</CardTitle>
                                        <p className="text-sm text-muted-foreground">5 báo cáo được cập nhật gần nhất</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {activities && activities.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {activities.map((activity: RecentActivity, index: number) => (
                                            <motion.div
                                                key={activity.id}
                                                className="flex items-start space-x-4 p-6 hover:bg-muted/30 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                            >
                                                <div className={`w-3 h-3 ${getActivityColor(activity)} rounded-full mt-2 flex-shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-foreground font-medium">{activity.title}</p>
                                                    <p className="text-muted-foreground text-sm">{activity.description}</p>
                                                    
                                                    {activity.incompleteTasksCount > 0 && activity.mostCommonIncompleteReason && (
                                                        <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Zap className="w-4 h-4 text-orange-500" />
                                                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                                                    {activity.incompleteTasksCount} công việc chưa xong
                                                                </span>
                                                                <span className="text-orange-400">•</span>
                                                                <span className="text-xs text-orange-600 dark:text-orange-400">
                                                                    &quot;{activity.mostCommonIncompleteReason}&quot;
                                                                </span>
                                                            </div>
                                                            {/* Display sample tasks if available */}
                                                            {activity.incompleteTasksSample && activity.incompleteTasksSample.length > 0 && (
                                                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                                                    <span className="font-medium">Ví dụ:</span>{' '}
                                                                    {activity.incompleteTasksSample.map((task, idx) => (
                                                                        <span key={idx}>
                                                                            {task.taskName}
                                                                            {idx < activity.incompleteTasksSample!.length - 1 ? ', ' : ''}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
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
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock3 className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Chưa có hoạt động nào</h3>
                                        <p className="text-muted-foreground">Bắt đầu tạo báo cáo để theo dõi hoạt động của bạn</p>
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
