'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import type { User, RegisterDto, ChangePasswordDto } from '@/types'

interface LoginResponse {
  success: boolean
  user: User
  message: string
}

interface AuthResponse {
  user: User
}

export function useAuth() {
  const queryClient = useQueryClient()

  // Get current user profile - with longer stale time to reduce API calls
  const {
    data: authData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<AuthResponse> => {
      try {
        return await api.get<AuthResponse>('/users/profile')
      } catch (error: any) {
        if (error.status === 401) {
          // Clear any stale auth data
          queryClient.removeQueries({ queryKey: ['auth'] })
          throw error
        }
        throw error
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - much longer than before
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) return false
      return failureCount < 1
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every mount
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ employeeCode, password }: { employeeCode: string; password: string }) => {
      return await api.post<LoginResponse>('/auth/login', { employeeCode, password })
    },
    onSuccess: (data) => {
      // Update the auth cache with new user data
      queryClient.setQueryData(['auth', 'profile'], { user: data.user })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      toast.success(data.message || 'Đăng nhập thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại!')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterDto) => {
      return await api.post('/auth/register', data)
    },
    onSuccess: (data: any) => {
      toast.success(data.message || 'Đăng ký thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại!')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/auth/logout')
    },
    onSuccess: () => {
      // Clear all auth-related cache
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.removeQueries({ queryKey: ['users'] })
      queryClient.removeQueries({ queryKey: ['reports'] })
      
      toast.success('Đăng xuất thành công!')
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local state
      queryClient.removeQueries({ queryKey: ['auth'] })
      toast.error(error.message || 'Có lỗi khi đăng xuất!')
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      return await api.patch('/auth/change-password', data)
    },
    onSuccess: (data: any) => {
      toast.success(data.message || 'Đổi mật khẩu thành công!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đổi mật khẩu thất bại!')
    },
  })

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user && !error,
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