'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'
import { UserService } from '@/services/user.service'
import toast from 'react-hot-toast'
import { ChangePasswordDto, UpdateProfileDto } from '@/types'

// Query keys for profile data
const PROFILE_QUERY_KEYS = {
  profile: ['auth', 'profile'] as const,
}

/**
 * Get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: AuthService.getProfile, // Use AuthService for authentication context
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update both auth and user caches
      queryClient.setQueryData(['auth', 'profile'], updatedUser)
      queryClient.setQueryData(['users', 'profile'], updatedUser)
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
      toast.success('Cập nhật thông tin cá nhân thành công!')
    },
    onError: (error) => {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Cập nhật thông tin thất bại')
    },
    retry: 1,
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDto) => AuthService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
    },
    onError: (error) => {
      console.error('Change password error:', error)
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
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  
  return {
    user: profile.data,
    isLoading: profile.isLoading,
    error: profile.error,
    updateProfile: updateProfile.mutateAsync,
    changePassword: changePassword.mutateAsync,
    isUpdating: updateProfile.isPending,
    isChangingPassword: changePassword.isPending,
    refetch: profile.refetch,
  }
}
