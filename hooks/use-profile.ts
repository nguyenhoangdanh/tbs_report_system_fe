'use client'

import { AuthService } from '@/services/auth.service'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import { ChangePasswordDto, UpdateProfileDto } from '@/types'
import { QUERY_KEYS } from './query-key'
import { useApiMutation, useApiQuery } from './use-api-query'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Get current user profile
 */
export function useProfile() {
  return useApiQuery({
    queryKey: QUERY_KEYS.auth.profile(),
    queryFn: AuthService.getProfile,
    cacheStrategy: 'normal',
    throwOnError: false,
  })
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useApiMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update profile cache immediately using queryClient directly
      queryClient.setQueryData(QUERY_KEYS.auth.profile(), updatedUser)
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      toast.success('Cập nhật thông tin cá nhân thành công!')
    },
    onError: (error: any) => {
      console.error('❌ Update profile error:', error)
      toast.error(error.message || 'Cập nhật thông tin thất bại')
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
