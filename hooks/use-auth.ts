import { AuthService } from '@/services/auth.service'
import { api } from '@/lib/api'
import type { RegisterDto, ChangePasswordDto, User } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export function useAuth() {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current user profile
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      console.log('[AUTH] Fetching profile, cookies:', document.cookie)
      return await api.get<User>('/users/profile')
    },
    retry: (failureCount, error: any) => {
      console.log('[AUTH] Retry:', failureCount, 'Status:', error?.status)
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 1 // Giảm retry
    },
    staleTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
    enabled: isMounted, // Chỉ chạy client-side
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ employeeCode, password }: { employeeCode: string; password: string }) => 
      AuthService.login({ employeeCode, password }),
    onSuccess: (response) => {
      console.log('[AUTH] Login success response:', response)
      console.log('[AUTH] Checking cookies after login...')
      
      // Check cookies immediately
      setTimeout(() => {
        console.log('[AUTH] Cookies 100ms after login:', document.cookie)
      }, 100)
      
      setTimeout(() => {
        console.log('[AUTH] Cookies 500ms after login:', document.cookie)
      }, 500)
      
      queryClient.setQueryData(['auth', 'profile'], response.user)
      toast.success('Đăng nhập thành công!')
      
      // Wait for cookie to be set, then redirect
      setTimeout(() => {
        console.log('[AUTH] Final cookies before redirect:', document.cookie)
        const hasAuthToken = document.cookie.includes('auth-token')
        console.log('[AUTH] Has auth token before redirect:', hasAuthToken)
        
        if (hasAuthToken) {
          window.location.href = '/dashboard'
        } else {
          console.error('[AUTH] No auth token found after login!')
          toast.error('Đăng nhập thành công nhưng có lỗi xảy ra. Vui lòng thử lại.')
        }
      }, 1500) // Increased timeout for production
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