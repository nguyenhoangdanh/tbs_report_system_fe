"use client"

import { memo } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { PositionCard } from "./position-card"

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
    positionRanking?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR"
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
  weekNumber: number
  year: number
  canEvaluation?: boolean
  onEvaluationChange?: () => void
}

const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 },
  },
}

export const PositionGroupsList = memo(
  ({ positions, filterDisplayText, isManagement, isJobPosition, weekNumber, year, canEvaluation, onEvaluationChange }: PositionGroupsListProps) => {
    const shouldReduceMotion = useReducedMotion()

    if (!positions || positions.length === 0) {
      return (
        <motion.div
          className="text-center py-8"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
          transition={shouldReduceMotion ? undefined : { duration: 0.2 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-green-600 text-2xl">📊</span>
          </div>
          <p className="text-muted-foreground">Không có dữ liệu {isJobPosition ? "vị trí công việc" : "chức danh"}</p>
        </motion.div>
      )
    }

    return (
      <motion.div
        className="space-y-4"
        variants={shouldReduceMotion ? undefined : containerVariants}
        initial={shouldReduceMotion ? false : "initial"}
        animate={shouldReduceMotion ? false : "animate"}
      >
        {positions.map((position, index) => (
          <motion.div
            key={position.position?.id || position.jobPosition?.id || index}
            variants={shouldReduceMotion ? undefined : itemVariants}
            transition={shouldReduceMotion ? undefined : { duration: 0.15 }}
          >
            <PositionCard position={position} weekNumber={weekNumber} year={year} canEvaluation={canEvaluation} />
          </motion.div>
        ))}
      </motion.div>
    )
  },
)

PositionGroupsList.displayName = "PositionGroupsList"
