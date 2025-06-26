import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Chỉ handle static files optimization - KHÔNG handle auth redirects
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Chỉ skip static files, không handle auth logic
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Đơn giản chỉ cho tất cả requests đi qua
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Chỉ match cho static file optimization
    '/((?!api/|_next/static/|_next/image/|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
