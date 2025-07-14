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
  constructor(
    public message: string,
    public status: number,
    public data?: any,
    public isUserFriendly: boolean = false // Flag to indicate if error should be shown to user
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface CacheEntry {
  promise: Promise<any>
  timestamp: number
  data?: any
}

interface RequestConfig extends RequestInit {
  timeout?: number
  enableCache?: boolean // Renamed from 'cache' to avoid conflict with RequestInit.cache
  dedupe?: boolean
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly CACHE_TTL = 30000 // 30s
  private readonly MAX_CACHE_SIZE = 50
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(baseURL: string, timeout = 8000) {
    this.baseURL = baseURL
    this.defaultTimeout = timeout
    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupCache()
      }, 60000) // Cleanup every minute
    }
  }

  private cleanupCache() {
    const now = Date.now()
    let deletedCount = 0

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    // Remove oldest entries if cache is too large
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE)
      toDelete.forEach(([key]) => {
        this.cache.delete(key)
        deletedCount++
      })
    }
  }

  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const headers = JSON.stringify(options.headers || {})
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${headers}:${body}`
  }

  private getDedupeKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body || ''
    return `${method}:${url}:${body}`
  }

  private shouldCache(endpoint: string, method: string): boolean {
    return (
      method === 'GET' &&
      !endpoint.includes('/auth/') &&
      !endpoint.includes('/users/profile') &&
      !endpoint.includes('/statistics/dashboard') // Real-time data shouldn't be cached
    )
  }

  private shouldDedupe(endpoint: string, method: string): boolean {
    return (
      method === 'GET' ||
      (method === 'POST' && (
        endpoint.includes('/auth/') ||
        endpoint.includes('/users/profile') ||
        endpoint.includes('/login')
      ))
    )
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || ''
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      let errorData: any = null
      let isUserFriendly = false
      
      try {
        if (contentType.includes('application/json')) {
          errorData = await response.json()
          
          if (errorData) {
            // Extract error message with better UX handling
            const backendMessage = errorData.message || errorData.error || errorData.statusText
            
            if (backendMessage) {
              errorMessage = backendMessage
              isUserFriendly = true // Backend messages are usually user-friendly
            } else {
              errorMessage = this.getDefaultErrorMessage(response.status)
              isUserFriendly = true
            }
          }
        } else {
          errorMessage = this.getDefaultErrorMessage(response.status)
          isUserFriendly = true
        }
      } catch (parseError) {
        errorMessage = this.getDefaultErrorMessage(response.status)
        isUserFriendly = true
      }
      
      // Ensure message is always a string
      if (typeof errorMessage !== 'string') {
        errorMessage = this.getDefaultErrorMessage(response.status)
        isUserFriendly = true
      }
      
      throw new ApiError(errorMessage, response.status, errorData, isUserFriendly)
    }

    if (contentType.includes('application/json')) {
      const data = await response.json()
      
      // Handle different response structures
      if (data && typeof data === 'object') {
        // If response has data wrapper, return the data
        if ('data' in data && data.data !== undefined) {
          return data.data
        }
        // Otherwise return the object itself
        return data
      }
      
      return data
    }

    // For non-JSON responses
    return {} as T
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Dữ liệu không hợp lệ'
      case 401:
        return 'Bạn cần đăng nhập để tiếp tục'
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này'
      case 404:
        return 'Không tìm thấy dữ liệu'
      case 409:
        return 'Dữ liệu đã tồn tại'
      case 422:
        return 'Dữ liệu không hợp lệ'
      case 429:
        return 'Quá nhiều yêu cầu, vui lòng thử lại sau'
      case 500:
        return 'Lỗi máy chủ, vui lòng thử lại sau'
      case 502:
        return 'Dịch vụ tạm thời không khả dụng'
      case 503:
        return 'Dịch vụ đang bảo trì'
      default:
        return status >= 500 
          ? 'Lỗi máy chủ, vui lòng thử lại sau'
          : 'Có lỗi xảy ra, vui lòng thử lại'
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      enableCache = true,
      dedupe = true,
      ...options
    } = config

    const url = `${this.baseURL}${endpoint}`
    const method = options.method || 'GET'
    
    // Enhanced deduplication for auth endpoints
    const shouldCache = enableCache && this.shouldCache(endpoint, method)
    const shouldDedupe = dedupe && this.shouldDedupe(endpoint, method)
    
    const cacheKey = shouldCache ? this.getCacheKey(url, options) : null
    const dedupeKey = shouldDedupe ? this.getDedupeKey(url, options) : null

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!
      if (Date.now() - entry.timestamp < this.CACHE_TTL) {
        return entry.promise
      }
      this.cache.delete(cacheKey)
    }

    // Enhanced request deduplication - especially for auth calls
    if (dedupeKey && this.pendingRequests.has(dedupeKey)) {
      return this.pendingRequests.get(dedupeKey)!
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Configure request
    const requestConfig: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=100',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
      signal: controller.signal,
    }

    // Create request promise with better error handling
    const requestPromise = (async (): Promise<T> => {
      try {
        const response = await fetch(url, requestConfig)
        clearTimeout(timeoutId)
        
        const result = await this.handleResponse<T>(response)
        
        // Cache successful GET responses
        if (cacheKey && method === 'GET') {
          this.cache.set(cacheKey, {
            promise: Promise.resolve(result),
            timestamp: Date.now(),
            data: result
          })
        }
        
        return result
        
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        // Handle different types of errors more gracefully
        if (error instanceof ApiError) {
          // Log for debugging but don't expose technical details
          console.error(`[API] ${method} ${endpoint} failed:`, error.message)
          throw error
        }
        
        if (error.name === 'AbortError') {
          console.warn(`[API] ${method} ${endpoint} timed out`)
          throw new ApiError('Yêu cầu quá thời gian chờ, vui lòng thử lại', 408, null, true)
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error(`[API] Network error for ${method} ${endpoint}:`, error.message)
          throw new ApiError('Không thể kết nối mạng, vui lòng kiểm tra kết nối', 0, null, true)
        }
        
        // Log unexpected errors for debugging
        console.error(`[API] Unexpected error for ${method} ${endpoint}:`, error)
        
        // Return user-friendly error message for unexpected errors
        const errorMessage = 'Có lỗi không xác định xảy ra, vui lòng thử lại'
        throw new ApiError(errorMessage, error.status || 0, null, true)
        
      } finally {
        // Cleanup pending request
        if (dedupeKey) {
          this.pendingRequests.delete(dedupeKey)
        }
      }
    })()

    // Store pending request for deduplication
    if (dedupeKey) {
      this.pendingRequests.set(dedupeKey, requestPromise)
      
      // Auto-cleanup after request completes
      requestPromise.finally(() => {
        setTimeout(() => {
          this.pendingRequests.delete(dedupeKey)
        }, 1000) // Keep deduplication for 1 second after completion
      })
    }

    // Store in cache for GET requests
    if (cacheKey) {
      this.cache.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now()
      })
    }

    return requestPromise
  }

  // Convenience methods
  get<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      enableCache: false, // Updated property name
    })
  }

  put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      enableCache: false, // Updated property name
    })
  }

  patch<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      enableCache: false, // Updated property name
    })
  }

  delete<T = void>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
      enableCache: false, // Updated property name
    })
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=5, max=50',
        },
      })
      
      return response.ok
    } catch (error) {
      console.error('[API] Health check failed:', error)
      return false
    }
  }

  // Clear cache method
  clearCache() {
    this.cache.clear()
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
      entries: Array.from(this.cache.keys())
    }
  }

  // Destroy instance
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL)

// Export the instance methods as the main API
export const api = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.put<T>(endpoint, data, config),
  patch: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.patch<T>(endpoint, data, config),
  delete: <T = void>(endpoint: string, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.delete<T>(endpoint, config),
}

// Export utility functions
export const checkApiHealth = () => apiClient.checkHealth()
export const clearApiCache = () => apiClient.clearCache()
export const getApiCacheStats = () => apiClient.getCacheStats()

// Export the client instance for advanced usage
export { apiClient }

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiClient.destroy()
  })
  
  // Pre-warm connection
  apiClient.checkHealth().catch(() => {
    // Ignore health check failures during initialization
  })
}

// Export utility functions for error handling
export const isUserFriendlyError = (error: any): boolean => {
  return ApiClient.isUserFriendlyError(error)
}

export const getSafeErrorMessage = (error: any): string => {
  return ApiClient.getSafeErrorMessage(error)
}
