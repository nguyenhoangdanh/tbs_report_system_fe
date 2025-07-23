"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { clearUserCaches } from "@/hooks/use-reports"
import { toast } from "react-toast-kit"
import type { User, LoginDto } from "@/types"

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

  const clearUserData = useCallback(
    (previousUserId?: string) => {
      setUser(null)
      setError(null)
      clearUserCaches(queryClient, previousUserId)
    },
    [queryClient],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const checkAuth = useCallback(async () => {
    if (isCheckingAuth.current) {
      return
    }

    if (retryCount.current >= maxRetries) {
      setIsLoading(false)
      isCheckingAuth.current = false
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
          const previousUserId = prevUser?.id
          const newUserId = result.data!.id

          if (previousUserId && previousUserId !== newUserId) {
            clearUserCaches(queryClient, previousUserId)
          }

          return result.data!
        })
        setError(null)
        retryCount.current = 0
      } else {
        const errorMessage = result.error?.message || "Xác thực thất bại"
        const errorStatus = result.error?.status

        if (errorStatus && errorStatus >= 400 && errorStatus < 500) {
          setUser((prevUser) => {
            if (prevUser) {
              clearUserCaches(queryClient, prevUser.id)
            }
            return null
          })
        }

        if (errorStatus && errorStatus >= 500) {
          setError(errorMessage)
        } else {
          setError(null)
        }
      }
    } catch (error: any) {
      console.error("💥 Auth check error:", error)

      if (error?.message?.includes("Network") || error?.message?.includes("fetch")) {
        setError("Lỗi kết nối mạng")
      } else {
        setUser((prevUser) => {
          if (prevUser) {
            clearUserCaches(queryClient, prevUser.id)
          }
          return null
        })
        setError(error?.message || "Lỗi xác thực")
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
          setUser((prevUser) => {
            if (prevUser) {
              clearUserCaches(queryClient, prevUser.id)
            }
            return result.data!.user
          })
          retryCount.current = 0
          // Gọi lại checkAuth để đảm bảo context user đồng bộ với backend
          await checkAuth()
          // Force reload để đảm bảo toàn bộ cache và state được reset (nếu vẫn lỗi)
          // window.location.reload()
          return true
        } else {
          const errorMessage = result.error?.message || "Đăng nhập thất bại"
          setError(errorMessage)
          toast.error(errorMessage)
          return false
        }
      } catch (error: any) {
        console.error("💥 Login error:", error)
        const errorMessage = error?.message || "Đăng nhập thất bại"
        setError(errorMessage)
        toast.error(errorMessage)
        return false
      } finally {
        isLoggingIn.current = false
      }
    },
    [queryClient, checkAuth],
  )

  const logout = useCallback(async () => {
    if (isLoggingOut.current) {
      return
    }

    try {
      isLoggingOut.current = true

      const result = await AuthService.logout()

      setUser((prevUser) => {
        if (prevUser) {
          clearUserCaches(queryClient, prevUser.id)
        }
        return null
      })
      retryCount.current = 0

      if (result.success) {
        toast.success("Đăng xuất thành công!")
      } else {
        toast.success("Đã đăng xuất!")
      }

      router.push("/login")
    } catch (error: any) {
      setUser((prevUser) => {
        if (prevUser) {
          clearUserCaches(queryClient, prevUser.id)
        }
        return null
      })
      router.push("/login")

      toast.success("Đã đăng xuất!")
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

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
