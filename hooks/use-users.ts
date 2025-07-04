'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/services/user.service'
import type { 
  User, 
  CreateUserDto,
  UpdateProfileDto, 
  PaginatedResponse 
} from '@/types'
import { toast } from 'react-toast-kit'

// Query keys for user data
const USER_QUERY_KEYS = {
  users: (page: number, limit: number) => ['users', 'all', page, limit] as const,
  userById: (id: string) => ['users', 'by-id', id] as const,
}

/**
 * Get all users (admin only)
 */
export function useAllUsers(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<User>, Error>({
    queryKey: USER_QUERY_KEYS.users(page, limit),
    queryFn: () => UserService.getAllUsers(page, limit),
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get user by ID
 */
export function useUserById(id: string) {
  return useQuery<User, Error>({
    queryKey: USER_QUERY_KEYS.userById(id),
    queryFn: () => UserService.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Create user mutation (admin only)
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation<User, Error, CreateUserDto>({
    mutationFn: (data: CreateUserDto) => UserService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['users', 'all'],
        exact: false 
      })
      toast.success('Tạo người dùng thành công!')
    },
    onError: (error) => {
      console.error('Create user error:', error)
      toast.error(error.message || 'Tạo người dùng thất bại')
    },
    retry: 1,
  })
}

/**
 * Update user by admin
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation<User, Error, { id: string; data: UpdateProfileDto }>({
    mutationFn: ({ id, data }) => UserService.updateUser(id, data),
    onSuccess: (updatedUser, variables) => {
      queryClient.setQueryData(USER_QUERY_KEYS.userById(variables.id), updatedUser)
      queryClient.invalidateQueries({ 
        queryKey: ['users', 'all'],
        exact: false 
      })
      toast.success('Cập nhật thông tin người dùng thành công!')
    },
    onError: (error) => {
      console.error('Update user error:', error)
      toast.error(error.message || 'Cập nhật thông tin người dùng thất bại')
    },
    retry: 1,
  })
}

/**
 * Delete user by admin
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, string>({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    onSuccess: (_, deletedUserId) => {
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.userById(deletedUserId) })
      queryClient.invalidateQueries({ 
        queryKey: ['users', 'all'],
        exact: false 
      })
      toast.success('Xóa người dùng thành công!')
    },
    onError: (error) => {
      console.error('Delete user error:', error)
      toast.error(error.message || 'Xóa người dùng thất bại')
    },
    retry: 1,
  })
}

/**
 * Get all users (admin only) - with params
 */
export function useUsers(params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  office?: string
  isActive?: boolean
}) {
  const page = params?.page || 1
  const limit = params?.limit || 10
  
  return useQuery({
    queryKey: ['users', 'all', { page, limit, ...params }],
    queryFn: () => UserService.getAllUsers(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Get user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => UserService.getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}


/**
 * Get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => UserService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if error is 401 (Unauthorized)
      if (error?.status === 401 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Update current user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: UpdateProfileDto) => UserService.updateProfile(userData),
    onSuccess: (updatedUser) => {
      // Update cache with new user info
      queryClient.setQueryData(['users', 'profile'], updatedUser)
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] })
    },
  })
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      UserService.changePassword(data),
  })
}

/**
 * Get all offices
 */
export function useOffices() {
  return useQuery({
    queryKey: ['organizations', 'offices'],
    queryFn: () => UserService.getOffices(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get all job positions
 */
export function useJobPositions() {
  return useQuery({
    queryKey: ['organizations', 'job-positions'],
    queryFn: () => UserService.getJobPositions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get all departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: ['organizations', 'departments'],
    queryFn: () => UserService.getDepartments(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get all positions
 */
export function usePositions() {
  return useQuery({
    queryKey: ['organizations', 'positions'],
    queryFn: () => UserService.getPositions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get users with ranking data
 */
export function useUsersWithRanking(filters?: {
  weekNumber?: number
  year?: number
  periodWeeks?: number
}) {
  return useQuery({
    queryKey: ['users', 'with-ranking', filters],
    queryFn: () => UserService.getUsersWithRankingData(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}
