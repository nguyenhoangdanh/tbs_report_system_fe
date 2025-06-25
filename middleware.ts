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
  }

  return response;
}

/**
 * Lightweight token validation - only decode JWT without API call
 */
function validateTokenLocally(token: string): { isValid: boolean; exp?: number } {
  try {
    // Simple JWT decode without verification (for middleware performance)
    const parts = token.split('.');
    if (parts.length !== 3) return { isValid: false };
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return { isValid: false, exp: payload.exp };
    }
    
    return { isValid: true, exp: payload.exp };
  } catch (error) {
    return { isValid: false };
  }
}

/**
 * Main middleware function - OPTIMIZED
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
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // For public routes
  if (isPublicRoute) {
    // If user has valid token and tries to access auth pages, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const tokenCheck = validateTokenLocally(token);
      if (tokenCheck.isValid) {
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        return addCorsHeaders(response, request);
      }
    }
    
    // Allow access to public routes
    let response = NextResponse.next();
    response = addCorsHeaders(response, request);
    
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);
    
    return response;
  }

  // For protected routes - lightweight token check
  if (!token) {
    console.log(`[MIDDLEWARE] No token for ${pathname}, redirecting to login`);
    
    const loginUrl = new URL('/login', request.url);
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      loginUrl.searchParams.set('returnUrl', pathname);
    }
    loginUrl.searchParams.set('reason', 'no_token');

    let response = NextResponse.redirect(loginUrl);
    response = addCorsHeaders(response, request);
    response.cookies.delete('auth-token');
    
    return response;
  }

  // Validate token locally (no API call)
  const tokenCheck = validateTokenLocally(token);
  
  if (!tokenCheck.isValid) {
    console.log(`[MIDDLEWARE] Invalid token for ${pathname}, redirecting to login`);
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'token_expired');
    
    let response = NextResponse.redirect(loginUrl);
    response = addCorsHeaders(response, request);
    response.cookies.delete('auth-token');
    
    return response;
  }

  console.log(`[MIDDLEWARE] Access granted for ${pathname}`);

  // Token is valid - allow access
  let response = NextResponse.next();

  // Add auth status header
  response.headers.set('X-Auth-Status', 'authenticated');

  // Add CORS headers
  response = addCorsHeaders(response, request);

  // Add performance monitoring headers
  const processingTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${processingTime}ms`);

  // Add cache control for authenticated pages
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
