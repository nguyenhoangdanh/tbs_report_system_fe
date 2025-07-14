"use client";

import { AuthService } from '@/services/auth.service'
import { useAuth } from '@/components/providers/auth-provider'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse, LoginDto, ForgotPasswordDto, ResetPasswordDto, ForgotPasswordResponse, UserRole } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toast-kit'

// Query keys for auth
const AUTH_QUERY_KEYS = {
  profile: (userId?: string) => ['auth', 'profile', userId] as const,
  checkAuth: (userId?: string) => ['auth', 'check', userId] as const,
}

/**
 * Get current user profile - delegate to AuthProvider
 */
export function useAuthProfile() {
  const { user, isLoading } = useAuth()
  
  return {
    data: user,
    isLoading,
    error: null,
    refetch: () => Promise.resolve(user)
  }
}

/**
 * Login mutation - delegate to AuthProvider
 */
export function useLogin() {
  const { login } = useAuth()
  
  return useMutation<void, Error, LoginDto>({
    mutationFn: (data: LoginDto) => login(data),
    retry: false, // Don't retry login attempts
    // Prevent duplicate mutations
    mutationKey: ['auth', 'login'],
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
 * Logout mutation - delegate to AuthProvider
 */
export function useLogout() {
  const { logout } = useAuth()
  
  return useMutation<void, Error, void>({
    mutationFn: () => logout(),
    retry: false, // Don't retry logout attempts
    // Prevent duplicate mutations
    mutationKey: ['auth', 'logout'],
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
 * Forgot password mutation - Phù hợp với backend (employeeCode + phone)
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, { employeeCode: string; phone: string }>({
    mutationFn: (data) => AuthService.forgotPassword({
      employeeCode: data.employeeCode,
      phone: data.phone
    }),
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
 * Reset password mutation - Phù hợp với backend (employeeCode + phone)
 */
export function useResetPassword() {
  const router = useRouter()
  
  return useMutation<void, Error, { employeeCode: string; phone: string; newPassword: string; confirmPassword: string }>({
    mutationFn: (data) => AuthService.resetPassword({
      employeeCode: data.employeeCode,
      phone: data.phone,
      newPassword: data.newPassword,
    }),
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
      return response
    },
    onError: (error: any) => {
      console.error('Refresh token failed:', error)
    }
  })
}

/**
 * Check authentication status - delegate to AuthProvider
 */
export function useAuthCheck() {
  const { user, isLoading, checkAuth } = useAuth()
  
  return {
    data: !!user,
    isLoading,
    error: null,
    refetch: checkAuth
  }
}

/**
 * Helper hook to get user permissions based on role
 */
export function useAuthPermissions() {
  const { user } = useAuth()
  
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
  
  const userRole = user.role as UserRole;
  
  return {
    canViewAllReports: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    canManageUsers: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    canViewOfficeStats: ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER'].includes(userRole),
    canViewDepartmentStats: ['ADMIN', 'SUPERADMIN', 'OFFICE_MANAGER', 'OFFICE_ADMIN'].includes(userRole),
    canEditOwnProfile: true,
    canEditOtherUsers: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    isSuperAdmin: userRole === 'SUPERADMIN',
    isAdmin: ['ADMIN', 'SUPERADMIN'].includes(userRole),
    isUser: userRole === 'USER',
  }
}

/**
 * Helper hook to get user display information
 */
export function useAuthUser() {
  const { user, isLoading } = useAuth()
  
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.employeeCode || 'Người dùng' : 'Người dùng'
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  
  return {
    user,
    isLoading,
    error: null,
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
