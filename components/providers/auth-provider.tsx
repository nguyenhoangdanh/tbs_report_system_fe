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
  error: string | null
  login: (credentials: LoginDto) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true to show loading initially
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Refs to prevent duplicate API calls
  const isCheckingAuth = useRef(false)
  const isLoggingIn = useRef(false)
  const isLoggingOut = useRef(false)
  const hasInitialized = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 3 // Reduce retries to 2

  const isAuthenticated = !!user

  const clearUserData = useCallback((previousUserId?: string) => {
    setUser(null)
    setError(null)
    clearUserCaches(queryClient, previousUserId)
  }, [queryClient])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Remove checkAuth from dependencies by using useCallback without dependencies
  const checkAuth = useCallback(async () => {
    // Prevent duplicate auth checks
    if (isCheckingAuth.current) {
      return
    }

    // Check retry limit
    if (retryCount.current >= maxRetries) {
      setIsLoading(false)
      isCheckingAuth.current = false
      setError('Không thể xác thực người dùng')
      return
    }

    try {
      isCheckingAuth.current = true
      setIsLoading(true)
      setError(null)
      retryCount.current++
      
      const result = await AuthService.getProfile()
      
      if (result.success && result.data) {
        setUser((prevUser) => {
          const previousUserId = prevUser?.id
          const newUserId = result.data!.id
          
          if (previousUserId && previousUserId !== newUserId) {
            clearUserCaches(queryClient, previousUserId)
          }
          
          return result.data!
        })
        setError(null)
        retryCount.current = 0 // Reset retry count on success
      } else {
        // More detailed error handling
        const errorMessage = result.error?.message || 'Xác thực thất bại'
        const errorStatus = result.error?.status
        
        // Don't clear on server errors (500, 502, etc.) as these might be temporary
        if (errorStatus && errorStatus >= 400 && errorStatus < 500) {
          setUser((prevUser) => {
            if (prevUser) {
              clearUserCaches(queryClient, prevUser.id)
            }
            return null
          })
        }
        
        // Set error for server errors, don't set error for client errors (user is just not logged in)
        if (errorStatus && errorStatus >= 500) {
          setError(errorMessage)
        } else {
          setError(null) // Clear error for client errors - user just needs to login
        }
      }
    } catch (error: any) {
      console.error('💥 Auth check error:', error)
      
      // Don't clear user data on network errors - might be temporary
      if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
        console.log('🌐 Network error during auth check, keeping user data')
        setError('Lỗi kết nối mạng')
      } else {
        setUser((prevUser) => {
          if (prevUser) {
            clearUserCaches(queryClient, prevUser.id)
          }
          return null
        })
        setError(error?.message || 'Lỗi xác thực')
      }
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [queryClient]) // Only include queryClient as dependency

  const login = useCallback(async (credentials: LoginDto): Promise<boolean> => {
    // Prevent duplicate login calls
    if (isLoggingIn.current) {
      console.log('🔄 Login already in progress, skipping...')
      return false
    }

    try {
      isLoggingIn.current = true
      setError(null)
      
      const result = await AuthService.login(credentials)

      if (result.success && result.data?.user) {
        setUser((prevUser) => {
          if (prevUser) {
            clearUserCaches(queryClient, prevUser.id)
          }
          return result.data!.user
        })
        retryCount.current = 0 // Reset retry count on successful login
        return true
      } else {
        const errorMessage = result.error?.message || 'Đăng nhập thất bại'
        setError(errorMessage)
        toast.error(errorMessage)
        return false
      }
    } catch (error: any) {
      console.error('💥 Login error:', error)
      const errorMessage = error?.message || 'Đăng nhập thất bại'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      isLoggingIn.current = false
    }
  }, [queryClient])

  const logout = useCallback(async () => {
    // Prevent duplicate logout calls
    if (isLoggingOut.current) {
      console.log('🔄 Logout already in progress, skipping...')
      return
    }

    try {
      isLoggingOut.current = true
      
      const result = await AuthService.logout()
      
      // Always clear user data regardless of API result
      setUser((prevUser) => {
        if (prevUser) {
          clearUserCaches(queryClient, prevUser.id)
        }
        return null
      })
      retryCount.current = 0 // Reset retry count on logout
      
      if (result.success) {
        toast.success('Đăng xuất thành công!')
      } else {
        toast.success('Đã đăng xuất!')
      }
      
      router.push('/login')
    } catch (error: any) {
      
      // Always clear user data even if API fails
      setUser((prevUser) => {
        if (prevUser) {
          clearUserCaches(queryClient, prevUser.id)
        }
        return null
      })
      router.push('/login')
      
      toast.success('Đã đăng xuất!')
    } finally {
      isLoggingOut.current = false
    }
  }, [router, queryClient])

  // Initial auth check - FIX: Actually call checkAuth in useEffect
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      
      // Check if we're in browser and have cookies
      const hasCookies = typeof document !== 'undefined' && document.cookie.length > 0
      
      // Don't use timeout - call checkAuth immediately to prevent loading state stuck
      if (!isCheckingAuth.current) {
        checkAuth().catch((error) => {
          setIsLoading(false) // Ensure loading stops even on error
        })
      }
    }
  }, [checkAuth]) // Add checkAuth as dependency to ensure it's called

  // Fallback to stop loading after a timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !isCheckingAuth.current) {
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout as fallback

    return () => clearTimeout(timeoutId)
  }, [isLoading])

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
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
