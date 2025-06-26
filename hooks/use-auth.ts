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

  // User profile query
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => AuthService.getProfile(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false
      return failureCount < 1
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Login mutation với redirect
  const loginMutation = useMutation({
    mutationFn: async ({ employeeCode, password }: { employeeCode: string; password: string }) => {
      return await AuthService.login({ employeeCode, password })
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['auth', 'profile'], data.user)
      toast.success(data.message || 'Đăng nhập thành công!')

      // Redirect với window.location để tránh client-side routing issues
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        const targetUrl = returnUrl && returnUrl !== '/login' ? returnUrl : '/dashboard'
        window.location.href = targetUrl
      }, 1000)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
    retry: false,
  })

  // Register mutation với redirect
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterDto) => {
      return await AuthService.register(data)
    },
    onSuccess: (data: AuthResponse) => {
      toast.success(data.message || 'Đăng ký thành công!')

      if (data.user) {
        queryClient.setQueryData(['auth', 'profile'], data.user)
        // Redirect to dashboard if auto-login
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        // Redirect to login if manual activation required
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại!')
    },
    retry: false,
  })

  // Logout mutation với redirect
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await AuthService.logout()
    },
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công!')

      // Force redirect to login
      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
    },
    onError: (error: any) => {
      queryClient.clear()
      toast.error(error.message || 'Đã đăng xuất')

      // Force redirect even on error
      setTimeout(() => {
        window.location.href = '/login'
      }, 500)
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