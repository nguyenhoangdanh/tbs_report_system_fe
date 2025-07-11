'use client'

import React, { memo } from 'react'
import { usePositionDetails, useCurrentWeekFilters } from '@/hooks/use-hierarchy'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SimplePieChart } from '@/components/charts/simple-pie-chart'
import type { PositionDetailsResponse, JobPositionStats, UserStats } from '@/types/hierarchy'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PositionEmployeesListProps {
  positionId: string
}

export const PositionEmployeesList = memo(({ positionId }: PositionEmployeesListProps) => {
  const currentWeekFilters = useCurrentWeekFilters()
  
  const { data, isLoading, error } = usePositionDetails(
    positionId, 
    currentWeekFilters.weekNumber,
    currentWeekFilters.year
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" text="Đang tải danh sách nhân viên..." />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Không thể tải danh sách nhân viên" 
        details={error}
      />
    )
  }

  if (!data) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Không có dữ liệu nhân viên
      </div>
    )
  }

  // For "Nhân viên" position, show job positions breakdown
  if (data.groupBy === 'jobPosition' && data.jobPositions) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">
          Phân chia theo vị trí công việc:
        </h4>
        <div className="grid gap-3">
          {data.jobPositions.map((jp: JobPositionStats) => (
            <Card key={jp.jobPosition.id} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-medium">{jp.jobPosition.jobName}</h5>
                    <p className="text-xs text-muted-foreground">
                      {jp.jobPosition.department.name} - {jp.jobPosition.department.office?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SimplePieChart
                      completedPercentage={jp.stats.taskCompletionRate}
                      size={40}
                      showLabel={false}
                    />
                    <Badge 
                      variant={jp.stats.taskCompletionRate >= 85 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {jp.stats.taskCompletionRate}%
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium">{jp.stats.totalUsers}</div>
                    <div className="text-muted-foreground">Nhân viên</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{jp.stats.usersWithReports}</div>
                    <div className="text-muted-foreground">Đã nộp</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{jp.stats.usersWithCompletedReports}</div>
                    <div className="text-muted-foreground">Hoàn thành</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // For other positions, show individual users
  if (data.groupBy === 'user' && data.users) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">
          Danh sách nhân viên:
        </h4>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {data.users.map((user: UserStats) => (
            <Card key={user.user.id} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm truncate">
                      {user.user.firstName} {user.user.lastName}
                    </h5>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.user.employeeCode} - {user.user.jobPosition.jobName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.user.jobPosition.department.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {user.reportStatus.hasReport && (
                      <SimplePieChart
                        completedPercentage={user.reportStatus.taskCompletionRate}
                        size={32}
                        showLabel={false}
                      />
                    )}
                    <div className="text-right">
                      <Badge 
                        variant={user.reportStatus.hasReport ? 
                          (user.reportStatus.isCompleted ? 'default' : 'secondary') : 
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {user.reportStatus.hasReport ? 
                         'Hoàn thành' :
                          'Chưa nộp'
                        }
                      </Badge>
                      {user.reportStatus.hasReport && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.reportStatus.completedTasks}/{user.reportStatus.totalTasks} tasks
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-right">
                  {/* Removed the redirect link - không còn navigate sang trang khác */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      // Có thể mở modal hoặc collapse để hiển thị chi tiết
                      console.log('View user details for:', user.user.id)
                    }}
                  >
                    Chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return null
})

PositionEmployeesList.displayName = 'PositionEmployeesList'
