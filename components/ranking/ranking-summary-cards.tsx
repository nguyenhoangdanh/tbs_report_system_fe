import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle } from "lucide-react"

interface RankingSummaryCardsProps {
  summary: {
    totalEmployees: number
    averageCompletionRate: number
    topPerformers: number
    needsImprovement: number
    rankingDistribution: {
      excellent: { count: number; percentage: number }
      good: { count: number; percentage: number }
      average: { count: number; percentage: number }
      belowAverage: { count: number; percentage: number }
      poor: { count: number; percentage: number }
    }
  }
  className?: string
}

export function RankingSummaryCards({ summary, className = "" }: RankingSummaryCardsProps) {
  const excellentAndGood = summary.rankingDistribution.excellent.count + summary.rankingDistribution.good.count
  const poorAndBelowAverage = summary.rankingDistribution.poor.count + summary.rankingDistribution.belowAverage.count
  
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tổng nhân viên
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Đã được xếp loại
          </p>
        </CardContent>
      </Card>

      {/* Average Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tỷ lệ hoàn thành TB
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.averageCompletionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Trung bình toàn bộ
          </p>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Xuất sắc & Tốt
          </CardTitle>
          <Award className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {excellentAndGood}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.totalEmployees > 0 
              ? Math.round((excellentAndGood / summary.totalEmployees) * 100)
              : 0
            }% tổng số
          </p>
        </CardContent>
      </Card>

      {/* Needs Improvement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cần cải thiện
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {poorAndBelowAverage}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.totalEmployees > 0 
              ? Math.round((poorAndBelowAverage / summary.totalEmployees) * 100)
              : 0
            }% tổng số
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
