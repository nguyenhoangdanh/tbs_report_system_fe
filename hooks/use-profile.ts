'use client'

import { AuthService } from '@/services/auth.service'
import { UserService } from '@/services/user.service'
import { toast } from 'react-toast-kit'
import { ChangePasswordDto, UpdateProfileDto } from '@/types'
import { QUERY_KEYS } from './query-key'
import { useApiMutation, useApiQuery } from './use-api-query'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'

/**
 * Get current user profile - with React Query but sync with AuthProvider
 */
export function useProfile() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  
  // Use consistent query key - without userId to match invalidation
  const profileKey = QUERY_KEYS.auth.profile()
  
  // Create React Query for DevTools and cache management
  const query = useApiQuery({
    queryKey: profileKey,
    queryFn: AuthService.getProfile,
    enabled: !!authUser?.id, // Only fetch if authenticated
    cacheStrategy: 'normal',
    throwOnError: false,
    // Sync with AuthProvider data
    initialData: authUser,
    placeholderData: authUser,
  })
  
  // Use AuthProvider data as source of truth, React Query for cache management
  return {
    data: authUser || query.data,
    isLoading: authLoading || query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { checkAuth, user } = useAuth()
  
  return useApiMutation({
    mutationFn: (data: UpdateProfileDto) => UserService.updateProfile(data),
    onSuccess: async (updatedUser) => {
      
      // 1. Update React Query cache immediately
      const profileKey = QUERY_KEYS.auth.profile()
      queryClient.setQueryData(profileKey, updatedUser)
      
      // 2. Force AuthProvider to refetch (this will trigger form update via user prop change)
      await checkAuth()
      
      // 3. Add small delay to ensure React has time to process state updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 4. Final invalidation to ensure UI consistency
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      
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
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { checkAuth } = useAuth()
  
  return useApiMutation({
    mutationFn: (file: File) => UserService.uploadAvatar(file),
    onSuccess: async (response) => {
      const avatarUrl = response.avatarUrl 
      
      if (avatarUrl) {
        // 1. Update profile with new avatar URL
        const updateResult = await UserService.updateProfile({ avatar: avatarUrl })
        
        if (updateResult.success) {
          // 2. Update React Query cache
          const profileKey = QUERY_KEYS.auth.profile()
          queryClient.setQueryData(profileKey, updateResult.data)
          
          // 3. Force AuthProvider to refetch
          await checkAuth()
          
          // 4. Final cache invalidation
          await queryClient.invalidateQueries({ queryKey: ['auth'] })
          
          toast.success('Cập nhật ảnh đại diện thành công!')
        } else {
          throw new Error('Failed to update profile with new avatar')
        }
      } else {
        throw new Error('No avatar URL returned from server')
      }
    },
    onError: (error: any) => {
      console.error('❌ Upload avatar error:', error)
      toast.error(error.message || 'Không thể tải lên ảnh đại diện')
    },
    retry: 1,
  })
}

/**
 * Remove avatar mutation
 */
export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  const { checkAuth } = useAuth()
  
  return useApiMutation({
    mutationFn: () => UserService.removeAvatar(),
    onSuccess: async () => {
      // Update profile to remove avatar
      const updateResult = await UserService.updateProfile({ avatar: null })
      
      if (updateResult.success) {
        // Update React Query cache
        const profileKey = QUERY_KEYS.auth.profile()
        queryClient.setQueryData(profileKey, updateResult.data)
        
        // Force AuthProvider to refetch
        await checkAuth()
        
        // Final cache invalidation
        await queryClient.invalidateQueries({ queryKey: ['auth'] })
        
        toast.success('Đã xóa ảnh đại diện!')
      }
    },
    onError: (error: any) => {
      console.error('❌ Remove avatar error:', error)
      toast.error(error.message || 'Không thể xóa ảnh đại diện')
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
  const uploadAvatarMutation = useUploadAvatar()
  const removeAvatarMutation = useRemoveAvatar()
  
  return {
    user: profile.data,
    isLoading: profile.isLoading,
    error: profile.error,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    removeAvatar: removeAvatarMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isRemovingAvatar: removeAvatarMutation.isPending,
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
    },
    avatarStatus: {
      isSuccess: uploadAvatarMutation.isSuccess,
      isError: uploadAvatarMutation.isError,
      error: uploadAvatarMutation.error,
    }
  }
}
