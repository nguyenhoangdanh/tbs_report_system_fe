"use client";

import { AuthService } from '@/services/auth.service'
import { useAuth } from '@/components/providers/auth-provider'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse, LoginDto, ForgotPasswordDto, ResetPasswordDto, ForgotPasswordResponse, UserRole } from '@/types'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toast-kit'
import { useApiMutation } from './use-api-query'
import { QUERY_KEYS } from './query-key'

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
 * Login mutation - call AuthService directly and update AuthProvider manually
 */
export function useLogin() {
  const { checkAuth } = useAuth()
  const router = useRouter()
  
  return useApiMutation<AuthResponse, LoginDto, Error>({
    mutationFn: (data: LoginDto) => AuthService.login(data),
    onSuccess: async (response) => {
      // After successful login, check auth to update context
      await checkAuth()
      // Check if user is inactive and force password reset
      if (response.user && response.user.isActive === false) {
        toast.info('Bạn cần đổi mật khẩu mới trước khi tiếp tục.')
        router.push(`/reset-password?employeeCode=${encodeURIComponent(response.user.employeeCode)}&phone=${encodeURIComponent(response.user.phone)}`)
        return
      }
      toast.success('Đăng nhập thành công!')
      
      // Navigate to dashboard or return URL
      const urlParams = new URLSearchParams(window.location.search)
      const returnUrl = urlParams.get('returnUrl')
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl))
      } else {
        router.push('/dashboard')
      }
    },
    onError: (error) => {
      console.error('Login error:', error)
      toast.error(error.message || 'Đăng nhập thất bại')
    },
    retry: false,
    mutationKey: ['auth', 'login'],
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useApiMutation<AuthResponse, RegisterDto, Error>({
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
    mutationFn: async (): Promise<void> => {
      await logout()
    },
    retry: false,
    mutationKey: ['auth', 'logout'],
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useApiMutation<void, ChangePasswordDto, Error>({
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
  return useApiMutation<ForgotPasswordResponse, { employeeCode: string; phone: string }, Error>({
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
  
  return useApiMutation<void, { employeeCode: string; phone: string; newPassword: string; confirmPassword: string }, Error>({
    mutationFn: (data) => AuthService.resetPassword({
      employeeCode: data.employeeCode,
      phone: data.phone,
      newPassword: data.newPassword,
    }),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công!')
      router.push('/login')
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
  return useApiMutation<AuthResponse, void, Error>({
    mutationFn: () => AuthService.refreshToken(),
    onSuccess: (response) => {
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
