'use client'

import { useAuth } from './auth-provider'
import { useEffect, useState, useRef } from 'react'
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
  const hasRedirectedRef = useRef(false)
  const lastPathnameRef = useRef(pathname)
  const lastAuthStateRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Skip if already redirected or if auth state and path haven't changed
    if (hasRedirectedRef.current || 
        (lastPathnameRef.current === pathname && lastAuthStateRef.current === isAuthenticated)) {
      return
    }

    const checkAuth = async () => {
      if (!isLoading) {
        const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
        
        // Update refs
        lastPathnameRef.current = pathname
        lastAuthStateRef.current = isAuthenticated
        
        // Case 1: Authenticated user on auth pages -> redirect once
        if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
          hasRedirectedRef.current = true
          window.location.replace('/dashboard')
          return
        }

        // Case 2: Unauthenticated user on protected route -> redirect once
        if (!isAuthenticated && !isPublicRoute) {
          hasRedirectedRef.current = true
          const loginUrl = `/login?returnUrl=${encodeURIComponent(pathname)}`
          window.location.replace(loginUrl)
          return
        }

        setIsChecking(false)
      }
    }

    checkAuth()
  }, [isAuthenticated, isLoading, pathname])

  // Reset redirect flag when pathname changes significantly
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      hasRedirectedRef.current = false
    }
  }, [pathname])

  // Show loading only when necessary
  if (isLoading || (isChecking && !hasRedirectedRef.current)) {
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
