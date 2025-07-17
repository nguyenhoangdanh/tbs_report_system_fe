'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import { ChangePasswordDto, UpdateProfileDto } from '@/types'
import { useApiMutation, useApiQuery } from './use-api-query'

// Query keys for profile data
const PROFILE_QUERY_KEYS = {
  profile: ['auth', 'profile'] as const,
}

/**
 * Get current user profile
 */
export function useProfile() {
  return useApiQuery({
    queryKey: PROFILE_QUERY_KEYS.profile,
    queryFn: AuthService.getProfile,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for profile data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Không retry nếu là lỗi 401 (Unauthorized)
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
  const queryClient = useQueryClient()
  
  return useApiMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: (updatedUser) => {
      const userId = updatedUser?.id;

      // Update profile cache immediately
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile, updatedUser)
      
      // Also update other user-related caches
      queryClient.setQueryData(['users', 'profile'], updatedUser)
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: PROFILE_QUERY_KEYS.profile,
        exact: true 
      })
      
      // Invalidate user-specific queries to refresh with new user context
      queryClient.invalidateQueries({ 
        queryKey: ['reports', userId],
        exact: false 
      })
      
      queryClient.invalidateQueries({ 
        queryKey: ['statistics', userId],
        exact: false 
      })
      
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
