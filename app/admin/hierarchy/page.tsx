"use client"

import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Loader2 } from 'lucide-react'
import HierarchyDashboard from '@/components/hierarchy/hierarchy-dashboard'
import { ScreenLoading } from '@/components/loading/screen-loading'

export default function HierarchyPage() {
  return (
    <MainLayout
      enableBackgroundAnimation
      title="Báo cáo Hierarchy"
      subtitle="Quản lý và theo dõi báo cáo Kế hoạch & Kết quả công việc theo tuần"
    >
      <div className="container mx-auto py-6">
        <Suspense
          fallback={
            <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
          }
        >
          <HierarchyDashboard />
        </Suspense>
      </div>
    </MainLayout>
  )
}
