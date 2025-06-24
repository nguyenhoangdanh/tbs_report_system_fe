import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'
import { api } from '@/lib/api'
import type { RegisterDto, ChangePasswordDto, User } from '@/types'
import { toast } from 'react-hot-toast'

export function useAuth() {
  const queryClient = useQueryClient()

  // Get current user profile
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        return await api.get<User>('/users/profile')
      } catch (error: any) {
        // Don't show toast for 401 errors (user not logged in)
        if (error.status !== 401) {
          console.error('Profile fetch error:', error)
        }
        throw error
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ employeeCode, password }: { employeeCode: string; password: string }) => 
      AuthService.login({ employeeCode, password }),
    onSuccess: (response) => {
      queryClient.setQueryData(['auth', 'profile'], response.user)
      toast.success('Đăng nhập thành công!')
    },
    onError: (error: Error) => {
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
      console.error('Logout failed:', error)
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
    isLoading,
    isAuthenticated: !!user && !error,
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
