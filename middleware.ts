import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Only log in development or for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE] Running for:', pathname)
  }
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // images, fonts, etc.
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE] Token exists:', !!token, 'Length:', token?.length || 0)
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/']
  const publicApiRoutes = ['/api/organizations']
  
  const isPublicRoute = publicRoutes.includes(pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Allow public API routes without authentication
  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    console.log('No token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If token exists, validate it for role-based access only
  if (token) {
    try {
      const decoded = jwtDecode<any>(token)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[MIDDLEWARE] Token decoded:', { 
          role: decoded.role
        })
      }

      // Role-based route protection
      const userRole = decoded.role
      
      // Only apply role protection if role exists
      if (userRole) {
        // Protect admin routes
        if (pathname.startsWith('/admin') && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
          console.log('Access denied to admin route')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Protect superadmin routes
        if (pathname.startsWith('/superadmin') && userRole !== 'SUPERADMIN') {
          console.log('Access denied to superadmin route')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Redirect authenticated users from login/register to dashboard
      if (pathname === '/login' || pathname === '/register') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MIDDLEWARE] Authenticated user on auth route, redirecting to dashboard')
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE] Allowing request')
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
