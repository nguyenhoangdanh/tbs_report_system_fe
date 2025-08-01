"use client"

import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Loader2 } from 'lucide-react'
import HierarchyDashboard from '@/components/hierarchy/hierarchy-dashboard'
import { ScreenLoading } from '@/components/loading/screen-loading'

export default function HierarchyPage() {
  return (
    <MainLayout
      // enableBackgroundAnimation
      // subtitle="Quản lý và theo dõi báo cáo Kế hoạch & Kết quả công việc theo tuần"
    >
        <Suspense
          fallback={
            <ScreenLoading size="lg" variant="grid" fullScreen backdrop />
          }
        >
          <HierarchyDashboard />
        </Suspense>
    </MainLayout>
  )
}
