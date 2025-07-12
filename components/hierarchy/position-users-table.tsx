'use client'

import React, { memo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye,  ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import { getPerformanceBadge, classifyPerformance } from '@/utils/performance-classification'
import Link from 'next/link'

// Fix: Update interface để match với backend response structure
interface PositionUser {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  office: {
    id: string
    name: string
    type?: string
  }
  jobPosition: {
    id: string
    jobName: string
    department: {
      id: string
      name: string
      office?: {
        id: string
        name: string
      }
    }
  }
  stats: {
    hasReport: boolean
    isCompleted: boolean
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
  }
}

interface PositionUsersTableProps {
  users: PositionUser[]
  positionName: string
}

interface UserDetailProps {
  user: PositionUser
}

// Component để hiển thị chi tiết user trong collapse
const UserDetail = memo(({ user }: UserDetailProps) => {
  
  const userCompletionRate = user.stats?.taskCompletionRate || 0
  const hasReport = user.stats?.hasReport || false
  const totalTasks = user.stats?.totalTasks || 0
  const completedTasks = user.stats?.completedTasks || 0

  const userPerformanceBadge = getPerformanceBadge(userCompletionRate)
  const userClassification = classifyPerformance(userCompletionRate)


  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="text-gray-500">Chức vụ:</span>
            <span className="ml-2 font-medium">{user.jobPosition?.jobName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Phòng ban:</span>
            <span className="ml-2 font-medium">{user.jobPosition?.department?.name || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Fix: Kiểm tra hasReport và hiển thị đúng dữ liệu */}
      {hasReport ? (
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
              <div className="font-medium text-blue-600">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Tổng công việc</div>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
              <div className="font-medium text-green-600">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
              <div className="font-medium text-yellow-600">
                {totalTasks - completedTasks}
              </div>
              <div className="text-xs text-muted-foreground">Chưa hoàn thành</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: userClassification.bgColor }}>
              <div className="font-medium" style={{ color: userClassification.color }}>
                {Math.round(userCompletionRate)}%
              </div>
              <div className="text-xs text-muted-foreground">Tỷ lệ HT</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t">
          <div className="text-center py-4">
            <div className="text-red-500 font-medium">Chưa nộp báo cáo</div>
            <div className="text-xs text-muted-foreground">Nhân viên này chưa nộp báo cáo tuần</div>
          </div>
        </div>
      )}

      {/* Action buttons section */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Các hành động có sẵn:
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/hierarchy/user/${user.id}`}>
              <Button variant="outline" size="sm" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Thống kê chi tiết
              </Button>
            </Link>

            <Link href={`/admin/hierarchy/user/${user.id}/reports`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Tất cả báo cáo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

UserDetail.displayName = 'UserDetail'

export const PositionUsersTable = memo(({ users, positionName }: PositionUsersTableProps) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  const toggleUserDetail = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Không có nhân viên nào trong chức danh này
      </div>
    )
  }


  // Sort users by completion rate (highest first)
  const sortedUsers = [...users].sort((a, b) => {
    const aRate = a.stats?.taskCompletionRate || 0
    const bRate = b.stats?.taskCompletionRate || 0
    return bRate - aRate
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">
          Danh sách {positionName} ({users.length} người):
        </h4>
        <Badge variant="outline" className="text-xs">
          Sắp xếp theo % hoàn thành
        </Badge>
      </div>

      {/* Compact user list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sortedUsers.map((userItem, index) => {
          const isExpanded = expandedUsers.has(userItem.id || '')
          
          // Fix: Extract correct data với proper mapping
          const completionRate = userItem.stats?.taskCompletionRate || 0
          const hasReport = userItem.stats?.hasReport || false
          const isCompleted = userItem.stats?.isCompleted || false
          
          const userPerformanceBadge = getPerformanceBadge(completionRate)
          const userClassification = classifyPerformance(completionRate)

          return (
            <div key={userItem.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Compact User Row */}
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleUserDetail(userItem.id || '')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm truncate">
                          {userItem.firstName} {userItem.lastName}
                        </h5>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {userItem.employeeCode} - {userItem.office?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Fix: Hiển thị đúng status và performance */}
                    {hasReport ? (
                      <>
                        <Badge className={`${userPerformanceBadge.className} text-xs`}>
                          {userPerformanceBadge.label}
                        </Badge>
                        <div
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{
                            color: userClassification.color,
                            backgroundColor: userClassification.bgColor
                          }}
                        >
                          {Math.round(completionRate)}%
                        </div>
                      </>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Chưa nộp
                      </Badge>
                    )}

                    {/* Quick action button */}
                    <Link href={`/admin/hierarchy/user/${userItem.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                        <BarChart3 className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Expanded User Details */}
              {isExpanded && (
                <UserDetail user={userItem} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

PositionUsersTable.displayName = 'PositionUsersTable'
