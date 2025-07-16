"use client"

import { memo, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Users, AlertTriangle } from 'lucide-react'
import { PositionData } from "@/utils/hierarchy-utils"

interface OverviewTabProps {
  positions: PositionData[]
  jobPositions: PositionData[]
  userPermissions: any
  filterDisplayText: string
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export const OverviewTab = memo(
  ({ positions, jobPositions, userPermissions, filterDisplayText }: OverviewTabProps) => {
    const managementPositions = useMemo(() => {
      return positions.filter((pos) => pos.position?.isManagement === true)
    }, [positions])

    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {managementPositions.length > 0 && userPermissions.canViewPositions && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-gradient shadow-green-glow">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-green-gradient">
                Cấp Quản Lý ({managementPositions.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managementPositions.map((position, index) => {
                const totalUsers = position.stats?.totalUsers || 0
                const avgCompletion = position.stats?.averageCompletionRate || 0

                return (
                  <motion.div
                    key={position.position?.id || `mgmt-${index}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="border-l-4 border-l-green-500 glass-green hover:shadow-green-glow transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-green-700 dark:text-green-300">
                            {position.position?.name || "Vị trí quản lý"}
                          </h4>
                          <Badge variant="outline" className="text-xs glass-green border-green-500/30">
                            {position.position?.description || "Quản lý"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Nhân viên:</span>
                            <span className="text-sm font-medium">{totalUsers}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Đã nộp:</span>
                            <span className="text-sm font-medium text-green-600">
                              {position.stats.usersWithReports}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Tỷ lệ hoàn thành:</span>
                            <span className="text-sm font-medium text-green-600">{avgCompletion}%</span>
                          </div>
                          {position.stats.users.filter((user) => !user.stats.hasReport).length > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Chưa nộp:</span>
                              <span className="text-sm font-medium text-red-600">
                                {position.stats.users.filter((user) => !user.stats.hasReport).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {jobPositions.length > 0 && userPermissions.canViewJobPositions && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-green-gradient shadow-green-glow">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-green-gradient">
                Vị trí công việc ({jobPositions.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobPositions.map((jobPos, index) => (
                <motion.div
                  key={jobPos.jobPosition?.id || `job-${index}`}
                  className="p-4 border rounded-lg glass-green hover:shadow-green-glow transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate text-sm text-green-700 dark:text-green-300">
                      {jobPos.jobPosition?.jobName || "Vị trí công việc"}
                    </h4>
                    <Badge variant="secondary" className="text-xs glass-green border-green-500/30">
                      {jobPos.userCount || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {jobPos.jobPosition?.department?.name || "Phòng ban"}
                  </div>
                  <div className="text-xs text-green-600">
                    {jobPos.stats?.usersWithReports || 0}/{jobPos.userCount || 0} đã nộp (
                    {Math.round(jobPos.stats?.submissionRate || 0)}%)
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {positions.length === 0 && jobPositions.length === 0 && (
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
            <p className="text-muted-foreground">Không tìm thấy dữ liệu cho {filterDisplayText}</p>
          </motion.div>
        )}
      </motion.div>
    )
  },
)

OverviewTab.displayName = "OverviewTab"
