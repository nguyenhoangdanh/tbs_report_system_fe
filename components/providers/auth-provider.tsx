'use client'

import React, { createContext, useContext } from 'react'
import { useAuth as useAuthQuery } from '@/hooks/use-auth'
import type { User, RegisterDto, ChangePasswordDto } from '@/types'

interface AuthContextType {
  user: User | null
  login: (employeeCode: string, password: string) => Promise<void>
  register: (data: RegisterDto) => Promise<void>
  logout: () => Promise<void>
  changePassword: (data: ChangePasswordDto) => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  isLoginLoading: boolean
  isRegisterLoading: boolean
  isLogoutLoading: boolean
  isChangePasswordLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthQuery()

  // Transform undefined to null for consistency and wrap functions to return Promise<void>
  const authWithNullUser: AuthContextType = {
    user: auth.user ?? null,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    register: async (data: RegisterDto) => {
      await auth.register(data)
    },
    logout: auth.logout,
    changePassword: auth.changePassword,
    isLoginLoading: auth.isLoginLoading,
    isRegisterLoading: auth.isRegisterLoading,
    isLogoutLoading: auth.isLogoutLoading,
    isChangePasswordLoading: auth.isChangePasswordLoading,
  }

  return (
    <AuthContext.Provider value={authWithNullUser}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
