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
import { useApiQuery, useApiMutation } from './use-api-query'

/**
 * Get all users (admin only)
 */
export function useAllUsers(page = 1, limit = 10) {
  return useApiQuery<PaginatedResponse<User>, Error>({
    queryKey: QUERY_KEYS.users.list(page, limit),
    queryFn: () => UserService.getAllUsers(page, limit),
    cacheStrategy: 'normal',
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
    cacheStrategy: 'normal',
    throwOnError: false,
  })
}

/**
 * Create user mutation (admin only)
 */
export function useCreateUser() {
  return useApiMutation<User, CreateUserDto, Error>({
    mutationFn: (data: CreateUserDto) => UserService.createUser(data),
    invalidation: {
      type: 'custom',
      customInvalidation: async (queryClient) => {
        await queryClient.invalidateQueries({ queryKey: ['users'] })
      }
    },
    onSuccess: () => {
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
  return useApiMutation<User, { id: string; data: UpdateProfileDto }, Error>({
    mutationFn: ({ id, data }) => UserService.updateUser(id, data),
    invalidation: {
      type: 'custom',
      customInvalidation: async (queryClient, data, variables) => {
        await queryClient.invalidateQueries({ queryKey: ['users'] })
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.detail(variables.id) })
      }
    },
    onSuccess: (updatedUser, variables) => {
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
  return useApiMutation<void, string, Error>({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    invalidation: {
      type: 'custom',
      customInvalidation: async (queryClient, data, userId) => {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.users.detail(userId) })
        await queryClient.invalidateQueries({ queryKey: ['users'] })
      }
    },
    onSuccess: () => {
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
