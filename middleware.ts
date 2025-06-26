import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/']
const staticRoutes = ['/_next', '/favicon.ico', '/images', '/icons']

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    return payload.exp && payload.exp > now
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    staticRoutes.some(route => pathname.startsWith(route)) || 
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  const isPublicRoute = publicRoutes.includes(pathname)

  // For authenticated users trying to access public routes
  if (isPublicRoute && token && isTokenValid(token)) {
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // For public routes without auth
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes without valid auth
  if (!token || !isTokenValid(token)) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/login') {
      loginUrl.searchParams.set('returnUrl', pathname)
    }
    
    const response = NextResponse.redirect(loginUrl)
    if (token) {
      response.cookies.delete('auth-token') // Clear invalid token
    }
    return response
  }

  // Allow access to protected routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
}
