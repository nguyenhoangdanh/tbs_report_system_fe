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
import { QUERY_KEYS } from './query-key'
import { useApiQuery } from './use-api-query'
import { useOptimizedMutation } from './use-mutation'

// Query keys for user data
const USER_QUERY_KEYS = {
  users: (page: number, limit: number) => ['users', 'all', page, limit] as const,
  userById: (id: string) => ['users', 'by-id', id] as const,
}

/**
 * Get all users (admin only)
 */
export function useAllUsers(page = 1, limit = 10) {
  return useApiQuery<PaginatedResponse<User>, Error>({
    queryKey: QUERY_KEYS.users.list(page, limit),
    queryFn: () => UserService.getAllUsers(page, limit),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Get user by ID
 */
export function useUserById(id: string) {
  return useApiQuery<User, Error>({
    queryKey: QUERY_KEYS.users.detail(id),
    queryFn: () => UserService.getUserById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    throwOnError: false,
  })
}

/**
 * Create user mutation (admin only)
 */
export function useCreateUser() {
  return useOptimizedMutation<User, CreateUserDto, Error>({
    mutationFn: (data: CreateUserDto) => UserService.createUser(data),
    onSuccess: () => {
      toast.success('Tạo người dùng thành công!')
    },
    onError: (error) => {
      console.error('Create user error:', error)
      toast.error(error.message || 'Tạo người dùng thất bại')
    },
    invalidateQueries: async (cacheManager) => {
      await cacheManager.invalidateUserManagementData()
    },
    retry: 1,
  })
}

/**
 * Update user by admin
 */
export function useUpdateUser() {
  return useOptimizedMutation<User, { id: string; data: UpdateProfileDto }, Error>({
    mutationFn: ({ id, data }) => UserService.updateUser(id, data),
    onSuccess: (updatedUser, variables) => {
      toast.success('Cập nhật thông tin người dùng thành công!')
    },
    onError: (error) => {
      console.error('Update user error:', error)
      toast.error(error.message || 'Cập nhật thông tin người dùng thất bại')
    },
    invalidateQueries: async (cacheManager, data, variables) => {
      await cacheManager.invalidateUserManagementData(variables.id)
      await cacheManager.invalidateUserData(variables.id)
    },
    retry: 1,
  })
}

/**
 * Delete user by admin
 */
export function useDeleteUser() {
  return useOptimizedMutation<void, string, Error>({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công!')
    },
    onError: (error) => {
      console.error('Delete user error:', error)
      toast.error(error.message || 'Xóa người dùng thất bại')
    },
    invalidateQueries: async (cacheManager, data, userId) => {
      cacheManager.clearUserCache(userId)
      await cacheManager.invalidateUserManagementData()
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
    queryKey: QUERY_KEYS.users.profile,
    queryFn: () => UserService.getProfile(),
    staleTime: 3 * 60 * 1000,
    retry: (failureCount, error: any) => {
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
      queryClient.setQueryData(QUERY_KEYS.users.profile, updatedUser)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.profile })
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
    queryKey: QUERY_KEYS.organizations.offices,
    queryFn: () => UserService.getOffices(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Get all job positions
 */
export function useJobPositions() {
  return useQuery({
    queryKey: QUERY_KEYS.organizations.jobPositions,
    queryFn: () => UserService.getJobPositions(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Get all departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: QUERY_KEYS.organizations.departments,
    queryFn: () => UserService.getDepartments(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Get all positions
 */
export function usePositions() {
  return useQuery({
    queryKey: QUERY_KEYS.organizations.positions,
    queryFn: () => UserService.getPositions(),
    staleTime: 10 * 60 * 1000,
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
    queryKey: QUERY_KEYS.users.withRanking(filters),
    queryFn: () => UserService.getUsersWithRankingData(filters),
    staleTime: 2 * 60 * 1000,
  })
}
