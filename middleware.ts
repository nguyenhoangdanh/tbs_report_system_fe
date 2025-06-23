import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/']
  const publicApiRoutes = ['/api/organizations'] // Add organizations as public
  
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Allow public API routes without authentication
  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, validate it
  if (token) {
    try {
      const decoded = jwtDecode<any>(token)
      
      // Check if token is expired
      if (decoded.exp * 1000 <= Date.now()) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
      }

      // Role-based route protection
      const userRole = decoded.role // Fix: use decoded.role instead of decoded.user?.role
      const pathname = request.nextUrl.pathname

      // Protect admin routes
      if (pathname.startsWith('/admin') && !['ADMIN', 'SUPERADMIN'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Protect superadmin routes
      if (pathname.startsWith('/superadmin') && userRole !== 'SUPERADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect authenticated users from auth routes to dashboard
      if (isPublicRoute && !['/'].includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

    } catch (error) {
      // Invalid token
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
