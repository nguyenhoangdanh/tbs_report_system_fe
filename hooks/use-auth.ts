'use client'

import { AuthService } from '@/services/auth.service'
import { api } from '@/lib/api'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { debugCookies, pollCookieChanges } from '@/lib/cookie-debug'

export function useAuth() {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current user profile - simplified error handling
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<User> => {
      return await AuthService.getProfile()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401) return false
      return failureCount < 1
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    networkMode: 'online',
  })

  // Login mutation - let backend handle all error responses
  const loginMutation = useMutation({
    mutationFn: async ({ employeeCode, password }: { employeeCode: string; password: string }) => {
      return await AuthService.login({ employeeCode, password })
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['auth', 'profile'], data.user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      // Preload dashboard data
      queryClient.prefetchQuery({
        queryKey: ['statistics', 'dashboard-combined'],
        staleTime: 60000,
      });
      
      toast.success(data.message || 'Đăng nhập thành công!')
    },
    onError: (error: any) => {
      // Backend already provides user-friendly error messages
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
  })

  // Register mutation - simplified
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterDto) => {
      return await AuthService.register(data)
    },
    onSuccess: (data: AuthResponse) => {
      toast.success(data.message || 'Đăng ký thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại!')
    },
  })

  // Logout mutation - simplified
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.logout()
    },
    onSuccess: () => {
      console.log('[AUTH] Logout successful, clearing cache and redirecting...');
      
      queryClient.clear()
      queryClient.removeQueries()
      queryClient.invalidateQueries()
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=logged_out';
        }
      }, 100);
      
      toast.success('Đăng xuất thành công!')
    },
    onError: (error: any) => {
      console.warn('[AUTH] Logout error, but clearing local state anyway:', error);
      
      queryClient.clear()
      queryClient.removeQueries()
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=logout_error';
        }
      }, 100);
      
      toast.error(error.message || 'Đã đăng xuất (có lỗi từ server)')
    },
  })

  // Change password mutation - simplified
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      return await AuthService.changePassword(data)
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đổi mật khẩu thất bại!')
    },
  })

  return {
    user: user ?? null,
    isLoading: !isMounted || isLoading,
    isAuthenticated: !!user && !error,
    login: async (employeeCode: string, password: string) => {
      await loginMutation.mutateAsync({ employeeCode, password })
    },
    register: async (data: RegisterDto) => {
      await registerMutation.mutateAsync(data)
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
    changePassword: async (data: ChangePasswordDto) => {
      await changePasswordMutation.mutateAsync(data)
    },
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  }
}