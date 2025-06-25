"use client";

import { useState, useEffect } from 'react';
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
import { toast } from 'react-hot-toast';
import type { User, Office, JobPosition } from '@/types';
import { Role } from '@/types';

interface EditUser{
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  cardId: string;
  jobPositionId: string;
  officeId: string;
  role: Role;
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editData, setEditData] = useState<EditUser>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    cardId: '',
    jobPositionId: '',
    officeId: '',
    role: Role.USER, 
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
      setUsers(usersData.data || usersData);
      setOffices(officesData);
      setJobPositions(jobPositionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditData({
      employeeCode: user.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      cardId: user.cardId || '',
      jobPositionId: user.jobPositionId,
      officeId: user.officeId,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      // Create properly typed update data
      const updateData: Partial<User> = {
        employeeCode: editData.employeeCode,
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email || undefined,
        cardId: editData.cardId || undefined,
        jobPositionId: editData.jobPositionId,
        officeId: editData.officeId,
        role: editData.role,
      };
      
      await UserService.updateUser(selectedUser.id, updateData);
      toast.success('Cập nhật thành công!');
      setIsEditModalOpen(false);
      loadData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    }
  };

  const filteredUsers = users.filter(user =>
    user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'SUPERADMIN') {
    return (
      <MainLayout
        title="Không có quyền truy cập"
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Quản lý Users' }
        ]}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Không có quyền truy cập</h1>
            <p className="text-muted-foreground">Chỉ Superadmin mới có thể truy cập trang này.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Quản lý Users"
      subtitle="Quản lý tất cả người dùng trong hệ thống"
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/admin' },
        { label: 'Quản lý Users' }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm</Label>
                <Input
                  id="search"
                  placeholder="Tìm theo mã NV, tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadData} variant="outline">
                  Làm mới
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
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
                <Label htmlFor="edit-cardId">CCCD</Label>
                <Input
                  id="edit-cardId"
                  value={editData.cardId}
                  onChange={(e) => setEditData({ ...editData, cardId: e.target.value })}
                  maxLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select
                  value={editData.role}
                  onValueChange={(value) => setEditData({ ...editData, role: value as Role })}
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
    </MainLayout>
  );
}
