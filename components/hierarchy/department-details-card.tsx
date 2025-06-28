"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimplePieChart } from "@/components/charts/simple-pie-chart";
import { ResponsiveCard } from "@/components/hierarchy/responsive-card";
import { Building2, User, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { DepartmentDetails } from "@/types/hierarchy";

interface DepartmentDetailsCardProps {
  data: DepartmentDetails;
}

export const DepartmentDetailsCard = memo(function DepartmentDetailsCard({
  data,
}: DepartmentDetailsCardProps) {
  // Memoized calculations for performance
  const summaryStats = useMemo(
    () => ({
      totalUsers: data.summary.totalUsers,
      usersWithReports: data.summary.usersWithReports,
      completedReports: data.summary.completedReports,
      averageTaskCompletion: data.summary.averageTaskCompletion,
    }),
    [data.summary]
  );

  const sortedUsers = useMemo(
    () =>
      [...data.users].sort((a, b) => {
        // Sort by completion rate (descending), then by name
        if (
          a.reportStatus.taskCompletionRate !==
          b.reportStatus.taskCompletionRate
        ) {
          return (
            b.reportStatus.taskCompletionRate -
            a.reportStatus.taskCompletionRate
          );
        }
        return `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      }),
    [data.users]
  );

  const getStatusColor = useMemo(
    () => (user: any) => {
      if (!user.reportStatus.hasReport) return "text-gray-500";
      if (user.reportStatus.isCompleted) return "text-green-600";
      if (user.reportStatus.taskCompletionRate >= 70) return "text-yellow-600";
      return "text-red-600";
    },
    []
  );

  const getStatusBadge = useMemo(
    () => (user: any) => {
      if (!user.reportStatus.hasReport) {
        return {
          label: "Chưa nộp",
          variant: "secondary" as const,
          color: "bg-gray-500",
        };
      }
      if (user.reportStatus.isCompleted) {
        return {
          label: "Hoàn thành",
          variant: "default" as const,
          color: "bg-green-500",
        };
      }
      if (user.reportStatus.taskCompletionRate >= 70) {
        return {
          label: "Đang làm",
          variant: "outline" as const,
          color: "bg-yellow-500",
        };
      }
      return {
        label: "Cần theo dõi",
        variant: "destructive" as const,
        color: "bg-red-500",
      };
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Building2 className="w-7 h-7 text-purple-600" />
                {data.department.name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">{data.department.office.name}</Badge>
                <Badge variant="secondary">
                  Tuần {data.weekNumber}/{data.year}
                </Badge>
              </div>
            </div>

            {/* Department Summary */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <SimplePieChart
                  completed={summaryStats.usersWithReports}
                  incomplete={
                    summaryStats.totalUsers - summaryStats.usersWithReports
                  }
                  size={100}
                  strokeWidth={10}
                  showLabel
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tỷ lệ nộp BC
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Tỷ lệ hoàn thành TB
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {summaryStats.averageTaskCompletion}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        {data.department.description && (
          <CardContent>
            <p className="text-muted-foreground">
              {data.department.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Danh sách nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedUsers.map((user, index) => {
              const statusBadge = getStatusBadge(user);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* Mobile User Card */}
                      <div className="block lg:hidden p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </span>
                          </div>

                          {user.reportStatus.hasReport && (
                            <div className="flex-shrink-0">
                              <SimplePieChart
                                completed={user.reportStatus.completedTasks}
                                incomplete={
                                  user.reportStatus.totalTasks -
                                  user.reportStatus.completedTasks
                                }
                                size={40}
                                strokeWidth={4}
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <h3 className="font-semibold truncate">
                                {user.firstName} {user.lastName}
                              </h3>
                              <Badge
                                variant={statusBadge.variant}
                                className="text-xs"
                              >
                                {statusBadge.label}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Mã: {user.employeeCode}</p>
                              <p>{user.jobPosition.jobName}</p>
                            </div>
                          </div>
                        </div>

                        {user.reportStatus.hasReport && (
                          <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                            <div>
                              <span className="text-muted-foreground">
                                Tổng CV:
                              </span>
                              <span className="font-medium ml-1">
                                {user.reportStatus.totalTasks}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Hoàn thành:
                              </span>
                              <span className="font-medium ml-1 text-green-600">
                                {user.reportStatus.completedTasks}
                              </span>
                            </div>
                          </div>
                        )}

                        <Link href={`/admin/hierarchy/user/${user.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Xem chi tiết
                          </Button>
                        </Link>
                      </div>

                      {/* Desktop User Card */}
                      <div className="hidden lg:block p-6">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <Badge
                                  variant={statusBadge.variant}
                                  className="text-xs"
                                >
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <p>Mã NV: {user.employeeCode}</p>
                                  <p>
                                    Số điện thoại: {user.phone || "Chưa có"}
                                  </p>
                                </div>
                                <div>
                                  <p>Vị trí: {user.jobPosition.jobName}</p>
                                  <p>
                                    Chức danh: {user.jobPosition.positionName}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {user.reportStatus.hasReport && (
                            <div className="flex items-center gap-6">
                              <SimplePieChart
                                completed={user.reportStatus.completedTasks}
                                incomplete={
                                  user.reportStatus.totalTasks -
                                  user.reportStatus.completedTasks
                                }
                                size={80}
                                strokeWidth={8}
                                showLabel
                              />

                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold">
                                    {user.reportStatus.totalTasks}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Tổng CV
                                  </div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-green-600">
                                    {user.reportStatus.completedTasks}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Hoàn thành
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-right">
                            {user.reportStatus.hasReport && (
                              <div className="mb-3">
                                <div className="text-sm text-muted-foreground">
                                  Tỷ lệ HT
                                </div>
                                <div
                                  className={`text-2xl font-bold ${getStatusColor(
                                    user
                                  )}`}
                                >
                                  {user.reportStatus.taskCompletionRate}%
                                </div>
                              </div>
                            )}

                            <Link href={`/admin/hierarchy/user/${user.id}`}>
                              <Button variant="outline" size="sm">
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Incomplete Reasons - Desktop only */}
                        {user.reportStatus.incompleteReasons.length > 0 && (
                          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-700">
                                Công việc chưa hoàn thành
                              </span>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {user.reportStatus.incompleteReasons.map(
                                (item, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium text-orange-800">
                                      {item.taskName}:
                                    </span>
                                    <span className="text-orange-600 ml-1">
                                      {item.reason}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
