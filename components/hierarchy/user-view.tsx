'use client'

import React, { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, CheckCircle, TrendingUp } from 'lucide-react'

interface UserViewProps {
  data: any
}

export const UserView = memo(({ data }: UserViewProps) => {
  if (!data?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không có dữ liệu người dùng</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        Nhân viên: {data.user.firstName} {data.user.lastName}
      </h2>
      
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Mã NV:</span>
              <span className="ml-1 font-medium">{data.user.employeeCode}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-1 font-medium">{data.user.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Vai trò:</span>
              <span className="ml-1 font-medium">{data.user.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Chức vụ:</span>
              <span className="ml-1 font-medium">{data.user.jobPosition?.jobName}</span>
            </div>
            <div>
              <span className="text-gray-500">Phòng ban:</span>
              <span className="ml-1 font-medium">{data.user.jobPosition?.department?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Văn phòng:</span>
              <span className="ml-1 font-medium">{data.user.office?.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      {data.overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng báo cáo</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.overallStats.totalReports || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.overallStats.completedReports || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ báo cáo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.overallStats.reportCompletionRate || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ task</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.overallStats.taskCompletionRate || 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Reports */}
      {data.reports && data.reports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Báo cáo gần đây</h3>
          {data.reports.slice(0, 5).map((report: any) => (
            <Card key={report.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    Tuần {report.weekNumber}/{report.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    {report.stats?.completedTasks || 0}/{report.stats?.totalTasks || 0} tasks hoàn thành
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tạo: {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={report.isCompleted ? 'default' : 'secondary'}>
                    {report.stats?.taskCompletionRate || 0}%
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No reports message */}
      {(!data.reports || data.reports.length === 0) && (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có báo cáo nào</p>
          </div>
        </Card>
      )}
    </div>
  )
})

UserView.displayName = 'UserView'
