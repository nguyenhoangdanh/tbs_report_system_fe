"use client"

import { memo, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, BarChart3, X } from "lucide-react"
import { getPerformanceBadge, classifyPerformance } from "@/utils/performance-classification"
import { ReportTemplate } from "@/components/reports/report-template"
import { cn } from "@/lib/utils"
import { HierarchyService } from "@/services/hierarchy.service"
import { ScreenLoading } from "@/components/loading/screen-loading"
import { PositionUser } from "@/types/hierarchy"


interface PositionUsersTableProps {
  users: PositionUser[]
  positionName: string
  weekNumber: number
  year: number
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
              style={{
                // backgroundColor: userClassification.bgColor,
                // borderColor: userClassification.borderColor,
              }}
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

export const PositionUsersTable = memo(({ users, positionName, weekNumber, year }: PositionUsersTableProps) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PositionUser | null>(null)
  const [reportData, setReportData] = useState<any | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  // Fetch report data when selectedUser changes and dialog is open
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedUser || !selectedUser.id) return
      setLoadingReport(true)
      setReportError(null)
      try {
        // You may want to pass weekNumber/year as props or get current week/year
        const response = await HierarchyService.getUserDetails(selectedUser.id, {
          weekNumber: weekNumber,
          year: year,
        })

        if (response.success && response.data && response.data.reports && response.data.reports.length > 0) {
          // Use the first report for demo, or find the correct one
          setReportData({
            ...response.data.reports[0],
            user: response.data.user,
          })
        } else {
          setReportData(null)
        }
      } catch (err: any) {
        setReportError(err?.message || "Không thể tải báo cáo")
        setReportData(null)
      } finally {
        setLoadingReport(false)
      }
    }
    if (dialogOpen && selectedUser) {
      fetchReport()
    }
  }, [dialogOpen, selectedUser])

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
  });

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

      {/* Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div style={{ marginTop: "72px" }}>
          <DialogContent
            className="max-w-7xl w-full bg-white dark:bg-gray-900 rounded-xl p-0"
            style={{
              padding: 0,
              background: "white",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              minHeight: "20vh",
              maxHeight: "80vh",
              // height: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 rounded-t-xl border-b px-6 py-4 flex items-center justify-between">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Báo cáo của {selectedUser?.firstName} {selectedUser?.lastName}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                 {selectedUser?.position?.description} - {selectedUser?.jobPosition?.jobName} - {selectedUser?.office?.name}
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                className="ml-2 rounded-full p-2 hover:bg-muted transition"
                aria-label="Đóng"
                onClick={() => setDialogOpen(false)}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4">
              {loadingReport && (
                <ScreenLoading size="md" variant="dual-ring" />
              )}
              {reportError && (
                <div className="text-center py-8 text-destructive">{reportError}</div>
              )}
              {reportData && (
                <ReportTemplate report={reportData} />
              )}
              {!loadingReport && !reportData && !reportError && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nhân viên này chưa có báo cáo tuần</p>
                </div>
              )}
            </div>
          </DialogContent>
        </div>
      </Dialog>
    </div>
  )
})

PositionUsersTable.displayName = "PositionUsersTable"

