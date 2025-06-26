'use client'

import { AuthService } from '@/services/auth.service'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export function useAuth() {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Optimized user profile query - reduce redundant calls
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => AuthService.getProfile(),
    staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2 * 60 * 1000, // Longer stale time
    gcTime: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false
      return failureCount < 1
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent redundant mount calls
    refetchOnReconnect: true,
    networkMode: 'online',
  })

  // Optimized login with immediate cache update and prefetching
  const loginMutation = useMutation({
    mutationFn: async ({ employeeCode, password }: { employeeCode: string; password: string }) => {
      return await AuthService.login({ employeeCode, password })
    },
    onSuccess: (data: AuthResponse) => {
      // Immediately update cache to prevent redundant calls
      queryClient.setQueryData(['auth', 'profile'], data.user)
      
      // Prefetch critical dashboard data to reduce loading time
      Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['statistics', 'dashboard-combined'],
          queryFn: async () => {
            // Pre-load dashboard data
            const { StatisticsService } = await import('@/services/statistics.service')
            return Promise.allSettled([
              StatisticsService.getDashboardStats(),
              StatisticsService.getWeeklyTaskStats(),
            ])
          },
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['reports', 'current-week'],
          queryFn: async () => {
            const { ReportService } = await import('@/services/report.service')
            return ReportService.getCurrentWeekReport()
          },
          staleTime: 30 * 1000,
        })
      ]).catch(console.warn) // Don't block on prefetch failures

      toast.success(data.message || 'Đăng nhập thành công!')

      // Faster redirect
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        const targetUrl = returnUrl && returnUrl !== '/login' ? returnUrl : '/dashboard'
        window.location.replace(targetUrl)
      }, 300) // Reduced from 800ms
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
    retry: false,
  })

  // Optimized logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.logout()
    },
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công!')
      setTimeout(() => window.location.replace('/login'), 100) // Much faster
    },
    onError: (error: any) => {
      queryClient.clear()
      toast.error(error.message || 'Đã đăng xuất')
      setTimeout(() => window.location.replace('/login'), 100)
    },
    retry: false,
  })

  // Register mutation - production optimized
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterDto) => {
      return await AuthService.register(data)
    },
    onSuccess: (data: AuthResponse) => {
      toast.success(data.message || 'Đăng ký thành công!')

      if (data.user) {
        queryClient.setQueryData(['auth', 'profile'], data.user)
        setTimeout(() => window.location.replace('/dashboard'), 1200)
      } else {
        setTimeout(() => window.location.replace('/login'), 1200)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại!')
    },
    retry: false,
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
    retry: false,
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