"use client"
import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { AppLoading } from '@/components/ui/app-loading'
import { useAuth } from '@/components/providers/auth-provider'
import { HierarchyDashboard } from '@/components/hierarchy/hierarchy-dashboard'


function HierarchyPageContent() {
  const { user } = useAuth()

  if (!user) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN', 'USER']
  if (!user.role || !allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-500">Bạn không có quyền xem báo cáo KH & KQCV.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Generate role-appropriate breadcrumb
  const getBreadcrumbItems = () => {
    const items = [{ label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' }]
    
    // Only show Admin breadcrumb for roles that can access admin area
    // if (user.role && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    //   items.push({ label: 'Admin', href: '/admin' })
    // }

    // items.push({ label: 'Báo cáo KH & KQCV', href: '/admin/hierarchy' })
    return items
  }

  return (
    <MainLayout
      title="Báo cáo KH & KQCV"
      subtitle="Xem và quản lý báo cáo theo cấu trúc tổ chức với xếp loại hiệu suất"
      showBreadcrumb
      breadcrumbItems={getBreadcrumbItems()}
    >
      <HierarchyDashboard />
    </MainLayout>
  )
}

export default function HierarchyPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải báo cáo KH & KQCV..." />
        </div>
      </MainLayout>
    }>
      <HierarchyPageContent />
    </Suspense>
  )
}
