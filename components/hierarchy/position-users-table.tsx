"use client"

import type React from "react"
import { memo, useCallback, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, BarChart3, ChevronRight, Loader2 } from "lucide-react"
import { getPerformanceBadge, classifyPerformance } from "@/utils/performance-classification"
import { ReportTemplate } from "@/components/reports/report-template"
import { EvaluationDialog } from "@/components/reports/evaluation-dialog"
import { cn } from "@/lib/utils"
import type { PositionUser } from "@/types/hierarchy"
import { useUserDetails } from "@/hooks/use-hierarchy"
import { useInvalidateHierarchyQueries } from "@/hooks/use-reports"
import useUIStateStore from "@/store/ui-state-store"
import { useEvaluationScrollPreservation } from "@/hooks/use-scroll-preservation"
import { AvatarDisplay } from "../ui/avatar-display"

interface PositionUsersTableProps {
  users: PositionUser[]
  positionName: string
  weekNumber: number
  year: number
  canEvaluation?: boolean
}

interface UserDetailProps {
  user: PositionUser
}

// ✅ OPTIMIZED: Simple user detail component with minimal re-renders
const UserDetail = memo(({ user }: UserDetailProps) => {
  const userCompletionRate = user.stats?.taskCompletionRate || 0
  const hasReport = user.stats?.hasReport || false
  const totalTasks = user.stats?.totalTasks || 0
  const completedTasks = user.stats?.completedTasks || 0
  const userClassification = classifyPerformance(userCompletionRate)

  return (
    <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border mt-2">
      {hasReport ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="p-2 sm:p-3 bg-card rounded-lg border">
            <div className="font-medium text-sm sm:text-base">{totalTasks}</div>
            <div className="text-xs text-muted-foreground">Tổng CV</div>
          </div>
          <div className="p-2 sm:p-3 bg-card rounded-lg border">
            <div className="font-medium text-sm sm:text-base">{completedTasks}</div>
            <div className="text-xs text-muted-foreground">Hoàn thành</div>
          </div>
          <div className="p-2 sm:p-3 bg-card rounded-lg border">
            <div className="font-medium text-sm sm:text-base">{totalTasks - completedTasks}</div>
            <div className="text-xs text-muted-foreground">Chưa HT</div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg border bg-card">
            <div className="font-medium text-sm sm:text-base" style={{ color: userClassification.color }}>
              {Math.round(userCompletionRate)}%
            </div>
            <div className="text-xs">Tỷ lệ HT</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 sm:py-4">
          <div className="text-destructive font-medium text-sm sm:text-base">Chưa nộp báo cáo</div>
          <div className="text-xs text-muted-foreground mt-1">
            {user.firstName} {user.lastName} chưa nộp báo cáo tuần
          </div>
        </div>
      )}
    </div>
  )
})

UserDetail.displayName = "UserDetail"

// ✅ ENHANCED: Memoized InlineReportView with stable props
const InlineReportView = memo(({ 
  user, 
  weekNumber, 
  year, 
  canEvaluation, 
  onEvaluationChange 
}: {
  user: PositionUser
  weekNumber: number
  year: number
  canEvaluation?: boolean
  onEvaluationChange?: () => void
}) => {
  // ✅ STABLE: Create stable cache key
  const cacheKey = useMemo(() => 
    `${user.id}-${weekNumber}-${year}`, 
    [user.id, weekNumber, year]
  )
  
  // ✅ OPTIMIZED: Only fetch data when component is mounted with stable enabled
  const userDetails = useUserDetails(
    user.id,
    { weekNumber, year },
    // {
    //   // ✅ CRITICAL: Add stable config to prevent unnecessary refetches
    //   staleTime: 30 * 1000, // 30 seconds
    //   gcTime: 5 * 60 * 1000, // 5 minutes
    //   refetchOnMount: false,
    //   refetchOnWindowFocus: false,
    // }
  )

  // ✅ STABLE: Memoized report data transformation
  const reportData = useMemo(() => {
    if (!userDetails.data?.reports) return null
    
    const found = userDetails.data.reports.find((r) => r.weekNumber === weekNumber && r.year === year)
    if (found) {
      return {
        ...found,
        user: userDetails.data.user,
        userId: userDetails.data.user.id,
      }
    }
    
    if (userDetails.data.reports.length > 0) {
      const first = userDetails.data.reports[0]
      return {
        ...first,
        user: userDetails.data.user,
        userId: userDetails.data.user.id,
      }
    }
    
    return null
  }, [userDetails.data, weekNumber, year])

  // ✅ STABLE: Memoized evaluation change handler
  const stableOnEvaluationChange = useCallback(() => {
    onEvaluationChange?.()
  }, [onEvaluationChange])

  if (userDetails.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Đang tải báo cáo...</span>
      </div>
    )
  }

  if (userDetails.error) {
    return (
      <div className="text-center py-6 text-destructive text-sm bg-destructive/5 rounded-lg border border-destructive/20">
        Lỗi tải báo cáo: {String(userDetails.error)}
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Chưa có báo cáo</h3>
        <p className="text-muted-foreground text-sm">
          {user.firstName} {user.lastName} chưa có báo cáo tuần này
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReportTemplate 
        report={reportData} 
        canEvaluation={canEvaluation}
        onEvaluationChange={stableOnEvaluationChange}
        className="border-0 shadow-none"
      />
    </div>
  )
}, (prevProps, nextProps) => {
  // ✅ CUSTOM: Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.weekNumber === nextProps.weekNumber &&
    prevProps.year === nextProps.year &&
    prevProps.canEvaluation === nextProps.canEvaluation
    // Note: Don't compare onEvaluationChange as it's always different
  )
})

InlineReportView.displayName = "InlineReportView"

export const PositionUsersTable = memo(
  ({ users, positionName, weekNumber, year, canEvaluation }: PositionUsersTableProps) => {
    const { invalidateHierarchyQueries } = useInvalidateHierarchyQueries()
    
    // ✅ ENHANCED: Use store with better table ID
    const tableId = useMemo(() => 
      `position-${positionName}-${weekNumber}-${year}`.replace(/\s+/g, '-').toLowerCase(),
      [positionName, weekNumber, year]
    )

    // ✅ NEW: Add scroll preservation with reset capability
    const { saveCurrentPosition, resetScrollPosition } = useEvaluationScrollPreservation(tableId)
    
    const { setUserExpanded, getUserExpandedState, clearUserExpanded } = useUIStateStore()

    // ✅ NEW: Effect to listen for tab changes and reset if needed
    useEffect(() => {
      const handleTabChange = (event: CustomEvent) => {
        if (event.detail?.resetUI) {
          clearUserExpanded(tableId)
          resetScrollPosition()
        }
      }

      window.addEventListener('hierarchy-tab-change', handleTabChange as EventListener)
      
      return () => {
        window.removeEventListener('hierarchy-tab-change', handleTabChange as EventListener)
      }
    }, [tableId, clearUserExpanded, resetScrollPosition])

    // ✅ ENHANCED: Evaluation change handler that preserves scroll position
    const handleEvaluationChange = useCallback(() => {
      
      // ✅ CRITICAL: Save scroll position before data refresh
      saveCurrentPosition()
      
      // ✅ CRITICAL: Invalidate queries without affecting store state
      invalidateHierarchyQueries()
      
      // ✅ NOTE: expandedStates and scroll position remain unchanged, preserving UI state
    }, [invalidateHierarchyQueries, saveCurrentPosition])

    // ✅ OPTIMIZED: Memoized toggle functions with store
    const toggleUserDetail = useCallback((userId: string) => {
      const currentState = getUserExpandedState(tableId, userId)
      const newState = currentState === 'detail' ? null : 'detail'
      setUserExpanded(tableId, userId, newState)
    }, [tableId, getUserExpandedState, setUserExpanded])

    const toggleUserReport = useCallback((userId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const currentState = getUserExpandedState(tableId, userId)
      const newState = currentState === 'report' ? null : 'report'
      setUserExpanded(tableId, userId, newState)
    }, [tableId, getUserExpandedState, setUserExpanded])

    // ✅ OPTIMIZED: Memoized sorted users
    const sortedUsers = useMemo(() => {
      return [...users].sort((a, b) => {
        const aRate = a.stats?.taskCompletionRate || 0
        const bRate = b.stats?.taskCompletionRate || 0
        return bRate - aRate
      })
    }, [users])

    if (!users || users.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xl sm:text-2xl">👥</span>
          </div>
          <p className="text-sm sm:text-base">Không có nhân viên nào trong chức danh này</p>
        </div>
      )
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Danh sách {positionName} ({users.length} người):
          </h4>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            Sắp xếp theo % hoàn thành
          </Badge>
        </div>

        <div className="space-y-2">
          {sortedUsers.map((userItem, index) => {
            // ✅ ENHANCED: Get expanded state from store
            const expandedState = getUserExpandedState(tableId, userItem.id || "")
            const completionRate = userItem.stats?.taskCompletionRate || 0
            const hasReport = userItem.stats?.hasReport || false
            const userPerformanceBadge = getPerformanceBadge(completionRate)
            const userClassification = classifyPerformance(completionRate)

            return (
              <div key={userItem.id || index} className="border rounded-lg overflow-hidden bg-card">
                {/* ✅ OPTIMIZED: User row with minimal re-renders */}
                <div
                  className="p-2 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors duration-150"
                  onClick={() => toggleUserDetail(userItem.id || "")}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-muted rounded-full text-xs font-medium text-muted-foreground flex-shrink-0">
                        {index + 1}
                      </div>
                      {/* <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <h5 className="font-medium text-sm truncate">
                            {userItem.firstName} {userItem.lastName}
                          </h5>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 text-muted-foreground transition-transform duration-150 flex-shrink-0",
                              expandedState === 'detail' && "rotate-180",
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {userItem.employeeCode} - {userItem.office?.name}
                        </p>
                      </div> */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* <AvatarDisplay 
                          src={userItem.avatar || ""}
                          fallbackText="Avatar"
                          className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                        /> */}
                        {userItem.avatar ? (
                          <AvatarDisplay 
                            src={userItem.avatar}
                            fallbackText={`${userItem.firstName[0]}${userItem.lastName[0]}`}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {userItem.firstName[0]}{userItem.lastName[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <h5 className="font-medium text-sm truncate">
                              {userItem.firstName} {userItem.lastName}
                            </h5>
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 text-muted-foreground transition-transform duration-150 flex-shrink-0",
                                expandedState === 'detail' && "rotate-180",
                              )}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {userItem.employeeCode} - {userItem.office?.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {hasReport ? (
                        <>
                          <div className="hidden sm:block">
                            <Badge className={userPerformanceBadge.className} variant={userPerformanceBadge.variant}>
                              {userPerformanceBadge.label}
                            </Badge>
                          </div>
                          <div
                            className="text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border"
                            style={{
                              color: userClassification.color,
                              backgroundColor: userClassification.bgColor,
                              borderColor: userClassification.borderColor,
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

                      {hasReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "text-xs h-6 w-6 p-0 sm:h-8 sm:w-8 hover:bg-muted transition-colors",
                            expandedState === 'report' && "bg-blue-100 text-blue-600"
                          )}
                          onClick={(e) => toggleUserReport(userItem.id || "", e)}
                        >
                          {expandedState === 'report' ? (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ✅ OPTIMIZED: Conditional expansion with smooth transitions */}
                {expandedState === 'detail' && (
                  <div className="border-t animate-in slide-in-from-top-1 duration-200">
                    <UserDetail user={userItem} />
                  </div>
                )}

                {expandedState === 'report' && hasReport && (
                  <div className="border-t animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4">
                      <div className="mb-4 pb-2 border-b">
                        <h3 className="font-semibold text-base">
                          📊 Báo cáo của {userItem.firstName} {userItem.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {userItem.jobPosition?.jobName} - {userItem.office?.name}
                        </p>
                      </div>
                      
                      <InlineReportView
                        user={userItem}
                        weekNumber={weekNumber}
                        year={year}
                        canEvaluation={canEvaluation}
                        onEvaluationChange={handleEvaluationChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ✅ GLOBAL: EvaluationDialog renders globally when needed */}
        <EvaluationDialog onEvaluationChange={handleEvaluationChange} />
      </div>
    )
  },
)

PositionUsersTable.displayName = "PositionUsersTable"
