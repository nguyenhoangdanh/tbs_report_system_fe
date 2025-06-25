import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuration
const middlewareConfig = {
  production: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
};

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
];

const staticRoutes = ['/_next', '/favicon.ico', '/images', '/icons'];

/**
 * Add CORS headers
 */
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://weeklyreport-orpin.vercel.app',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Set-Cookie, Cache-Control');
    response.headers.set('Access-Control-Expose-Headers', 'Set-Cookie');
  }

  return response;
}

/**
 * Enhanced token validation với httpOnly cookies
 */
async function validateToken(
  request: NextRequest,
): Promise<{ isValid: boolean; shouldRefresh: boolean; userData?: any }> {
  // CRITICAL: Lấy auth-token từ httpOnly cookies
  const token = request.cookies.get('auth-token')?.value;

  console.log(`[MIDDLEWARE] Checking httpOnly cookie token: ${token ? 'Present' : 'Missing'}`);

  if (!token) {
    return { isValid: false, shouldRefresh: false };
  }

  try {
    // QUAN TRỌNG: Gọi API endpoint để validate token
    // Vì token đã trong cookie, chỉ cần forward toàn bộ cookies
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log(`[MIDDLEWARE] Forwarding cookies to API: ${cookieHeader.substring(0, 100)}...`);
    
    const verifyResponse = await fetch(`${middlewareConfig.apiBaseUrl}/users/profile`, {
      method: 'GET',
      headers: {
        // Forward tất cả cookies từ request gốc - ĐÂY LÀ KEY!
        'Cookie': cookieHeader,
        'Cache-Control': 'no-cache',
        'User-Agent': request.headers.get('user-agent') || 'Next.js Middleware',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    console.log(`[MIDDLEWARE] API response status: ${verifyResponse.status}`);

    if (verifyResponse.ok) {
      // Token hợp lệ, lấy thông tin người dùng
      const userData = await verifyResponse.json();
      console.log('[MIDDLEWARE] Token valid, user data received');
      return { isValid: true, shouldRefresh: false, userData };
    } else if (verifyResponse.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      console.log('[MIDDLEWARE] Token invalid or expired');
      return { isValid: false, shouldRefresh: true };
    }

    return { isValid: false, shouldRefresh: false };
  } catch (error) {
    console.error('[MIDDLEWARE] Error validating token:', error);
    // If network error, temporarily allow access to avoid blocking
    return { isValid: true, shouldRefresh: false };
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, request);
  }

  // Skip middleware for static files and API routes
  if (
    staticRoutes.some(route => pathname.startsWith(route)) || 
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    const response = NextResponse.next();
    return addCorsHeaders(response, request);
  }

  // Create initial response
  let response = NextResponse.next();

  // Skip auth check for public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    response = addCorsHeaders(response, request);
    
    // Add performance headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);
    
    return response;
  }

  // Check authentication for protected routes
  const { isValid, shouldRefresh, userData } = await validateToken(request);

  if (!isValid) {
    console.log(`[MIDDLEWARE] Access denied for ${pathname}, redirecting to login`);
    
    // Redirect to login with return URL
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', pathname);
    url.searchParams.set('reason', shouldRefresh ? 'token_expired' : 'no_token');

    response = NextResponse.redirect(url);
    response = addCorsHeaders(response, request);
    
    // Clear invalid token
    response.cookies.delete('auth-token');
    
    return response;
  }

  console.log(`[MIDDLEWARE] Access granted for ${pathname}`);

  // If token should be refreshed, add header
  if (shouldRefresh) {
    response.headers.set('X-Token-Refresh-Required', 'true');
  }

  // Add auth status header
  if (userData) {
    response.headers.set('X-Auth-Status', 'authenticated');
  }

  // Add CORS headers
  response = addCorsHeaders(response, request);

  // Add performance monitoring headers
  const processingTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${processingTime}ms`);

  // Add cache control for authenticated pages
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
