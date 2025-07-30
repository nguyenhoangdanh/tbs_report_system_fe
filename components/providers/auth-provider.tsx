"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { toast } from "react-toast-kit"
import type { User, LoginDto } from "@/types"
import { adminOverviewStoreActions } from "@/store/admin-overview-store"

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

  const checkAuth = useCallback(async () => {
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
            // Force new timestamp to trigger form updates
            updatedAt: new Date().toISOString() 
          }
          
          // Always update if ANY user data has changed
          const hasUserDataChanged = !prevUser || 
            JSON.stringify(prevUser) !== JSON.stringify(newUser)
          
          if (hasUserDataChanged) {
            // Update React Query cache
            const profileKey = ['auth', 'profile']
            queryClient.setQueryData(profileKey, newUser)
            
            return newUser
          }
          
          return prevUser
        })
        setError(null)
        retryCount.current = 0
      } else {
        // Auth failed - clear user and cache
        setUser((prevUser) => {
          if (prevUser) {
            queryClient.clear()
          }
          return null
        })
        
        // Only show error for server errors
        if (result.error?.status && result.error.status >= 500) {
          setError(result.error.message || "Lỗi server")
        }
      }
    } catch (error: any) {
      console.error("Auth check failed:", error)
      
      // Clear user on any error
      setUser((prevUser) => {
        if (prevUser) {
          queryClient.clear()
        }
        return null
      })
      
      // Only show network errors to user
      if (error?.message?.includes("Network") || error?.message?.includes("fetch")) {
        setError("Lỗi kết nối mạng")
      }
    } finally {
      setIsLoading(false)
      isCheckingAuth.current = false
    }
  }, [queryClient])

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
          
          // CRITICAL: Clear all cache and store state for new user
          queryClient.clear()
          
          // Clear zustand store state for user switch
          if (typeof window !== 'undefined') {
            // Clear report store state
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

      // Try to logout from server (but don't block UI)
      await AuthService.logout()
      
      toast.success("Đăng xuất thành công!")
      router.push("/login")
    } catch (error: any) {
      // Even if logout fails, user is already cleared
      toast.success("Đã đăng xuất!")
      router.push("/login")
    } finally {
      isLoggingOut.current = false
    }
  }, [router, queryClient])

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      const hasCookies = typeof document !== "undefined" && document.cookie.length > 0

      if (!isCheckingAuth.current) {
        checkAuth().catch((error) => {
          setIsLoading(false)
        })
      }
    }
  }, [checkAuth])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !isCheckingAuth.current) {
        setIsLoading(false)
      }
    }, 10000)

    return () => clearTimeout(timeoutId)
  }, [isLoading])

  // STABLE context value to prevent child rerenders
  const contextValue = useMemo(() => ({
    user: stableUser,
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
