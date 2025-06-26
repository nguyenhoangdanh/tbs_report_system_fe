'use client'

import { useAuth } from './auth-provider'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const PUBLIC_ROUTES = [
  '/',
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password'
]

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
        
        // Case 1: Đã login nhưng ở auth pages -> redirect
        if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
          window.location.replace('/dashboard')
          return
        }

        // Case 2: Chưa login và ở protected route -> redirect  
        if (!isAuthenticated && !isPublicRoute) {
          const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`
          window.location.replace(loginUrl)
          return
        }

        setIsChecking(false)
      }
    }

    checkAuth()
  }, [isAuthenticated, isLoading, pathname])

  // Show loading khi đang check auth
  if (isLoading || isChecking) {
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
