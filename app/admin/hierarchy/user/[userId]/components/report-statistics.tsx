import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, CheckCircle2, Clock, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { safeNumber } from '@/utils/type-guards'

interface ReportStatisticsProps {
  stats: any
  report: any
}

export const ReportStatistics = memo(function ReportStatistics({ stats, report }: ReportStatisticsProps) {
  const totalTasks = safeNumber(stats?.totalTasks, 0)
  const completedTasks = safeNumber(stats?.completedTasks, 0)
  const incompleteTasks = safeNumber(stats?.incompleteTasks, 0)
  const tasksByDay = stats?.tasksByDay || {}

  const statsData = [
    {
      title: 'Tổng CV',
      value: totalTasks,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      description: 'Được giao'
    },
    {
      title: 'Hoàn thành',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      description: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`
    },
    {
      title: 'Chưa hoàn thành',
      value: incompleteTasks,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      description: `${totalTasks > 0 ? Math.round((incompleteTasks / totalTasks) * 100) : 0}%`
    },
    {
      title: 'Ngày làm việc',
      value: tasksByDay ? Object.values(tasksByDay).filter((count: any) => safeNumber(count, 0) > 0).length : 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      description: 'Có công việc'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-3 rounded-lg ${stat.bgColor}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
            </div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.description}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Trạng thái</div>
          <Badge variant={report?.isCompleted ? 'default' : 'secondary'} className="text-xs">
            {report?.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
          </Badge>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Khóa báo cáo</div>
          <Badge variant={report?.isLocked ? 'destructive' : 'outline'} className="text-xs">
            {report?.isLocked ? 'Đã khóa' : 'Có thể sửa'}
          </Badge>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Cập nhật</div>
          <div className="text-xs font-medium">
            {report?.updatedAt ? new Date(report.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  )
})
