'use client'

import { useAuth } from './auth-provider'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/']

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname)

      if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        // Redirect authenticated users away from auth pages
        window.location.href = '/dashboard'
        return
      }

      if (!isAuthenticated && !isPublicRoute) {
        // Redirect unauthenticated users to login
        const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`
        window.location.href = loginUrl
        return
      }
    }
  }, [isAuthenticated, isLoading, pathname])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
