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

  // Get current user profile - optimized stale time
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<User> => {
      try {
        return await AuthService.getProfile()
      } catch (error: any) {
        if (error.status === 401) {
          queryClient.removeQueries({ queryKey: ['auth'] })
          throw error
        }
        throw error
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - giảm từ 10 phút
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false
      return failureCount < 1
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Thêm network detection
    networkMode: 'online',
  })

  // Login mutation với optimized error handling
  const loginMutation = useMutation({
    mutationFn: async ({ employeeCode, password }: { employeeCode: string; password: string }) => {
      return await AuthService.login({ employeeCode, password })
    },
    onSuccess: (data: AuthResponse) => {
      // Update the auth cache with new user data
      queryClient.setQueryData(['auth', 'profile'], data.user)
      
      // Invalidate and refetch auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      // Preload dashboard data
      queryClient.prefetchQuery({
        queryKey: ['statistics', 'dashboard-combined'],
        staleTime: 60000,
      });
      
      toast.success(data.message || 'Đăng nhập thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
  })

  // Register mutation
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

  // Logout mutation với aggressive cache clearing
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.logout()
    },
    onSuccess: () => {
      // Clear all cache
      queryClient.clear()
      toast.success('Đăng xuất thành công!')
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local state
      queryClient.clear()
      toast.error(error.message || 'Có lỗi khi đăng xuất!')
    },
  })

  // Change password mutation
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