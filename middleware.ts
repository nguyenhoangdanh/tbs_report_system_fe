import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  
  // Enhanced logging for production debugging
  console.log('[MIDDLEWARE]', {
    pathname,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    environment: process.env.NODE_ENV,
    userAgent: request.headers.get('user-agent'),
    allCookies: request.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 10)}...`)
  })

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    console.log('[MIDDLEWARE] No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, validate it
  if (token) {
    try {
      const decoded = jwtDecode<any>(token)
      
      // Enhanced token validation logging
      console.log('[MIDDLEWARE] Token validation:', {
        hasRole: !!decoded.role,
        isExpired: decoded.exp * 1000 <= Date.now(),
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        currentTime: new Date().toISOString()
      })

      // Role-based route protection
      const userRole = decoded.role
      
      if (userRole) {
        // Protect admin routes
        if (pathname.startsWith('/admin') && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Protect superadmin routes
        if (pathname.startsWith('/superadmin') && userRole !== 'SUPERADMIN') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Redirect authenticated users from auth routes
      if (pathname === '/login' || pathname === '/register') {
        console.log('[MIDDLEWARE] Authenticated user on auth route, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

    } catch (error) {
      console.error('[MIDDLEWARE] Token validation error:', error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
