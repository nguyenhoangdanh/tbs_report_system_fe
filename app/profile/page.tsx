'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserService } from '@/services/user.service'
import { useProfile } from '@/hooks/use-profile'
import { toast } from 'react-hot-toast'
import type { JobPosition, Office } from '@/types'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { updateProfile, changePassword, isUpdating, isChangingPassword } = useProfile()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [editData, setEditData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    cardId: '',
    jobPositionId: '',
    officeId: '',
    role: 'USER',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setEditData({
        employeeCode: user.employeeCode || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        cardId: user.cardId || '',
        jobPositionId: user.jobPositionId || '',
        officeId: user.officeId || '',
        role: user.role || 'USER',
      })
    }
  }, [user])

  useEffect(() => {
    loadEditData()
  }, [])

  const loadEditData = async () => {
    setLoadingData(true)
    try {
      const [jobPositionsData, officesData] = await Promise.all([
        UserService.getJobPositions(),
        UserService.getOffices()
      ])
      setJobPositions(jobPositionsData)
      setOffices(officesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updateData: any = {}
      
      if (editData.employeeCode !== user?.employeeCode) {
        updateData.employeeCode = editData.employeeCode
      }
      if (editData.firstName !== user?.firstName) {
        updateData.firstName = editData.firstName
      }
      if (editData.lastName !== user?.lastName) {
        updateData.lastName = editData.lastName
      }
      if (editData.email !== (user?.email || '')) {
        updateData.email = editData.email || undefined
      }
      if (editData.cardId !== (user?.cardId || '')) {
        updateData.cardId = editData.cardId || undefined
      }
      if (editData.jobPositionId !== user?.jobPositionId) {
        updateData.jobPositionId = editData.jobPositionId
      }
      if (editData.officeId !== user?.officeId) {
        updateData.officeId = editData.officeId
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('Không có thay đổi nào để lưu')
        return
      }

      await updateProfile(updateData)
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại')
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Đổi mật khẩu thất bại')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const canEditRole = user?.role === 'SUPERADMIN'

  return (
    <MainLayout
      title="Thông tin cá nhân"
      subtitle="Quản lý thông tin tài khoản và cài đặt bảo mật"
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Thông tin cá nhân' }
      ]}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {user.employeeCode}
                  </p>
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                    user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {user.role === 'SUPERADMIN' ? 'Tổng giám đốc' : 
                     user.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}
                  </span>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'info'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    👤 Thông tin cá nhân
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'password'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    🔒 Đổi mật khẩu
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Cập nhật thông tin cá nhân của bạn. Các trường có dấu * là bắt buộc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Employee Code */}
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">
                        Mã nhân viên <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="employeeCode"
                        value={editData.employeeCode}
                        onChange={(e) => setEditData({ ...editData, employeeCode: e.target.value })}
                        placeholder="CEO001, EMP001..."
                      />
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Họ <span className="text-red-500">*</span></Label>
                        <Input
                          id="firstName"
                          value={editData.firstName}
                          onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                          placeholder="Nhập họ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Tên <span className="text-red-500">*</span></Label>
                        <Input
                          id="lastName"
                          value={editData.lastName}
                          onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                          placeholder="Nhập tên"
                        />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email 
                        <span className="text-muted-foreground ml-1">(không bắt buộc)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        placeholder="your.email@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardId">
                        Căn cước công dân 
                        <span className="text-muted-foreground ml-1">(không bắt buộc)</span>
                      </Label>
                      <Input
                        id="cardId"
                        value={editData.cardId}
                        onChange={(e) => setEditData({ ...editData, cardId: e.target.value })}
                        placeholder="012345678901"
                        maxLength={12}
                      />
                    </div>

                    {/* Work Info */}
                    <div className="space-y-2">
                      <Label>Văn phòng <span className="text-red-500">*</span></Label>
                      <Select
                        value={editData.officeId}
                        onValueChange={(value) => setEditData({ ...editData, officeId: value })}
                        disabled={loadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? "Đang tải..." : "Chọn văn phòng"} />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                              <div className="flex items-center gap-2">
                                <span>{office.type === 'HEAD_OFFICE' ? '🏢' : '🏭'}</span>
                                {office.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Vị trí công việc <span className="text-red-500">*</span></Label>
                      <Select
                        value={editData.jobPositionId}
                        onValueChange={(value) => setEditData({ ...editData, jobPositionId: value })}
                        disabled={loadingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingData ? "Đang tải..." : "Chọn vị trí công việc"} />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPositions
                            .filter(jp => !editData.officeId || jp.department?.officeId === editData.officeId)
                            .map((jobPosition) => (
                            <SelectItem key={jobPosition.id} value={jobPosition.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{jobPosition.jobName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {jobPosition.department?.name} - {jobPosition.position?.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Role (Only for Superadmin) */}
                    {canEditRole && (
                      <div className="space-y-2">
                        <Label>
                          Vai trò 
                          <span className="text-xs text-muted-foreground ml-2">(Chỉ Superadmin)</span>
                        </Label>
                        <Select
                          value={editData.role}
                          onValueChange={(value: 'SUPERADMIN' | 'ADMIN' | 'USER') => setEditData({ ...editData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Nhân viên</SelectItem>
                            <SelectItem value="ADMIN">Quản lý</SelectItem>
                            <SelectItem value="SUPERADMIN">Tổng giám đốc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Thông tin bổ sung:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• <span className="font-medium">Phòng ban:</span> {user.jobPosition?.department?.name || 'Chưa phân công'}</p>
                        <p>• <span className="font-medium">Chức vụ:</span> {user.jobPosition?.position?.name || 'Chưa phân công'}</p>
                        <p>• <span className="font-medium">Loại văn phòng:</span> {
                          user.office?.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 
                          user.office?.type === 'FACTORY_OFFICE' ? 'Văn phòng nhà máy' : 'Chưa phân công'
                        }</p>
                        <p>• <span className="font-medium">Ngày tạo:</span> {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isUpdating || !editData.firstName || !editData.lastName || !editData.employeeCode}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Đổi mật khẩu</CardTitle>
                    <CardDescription>
                      Cập nhật mật khẩu để bảo mật tài khoản của bạn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        Mật khẩu hiện tại <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
                      <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-300">Yêu cầu mật khẩu:</h4>
                      <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                        <li>• Tối thiểu 6 ký tự</li>
                        <li>• Nên kết hợp chữ cái, số và ký tự đặc biệt</li>
                        <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          isChangingPassword || 
                          !passwordData.currentPassword || 
                          !passwordData.newPassword || 
                          !passwordData.confirmPassword ||
                          passwordData.newPassword !== passwordData.confirmPassword
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
