'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import type { JobPosition, Office } from '@/types'
import { useProfileManagement } from '@/hooks/use-profile'
import { FormField } from '@/components/ui/form-field'
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData
} from '@/lib/validations/profile'
import { Building2, Factory } from 'lucide-react'

function ProfileContent() {
  // Use useProfileManagement instead of useAuth for profile data
  const {
    user,
    isLoading,
    updateProfile,
    changePassword,
    isUpdating,
    isChangingPassword,
    refetch
  } = useProfileManagement()

  const { isAuthenticated, checkAuth } = useAuth() // Only for authentication status
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Profile form - Reset values when user data changes
  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      employeeCode: user?.employeeCode || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      jobPositionId: user?.jobPosition?.id || '',
      officeId: user?.office?.id || '',
    },
    mode: 'onChange',
  })

  // Password form
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  // Watch office ID to filter job positions
  const watchedOfficeId = profileForm.watch('officeId')

  // Memoize filtered job positions to prevent unnecessary re-renders
  const filteredJobPositions = useMemo(() => {
    if (!watchedOfficeId) return jobPositions
    return jobPositions.filter(jp => jp.department?.officeId === watchedOfficeId)
  }, [jobPositions, watchedOfficeId])

  // Check if user can edit role
  const canEditRole = useMemo(() => user?.role === 'SUPERADMIN', [user?.role])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

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

  const handleSaveProfile = async (data: UpdateProfileFormData) => {
    try {
      // Only send changed fields
      const updateData: Partial<UpdateProfileFormData> = {}

      if (data.employeeCode !== user?.employeeCode) {
        updateData.employeeCode = data.employeeCode
      }
      if (data.firstName !== user?.firstName) {
        updateData.firstName = data.firstName
      }
      if (data.lastName !== user?.lastName) {
        updateData.lastName = data.lastName
      }
      if (data.email !== (user?.email || '')) {
        updateData.email = data.email || undefined
      }
      if (data.phone !== (user?.phone || '')) {
        updateData.phone = data.phone || undefined
      }
      if (data.jobPositionId !== user?.jobPosition?.id) {
        updateData.jobPositionId = data.jobPositionId
      }
      if (data.officeId !== user?.office.id) {
        updateData.officeId = data.officeId
      }
      if (canEditRole && data.role !== user?.role) {
        updateData.role = data.role
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('Không có thay đổi nào để lưu')
        return
      }

      // Use updateProfile from useProfileManagement - it will auto refresh data
      await updateProfile(updateData)

      // Also refresh auth context to sync with updated profile
      await checkAuth()

      // Reload job positions and offices if office/role changed
      if (updateData.officeId || updateData.role) {
        await loadEditData()
      }

    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Cập nhật thất bại')
    }
  }

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      // Use changePassword from useProfileManagement
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      // Reset form after successful password change
      passwordForm.reset()
      // Success toast is handled in the hook
    } catch (error: any) {
      console.error('Password change error:', error)
      // Error toast is handled in the hook
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Không thể tải thông tin người dùng</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mt-4"
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      title="Thông tin cá nhân"
      subtitle="Quản lý thông tin tài khoản và cài đặt bảo mật"
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Trang chủ', href: '/dashboard' },
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
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                    user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                    {user.jobPosition?.position?.description}
                  </span>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'info'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                  >
                    👤 Thông tin cá nhân
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'password'
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
                      Cập nhật thông tin cá nhân của bạn. Các trường có dấu
                      <span className="text-red-500 text-center">{` (*) `}</span>
                      là bắt buộc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Employee Code */}
                        <Controller
                          name="employeeCode"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="Mã nhân viên"
                              placeholder="CEO001, EMP001..."
                              required
                              {...field}
                              error={fieldState.error?.message}
                            />
                          )}
                        />

                        <Controller
                          name="phone"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <FormField
                              required
                              label="Số điện thoại"
                              placeholder="0123456789"
                              maxLength={10}
                              {...field}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      </div>

                      {/* Name */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                          name="firstName"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="Họ"
                              placeholder="Nhập họ"
                              required
                              {...field}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                        <Controller
                          name="lastName"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <FormField
                              label="Tên"
                              placeholder="Nhập tên"
                              required
                              {...field}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Contact Info */}
                      <Controller
                        name="email"
                        control={profileForm.control}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="Email"
                            type="email"
                            placeholder="your.email@company.com"
                            description="Không bắt buộc"
                            {...field}
                            error={fieldState.error?.message}
                          />
                        )}
                      />



                      {/* Work Info */}
                      <div className="space-y-2">
                        <Label>Văn phòng <span className="text-red-500">*</span></Label>
                        <Controller
                          name="officeId"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <div>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={loadingData}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingData ? "Đang tải..." : "Chọn văn phòng"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {offices.map((office) => (
                                    <SelectItem key={office.id} value={office.id}>
                                      <div className="flex items-center gap-2">
                                        {office.type === 'HEAD_OFFICE'
                                          ? <Building2 className="w-4 h-4 text-green-500" />
                                          : <Factory className="w-4 h-4 text-red-500" />}
                                        {office.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.error && (
                                <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                        </div>
                        </div>

                      <div className="space-y-2">
                        <Label>Vị trí công việc <span className="text-red-500">*</span></Label>
                        <Controller
                          name="jobPositionId"
                          control={profileForm.control}
                          render={({ field, fieldState }) => (
                            <div>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={loadingData || !watchedOfficeId}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingData ? "Đang tải..." :
                                        !watchedOfficeId ? "Chọn văn phòng trước" :
                                          "Chọn vị trí công việc"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredJobPositions.map((jobPosition) => (
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
                              {fieldState.error && (
                                <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      </div>

                      {/* Role (Only for Superadmin) */}
                      {canEditRole && (
                        <div className="space-y-2">
                          <Label>
                            Vai trò
                            <span className="text-xs text-muted-foreground ml-2">(Chỉ Superadmin)</span>
                          </Label>
                          <Controller
                            name="role"
                            control={profileForm.control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">Nhân viên</SelectItem>
                                  <SelectItem value="ADMIN">Quản lý</SelectItem>
                                  <SelectItem value="SUPERADMIN">Tổng giám đốc</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}

                      {/* Info Box */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Thông tin bổ sung:</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>• <span className="font-medium">Phòng ban:</span> {user.jobPosition?.department?.name}</p>
                          <p>• <span className="font-medium">Chức vụ:</span> {user.jobPosition?.position?.description}</p>
                          <p>• <span className="font-medium">Loại văn phòng:</span> {
                            user.office?.type === 'HEAD_OFFICE'
                              ? 'Văn phòng điều hành tổ hợp'
                              : 'Văn phòng nhà máy'
                          }</p>
                          <p>• <span className="font-medium">Ngày tạo:</span> {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          type="submit"
                          disabled={isUpdating || !profileForm.formState.isValid}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                      </div>
                    </form>
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
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-6">
                      <Controller
                        name="currentPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="Mật khẩu hiện tại"
                            type="password"
                            placeholder="Nhập mật khẩu hiện tại"
                            required
                            showPasswordToggle
                            {...field}
                            error={fieldState.error?.message}
                          />
                        )}
                      />

                      <Controller
                        name="newPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="Mật khẩu mới"
                            type="password"
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            required
                            showPasswordToggle
                            {...field}
                            error={fieldState.error?.message}
                          />
                        )}
                      />

                      <Controller
                        name="confirmPassword"
                        control={passwordForm.control}
                        render={({ field, fieldState }) => (
                          <FormField
                            label="Xác nhận mật khẩu mới"
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            required
                            showPasswordToggle
                            {...field}
                            error={fieldState.error?.message}
                          />
                        )}
                      />

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
                          type="submit"
                          disabled={isChangingPassword || !passwordForm.formState.isValid}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                        </Button>
                      </div>
                    </form>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
