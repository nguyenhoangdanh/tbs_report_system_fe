import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Chỉ handle static files, không handle auth
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Chỉ xử lý static files optimization
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
