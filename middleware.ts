import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const AUTH_ROUTES = ['/login', '/register']

function shouldSkipMiddleware(pathname: string): boolean {
  // Skip static files và API routes
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  )
}

function isValidJWT(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }
  
  const authToken = request.cookies.get('auth-token')?.value
  const hasValidToken = authToken && isValidJWT(authToken)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  
  // Redirect authenticated users away from auth pages
  if (hasValidToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users to login
  if (!hasValidToken) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/login') {
      loginUrl.searchParams.set('returnUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/|_next/static/|_next/image/|favicon\\.ico|.*\\.[a-zA-Z]+$).*)',
  ],
}
