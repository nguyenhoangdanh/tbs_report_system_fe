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
  
  // Simplified logging for production
  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE]', {
      pathname,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      environment: process.env.NODE_ENV,
    })
  }

  const publicRoutes = ['/login', '/register', '/forgot-password', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MIDDLEWARE] No token found, redirecting to login')
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, validate it
  if (token) {
    try {
      const decoded = jwtDecode<any>(token)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[MIDDLEWARE] Token validation:', {
          hasRole: !!decoded.role,
          isExpired: decoded.exp * 1000 <= Date.now(),
        })
      }

      // Role-based route protection
      const userRole = decoded.role
      
      if (userRole) {
        if (pathname.startsWith('/admin') && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (pathname.startsWith('/superadmin') && userRole !== 'SUPERADMIN') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Redirect authenticated users from auth routes
      if (pathname === '/login' || pathname === '/register') {
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
