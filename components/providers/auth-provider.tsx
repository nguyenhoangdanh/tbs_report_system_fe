"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { toast } from "react-toast-kit"
import type { User, LoginDto } from "@/types"
import { adminOverviewStoreActions } from "@/store/admin-overview-store"
import { useAuthStore } from "@/store/auth-store"

interface AuthContextType {
  user: User | null // ✅ Explicitly allow null
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const isCheckingAuth = useRef(false)
  const isLoggingIn = useRef(false)
  const isLoggingOut = useRef(false)
  const hasInitialized = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 5

  const isAuthenticated = !!user

  // STABLE user object to prevent unnecessary rerenders - UPDATED to be more sensitive to changes
  const stableUser = useMemo(() => user, [
    user?.id, 
    user?.employeeCode, 
    user?.firstName, 
    user?.lastName, 
    user?.email, 
    user?.phone,
    user?.jobPosition?.id,
    user?.office?.id,
    user?.role,
    user?.updatedAt // Include updatedAt to trigger updates
  ])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ✅ Simple subscription to auth store
  const hasValidTokens = useAuthStore((state) => state.hasValidAuth())

  const checkAuth = useCallback(async () => {
    // ✅ If we have valid tokens in localStorage, use them immediately
    if (hasValidTokens) {
      try {
        const result = await AuthService.getProfile()
        if (result.success && result.data) {
          setUser(result.data)
          setError(null)
          retryCount.current = 0
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.warn('⚠️ Token verification failed:', error)
        useAuthStore.getState().clearAuth()
      }
    }

    // Prevent concurrent auth checks
    if (isCheckingAuth.current) {
      return
    }

    // Simple retry limit
    if (retryCount.current >= maxRetries) {
      setIsLoading(false)
      setError("Không thể xác thực người dùng")
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
          const newUser = { 
            ...result.data!, 
            updatedAt: new Date().toISOString() 
          }
          
          const hasUserDataChanged = !prevUser || 
            JSON.stringify(prevUser) !== JSON.stringify(newUser)
          
          if (hasUserDataChanged) {
            const profileKey = ['auth', 'profile']
            queryClient.setQueryData(profileKey, newUser)
            return newUser
          }
          
          return prevUser
        })
        setError(null)
        retryCount.current = 0
      } else {
        // Auth failed - clear user and tokens
        setUser(null)
        queryClient.clear()
        useAuthStore.getState().clearAuth()
        
        if (result.error?.status && result.error.status >= 500) {
          setError(result.error.message || "Lỗi server")
        }
      }
    } catch (error: any) {
      console.error("Auth check failed:", error)
      
      setUser(null)
      queryClient.clear()
      useAuthStore.getState().clearAuth()
      
      if (error?.message?.includes("Network") || error?.message?.includes("fetch")) {
        setError("Lỗi kết nối mạng")
      }
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [queryClient, hasValidTokens])

  const login = useCallback(
    async (credentials: LoginDto): Promise<boolean> => {
      if (isLoggingIn.current) {
        return false
      }

      try {
        isLoggingIn.current = true
        setError(null)

        const result = await AuthService.login(credentials)

        if (result.success && result.data?.user) {
          const newUser = result.data.user
          
          // ✅ Tokens are already stored in auth store by AuthService.login
          // Just update user state
          queryClient.clear()
          
          if (typeof window !== 'undefined') {
            const { clearAllState } = await import('@/store/report-store')
            clearAllState()
          }
          
          setUser(newUser)
          retryCount.current = 0
          
          return true
        } else {
          const errorMessage = result.error?.message || "Đăng nhập thất bại"
          setError(errorMessage)
          toast.error(errorMessage)
          return false
        }
      } catch (error: any) {
        console.error("Login error:", error)
        const errorMessage = error?.message || "Đăng nhập thất bại"
        setError(errorMessage)
        toast.error(errorMessage)
        return false
      } finally {
        isLoggingIn.current = false
      }
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    if (isLoggingOut.current) {
      return
    }

    try {
      isLoggingOut.current = true
      
      // Clear user and cache immediately
      setUser(null)
      queryClient.clear()
      retryCount.current = 0

      // Clear zustand store state
      if (typeof window !== 'undefined') {
        const { clearAllState } = await import('@/store/report-store')
        clearAllState()
        adminOverviewStoreActions.clearAll()
      }

      // Backend logout will also clear auth store tokens
      try {
        await AuthService.logout()
        console.log('✅ Server logout successful')
      } catch (serverError) {
        console.warn('⚠️ Server logout failed, but local cleanup completed:', serverError)
      }
      
      toast.success("Đăng xuất thành công!")
      router.push("/login")
    } catch (error: any) {
      console.warn('⚠️ Logout process failed, but cleanup completed:', error)
      toast.success("Đã đăng xuất!")
      router.push("/login")
    } finally {
      isLoggingOut.current = false
    }
  }, [router, queryClient])

  // ✅ Simple initialization
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      // Immediate check for valid tokens
      const store = useAuthStore.getState()
      if (store.hasValidAuth()) {
        console.log('🔄 Valid tokens found on init, verifying with server...')
        checkAuth().catch((error) => {
          console.warn('⚠️ Token verification failed on init:', error)
          setIsLoading(false)
        })
      } else {
        console.log('ℹ️ No valid tokens found on init')
        setIsLoading(false)
      }
    }
  }, [checkAuth])

  // STABLE context value to prevent child rerenders
  const contextValue = useMemo(() => ({
    user: stableUser, // ✅ This can be null
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  }), [stableUser, isAuthenticated, isLoading, error, login, logout, checkAuth, clearError])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
