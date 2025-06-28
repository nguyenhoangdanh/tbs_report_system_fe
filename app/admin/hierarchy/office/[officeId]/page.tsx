"use client"

import { Suspense, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useOfficeDetails, useCurrentWeekFilter } from '@/hooks/use-hierarchy'
import { MainLayout } from '@/components/layout/main-layout'
import { OfficeDetailsCard } from '@/components/hierarchy/office-details-card'
import { AppLoading } from '@/components/ui/app-loading'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

function OfficeDetailsContent() {
  const { user } = useAuth()
  const params = useParams()
  const officeId = params?.officeId as string
  const { weekNumber: currentWeek, year: currentYear } = useCurrentWeekFilter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const { 
    data: officeData, 
    isLoading, 
    error,
    refetch
  } = useOfficeDetails(officeId, {
    weekNumber: currentWeek,
    year: currentYear
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ 
        queryKey: ['hierarchy', 'office-details', officeId] 
      })
      await refetch()
      toast.success('Dữ liệu đã được cập nhật')
    } catch (error) {
      toast.error('Có lỗi khi cập nhật dữ liệu')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!user) {
    return <AppLoading text="Đang xác thực..." />
  }

  // Check permissions
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER']
  if (!allowedRoles.includes(user.role)) {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Chi tiết văn phòng' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không có quyền truy cập</h2>
              <p className="text-red-600">Chỉ quản lý cấp cao mới có thể xem chi tiết văn phòng.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết văn phòng..." />
        </div>
      </MainLayout>
    )
  }

  if (error || !officeData) {
    return (
      <MainLayout
        title="Lỗi tải dữ liệu"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
          { label: 'Chi tiết văn phòng' }
        ]}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <Building2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h2>
              <p className="text-red-600 mb-4">
                {(error as any)?.message || 'Có lỗi xảy ra khi tải chi tiết văn phòng'}
              </p>
              <Link href="/admin/hierarchy">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      title={`Chi tiết văn phòng: ${officeData.office.name}`}
      subtitle={`Tuần ${officeData.weekNumber}/${officeData.year}`}
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Báo cáo phân cấp', href: '/admin/hierarchy' },
        { label: officeData.office.name }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Refresh */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/hierarchy">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại báo cáo phân cấp
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {/* Office Details */}
        <OfficeDetailsCard data={officeData} />
      </div>
    </MainLayout>
  )
}

export default function OfficeDetailsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppLoading text="Đang tải chi tiết văn phòng..." />
        </div>
      </MainLayout>
    }>
      <OfficeDetailsContent />
    </Suspense>
  )
}
