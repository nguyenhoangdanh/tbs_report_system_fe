import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { PositionCard } from '../position-card'

interface PositionsTabProps {
  positions: any[]
  jobPositions: any[]
  userPermissions: {
    canViewPositions: boolean
    canViewJobPositions: boolean
    userLevel: string
  }
  filterDisplayText: string
}

const JobPositionCard = memo(({ jobPos, index }: { jobPos: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
  >
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-lg">
            {jobPos.jobPosition?.jobName}
          </h4>
          <Badge variant="outline">
            {jobPos.userCount || 0} người
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Phòng ban:</span>
            <span className="text-sm font-medium">
              {jobPos.jobPosition?.department?.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Văn phòng:</span>
            <span className="text-sm font-medium">
              {jobPos.jobPosition?.department?.office?.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Đã nộp báo cáo:</span>
            <Badge variant="secondary">
              {jobPos.stats?.usersWithReports || 0}/{jobPos.userCount || 0}
              ({jobPos.stats?.submissionRate || 0}%)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
))

JobPositionCard.displayName = 'JobPositionCard'

export const PositionsTab = memo(({ 
  positions, 
  jobPositions, 
  userPermissions, 
  filterDisplayText 
}: PositionsTabProps) => {
  const hasPositions = userPermissions.canViewPositions && positions.length > 0
  const hasJobPositions = userPermissions.canViewJobPositions && jobPositions.length > 0

  if (!hasPositions && !hasJobPositions) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">
            Chưa có dữ liệu cho {filterDisplayText}
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
      {/* Management Positions */}
      {hasPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Chi tiết cấp quản lý</h3>
          <div className="space-y-6">
            {positions.map((position: any, index: number) => (
              <motion.div
                key={position.position?.id || `position-detail-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PositionCard position={position} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Job Positions */}
      {hasJobPositions && !hasPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {userPermissions.userLevel === 'USER' 
              ? 'Vị trí công việc cùng cấp' 
              : 'Vị trí công việc'
            }
          </h3>
          <div className="space-y-4">
            {jobPositions.map((jobPos: any, index: number) => (
              <JobPositionCard 
                key={jobPos.jobPosition?.id || `job-detail-${index}`}
                jobPos={jobPos}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
})

PositionsTab.displayName = 'PositionsTab'
