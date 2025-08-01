"use client";

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserService } from '@/services/user.service';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-toast-kit'
import type { User, Office, JobPosition, UserRole, UpdateProfileDto } from '@/types';
import { PaginatedResponse } from '@/lib/api';
import { ScreenLoading } from '@/components/loading/screen-loading';

interface EditUser{
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobPositionId: string;
  officeId: string;
  role: UserRole; // Use UserRole type for role
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<PaginatedResponse<User>>();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [editData, setEditData] = useState<EditUser>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobPositionId: '',
    officeId: '',
    role: 'USER' as UserRole // Default to 'USER'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, officesData, jobPositionsData] = await Promise.all([
        UserService.getAllUsers(),
        UserService.getOffices(),
        UserService.getJobPositions()
      ]);
      if (usersData.success && usersData.data) {
        setUsers(usersData.data);
      }
      setOffices(officesData?.data || []);
      setJobPositions(jobPositionsData?.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } 
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditData({
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      phone: user.phone || '',
      jobPositionId: user.jobPosition.id,
      officeId: user.office.id,
      role: user.role as UserRole
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      // Create properly typed update data
      const updateData: Partial<UpdateProfileDto> = {
        employeeCode: editData.employeeCode,
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email || undefined,
        phone: editData.phone || undefined,
        jobPositionId: editData.jobPositionId,
        officeId: editData.officeId,
        // role: editData.role,
      };
      
      await UserService.updateUser(selectedUser.id, updateData);
      toast.success('Cập nhật thành công!');
      setIsEditModalOpen(false);
      loadData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users?.data) return [];
    // Lọc bỏ phần tử không phải mảng, sau đó flat
    const allUsers = users.data
      .filter((arr) => Array.isArray(arr))
      .flat();
    return allUsers.filter((user: User) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase()) ||
        (user.email ? user.email.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      );
    });
  }, [users, searchTerm]);


  // Add loading check for currentUser
  if (!currentUser) {
    return (
      <MainLayout>
        <ScreenLoading size="lg" variant="grid" fullScreen backdrop />
      </MainLayout>
    );
  }

  // Show role-based access message but allow access since RouteGuard handles it
  if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
    return (
      <MainLayout
        title="Quyền truy cập hạn chế"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Quản lý Users' }
        ]}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-yellow-600 mb-4">Quyền truy cập hạn chế</h1>
            <p className="text-muted-foreground">
              Vai trò hiện tại ({currentUser.role}) có quyền truy cập hạn chế đến trang này.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Chỉ SUPERADMIN và ADMIN mới có thể quản lý tất cả người dùng.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm</Label>
                {/* <Input
                  id="search"
                  placeholder="Tìm theo mã NV, tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                /> */}
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Tìm theo mã NV, tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    className="absolute right-6 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchTerm('')}
                  >
                    X
                  </Button>
                )}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="sr-only">Tìm kiếm</span>
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user: User) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Mã NV: {user.employeeCode}</p>
                          <p>Email: {user.email || 'Chưa có'}</p>
                          <p>Vai trò: {
                            user.role === 'SUPERADMIN' ? 'Tổng giám đốc' :
                            user.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'
                          }</p>
                          <p>Văn phòng: {user.office?.name}</p>
                          <p>Vị trí: {user.jobPosition?.jobName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                      <Button
                        onClick={() => handleEditUser(user)}
                        variant="outline"
                        size="sm"
                      >
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin người dùng. Superadmin có thể thay đổi tất cả thông tin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Employee Code */}
              <div className="space-y-2">
                <Label htmlFor="edit-employeeCode">Mã nhân viên *</Label>
                <Input
                  id="edit-employeeCode"
                  value={editData.employeeCode}
                  onChange={(e) => setEditData({ ...editData, employeeCode: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Họ *</Label>
                  <Input
                    id="edit-firstName"
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Tên *</Label>
                  <Input
                    id="edit-lastName"
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select
                  value={editData.role}
                  onValueChange={(value) => setEditData({ ...editData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Nhân viên</SelectItem>
                    <SelectItem value="ADMIN">Quản lý</SelectItem>
                    <SelectItem value="SUPERADMIN">Tổng giám đốc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Văn phòng</Label>
                <Select
                  value={editData.officeId}
                  onValueChange={(value) => setEditData({ ...editData, officeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vị trí công việc</Label>
                <Select
                  value={editData.jobPositionId}
                  onValueChange={(value) => setEditData({ ...editData, jobPositionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions
                      .filter(jp => jp.department?.officeId === editData.officeId)
                      .map((jobPosition) => (
                      <SelectItem key={jobPosition.id} value={jobPosition.id}>
                        {jobPosition.jobName} - {jobPosition.department?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveUser}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Lưu thay đổi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}

export default function AdminUsersPage() {
  return (
    <MainLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Trang chủ', href: '/dashboard' },
        { label: 'Quản lý người dùng' }
      ]}
    >
      <Suspense fallback={
        <ScreenLoading size="lg" variant="grid" fullScreen backdrop />
      }>
        <AdminUsersContent />
      </Suspense>
    </MainLayout>
  )
}
