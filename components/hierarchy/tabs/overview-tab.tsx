import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Building, AlertTriangle } from 'lucide-react'
import { PerformanceBarChart } from '@/components/charts/performance-bar-chart'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { classifyPerformance } from '@/utils/performance-classification'
import type { ManagementHierarchyResponse, StaffHierarchyResponse } from '@/types/hierarchy'

interface OverviewTabProps {
  positions: any[]
  jobPositions: any[]
  userPermissions: {
    canViewPositions: boolean
    canViewJobPositions: boolean
    userLevel: string
  }
  onShowMorePositions: () => void
  filterDisplayText: string
}

const PositionOverviewCard = memo(({ position }: { position: any }) => {
  const classification = classifyPerformance(position.stats?.submissionRate || 0)
  
  return (
    <Card className="h-full border-l-4 border-l-purple-500 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {position.position?.name || 'Chức danh'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {position.position?.description}
            </p>
          </div>
          <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
            Quản lý
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {position.stats?.totalUsers || 0}
            </div>
            <div className="text-xs text-muted-foreground">Tổng NV</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {position.stats?.usersWithReports || 0}
            </div>
            <div className="text-xs text-muted-foreground">Đã nộp</div>
          </div>
        </div>

        {/* Performance Bar Chart */}
        <div className="flex justify-center mb-4">
          <PerformanceBarChart 
            distribution={position.stats?.rankingDistribution || {
              excellent: { count: 0, percentage: 0 },
              good: { count: 0, percentage: 0 },
              average: { count: 0, percentage: 0 },
              belowAverage: { count: 0, percentage: 0 },
              poor: { count: 0, percentage: 0 }
            }}
            width={160}
            height={80}
            showLabels={true}
          />
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-600" />
            <span>{position.departmentBreakdown?.length || 0} phòng ban</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-purple-600">
              {position.stats?.submissionRate || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Tỷ lệ nộp</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PositionOverviewCard.displayName = 'PositionOverviewCard'

const JobPositionSummary = memo(({ 
  jobPositions, 
  userLevel, 
  onShowMore 
}: { 
  jobPositions: any[]
  userLevel: string
  onShowMore: () => void 
}) => (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="w-5 h-5" />
        {userLevel === 'USER' 
          ? `Vị trí công việc cùng cấp (${jobPositions.length})`
          : `Vị trí công việc khác (${jobPositions.length})`
        }
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }} gap={4}>
        {jobPositions.slice(0, 6).map((jobPos: any, index: number) => (
          <motion.div 
            key={jobPos.jobPosition?.id || `job-${index}`} 
            className="p-4 border rounded-lg transition-all duration-200 hover:shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium truncate">
                {jobPos.jobPosition?.jobName || 'Vị trí công việc'}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {jobPos.userCount || 0} người
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {jobPos.stats?.usersWithReports || 0}/{jobPos.userCount || 0} đã nộp 
              ({jobPos.stats?.submissionRate || 0}%)
            </div>
          </motion.div>
        ))}
      </ResponsiveGrid>
      
      {jobPositions.length > 6 && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={onShowMore}>
            Xem tất cả {jobPositions.length} vị trí
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
))

JobPositionSummary.displayName = 'JobPositionSummary'

export const OverviewTab = memo(({ 
  positions, 
  jobPositions, 
  userPermissions, 
  onShowMorePositions,
  filterDisplayText 
}: OverviewTabProps) => {
  const hasPositions = userPermissions.canViewPositions && positions.length > 0
  const hasJobPositions = userPermissions.canViewJobPositions && jobPositions.length > 0

  if (!hasPositions && !hasJobPositions) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">
            Chưa có dữ liệu cho {filterDisplayText} trong phạm vi quyền của bạn
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Position Cards Grid */}
      {hasPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Cấp quản lý (Positions)</h3>
          <ResponsiveGrid cols={{ default: 1, lg: 2, xl: 3 }} gap={6}>
            {positions.map((position: any, index: number) => (
              <motion.div
                key={position.position?.id || `position-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PositionOverviewCard position={position} />
              </motion.div>
            ))}
          </ResponsiveGrid>
        </div>
      )}

      {/* Job Positions Summary */}
      {hasJobPositions && (
        <JobPositionSummary 
          jobPositions={jobPositions}
          userLevel={userPermissions.userLevel}
          onShowMore={onShowMorePositions}
        />
      )}
    </motion.div>
  )
})

OverviewTab.displayName = 'OverviewTab'
