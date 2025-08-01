import { PositionData } from "@/utils/hierarchy-utils"
import { useReducedMotion, motion } from "framer-motion"
import { memo, useMemo } from "react"

interface OverviewCardProps {
  title: string
  count: number
  icon: any
  onClick: () => void
  description?: string
  variant?: "management" | "employee"
  positions?: PositionData[]
  isJobPosition?: boolean
}
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

export const OverviewCard = memo(
  ({
    title,
    count,
    icon: Icon,
    onClick,
    description,
    variant = "management",
    positions = [],
    isJobPosition = false,
  }: OverviewCardProps) => {
    const shouldReduceMotion = useReducedMotion()

    const stats = useMemo(() => {
      if (isJobPosition) {
        let totalEmployees = 0
        let totalFilled = 0
        let totalPending = 0
        let submissionRate = 0

        positions.forEach((pos) => {
          const users = pos.users || []
          const userCount = users.length

          totalEmployees += userCount
          totalFilled += pos.stats?.usersWithReports || 0
          submissionRate = pos.stats?.submissionRate || 0
          totalPending += userCount - (pos.stats?.usersWithReports || 0)
        })

        return {
          totalEmployees,
          totalFilled,
          totalPending,
          submissionRate,
        }
      } else {
        let totalEmployees = 0
        let totalFilled = 0
        let totalPending = 0
        let submissionRate = 0

        positions.forEach((pos) => {
          const users = pos.users || []
          const userCount = users.length
          totalEmployees += userCount
          totalFilled += pos.stats?.usersWithReports || 0
          submissionRate = pos.stats?.submissionRate || 0
          totalPending += userCount - (pos.stats?.usersWithReports || 0)
        })

        return {
          totalEmployees,
          totalFilled,
          totalPending,
          submissionRate,
        }
      }
    }, [positions, isJobPosition])

    return (
      <motion.div
        whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }} // Reduced from scale: 1.02, y: -5
        whileTap={shouldReduceMotion ? {} : { scale: 0.99 }} // Reduced from 0.98
        transition={shouldReduceMotion ? {} : { type: "spring", stiffness: 400, damping: 25 }} // Faster spring
      >
        <Card
          className="border-border/50 dark:border-border/90 hover:shadow-green-glow transition-all duration-200 cursor-pointer group" // Reduced from 300ms
          onClick={onClick}
        >
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Header - Mobile optimized */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div
                    className={`p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0 transition-transform duration-150 ${variant === "management"
                        ? "bg-warm-gradient shadow-green-glow"
                        : "bg-green-gradient shadow-emerald-glow"}
                      `}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-300 truncate">
                      {title}
                    </h3>
                    {description && (
                      <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600 transition-colors duration-150 flex-shrink-0" /> {/* Reduced transition */}
              </div>

              {/* Statistics - Mobile responsive grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NV:</span>
                    <span className="font-medium">{stats.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã nộp:</span>
                    <span className="font-medium text-green-600">{stats.totalFilled}</span>
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground hidden sm:inline">Tỷ lệ:</span>
                    <span className="text-muted-foreground sm:hidden">TL:</span>
                    <span
                      className={`font-medium ${stats.submissionRate > 80
                        ? "text-green-600"
                        : stats.submissionRate > 50
                          ? "text-yellow-600"
                          : "text-red-600"
                        }`}
                    >
                      {stats.submissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground hidden sm:inline">Chưa nộp:</span>
                    <span className="text-muted-foreground sm:hidden">Chưa:</span>
                    <span className="font-medium text-red-600">{stats.totalPending}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                  <motion.div
                    className={`h-1.5 sm:h-2 rounded-full ${stats.submissionRate > 80
                      ? "bg-green-500"
                      : stats.submissionRate > 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                      }`}
                    initial={shouldReduceMotion ? { width: `${stats.submissionRate}%` } : { width: 0 }}
                    animate={{ width: `${stats.submissionRate}%` }}
                    transition={shouldReduceMotion ? {} : { duration: 0.3, ease: "easeOut" }} // Reduced duration
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  },
)

OverviewCard.displayName = "OverviewCard"