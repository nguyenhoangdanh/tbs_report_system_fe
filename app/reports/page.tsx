import type { Metadata } from 'next';
import ReportsPage from '@/components/pages/reports-page';

export const metadata: Metadata = {
  title: 'Báo cáo của tôi - Weekly Work Report System',
  description: 'Quản lý báo cáo công việc hàng tuần của bạn',
}

export default function Reports() {
  return <ReportsPage />
}
