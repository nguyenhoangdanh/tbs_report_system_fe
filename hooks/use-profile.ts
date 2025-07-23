'use client'

import { AuthService } from '@/services/auth.service'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import { ChangePasswordDto, UpdateProfileDto } from '@/types'
import { QUERY_KEYS } from './query-key'
import { useApiMutation, useApiQuery } from './use-api-query'
import { useOptimizedMutation } from './use-mutation'

/**
 * Get current user profile
 */
export function useProfile() {
  return useApiQuery({
    queryKey: QUERY_KEYS.auth.profile(),
    queryFn: AuthService.getProfile,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  return useOptimizedMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: (updatedUser) => {
      toast.success('Cập nhật thông tin cá nhân thành công!')
    },
    onError: (error: any) => {
      console.error('❌ Update profile error:', error)
      toast.error(error.message || 'Cập nhật thông tin thất bại')
    },
    invalidateQueries: async (cacheManager, updatedUser) => {
      const userId = updatedUser?.id;
      if (userId) {
        await cacheManager.invalidateUserData(userId)
      }
    },
    retry: 1,
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useApiMutation({
    mutationFn: (data: ChangePasswordDto) => AuthService.changePassword(data),
    onSuccess: (data) => {
      toast.success('Đổi mật khẩu thành công!')
    },
    onError: (error: any) => {
      console.error('❌ Change password error:', error)
      toast.error(error.message || 'Đổi mật khẩu thất bại')
    },
    retry: 1,
  })
}

/**
 * Combined hook for profile management
 */
export function useProfileManagement() {
  const profile = useProfile()
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()
  
  return {
    user: profile.data,
    isLoading: profile.isLoading,
    error: profile.error,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    refetch: profile.refetch,
    
    // Status tracking
    updateStatus: {
      isSuccess: updateProfileMutation.isSuccess,
      isError: updateProfileMutation.isError,
      error: updateProfileMutation.error,
    },
    passwordStatus: {
      isSuccess: changePasswordMutation.isSuccess,
      isError: changePasswordMutation.isError,
      error: changePasswordMutation.error,
    }
  }
}
