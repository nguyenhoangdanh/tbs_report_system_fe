"use client"

import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Loader2 } from 'lucide-react'
import HierarchyDashboard from '@/components/hierarchy/hierarchy-dashboard'

export default function HierarchyPage() {
  return (
    <MainLayout 
      enableBackgroundAnimation
      title="Báo cáo Hierarchy" 
      subtitle="Quản lý và theo dõi báo cáo theo cấu trúc tổ chức"
    >
      <div className="container mx-auto py-6">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Đang tải dữ liệu hierarchy...</span>
              </div>
            </div>
          }
        >
          <HierarchyDashboard />
        </Suspense>
      </div>
    </MainLayout>
  )
}
