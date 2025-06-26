'use client'

import { AuthService } from '@/services/auth.service'
import type { RegisterDto, ChangePasswordDto, User, AuthResponse } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Drastically simplified profile query
  const {
    data: user,
    isLoading: queryLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      console.log('[Auth] Fetching profile...')
      const result = await AuthService.getProfile()
      console.log('[Auth] Profile success:', result?.employeeCode)
      return result
    },
    enabled: isMounted,
    retry: false, // Never retry
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in cache forever
  })

  // Force loading to be false after 3 seconds or when we have data/error
  const [forceReady, setForceReady] = useState(false)
  
  useEffect(() => {
    if (isMounted) {
      // Force ready after 3 seconds regardless of query state
      const timeout = setTimeout(() => {
        console.log('[Auth] Force ready after 3 seconds')
        setForceReady(true)
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [isMounted])

  // Simple loading logic
  const isLoading = isMounted && queryLoading && !user && !error && !forceReady

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { employeeCode: string; password: string }) => {
      console.log('[Auth] Login payload:', data)
      return AuthService.login(data)
    },
    onSuccess: (data: AuthResponse) => {
      console.log('[Auth] Login success')
      queryClient.setQueryData(['auth', 'profile'], data.user)
      toast.success('Đăng nhập thành công!')
      
      setTimeout(() => {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl')
        router.replace(returnUrl || '/dashboard')
      }, 300)
    },
    onError: (error: any) => {
      console.error('[Auth] Login error:', error)
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await AuthService.logout()
      } catch (error) {
        console.warn('[Auth] Logout API error, continuing...')
      }
    },
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công!')
      router.replace('/login')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => AuthService.register(data),
    onSuccess: (data: AuthResponse) => {
      if (data.user) {
        queryClient.setQueryData(['auth', 'profile'], data.user)
        toast.success('Đăng ký thành công!')
        setTimeout(() => router.replace('/dashboard'), 1000)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại!')
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => AuthService.changePassword(data),
    onSuccess: () => toast.success('Đổi mật khẩu thành công!'),
    onError: (error: any) => toast.error(error.message || 'Đổi mật khẩu thất bại!'),
  })

  const isAuthenticated = !!user
  
  console.log('[Auth] State:', {
    isMounted,
    isLoading,
    hasUser: !!user,
    hasError: !!error,
    isAuthenticated,
    forceReady
  })

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    login: (employeeCode: string, password: string) => 
      loginMutation.mutateAsync({ employeeCode, password }),
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  }
}