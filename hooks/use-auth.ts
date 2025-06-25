import { AuthService } from '@/services/auth.service'
import { api } from '@/lib/api'
import type { RegisterDto, ChangePasswordDto, User } from '@/types'
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

  // Get current user profile with optimized config
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      return await api.get<User>('/users/profile')
    },
    retry: (failureCount, error: any) => {
      // Reduce retry attempts for faster failure detection
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 1
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: isMounted, // Only run client-side
    // Add network mode for better offline handling
    networkMode: 'online',
  })

  // Login mutation with faster redirect
  const loginMutation = useMutation({
    mutationFn: ({ employeeCode, password }: { employeeCode: string; password: string }) => 
      AuthService.login({ employeeCode, password }),
    onSuccess: (response) => {
      console.log('[AUTH] Login success - setting user data and redirecting')
      
      // Set user data immediately to prevent loading flash
      queryClient.setQueryData(['auth', 'profile'], response.user)
      
      // Preload dashboard data in background
      queryClient.prefetchQuery({
        queryKey: ['dashboard', 'combined-data'],
        staleTime: 60 * 1000,
      })
      
      toast.success('Đăng nhập thành công!')
      
      // Immediate redirect for better UX
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    },
    onError: (error: Error) => {
      console.error('[AUTH] Login error:', error)
      toast.error(error.message)
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => AuthService.register(data),
    onSuccess: () => {
      toast.success('Đăng ký thành công!\nVui lòng đăng nhập.')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công!')
    },
    onError: (error: Error) => {
      // Clear cache anyway on logout error
      queryClient.clear()
    }
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => AuthService.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    user: user ?? null,
    isLoading: !isMounted || isLoading,
    isAuthenticated: isMounted && !!user && !error,
    login: async (employeeCode: string, password: string) => {
      await loginMutation.mutateAsync({ employeeCode, password })
    },
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  }
}