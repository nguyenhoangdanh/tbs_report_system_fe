'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardData } from '@/hooks/use-statistics'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { CalendarCheck2, CalendarDays, BarChart3, Clock3, CheckCircle2, Hourglass, FileText } from 'lucide-react'
import { AppLoading } from '@/components/ui/app-loading'

// --- Pie Chart Card Component ---
interface TaskPieChartCardProps {
  title: string
  subtitle?: string
  data: { name: string; value: number; fill: string }[]
  total: number
  completed: number
  color: string
  link?: string
  icon?: React.ReactNode
  filter?: string,
  textColor?: string,
}

const TaskPieChartCard = memo(function TaskPieChartCard({
  title,
  subtitle,
  data,
  total,
  completed,
  color,
  link,
  icon,
  filter,
}: TaskPieChartCardProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Custom label for PieChart: show % directly on each slice
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props
    const RADIAN = Math.PI / 180
    // Calculate label position at the middle of the arc
    const radius = innerRadius + (outerRadius - innerRadius) * 0.65
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    // Only show label if value > 0
    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="white" // Sử dụng màu trắng để tương phản tốt với cả màu xanh và cam
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        style={{ 
          textShadow: '0 1px 3px rgba(0,0,0,0.8)', // Tăng shadow để text rõ hơn
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' // Thêm drop-shadow cho độ tương phản tốt hơn
        }}
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    ) : null
  }

  return (
    <Card className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl bg-white dark:bg-card rounded-2xl shadow-lg p-6 md:p-8 mx-auto mb-8 transition-all">
      {/* Left: Info */}
      <div className="flex flex-col items-center md:items-start w-full md:w-1/2 gap-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2  border border-muted-foreground shadow ${color}`}>
          {icon}
        </div>
        <div className="text-base md:text-lg font-semibold text-foreground text-center md:text-left">{title}</div>
        {subtitle && (
          <div className="text-xs md:text-sm text-muted-foreground mb-1 text-center md:text-left">{subtitle}</div>
        )}
        <div className="font-bold text-2xl md:text-3xl text-card-foreground mb-1">{total}</div>
        <div className="text-xs md:text-sm text-muted-foreground mb-1">Tỷ lệ hoàn thành</div>
        <div className={`font-bold text-lg md:text-xl ${color}`}>{percent}%</div>
        {link && (
          <Link
            href={filter ? `${link}?filter=${filter}` : link}
            className="mt-3 text-xs md:text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            Xem tất cả báo cáo
          </Link>
        )}
      </div>
      {/* Right: Chart */}
      <div className="w-full md:w-1/2 flex items-center justify-center mt-6 md:mt-0">
        <div className="w-full max-w-[340px] min-w-[220px]">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={60}
                label={renderPieLabel}
                labelLine={false}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
                  padding: 10,
                }}
                itemStyle={{
                  color: 'var(--foreground)',
                  fontWeight: 500,
                  fontSize: 13,
                }}
                labelStyle={{
                  color: 'var(--muted-foreground)',
                  fontWeight: 400,
                  fontSize: 12,
                }}
              />
              <Legend
                align="center"
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: 8,
                  fontSize: 12,
                  color: 'var(--foreground)',
                  lineHeight: 1.2,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
})

// Utility function to build pie data
function buildTaskPieData(stat?: { completed?: number; uncompleted?: number }) {
  return [
    {
      name: 'Hoàn thành',
      value: stat?.completed || 0,
      fill: '#10b981',
    },
    {
      name: 'Chưa hoàn thành',
      value: stat?.uncompleted || 0,
      fill: '#f59e42',
    },
  ]
}

// --- Main DashboardPage ---
export default function DashboardPage() {
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  
  // Use combined hook for all dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error } = useDashboardData()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Wait for mount to prevent hydration mismatch
  if (!isMounted) {
    return <AppLoading text="Đang khởi tạo..." />
  }

  // Let middleware handle unauthenticated users
  if (!user) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Show loading while fetching all dashboard data
  if (isDashboardLoading) {
    return (
      <MainLayout
        // title="Dashboard"
        // subtitle={`Chào mừng trở lại, ${user.lastName || 'Người dùng'}`}
      >
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-2 sm:px-4 py-6">
            <AppLoading text="Đang tải dữ liệu dashboard..." minimal={false} />
          </div>
        </div>
      </MainLayout>
    )
  }

  // Handle error state
  if (error) {
    return (
      <MainLayout
        // title="Dashboard"
        // subtitle={`Chào mừng trở lại, ${user.lastName || 'Người dùng'}`}
      >
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-2 sm:px-4 py-6">
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

  // All data is loaded, destructure from dashboardData
  const { activities, weeklyTaskStats, monthlyTaskStats, yearlyTaskStats } = dashboardData || {}

  // Utility functions
  const getActivityColor = (activity: any) => {
    switch (activity.status) {
      case 'completed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-orange-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getActivityIcon = (activity: any) => {
    switch (activity.status) {
      case 'completed':
        return <CheckCircle2 className="text-green-500 w-5 h-5" />
      case 'pending':
        return <Hourglass className="text-orange-500 w-5 h-5" />
      default:
        return <FileText className="text-blue-500 w-5 h-5" />
    }
  }

  // Pie chart data for each section
  const weeklyTaskPieData = buildTaskPieData(weeklyTaskStats)
  const monthStat = (monthlyTaskStats?.stats || []).find(item => item.month === currentMonth)
  const monthlyTaskPieData = buildTaskPieData(monthStat)
  const yearStat = (yearlyTaskStats?.stats || []).find(item => item.year === currentYear)
  const yearlyTaskPieData = buildTaskPieData(yearStat)

  // Icon classes
  const iconClass = "w-6 h-6 text-green-600 dark:text-white"
  const iconMonthClass = "w-6 h-6 text-blue-600 dark:text-white"
  const iconYearClass = "w-6 h-6 text-purple-600 dark:text-white"

  // Filter params
  const weekFilter = 'week'
  const monthFilter = `month&month=${currentMonth}&year=${currentYear}`
  const yearFilter = `year&year=${currentYear}`

  return (
    <MainLayout
      // title="Dashboard"
      // subtitle={`Chào mừng trở lại, ${user.lastName || 'Người dùng'}`}
    >
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-2 sm:px-4 py-6">
          {/* Pie Chart Cards Column */}
          <motion.div 
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TaskPieChartCard
              title="Công việc tuần này"
              data={weeklyTaskPieData}
              total={weeklyTaskStats?.total ?? 0}
              completed={weeklyTaskStats?.completed ?? 0}
              color="text-green-600"
              link="/reports"
              icon={<CalendarDays className={iconClass} />}
              filter={weekFilter}
            />
            <TaskPieChartCard
              title="Công việc tháng này"
              subtitle={`(${currentMonth}/${currentYear})`}
              data={monthlyTaskPieData}
              total={monthStat?.total ?? 0}
              completed={monthStat?.completed ?? 0}
              color="text-blue-600"
              link="/reports"
              icon={<CalendarCheck2 className={iconMonthClass} />}
              filter={monthFilter}
            />
            <TaskPieChartCard
              title="Công việc năm nay"
              subtitle={`(${currentYear})`}
              data={yearlyTaskPieData}
              total={yearStat?.total ?? 0}
              completed={yearStat?.completed ?? 0}
              color="text-purple-600"
              link="/reports"
              icon={<BarChart3 className={iconYearClass} />}
              filter={yearFilter}
            />
          </motion.div>

          {/* Recent Activity Section */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Clock3 className="text-white w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">Hoạt động gần đây</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <motion.div 
                        key={activity.id} 
                        className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`w-2 h-2 ${getActivityColor(activity)} rounded-full`}></div>
                        <div className="flex-1">
                          <p className="text-card-foreground font-medium">{activity.title}</p>
                          <p className="text-muted-foreground text-sm">{activity.description}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(activity.updatedAt), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </p>
                        </div>
                        <span className="text-lg">{getActivityIcon(activity)}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chưa có hoạt động nào gần đây</p>
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
