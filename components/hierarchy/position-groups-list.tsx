'use client'

import { memo } from 'react'
import { PositionCard } from './position-card'

// Fix: Update interface để match với PositionCard props
interface PositionData {
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
    code?: string
    description?: string
    department?: {
      id: string
      name: string
      office?: {
        id: string
        name: string
      }
    }
    position?: {
      id: string
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
    rankingDistribution?: any
    users?: any[]
  }
  userCount: number
  departmentBreakdown?: any[]
  users?: any[]
}

interface PositionGroupsListProps {
  positions: PositionData[]
  filterDisplayText?: string
  isManagement?: boolean
  isJobPosition?: boolean
}

export const PositionGroupsList = memo(
  ({
    positions,
    filterDisplayText,
    isManagement,
    isJobPosition,
  }: PositionGroupsListProps) => {
    if (!positions || positions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Không có dữ liệu {isJobPosition ? 'vị trí công việc' : 'chức danh'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {positions.map((position, index) => (
          <PositionCard
            key={position.position?.id || position.jobPosition?.id || index}
            position={position}
          />
        ))}
      </div>
    )
  },
)

PositionGroupsList.displayName = 'PositionGroupsList'
