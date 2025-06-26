import { ReportsPage } from '@/components/pages/reports-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Báo cáo của tôi - Weekly Work Report System',
  description: 'Quản lý báo cáo công việc hàng tuần của bạn',
}

export default function Reports() {
  return <ReportsPage />
}
