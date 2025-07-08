'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useChangePassword } from '@/hooks/use-auth'
import { ChangePasswordDto, User } from '@/types'
import { useProfile } from '@/hooks/use-profile'
import { toast } from 'react-toast-kit'
import { AuthService } from '@/services/auth.service'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
  login: (employeeCode: string, password: string, rememberMe?: boolean) => Promise<User>
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
  
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useProfile()
  
  const changePasswordMutation = useChangePassword()

  // Initialize auth state từ profile API (dựa vào HTTP-only cookie)
  useEffect(() => {
    if (!profileLoading) {
      if (profileData) {
        setUser(profileData)
      } else if (profileError) {
        setUser(null)
      }
      setIsInitialized(true)
    }
  }, [profileData, profileLoading, profileError])

  // Login function - return user data, let AuthGuard handle redirect
  const login = useCallback(async (employeeCode: string, password: string, rememberMe?: boolean): Promise<User> => {
    try {
      
      const response = await AuthService.login({ 
        employeeCode, 
        password, 
        rememberMe 
      })
      
      
      // Update user state immediately
      setUser(response.user)
      
      // Invalidate and refetch profile to sync with backend
      await refetchProfile()
      
      toast.success('Đăng nhập thành công!')
      
      // Return user data for AuthGuard to handle redirect
      return response.user
    } catch (error: any) {
      console.error('[AUTH PROVIDER] Login error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại'
      toast.error(errorMessage)
      throw error
    }
  }, [refetchProfile])

  // Logout function - clear user state, let AuthGuard handle redirect
  const logout = useCallback(async () => {
    try {
      
      await AuthService.logout()
      
      // Clear user state
      setUser(null)
      
      toast.success('Đăng xuất thành công!')
    } catch (error: any) {
      console.error('[AUTH PROVIDER] Logout error:', error)
      
      // Still clear state even if logout API fails
      setUser(null)
      
      // Show warning but don't block logout
      toast.error('Có lỗi khi đăng xuất, nhưng bạn đã được đăng xuất')
    }
  }, [])

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
      console.log('[AUTH PROVIDER] Refreshing user data...')
      const updatedProfile = await refetchProfile()
      if (updatedProfile.data) {
        setUser(updatedProfile.data)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('[AUTH PROVIDER] Error refreshing user:', error)
      setUser(null)
    }
  }, [refetchProfile])

  // Auto-refresh user data periodically (only in production)
  useEffect(() => {
    if (!user || !isInitialized || process.env.NODE_ENV !== 'production') return

    // Refresh every 10 minutes in production
    const interval = setInterval(() => {
      refreshUser()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, isInitialized, refreshUser])

  // Check session validity on window focus (only in production)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    const handleFocus = () => {
      if (user && isInitialized) {
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
