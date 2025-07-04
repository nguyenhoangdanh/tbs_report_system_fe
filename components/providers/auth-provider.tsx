'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLogin, useLogout, useChangePassword } from '@/hooks/use-auth'
import { ChangePasswordDto, User } from '@/types'
import { useProfile } from '@/hooks/use-profile'
import { toast } from 'react-toast-kit'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
  login: (employeeCode: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  changePassword: (data: ChangePasswordDto) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useProfile()
  
  const loginMutation = useLogin()
  const logoutMutation = useLogout()
  const changePasswordMutation = useChangePassword()

  // Initialize auth state từ profile API (dựa vào HTTP-only cookie)
  useEffect(() => {
    if (!profileLoading) {
      if (profileData) {
        console.log('[AUTH PROVIDER] User authenticated:', profileData)
        setUser(profileData)
      } else if (profileError) {
        console.log('[AUTH PROVIDER] User not authenticated:', profileError)
        setUser(null)
      }
      setIsInitialized(true)
    }
  }, [profileData, profileLoading, profileError])

  // Login function - chỉ sử dụng thông tin user trả về
  const login = useCallback(async (employeeCode: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await loginMutation.mutateAsync({ 
        employeeCode, 
        password, 
        rememberMe 
      })
      
      console.log('[AUTH PROVIDER] Login successful:', response)
      
      // Backend đã set HTTP-only cookie, chỉ cần lưu user info
      setUser(response.user)
      toast.success('Đăng nhập thành công!')
      
      // Redirect to dashboard or return URL
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl')
      router.push(returnUrl || '/dashboard')
    } catch (error: any) {
      console.error('[AUTH PROVIDER] Login error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại'
      toast.error(errorMessage)
      throw error
    }
  }, [loginMutation, router])

  // Logout function - clear user state và để backend clear cookie
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync()
      console.log('[AUTH PROVIDER] Logout successful')
      
      // Clear user state
      setUser(null)
      
      // Redirect to login
      router.replace('/login')
      toast.success('Đăng xuất thành công!')
    } catch (error: any) {
      console.error('[AUTH PROVIDER] Logout error:', error)
      
      // Still clear state even if logout API fails
      setUser(null)
      router.replace('/login')
      
      // Show warning but don't block logout
      toast.error('Có lỗi khi đăng xuất, nhưng bạn đã được đăng xuất')
    }
  }, [logoutMutation, router])

  // Change password function
  const changePassword = useCallback(async (data: ChangePasswordDto) => {
    try {
      await changePasswordMutation.mutateAsync(data)
      toast.success('Đổi mật khẩu thành công!')
    } catch (error: any) {
      console.error('[AUTH PROVIDER] Change password error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại'
      toast.error(errorMessage)
      throw error
    }
  }, [changePasswordMutation])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const updatedProfile = await refetchProfile()
      if (updatedProfile.data) {
        setUser(updatedProfile.data)
        console.log('[AUTH PROVIDER] User data refreshed')
      } else {
        // Nếu không lấy được profile, có thể session đã hết hạn
        console.log('[AUTH PROVIDER] Failed to refresh user data, logging out')
        await logout()
      }
    } catch (error) {
      console.error('[AUTH PROVIDER] Error refreshing user:', error)
      // Nếu refresh thất bại, logout để đảm bảo security
      await logout()
    }
  }, [refetchProfile, logout])

  // Auto-refresh user data periodically để đảm bảo session còn valid
  useEffect(() => {
    if (!user || !isInitialized) return

    // Refresh every 5 minutes để check session
    const interval = setInterval(() => {
      console.log('[AUTH PROVIDER] Auto-refreshing user data')
      refreshUser()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, isInitialized, refreshUser])

  // Check session validity on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && isInitialized) {
        console.log('[AUTH PROVIDER] Window focused, checking session')
        refreshUser()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, isInitialized, refreshUser])

  const contextValue: AuthContextType = {
    user,
    isLoading: !isInitialized || profileLoading,
    isAuthenticated: !!user && !profileError,
    error: profileError,
    login,
    logout,
    changePassword,
    refreshUser,
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
