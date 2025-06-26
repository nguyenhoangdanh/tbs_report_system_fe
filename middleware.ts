import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Định nghĩa rõ ràng public và protected routes
const PUBLIC_ROUTES = [
  '/',
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password'
]

const AUTH_ROUTES = ['/login', '/register']

// Routes cần bỏ qua middleware hoàn toàn
const SKIP_MIDDLEWARE_PATTERNS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/icons/',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
]

function shouldSkipMiddleware(pathname: string): boolean {
  // Skip nếu là file static (có extension)
  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return true
  }
  
  // Skip các patterns đã định nghĩa
  return SKIP_MIDDLEWARE_PATTERNS.some(pattern => 
    pathname.startsWith(pattern)
  )
}

function isValidJWT(token: string): boolean {
  try {
    // Kiểm tra format JWT cơ bản
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]))
    
    // Kiểm tra expiration
    if (!payload.exp) return false
    
    const now = Math.floor(Date.now() / 1000)
    const isNotExpired = payload.exp > now
    
    return isNotExpired
  } catch (error) {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware cho static files và API routes
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }
  
  // Lấy token từ cookie
  const authToken = request.cookies.get('auth-token')?.value
  const hasValidToken = authToken && isValidJWT(authToken)
  
  // Kiểm tra xem có phải public route không
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  
  // CASE 1: User đã login nhưng đang cố truy cập auth pages
  if (hasValidToken && isAuthRoute) {
    const dashboardUrl = new URL('/dashboard', request.url)
    const response = NextResponse.redirect(dashboardUrl)
    
    // Thêm headers để tránh cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
  
  // CASE 2: User đã login truy cập public routes khác -> cho phép
  if (hasValidToken && isPublicRoute) {
    return NextResponse.next()
  }
  
  // CASE 3: User chưa login truy cập public routes -> cho phép
  if (!hasValidToken && isPublicRoute) {
    return NextResponse.next()
  }
  
  // CASE 4: User chưa login truy cập protected routes -> redirect đến login
  if (!hasValidToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    
    // Chỉ thêm returnUrl nếu không phải là login page
    if (pathname !== '/login' && pathname !== '/register') {
      loginUrl.searchParams.set('returnUrl', pathname)
    }
    
    const response = NextResponse.redirect(loginUrl)
    
    // Clear invalid token nếu có
    if (authToken) {
      response.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }
    
    // Thêm headers chống cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
  
  // CASE 5: User đã login truy cập protected routes -> cho phép
  return NextResponse.next()
}

// Tối ưu matcher cho production
export const config = {
  matcher: [
    /*
     * Match tất cả paths trừ:
     * 1. /api routes (API routes)
     * 2. /_next/static (static files)  
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     * 5. Files có extension (images, css, js, etc.)
     */
    '/((?!api/|_next/static/|_next/image/|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.[a-zA-Z]+$).*)',
  ],
}
