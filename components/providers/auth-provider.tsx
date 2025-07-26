"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { toast } from "react-toast-kit"
import type { User, LoginDto } from "@/types"
import { clearUserCaches } from "@/lib/cache-utils"

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

  // STABLE user object to prevent unnecessary rerenders
  const stableUser = useMemo(() => user, [user?.id, user?.employeeCode])

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
        // Simple user update - clear cache only if user changes
        setUser((prevUser) => {
          const newUser = result.data!
          
          // Only clear cache if different user
          if (prevUser?.id && prevUser.id !== newUser.id) {
            console.log('🔄 User changed, clearing cache:', { 
              from: prevUser.id, 
              to: newUser.id 
            })
            queryClient.clear()
          }

          return newUser
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
          
          // Always clear cache on login for fresh state
          queryClient.clear()
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
