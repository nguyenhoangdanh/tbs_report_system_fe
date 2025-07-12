'use client'

import React, { useState, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Users, Award, UserCheck, UserX } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { PositionUsersTable } from './position-users-table'
import { PerformanceBarChart, PerformancePieChart } from '@/components/charts'
import { getPerformanceBadge, classifyPerformance } from '@/utils/performance-classification'

// Fix: Update interface để match với data structure thực tế
interface PositionCardProps {
  position: {
    position?: {
      id: string
      name: string
      level?: number
      description?: string
      isManagement?: boolean
    }
    jobPosition?: {
      id: string
      jobName: string
      department?: {
        name: string
      }
    }
    stats: {
      totalUsers: number
      usersWithReports: number
      usersWithCompletedReports: number
      usersWithoutReports: number
      submissionRate: number
      totalTasks: number
      completedTasks: number
      averageCompletionRate: number
      needsImprovementCount?: number
      positionRanking?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR'
      rankingDistribution?: {
        excellent: { count: number; percentage: number }
        good: { count: number; percentage: number }
        average: { count: number; percentage: number }
        belowAverage: { count: number; percentage: number }
        poor: { count: number; percentage: number }
      }
      users?: any[]
    }
    userCount: number
    departmentBreakdown?: any[]
    users?: any[]
  }
}

export const PositionCard = memo(({ position }: PositionCardProps) => {
  const [showDetails, setShowDetails] = useState(false)

  // Extract position information
  const positionInfo = {
    id: position.position?.id || position.jobPosition?.id || '',
    name: position.position?.name || position.jobPosition?.jobName || 'Vị trí không xác định',
    description: position.position?.description || position.jobPosition?.department?.name || '',
    isManagement: position.position?.isManagement || false
  }

  // Fix: Use averageCompletionRate instead of submissionRate for performance display
  const completionRate = position.stats.averageCompletionRate || 0
  const submissionRate = position.stats.submissionRate || 0
  const positionClassification = classifyPerformance(completionRate)
  const positionBadge = getPerformanceBadge(completionRate)


  // Create default ranking distribution if not provided
  const rankingDistribution = position.stats.rankingDistribution || {
    excellent: { count: 0, percentage: 0 },
    good: { count: 0, percentage: 0 },
    average: { count: 0, percentage: 0 },
    belowAverage: { count: 0, percentage: 0 },
    poor: { count: 0, percentage: 0 }
  }

  const getRankingStats = () => {
    return {
      excellent: rankingDistribution.excellent?.count || 0,
      good: rankingDistribution.good?.count || 0,
      average: rankingDistribution.average?.count || 0,
      poor: rankingDistribution.belowAverage?.count || 0,
      fail: rankingDistribution.poor?.count || 0,
    }
  }

  const rankingStats = getRankingStats()

  // Transform users data for the table if available - Fix user data mapping
  const transformedUsers = (position.stats.users || position.users || []).map((user: any) => {

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      email: user.email,
      office: {
        id: user.office?.id || '',
        name: user.office?.name || '',
        type: user.office?.type || ''
      },
      jobPosition: {
        id: user.jobPosition?.id || '',
        jobName: user.jobPosition?.jobName || '',
        department: {
          id: user.jobPosition?.department?.id || '',
          name: user.jobPosition?.department?.name || '',
          office: user.jobPosition?.department?.office || undefined
        }
      },
      stats: {
        hasReport: user.stats?.hasReport || false,
        isCompleted: user.stats?.isCompleted || false,
        totalTasks: user.stats?.totalTasks || 0,
        completedTasks: user.stats?.completedTasks || 0,
        taskCompletionRate: user.stats?.taskCompletionRate || 0
      }
    }
  })

  return (
    <div className="w-full">
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          {/* Main Card Content */}
          <CardContent className="p-4">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              {/* Left Side - Position Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                      {positionInfo.name}
                    </h3>
                    {positionInfo.isManagement && (
                      <Badge variant="secondary" className="text-xs">
                        Quản lý
                      </Badge>
                    )}
                  </div>
                  {positionInfo.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {positionInfo.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Center - Performance Charts */}
              <div className="flex flex-row gap-2 items-center mx-6">
                {/* <PerformanceBarChart
                  distribution={rankingDistribution}
                  width={140}
                  height={60}
                  showLabels={true}
                /> */}
                {/* Or use PieChart instead */}
                <PerformancePieChart 
                  distribution={rankingDistribution}
                  width={120}
                  height={120}
                  showLabels={true}
                  showLegend={true}
                  compact={true}
                  innerRadius={25}
                  outerRadius={50}
                />
              </div>

              {/* Right Side - Quick Stats - Fix: Show completion rate instead of submission rate */}
              <div className="flex items-center gap-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {position.stats.totalUsers}
                    </div>
                    <div className="text-xs text-muted-foreground">Tổng NV</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {position.stats.usersWithReports}
                    </div>
                    <div className="text-xs text-muted-foreground">Đã nộp</div>
                  </div>
                  {/* <div>
                    <div 
                      className="text-lg font-bold"
                      style={{ color: positionClassification.color }}
                    >
                      {Math.round(completionRate)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Hoàn thành</div>
                  </div> */}
                 
                </div>
              </div>
            </div>

            {/* Mobile Layout - Fix: Similar changes for mobile */}
            <div className="md:hidden">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate flex-1">
                    {positionInfo.name}
                  </h3>
                  {positionInfo.isManagement && (
                    <Badge variant="secondary" className="text-xs">
                      Quản lý
                    </Badge>
                  )}
                </div>
                {positionInfo.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {positionInfo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {position.stats.totalUsers}
                    </div>
                    <div className="text-xs text-muted-foreground">Tổng NV</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">
                      {position.stats.usersWithReports}
                    </div>
                    <div className="text-xs text-muted-foreground">Đã nộp</div>
                  </div>
                </div>

                {/* <div className="flex-1 flex justify-center">
                  <PerformanceBarChart
                    distribution={rankingDistribution}
                    width={100}
                    height={45}
                    showLabels={false}
                    compact={true}
                  />
                </div> */}

                <div className="flex flex-col gap-1">
                  <div className="text-center">
                    <div
                      className="text-lg font-bold"
                      style={{ color: positionClassification.color }}
                    >
                      {Math.round(completionRate)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Hoàn thành</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {position.stats.totalUsers} người
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Collapse Button - Bottom Center */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-none rounded-b-lg flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">Chi tiết nhân viên ({position.stats.totalUsers})</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Detailed Content - Expandable */}
          <CollapsibleContent>
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Mobile Stats Grid - Full Version */}
                  <div className="md:hidden grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <UserCheck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-600">
                        {position.stats.usersWithReports}
                      </div>
                      <div className="text-xs text-muted-foreground">Đã nộp</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <Award className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-green-600">
                        {position.stats.usersWithCompletedReports}
                      </div>
                      <div className="text-xs text-muted-foreground">Hoàn thành</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <UserX className="h-5 w-5 text-red-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-red-600">
                        {position.stats.usersWithoutReports}
                      </div>
                      <div className="text-xs text-muted-foreground">Chưa nộp</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(position.stats.averageCompletionRate || 0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Tỷ lệ hoàn thành</div>
                    </div>
                  </div>

                  {/* Performance Charts for Mobile Expanded View */}
                  <div className="md:hidden p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                      Biểu đồ xếp loại chi tiết
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex justify-center">
                        <PerformanceBarChart
                          distribution={rankingDistribution}
                          width={200}
                          height={80}
                          showLabels={true}
                        />
                      </div>
                      <div className="flex justify-center">
                        <PerformancePieChart
                          distribution={rankingDistribution}
                          width={100}
                          height={100}
                          showLabels={true}
                          showLegend={true}
                          compact={true}
                          innerRadius={25}
                          outerRadius={50}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Full Ranking Distribution */}
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phân loại xếp hạng chi tiết (Giỏi =100%, Khá ≥95%, TB ≥90%, Yếu ≥85%, Kém &lt;85%):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rankingStats.excellent > 0 && (
                        <Badge
                          style={{
                            backgroundColor: '#d946ef',
                            color: 'white',
                            borderColor: '#d946ef'
                          }}
                        >
                          Giỏi: {rankingStats.excellent}
                        </Badge>
                      )}
                      {rankingStats.good > 0 && (
                        <Badge
                          style={{
                            backgroundColor: '#22c55e',
                            color: 'white',
                            borderColor: '#22c55e'
                          }}
                        >
                          Khá: {rankingStats.good}
                        </Badge>
                      )}
                      {rankingStats.average > 0 && (
                        <Badge
                          style={{
                            backgroundColor: '#eab308',
                            color: 'white',
                            borderColor: '#eab308'
                          }}
                        >
                          Trung bình: {rankingStats.average}
                        </Badge>
                      )}
                      {rankingStats.poor > 0 && (
                        <Badge
                          style={{
                            backgroundColor: '#f97316',
                            color: 'white',
                            borderColor: '#f97316'
                          }}
                        >
                          Yếu: {rankingStats.poor}
                        </Badge>
                      )}
                      {rankingStats.fail > 0 && (
                        <Badge
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            borderColor: '#dc2626'
                          }}
                        >
                          Kém: {rankingStats.fail}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Employee Details Table */}
                  {transformedUsers.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                      <PositionUsersTable
                        users={transformedUsers}
                        positionName={positionInfo.name}
                      />
                    </div>
                  )}

                  {/* No users message */}
                  {transformedUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                      <p>Không có dữ liệu nhân viên</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
})

PositionCard.displayName = 'PositionCard'
