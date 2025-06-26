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

// Đơn giản hóa cache - giảm TTL để tránh stale data
const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>()
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 10000 : 5000 // 10s prod, 5s dev
const MAX_CACHE_SIZE = 30 // Giảm cache size

// Cleanup cache đơn giản
function cleanupCache() {
  const now = Date.now()
  for (const [key, { timestamp }] of requestCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
  
  // Giới hạn cache size
  if (requestCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(requestCache.entries())
    const toDelete = entries.slice(0, requestCache.size - MAX_CACHE_SIZE)
    toDelete.forEach(([key]) => requestCache.delete(key))
  }
}

// Request deduplication đơn giản
const pendingRequests = new Map<string, Promise<any>>()

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const method = options.method || 'GET'
  
  // Giảm timeout để tránh slow requests
  const timeout = process.env.NODE_ENV === 'production' ? 8000 : 5000
  
  // Chỉ cache GET requests và không cache auth endpoints
  const shouldCache = method === 'GET' && !endpoint.includes('/auth/') && !endpoint.includes('/users/profile')
  const cacheKey = shouldCache ? `${url}_${JSON.stringify(options.headers || {})}` : null
  
  // Check cache
  if (cacheKey && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.promise
    }
    requestCache.delete(cacheKey)
  }
  
  // Request deduplication - chỉ cho non-auth requests
  const shouldDedupe = !endpoint.includes('/auth/')
  const dedupeKey = shouldDedupe ? `${method}:${url}:${JSON.stringify(options.body || {})}` : null
  
  if (dedupeKey && pendingRequests.has(dedupeKey)) {
    return pendingRequests.get(dedupeKey)!
  }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    mode: 'cors',
    signal: controller.signal,
    ...options,
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorMessage = 'Có lỗi xảy ra'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || `Lỗi ${response.status}`
        }
        
        throw new ApiError(response.status, errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        // Backend đã xử lý response structure, chỉ cần return data
        return data?.data || data
      }
      
      return {} as T
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) throw error
      
      if (error?.name === 'AbortError') {
        throw new ApiError(0, 'Request timeout')
      }
      
      throw new ApiError(0, error.message || 'Network error')
    } finally {
      if (dedupeKey) {
        pendingRequests.delete(dedupeKey)
      }
    }
  })()

  // Cache and dedupe management
  if (dedupeKey) {
    pendingRequests.set(dedupeKey, requestPromise)
  }

  if (cacheKey) {
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: Date.now() })
  }

  return requestPromise
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

// Đơn giản hóa health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

// Warm up connection
if (typeof window !== 'undefined') {
  setTimeout(() => checkApiHealth(), 1000)
}
