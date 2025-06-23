'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserService } from '@/services/user.service'
import { useProfile } from '@/hooks/use-profile'
import { toast } from 'react-hot-toast'
import type { JobPosition, Office } from '@/types'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { updateProfile, isUpdating } = useProfile()
  const router = useRouter()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Remove role-based restrictions for self-editing
  const canEditEmployeeCode = true // All users can edit their employee code
  const canEditRole = user?.role === 'SUPERADMIN' // Only superadmin can edit roles
  const canEditOffice = true // All users can edit their office

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

  const loadEditData = async () => {
    if (loadingData) return
    
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

  const handleEditProfile = async () => {
    setIsEditModalOpen(true)
    await loadEditData()
  }

  const handleSaveProfile = async () => {
    try {
      // Filter out unchanged fields
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
      if (editData.role !== user?.role && canEditRole) {
        updateData.role = editData.role
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('Không có thay đổi nào để lưu')
        return
      }

      await updateProfile(updateData)
      setIsEditModalOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại')
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

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Chào mừng trở lại, {user.lastName || 'Người dùng'}</p>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <motion.button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Đăng xuất
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <motion.div
              className="bg-card p-6 rounded-2xl shadow-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <span className="text-white text-xl">👤</span>
                  </div>
                  <h2 className="text-lg font-semibold text-card-foreground">Thông tin cá nhân</h2>
                </div>
                
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <button 
                      onClick={handleEditProfile}
                      className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Chỉnh sửa thông tin cá nhân</DialogTitle>
                      <DialogDescription>
                        Cập nhật thông tin cá nhân của bạn. Các trường có dấu * là bắt buộc.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      {/* Employee Code - All users can edit */}
                      <div className="space-y-2">
                        <Label htmlFor="edit-employeeCode">
                          Mã nhân viên <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="edit-employeeCode"
                          value={editData.employeeCode}
                          onChange={(e) => setEditData({ ...editData, employeeCode: e.target.value })}
                          placeholder="CEO001, EMP001..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName">Họ <span className="text-red-500">*</span></Label>
                          <Input
                            id="edit-firstName"
                            value={editData.firstName}
                            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                            placeholder="Nhập họ"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName">Tên <span className="text-red-500">*</span></Label>
                          <Input
                            id="edit-lastName"
                            value={editData.lastName}
                            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                            placeholder="Nhập tên"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-email">
                          Email 
                          <span className="text-muted-foreground ml-1">(không bắt buộc)</span>
                        </Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          placeholder="your.email@company.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-cardId">
                          Căn cước công dân 
                          <span className="text-muted-foreground ml-1">(không bắt buộc)</span>
                        </Label>
                        <Input
                          id="edit-cardId"
                          value={editData.cardId}
                          onChange={(e) => setEditData({ ...editData, cardId: e.target.value })}
                          placeholder="012345678901"
                          maxLength={12}
                        />
                      </div>

                      {/* Office - All users can edit */}
                      <div className="space-y-2">
                        <Label>Văn phòng</Label>
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
                        <Label>Vị trí công việc</Label>
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

                      {/* Role - Only Superadmin */}
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

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Quyền chỉnh sửa:</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>• <span className="font-medium">Tất cả người dùng:</span> Có thể thay đổi tất cả thông tin cá nhân</p>
                          <p>• <span className="font-medium">Superadmin:</span> Có thể thay đổi vai trò của bất kỳ ai</p>
                          <p>• <span className="text-orange-600 font-medium">Lưu ý:</span> Thay đổi văn phòng sẽ reset vị trí công việc</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditModalOpen(false)}
                        disabled={isUpdating}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isUpdating || !editData.firstName || !editData.lastName}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mã NV:</span>
                  <span className="font-medium text-card-foreground">{user.employeeCode || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Họ tên:</span>
                  <span className="font-medium text-card-foreground">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-card-foreground">{user.email || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CCCD:</span>
                  <span className="font-medium text-card-foreground">{user.cardId || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Công việc:</span>
                  <span className="font-medium text-card-foreground">{user.jobPosition?.jobName || 'Chưa phân công'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phòng ban:</span>
                  <span className="font-medium text-card-foreground">{user.jobPosition?.department?.name || 'Chưa phân công'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chức vụ:</span>
                  <span className="font-medium text-card-foreground">{user.jobPosition?.position?.name || 'Chưa phân công'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vai trò:</span>
                  <span className="font-medium text-card-foreground">
                    {user.role === 'SUPERADMIN' ? 'Tổng giám đốc' : 
                     user.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Văn phòng:</span>
                  <span className="font-medium text-card-foreground">
                    {user.office?.type === 'HEAD_OFFICE' ? 'Văn phòng chính' : 
                     user.office?.type === 'FACTORY_OFFICE' ? 'Văn phòng nhà máy' : 'Chưa phân công'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div
              className="bg-card p-6 rounded-2xl shadow-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h2 className="text-lg font-semibold text-card-foreground">Thao tác nhanh</h2>
              </div>
              <div className="space-y-3">
                <motion.button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📝 Tạo báo cáo tuần này
                </motion.button>
                <motion.button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📋 Xem báo cáo của tôi
                </motion.button>
                {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                  <motion.button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    👥 Xem báo cáo nhóm
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              className="bg-card p-6 rounded-2xl shadow-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">📊</span>
                </div>
                <h2 className="text-lg font-semibold text-card-foreground">Thống kê</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Báo cáo tuần này:</span>
                  <span className="font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-sm">
                    ✅ Đã nộp
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tổng báo cáo:</span>
                  <span className="font-bold text-2xl text-card-foreground">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tỷ lệ hoàn thành:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    </div>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Section */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🕒</span>
                </div>
                <h2 className="text-xl font-semibold text-card-foreground">Hoạt động gần đây</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-card-foreground font-medium">Đã nộp báo cáo tuần 47/2024</p>
                    <p className="text-muted-foreground text-sm">2 giờ trước</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-card-foreground font-medium">Cập nhật task "Hoàn thành dự án ABC"</p>
                    <p className="text-muted-foreground text-sm">1 ngày trước</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-card-foreground font-medium">Tạo báo cáo tuần 46/2024</p>
                    <p className="text-muted-foreground text-sm">1 tuần trước</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
