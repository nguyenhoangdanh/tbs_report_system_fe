"use client";

import { AuthService } from '@/services/auth.service'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse, LoginDto, ForgotPasswordDto, ResetPasswordDto, ForgotPasswordResponse } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toast-kit'

// Query keys for auth
const AUTH_QUERY_KEYS = {
  profile: ['auth', 'profile'] as const,
  checkAuth: ['auth', 'check'] as const,
}

/**
 * Get current user profile
 */
export function useAuthProfile() {
  return useQuery<User, Error>({
    queryKey: AUTH_QUERY_KEYS.profile,
    queryFn: AuthService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    throwOnError: false,
  })
}

/**
 * Login mutation
 */
export function useLogin() {
  return useMutation<AuthResponse, Error, LoginDto>({
    mutationFn: (data: LoginDto) => AuthService.login(data),
    onSuccess: (response) => {
      // Let AuthGuard handle navigation based on user role
      // This ensures consistent navigation logic
      // window.location.replace('/dashboard') // Temporary redirect, AuthGuard will handle proper routing
    },
    onError: (error) => {
      console.error('Login error:', error)
      toast.error(error.message || 'Đăng nhập thất bại')
    },
    retry: 1,
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation<AuthResponse, Error, RegisterDto>({
    mutationFn: (data: RegisterDto) => AuthService.register(data),
    onSuccess: (response) => {
      // Backend handles HTTP-only cookie authentication
      // No need to handle access_token in frontend
      
      // Update profile cache with user data
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, response.user)
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      toast.success(response.message || 'Đăng ký thành công!')
      
      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error) => {
      console.error('Register error:', error)
      toast.error(error.message || 'Đăng ký thất bại')
    },
    retry: 1,
  })
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation<void, Error, void>({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      console.log('Logout successful')
      // Không cần xóa localStorage vì không lưu token
      // Backend sẽ clear HTTP-only cookie
    },
    onError: (error) => {
      console.error('Logout error:', error)
      
      // Still clear cache and redirect even if API call fails
      queryClient.clear()
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
      
      toast.error(error.message || 'Đăng xuất thất bại')
      router.push('/auth/login')
    },
    retry: 1,
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordDto>({
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
 * Forgot password mutation
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordDto>({
    mutationFn: (data: ForgotPasswordDto) => AuthService.forgotPassword(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Xác thực thông tin thành công!')
    },
    onError: (error) => {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Xác thực thông tin thất bại')
    },
    retry: 1,
  })
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  const router = useRouter()
  
  return useMutation<void, Error, ResetPasswordDto>({
    mutationFn: (data: ResetPasswordDto) => AuthService.resetPassword(data),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công!')
      router.push('/auth/login')
    },
    onError: (error) => {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Đặt lại mật khẩu thất bại')
    },
    retry: 1,
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: AuthService.refreshToken,
    onSuccess: (response) => {
      console.log('Token refreshed successfully')
      // Backend tự động set cookie mới
      return response
    },
    onError: (error: any) => {
      console.error('Refresh token failed:', error)
    }
  })
}

/**
 * Check authentication status
 */
export function useAuthCheck() {
  return useQuery<boolean, Error>({
    queryKey: AUTH_QUERY_KEYS.checkAuth,
    queryFn: async () => {
      try {
        // Check authentication via profile API call
        // Backend will validate HTTP-only cookie
        await AuthService.getProfile()
        return true
      } catch (error) {
        return false
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    throwOnError: false,
  })
}

/**
 * Helper hook to get user permissions based on role
 */
export function useAuthPermissions() {
  const { data: user } = useAuthProfile()
  
  if (!user) {
    return {
      canViewAllReports: false,
      canManageUsers: false,
      canViewOfficeStats: false,
      canViewDepartmentStats: false,
      canEditOwnProfile: false,
      canEditOtherUsers: false,
      isSuperAdmin: false,
      isAdmin: false,
      isOfficeManager: false,
      isOfficeAdmin: false,
      isUser: false,
    }
  }
  
  const userRole = user.role as string
  
  return {
    canViewAllReports: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    canManageUsers: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    canViewOfficeStats: ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(userRole),
    canViewDepartmentStats: ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN'].includes(userRole),
    canEditOwnProfile: true,
    canEditOtherUsers: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    isSuperAdmin: userRole === 'SUPERADMIN',
    isAdmin: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    isOfficeManager: userRole === 'OFFICE_MANAGER',
    isOfficeAdmin: userRole === 'OFFICE_ADMIN',
    isUser: userRole === 'USER',
  }
}

/**
 * Helper hook to get user display information
 */
export function useAuthUser() {
  const { data: user, isLoading, error } = useAuthProfile()
  
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.employeeCode || 'Người dùng' : 'Người dùng'
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    displayName,
    fullName,
    role: user?.role,
    employeeCode: user?.employeeCode,
    email: user?.email,
    office: user?.office,
    jobPosition: user?.jobPosition,
  }
}
