"use client"

import { Suspense } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { MainLayout } from '@/components/layout/main-layout'
import { HierarchyDashboard } from '@/components/hierarchy/hierarchy-dashboard'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, BarChart3, TrendingUp } from 'lucide-react'

function HierarchyReportsContent() {
  const { user } = useAuth()

  // Check permissions
  if (!user) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Role-based access control
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN']
  if (!allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        subtitle="Chỉ quản lý mới có thể xem báo cáo phân cấp"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Không có quyền truy cập
              </h2>
              <p className="text-red-600 mb-4">
                Chỉ quản lý cấp cao mới có thể xem báo cáo phân cấp này.
              </p>
              <p className="text-sm text-red-500">
                Vai trò hiện tại: <strong>{user.role}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      // title="Báo Cáo Phân Cấp"
      // subtitle="Xem báo cáo theo cấu trúc tổ chức"
      // showBreadcrumb
      // breadcrumbItems={[
      //   { label: 'Dashboard', href: '/dashboard' },
      //   { label: 'Admin', href: '/admin' },
      //   { label: 'Báo cáo phân cấp' }
      // ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Theo văn phòng</h3>
                  <p className="text-sm text-muted-foreground">Tổng quan các văn phòng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Theo phòng ban</h3>
                  <p className="text-sm text-muted-foreground">Chi tiết từng phòng ban</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Theo nhân viên</h3>
                  <p className="text-sm text-muted-foreground">Thống kê cá nhân</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Xu hướng</h3>
                  <p className="text-sm text-muted-foreground">Phân tích xu hướng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <HierarchyDashboard />
      </div>
    </MainLayout>
  )
}

export default function HierarchyReportsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải báo cáo phân cấp..." minimal={false} />
        </div>
      </MainLayout>
    }>
      <HierarchyReportsContent />
    </Suspense>
  )
}
