'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, Suspense, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import { type JobPosition, type Office } from '@/types'
import { useProfileManagement } from '@/hooks/use-profile'
import { type UpdateProfileFormData, type ChangePasswordFormData } from '@/lib/validations/profile'

// Import components
import { UserAvatar } from './components/user-avatar'
import { SidebarNav } from './components/sidebar-nav'
import { ProfileForm } from './components/profile-form'
import { PasswordForm } from './components/password-form'
import { ScreenLoading } from '@/components/loading/screen-loading'

function ProfileContent() {
  const {
    isLoading,
    updateProfile,
    changePassword,
    isUpdating,
    isChangingPassword,
    refetch,
  } = useProfileManagement();

  const { isAuthenticated, checkAuth, user } = useAuth()
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Load data only once
  const loadedRef = useRef(false)
  const loadEditData = useCallback(async () => {
    if (loadedRef.current || loadingData) return
    
    loadedRef.current = true
    setLoadingData(true)
    try {
      const [jobPositionsData, officesData] = await Promise.all([
        UserService.getJobPositions(),
        UserService.getOffices()
      ])
      setJobPositions(jobPositionsData?.data || [])
      setOffices(officesData?.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Không thể tải dữ liệu')
      loadedRef.current = false // Allow retry
    } finally {
      setLoadingData(false)
    }
  }, [loadingData])

  useEffect(() => {
    loadEditData()
  }, [])

  const handleSaveProfile = useCallback(async (data: UpdateProfileFormData) => {
    try {
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
      if (data.officeId !== user?.office?.id) {
        updateData.officeId = data.officeId
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('Không có thay đổi nào để lưu')
        return
      }

      await updateProfile(updateData)
      await checkAuth()

      if (updateData.officeId || updateData.role) {
        loadedRef.current = false
        await loadEditData()
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Cập nhật thất bại')
    }
  }, [user, updateProfile, checkAuth, loadEditData])

  const handleChangePassword = useCallback(async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      
      // Success handling is done in the hook and PasswordForm component
    } catch (error: any) {
      console.error('Password change error:', error)
      throw error // Re-throw to prevent form reset
    }
  }, [changePassword])

  if (isLoading) {
    return <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
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
        { label: 'Trang chủ', href: user?.role === 'USER' ? "/dashboard" : "/admin/hierarchy" },
        { label: 'Thông tin cá nhân' }
      ]}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <UserAvatar user={user} />
                <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
              </CardContent>
            </Card>
          </div>

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
                    <ProfileForm
                      user={user}
                      jobPositions={jobPositions}
                      offices={offices}
                      loadingData={loadingData}
                      onSubmit={handleSaveProfile}
                      isUpdating={isUpdating}
                    />
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
                    <PasswordForm
                      onSubmit={handleChangePassword}
                      isChangingPassword={isChangingPassword}
                    />
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
      <ScreenLoading size="lg" variant="dual-ring" fullScreen backdrop />
    }>
      <ProfileContent />
    </Suspense>
  )
}
