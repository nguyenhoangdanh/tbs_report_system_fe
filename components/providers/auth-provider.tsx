'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'
import { clearUserCaches } from '@/hooks/use-reports'
import { toast } from 'react-toast-kit'
import type { User, LoginDto } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginDto) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  const isAuthenticated = !!user

  const clearUserData = useCallback((previousUserId?: string) => {
    setUser(null)
    // Clear all user-specific caches
    clearUserCaches(queryClient, previousUserId)
    // Không cần clear localStorage vì backend sử dụng HTTP-only cookies
  }, [queryClient])

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Backend sử dụng HTTP-only cookies, gọi API profile để verify
      const userData = await AuthService.getProfile()
      
      // Check if this is a different user
      const previousUserId = user?.id
      const newUserId = userData.id
      
      if (previousUserId && previousUserId !== newUserId) {
        // Clear previous user's cache
        clearUserCaches(queryClient, previousUserId)
        console.log('🔄 Cleared cache for previous user:', previousUserId)
      }
      
      setUser(userData)
    } catch (error) {
      console.log('❌ Auth check failed:', error)
      clearUserData(user?.id)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, queryClient, clearUserData])

  const login = useCallback(async (credentials: LoginDto) => {
    try {
      const previousUserId = user?.id
      
      // Backend xử lý cả MSNV (số) và email prefix (chữ)
      console.log('🔑 Attempting login with:', {
        employeeCode: credentials.employeeCode,
        isNumeric: /^\d+$/.test(credentials.employeeCode),
        isEmailPrefix: /^[a-zA-Z][a-zA-Z0-9]*$/.test(credentials.employeeCode),
        rememberMe: credentials.rememberMe
      })
      
      const response = await AuthService.login(credentials)
      
      // Clear previous user's cache if exists
      if (previousUserId) {
        clearUserCaches(queryClient, previousUserId)
      }
      
      // Backend trả về user data và tự động set HTTP-only cookie
      setUser(response.user)
      
      console.log('✅ Login successful for user:', response.user.id)
      
      // Navigate to dashboard after successful login
      router.push('/dashboard')
      toast.success('Đăng nhập thành công!')
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      clearUserData(user?.id)
      
      const message = error?.message || 'Đăng nhập thất bại'
      toast.error(message)
      throw error
    }
  }, [user?.id, router, queryClient, clearUserData])

  const logout = useCallback(async () => {
    try {
      const currentUserId = user?.id
      
      // Call backend logout để clear HTTP-only cookie
      await AuthService.logout()
      
      // Clear user data and caches
      clearUserData(currentUserId)
      
      console.log('✅ Logout successful for user:', currentUserId)
      
      // Navigate to login page
      router.push('/login')
      toast.success('Đăng xuất thành công!')
    } catch (error: any) {
      console.error('❌ Logout failed:', error)
      
      // Force clear user data even if logout API fails
      clearUserData(user?.id)
      router.push('/login')
      
      toast.error('Đã có lỗi xảy ra khi đăng xuất')
    }
  }, [user?.id, router, clearUserData])

  // Initial auth check - chỉ chạy một lần khi mount
  useEffect(() => {
    checkAuth()
  }, []) // Bỏ checkAuth khỏi dependencies để tránh infinite loop

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
