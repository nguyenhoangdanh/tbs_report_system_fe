'use client'

import { useAuth } from './auth-provider'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Force stop checking after 5 seconds
    const timeout = setTimeout(() => {
      console.log('[RouteGuard] Force stop checking after 5 seconds')
      setChecking(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!isLoading && checking) {
      console.log('[RouteGuard] Auth check:', { isAuthenticated, pathname })
      
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      
      if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        console.log('[RouteGuard] Redirecting to dashboard')
        router.replace('/dashboard')
        return
      }
      
      if (!isAuthenticated && !isPublicRoute) {
        console.log('[RouteGuard] Redirecting to login')
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`)
        return
      }
      
      setChecking(false)
    }
  }, [isLoading, isAuthenticated, pathname, router, checking])

  // Show loading only when actually needed
  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
          <button 
            onClick={() => {
              setChecking(false)
              window.location.reload()
            }}
            className="mt-4 text-sm text-green-600 hover:underline"
          >
            Bấm vào đây nếu tải quá lâu
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
