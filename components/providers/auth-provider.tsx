'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

  // Refs to prevent duplicate API calls
  const isCheckingAuth = useRef(false)
  const isLoggingIn = useRef(false)
  const isLoggingOut = useRef(false)
  const hasInitialized = useRef(false)

  const isAuthenticated = !!user

  const clearUserData = useCallback((previousUserId?: string) => {
    setUser(null)
    clearUserCaches(queryClient, previousUserId)
  }, [queryClient])

  const checkAuth = useCallback(async () => {
    // Prevent duplicate auth checks
    if (isCheckingAuth.current) {
      return
    }

    try {
      isCheckingAuth.current = true
      setIsLoading(true)
      
      const userData = await AuthService.getProfile()
      
      const previousUserId = user?.id
      const newUserId = userData.id
      
      if (previousUserId && previousUserId !== newUserId) {
        clearUserCaches(queryClient, previousUserId)
      }
      
      setUser(userData)
    } catch (error) {
      clearUserData(user?.id)
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [user?.id, queryClient, clearUserData])

  const login = useCallback(async (credentials: LoginDto) => {
    // Prevent duplicate login calls
    if (isLoggingIn.current) {
      return
    }

    try {
      isLoggingIn.current = true
      
      const previousUserId = user?.id
      
      const response = await AuthService.login(credentials)
      
      if (previousUserId) {
        clearUserCaches(queryClient, previousUserId)
      }
      
      setUser(response.user)
      
      router.push('/dashboard')
      toast.success('Đăng nhập thành công!')
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      clearUserData(user?.id)
      
      const message = error?.message || 'Đăng nhập thất bại'
      toast.error(message)
      throw error
    } finally {
      isLoggingIn.current = false
    }
  }, [user?.id, router, queryClient, clearUserData])

  const logout = useCallback(async () => {
    // Prevent duplicate logout calls
    if (isLoggingOut.current) {
      return
    }

    try {
      isLoggingOut.current = true
      const currentUserId = user?.id
      
      await AuthService.logout()
      
      clearUserData(currentUserId)
      
      router.push('/login')
      toast.success('Đăng xuất thành công!')
    } catch (error: any) {
      console.error('❌ Logout failed:', error)
      
      clearUserData(user?.id)
      router.push('/login')
      
      toast.error('Đã có lỗi xảy ra khi đăng xuất')
    } finally {
      isLoggingOut.current = false
    }
  }, [user?.id, router, clearUserData])

  // Initial auth check - only run once
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      console.log('🏁 AuthProvider initializing...')
      checkAuth()
    }
  }, [])

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
