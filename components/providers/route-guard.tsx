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

// Define role-based access permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'SUPERADMIN': ['*'], // Can access everything
  'ADMIN': ['/admin', '/admin/users', '/admin/hierarchy', '/admin/reports', '/admin/statistics'],
  'OFFICE_MANAGER': ['/admin/hierarchy', '/admin/reports'],
  'OFFICE_ADMIN': ['/admin/hierarchy'],
  'USER': [] // No admin access
}

function hasRouteAccess(userRole: string, pathname: string): boolean {
  // Public routes are always accessible
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Regular user routes (non-admin) are accessible by authenticated users
  if (!pathname.startsWith('/admin')) {
    return true
  }

  // Check admin route access
  const permissions = ROLE_PERMISSIONS[userRole] || []
  
  // SUPERADMIN has access to everything
  if (permissions.includes('*')) {
    return true
  }

  // Check if user has specific permission for this route or parent route
  return permissions.some(permission => {
    // Exact match
    if (permission === pathname) return true
    
    // Parent route match (e.g., /admin allows /admin/anything)
    if (pathname.startsWith(permission + '/')) {
      return true
    }
    
    return false
  })
}

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Wait for component to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only run after component is mounted and auth is not loading
    if (!mounted || isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    
    // Case 1: Authenticated user trying to access auth pages -> redirect to dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard')
      return
    }
    
    // Case 2: Unauthenticated user trying to access protected routes -> redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Case 3: Authenticated user accessing protected routes -> check permissions
    if (isAuthenticated && user && !isPublicRoute) {
      const hasAccess = hasRouteAccess(user.role, pathname)
      
      if (!hasAccess) {
        router.replace('/dashboard')
        return
      }
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router, user])

  // Show loading while checking auth or not mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
          {user && (
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
              <p>Vai trò: {user.role}</p>
              <p>Đường dẫn: {pathname}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
