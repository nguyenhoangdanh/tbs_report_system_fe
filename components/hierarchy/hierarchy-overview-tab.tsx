"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Users, AlertTriangle } from 'lucide-react'
import { PositionData } from '@/utils/hierarchy-utils'

interface OverviewTabProps {
  positions: PositionData[]
  jobPositions: PositionData[]
  userPermissions: any
  filterDisplayText: string
}

export const OverviewTab = memo(({
  positions,
  jobPositions,
  userPermissions,
  filterDisplayText
}: OverviewTabProps) => {
  const managementPositions = useMemo(() => {
    return positions.filter(pos => pos.position?.isManagement === true)
  }, [positions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {managementPositions.length > 0 && userPermissions.canViewPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            Cấp Quản Lý ({managementPositions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managementPositions.map((position, index) => {
              const totalUsers = position.stats?.totalUsers || 0
              const avgCompletion = position.stats?.averageCompletionRate || 0

              return (
                <Card key={position.position?.id || `mgmt-${index}`} className="border-l-4 border-l-blue-500 backdrop-blur-sm bg-card/90">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {position.position?.name || 'Vị trí quản lý'}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-background/50">
                        {position.position?.description || 'Quản lý'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Nhân viên:</span>
                        <span className="text-sm font-medium">{totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Đã nộp:</span>
                        <span className="text-sm font-medium text-blue-600">{position.stats.usersWithReports}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Tỷ lệ hoàn thành:</span>
                        <span className="text-sm font-medium text-blue-600">{avgCompletion}%</span>
                      </div>
                      {position.stats.users.filter(user => !user.stats.hasReport).length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Chưa nộp:</span>
                          <span className="text-sm font-medium text-red-600">
                            {position.stats.users.filter(user => !user.stats.hasReport).length}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {jobPositions.length > 0 && userPermissions.canViewJobPositions && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Vị trí công việc ({jobPositions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobPositions.slice(0, 6).map((jobPos, index) => (
              <motion.div
                key={jobPos.jobPosition?.id || `job-${index}`}
                className="p-4 border rounded-lg transition-all duration-200 hover:shadow-md backdrop-blur-sm bg-card/80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate text-sm">
                    {jobPos.jobPosition?.jobName || 'Vị trí công việc'}
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-background/50">
                    {jobPos.userCount || 0}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {jobPos.jobPosition?.department?.name || 'Phòng ban'}
                </div>
                <div className="text-xs text-green-600">
                  {jobPos.stats?.usersWithReports || 0}/{jobPos.userCount || 0} đã nộp
                  ({Math.round(jobPos.stats?.submissionRate || 0)}%)
                </div>
              </motion.div>
            ))}
          </div>

          {jobPositions.length > 6 && (
            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-background/50">
                Còn {jobPositions.length - 6} vị trí khác
              </Badge>
            </div>
          )}
        </div>
      )}

      {positions.length === 0 && jobPositions.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">
            Không tìm thấy dữ liệu cho {filterDisplayText}
          </p>
        </div>
      )}
    </motion.div>
  )
})

OverviewTab.displayName = 'OverviewTab'
