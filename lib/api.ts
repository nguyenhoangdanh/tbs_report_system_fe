interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  status?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Optimized request cache with better cleanup
const requestCache = new Map<string, Promise<any>>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 5000 : 3000; // 5s cache in production
const MAX_CACHE_SIZE = process.env.NODE_ENV === 'production' ? 100 : 50; // More cache in production

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  
  // Fix: Use forEach instead of for...of with Map.entries()
  cacheTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_DURATION) {
      requestCache.delete(key);
      cacheTimestamps.delete(key);
    }
  });
  
  // If cache is still too large, remove oldest entries
  if (requestCache.size > MAX_CACHE_SIZE) {
    // Fix: Convert to array differently
    const entries: Array<[string, number]> = [];
    cacheTimestamps.forEach((timestamp, key) => {
      entries.push([key, timestamp]);
    });
    
    const sortedEntries = entries.sort(([,a], [,b]) => a - b);
    const toRemove = sortedEntries.slice(0, requestCache.size - MAX_CACHE_SIZE);
    
    toRemove.forEach(([key]) => {
      requestCache.delete(key);
      cacheTimestamps.delete(key);
    });
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Create cache key for GET requests only
  const isGetRequest = !options.method || options.method === 'GET';
  const cacheKey = isGetRequest ? `${url}_${JSON.stringify(options.headers || {})}` : null;
  
  // Return cached promise for recent GET requests
  if (cacheKey && requestCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey);
    if (timestamp && Date.now() - timestamp < CACHE_DURATION) {
      return requestCache.get(cacheKey);
    } else {
      // Remove expired cache
      requestCache.delete(cacheKey);
      cacheTimestamps.delete(cacheKey);
    }
  }
  
  // Optimized timeout based on endpoint type
  const isStatisticsEndpoint = endpoint.includes('/statistics/');
  const timeout = isStatisticsEndpoint ? 12000 : 8000; // Longer timeout for statistics
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      ...(typeof window !== 'undefined' && {
        'X-Requested-With': 'XMLHttpRequest',
      }),
      ...options.headers,
    },
    credentials: 'include',
    mode: 'cors',
    signal: controller.signal,
    ...options,
  }

  const requestPromise = (async () => {
    try {
      // Add request timing for performance monitoring
      const startTime = Date.now();
      
      const response = await fetch(url, config)
      clearTimeout(timeoutId)
      
      const requestTime = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method || 'GET'} ${endpoint} - ${response.status} (${requestTime}ms)`)
      }
      
      // Log slow requests in production
      if (process.env.NODE_ENV === 'production' && requestTime > 3000) {
        console.warn(`[API] Slow request: ${endpoint} took ${requestTime}ms`);
      }
      
      if (!response.ok) {
        let errorMessage = 'Có lỗi xảy ra'
        
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = Array.isArray(errorData.message) 
              ? errorData.message.join(', ') 
              : errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          errorMessage = response.statusText || `Lỗi ${response.status}`
        }
        
        throw new ApiError(response.status, errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        
        // Handle different response structures from backend
        // If data has a 'data' property, return it; otherwise return the whole response
        if (data && typeof data === 'object' && 'data' in data) {
          return data.data as T;
        }
        
        // For direct object responses (like User objects), return as-is
        return data as T;
      } else {
        return {} as T
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('[API] Request error:', error)
      
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error?.name === 'AbortError') {
        throw new ApiError(0, 'Timeout - Vui lòng thử lại')
      }
      
      if (error?.name === 'TypeError') {
        if (error?.message?.includes('fetch')) {
          throw new ApiError(0, `Không thể kết nối: ${API_BASE_URL}`)
        }
      }
      
      throw new ApiError(0, `Lỗi: ${error.message}`)
    }
  })();

  // Enhanced caching for production
  if (cacheKey) {
    requestCache.set(cacheKey, requestPromise);
    cacheTimestamps.set(cacheKey, Date.now());
    
    // Less frequent cleanup in production
    if (Math.random() < (process.env.NODE_ENV === 'production' ? 0.05 : 0.1)) {
      cleanupCache();
    }
  }

  return requestPromise;
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
}

// Utility function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      signal: AbortSignal.timeout(3000), // 3s timeout for health check
    })
    return response.ok
  } catch {
    return false
  }
}

// Pre-warm API connection
if (typeof window !== 'undefined') {
  // Warm up connection when app loads
  setTimeout(() => {
    checkApiHealth().catch(() => {});
  }, 1000);
}
