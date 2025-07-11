import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Building, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getPerformanceBadge } from '@/utils/performance-classification'
import type { ManagementHierarchyResponse, StaffHierarchyResponse } from '@/types/hierarchy'

interface SummaryCardsProps {
  summary: ManagementHierarchyResponse['summary'] | StaffHierarchyResponse['summary']
}

const SummaryCard = memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badge 
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: { text: string; className: string }
}) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {badge && (
        <Badge className={`${badge.className} mt-2`}>
          {badge.text}
        </Badge>
      )}
    </CardContent>
  </Card>
))

SummaryCard.displayName = 'SummaryCard'

export const SummaryCards = memo(({ summary }: SummaryCardsProps) => {
  const submissionBadge = getPerformanceBadge(summary.averageSubmissionRate)
  const completionBadge = getPerformanceBadge(summary.averageCompletionRate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Tổng nhân viên"
        value={summary.totalUsers}
        subtitle={`${'totalPositions' in summary ? summary.totalPositions : summary.totalJobPositions} đơn vị`}
        icon={Users}
      />

      <SummaryCard
        title="Đã nộp báo cáo"
        value={summary.totalUsersWithReports}
        badge={{
          text: `${summary.averageSubmissionRate}%`,
          className: submissionBadge.className
        }}
        icon={Building}
      />

      <SummaryCard
        title="Hoàn thành"
        value={'totalUsersWithCompletedReports' in summary ? (summary.totalUsersWithCompletedReports as number) : 0}
        badge={{
          text: `${summary.averageCompletionRate}%`,
          className: completionBadge.className
        }}
        icon={CheckCircle2}
      />

      <SummaryCard
        title="Cần theo dõi"
        value={summary.totalUsers - summary.totalUsersWithReports}
        subtitle="chưa nộp báo cáo"
        icon={AlertTriangle}
      />
    </div>
  )
})

SummaryCards.displayName = 'SummaryCards'
