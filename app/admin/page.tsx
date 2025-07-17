"use client";

import { useAuth } from '@/components/providers/auth-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, FileText, Building2, Shield, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScreenLoading } from '@/components/loading/screen-loading';

export default function AdminPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <MainLayout>
        <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
      </MainLayout>
    );
  }

  const adminCards = [
    {
      title: 'Quản lý người dùng',
      description: 'Xem và chỉnh sửa thông tin người dùng',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      roles: ['SUPERADMIN', 'ADMIN'],
    },
    {
      title: 'Báo cáo KH & KQCV',
      description: 'Xem báo cáo theo cấu trúc tổ chức',
      icon: BarChart3,
      href: '/admin/hierarchy',
      color: 'bg-green-500',
      roles: ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN'],
    },
    {
      title: 'Thống kê báo cáo',
      description: 'Xem thống kê tổng quan hệ thống',
      icon: FileText,
      href: '/admin/reports',
      color: 'bg-purple-500',
      roles: ['SUPERADMIN', 'ADMIN', 'OFFICE_MANAGER'],
    },
    {
      title: 'Quản lý văn phòng',
      description: 'Quản lý các văn phòng và phòng ban',
      icon: Building2,
      href: '/admin/offices',
      color: 'bg-orange-500',
      roles: ['SUPERADMIN'],
    },
  ];

  const availableCards = adminCards.filter(card => 
    card.roles.includes(user.role)
  );

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return { label: 'Tổng Giám Đốc', color: 'bg-red-500' };
      case 'ADMIN': return { label: 'Quản Lý', color: 'bg-blue-500' };
      case 'OFFICE_MANAGER': return { label: 'Trưởng Văn Phòng', color: 'bg-green-500' };
      case 'OFFICE_ADMIN': return { label: 'Quản Lý Phòng Ban', color: 'bg-purple-500' };
      default: return { label: 'Nhân Viên', color: 'bg-gray-500' };
    }
  };

  const roleInfo = getRoleDisplay(user.role);

  return (
    <MainLayout
      title="Quản Trị Hệ Thống"
      subtitle="Bảng điều khiển quản trị"
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Quản trị' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                Chào mừng, {user.firstName} {user.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={`${roleInfo.color} text-white text-xs`}>
                  {roleInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs">{user.office?.name}</Badge>
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bạn có quyền truy cập {availableCards.length} module quản trị
          </p>
        </div>

        {/* Admin Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {availableCards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Có quyền
                    </Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg leading-tight">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {card.description}
                  </p>
                  <Link href={card.href} passHref>
                    <Button className="w-full text-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Truy cập
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats - Mobile Optimized */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Thông tin nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                  {roleInfo.label}
                </div>
                <div className="text-sm text-muted-foreground">Vai trò hiện tại</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 truncate">
                  {user.office?.name || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Văn phòng</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">
                  {user.jobPosition?.jobName || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Vị trí</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {availableCards.length}
                </div>
                <div className="text-sm text-muted-foreground">Module có quyền</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
