"use client"

import type React from "react"

import { memo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, BarChart3, X } from "lucide-react"
import { getPerformanceBadge, classifyPerformance } from "@/utils/performance-classification"
import { ReportTemplate } from "@/components/reports/report-template"
import { cn } from "@/lib/utils"
import { ScreenLoading } from "@/components/loading/screen-loading"
import type { PositionUser } from "@/types/hierarchy"
import { useUserDetails } from "@/hooks/use-hierarchy"

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

const UserDetail = memo(({ user }: UserDetailProps) => {
  const userCompletionRate = user.stats?.taskCompletionRate || 0
  const hasReport = user.stats?.hasReport || false
  const totalTasks = user.stats?.totalTasks || 0
  const completedTasks = user.stats?.completedTasks || 0

  const userClassification = classifyPerformance(userCompletionRate)

  return (
    <div className="p-4 glass-green rounded-lg border mt-2 transition-all duration-200">
      {hasReport ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-card rounded-lg border">
              <div className="font-medium text-foreground">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Tổng công việc</div>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <div className="font-medium text-foreground">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <div className="font-medium text-foreground">{totalTasks - completedTasks}</div>
              <div className="text-xs text-muted-foreground">Chưa hoàn thành</div>
            </div>
            <div
              className="p-3 rounded-lg border bg-card"
              style={
                {
                  // backgroundColor: userClassification.bgColor,
                  // borderColor: userClassification.borderColor,
                }
              }
            >
              <div className="font-medium" style={{ color: userClassification.color }}>
                {Math.round(userCompletionRate)}%
              </div>
              <div className="text-xs">Tỷ lệ HT</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-destructive font-medium">Chưa nộp báo cáo</div>
          <div className="text-xs text-muted-foreground">Nhân viên này chưa nộp báo cáo tuần</div>
        </div>
      )}
    </div>
  )
})

UserDetail.displayName = "UserDetail"

export const PositionUsersTable = memo(
  ({ users, positionName, weekNumber, year, canEvaluation }: PositionUsersTableProps) => {
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
    const [selectedUser, setSelectedUser] = useState<PositionUser | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Use hook to always get fresh user details (like AdminOverview)
    const userDetails = useUserDetails(
      selectedUser?.id || "",
      dialogOpen && selectedUser ? { weekNumber, year } : undefined,
    )

    // Get the correct report for the selected week/year
    const reportData =
      userDetails.data && userDetails.data.reports
        ? (() => {
          const found = userDetails.data.reports.find((r) => r.weekNumber === weekNumber && r.year === year)
          if (found) {
            return {
              ...found,
              user: userDetails.data.user,
              userId: userDetails.data.user.id,
              // evaluations: [], // or actual evaluations if available
            }
          }
          // fallback: first report if not found
          if (userDetails.data.reports.length > 0) {
            const first = userDetails.data.reports[0]
            return {
              ...first,
              user: userDetails.data.user,
              userId: userDetails.data.user.id,
              // evaluations: [],
            }
          }
          return null
        })()
        : null

    const toggleUserDetail = (userId: string) => {
      const newExpanded = new Set(expandedUsers)
      if (newExpanded.has(userId)) {
        newExpanded.delete(userId)
      } else {
        newExpanded.add(userId)
      }
      setExpandedUsers(newExpanded)
    }

    const handleViewReport = (user: PositionUser, e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedUser(user)
      setDialogOpen(true)
    }

    if (!users || users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <p>Không có nhân viên nào trong chức danh này</p>
        </div>
      )
    }

    const sortedUsers = [...users].sort((a, b) => {
      const aRate = a.stats?.taskCompletionRate || 0
      const bRate = b.stats?.taskCompletionRate || 0
      return bRate - aRate
    })

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground">
            Danh sách {positionName} ({users.length} người):
          </h4>
          <Badge variant="outline" className="text-xs">
            Sắp xếp theo % hoàn thành
          </Badge>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedUsers.map((userItem, index) => {
            const isExpanded = expandedUsers.has(userItem.id || "")

            const completionRate = userItem.stats?.taskCompletionRate || 0
            const hasReport = userItem.stats?.hasReport || false

            const userPerformanceBadge = getPerformanceBadge(completionRate)
            const userClassification = classifyPerformance(completionRate)

            return (
              <div key={userItem.id || index} className="border rounded-lg overflow-hidden bg-card">
                {/* Compact User Row - Simplified animations */}
                <div
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors duration-150"
                  onClick={() => toggleUserDetail(userItem.id || "")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm truncate">
                            {userItem.firstName} {userItem.lastName}
                          </h5>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 text-muted-foreground transition-transform duration-150",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {userItem.employeeCode} - {userItem.office?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasReport ? (
                        <>
                          <Badge className={userPerformanceBadge.className} variant={userPerformanceBadge.variant}>
                            {userPerformanceBadge.label}
                          </Badge>
                          <div
                            className="text-xs font-medium px-2 py-1 rounded border"
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

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2 hover:bg-muted"
                        onClick={(e) => handleViewReport(userItem, e)}
                      >
                        <BarChart3 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded User Details - Simple slide animation */}
                {isExpanded && (
                  <div className="border-t">
                    <UserDetail user={userItem} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Report Dialog - Fixed positioning to avoid header overlap */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className="w-full h-full sm:max-w-7xl sm:w-[95vw] sm:h-[90vh] bg-white dark:bg-gray-900 rounded-none sm:rounded-xl p-0 m-0 sm:mt-4 sm:mb-4"
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              transform: "none",
              maxHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              ...(window.innerWidth >= 640 && {
                top: "5vh",
                left: "50%",
                right: "auto",
                bottom: "auto",
                transform: "translateX(-50%)",
                maxHeight: "90vh",
                width: "95vw",
                height: "90vh",
                borderRadius: "12px",
              }),
            }}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
              <DialogHeader className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                  Báo cáo của {selectedUser?.firstName} {selectedUser?.lastName}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground truncate">
                  {selectedUser?.position?.description} - {selectedUser?.jobPosition?.jobName} -{" "}
                  {selectedUser?.office?.name}
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                className="ml-2 rounded-full p-1.5 sm:p-2 hover:bg-muted transition flex-shrink-0"
                aria-label="Đóng"
                onClick={() => setDialogOpen(false)}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
              {userDetails.isLoading && <ScreenLoading size="md" variant="dual-ring" />}
              {userDetails.error && (
                <div className="text-center py-8 text-destructive">{String(userDetails.error)}</div>
              )}
              {reportData && <ReportTemplate report={reportData} canEvaluation={canEvaluation} />}
              {!userDetails.isLoading && !reportData && !userDetails.error && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nhân viên này chưa có báo cáo tuần</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  },
)

PositionUsersTable.displayName = "PositionUsersTable"
