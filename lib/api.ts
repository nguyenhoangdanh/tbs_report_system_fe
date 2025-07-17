import { createClient, ApiClient, ApiResponse, ApiError } from 'fetch-api-client'
import type {
  RequestConfig as BaseRequestConfig,
  ClientConfig,
} from 'fetch-api-client'

// Extended interfaces for your project
interface ApiConfig extends ClientConfig {
  retries?: number;
  retryDelay?: number;
}

export interface ErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface ProjectApiResponse<T = any> {
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

export interface ProjectApiError extends ApiError {
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isClientError?: boolean;
  isServerError?: boolean;
  message: string;
  status?: number;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ProjectApiError;
}

interface RequestConfig extends BaseRequestConfig {
  retries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  dedupe?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// Enhanced API client with CORS-friendly configuration
class EnhancedApiClient {
  private client: ApiClient
  private cache = new Map<string, { data: any; timestamp: number }>()
  private pendingRequests = new Map<string, Promise<ApiResult<any>>>()
  private readonly CACHE_TTL = 30000 // 30s
  private readonly MAX_CACHE_SIZE = 50
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: ApiConfig = {}) {
    // Create fetch-api-client instance with CORS-friendly headers
    this.client = createClient({
      baseURL: API_BASE_URL,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // ✅ Remove Pragma and Cache-Control headers that cause CORS issues
        // 'Cache-Control': 'no-cache',
        // 'Pragma': 'no-cache',
      },
      credentials: 'include', // ✅ Correct for fetch API - always include cookies
      validateStatus: (status) => status < 500,
      getToken: () => {
        // Optional: JWT token from localStorage (fallback)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
          return token;
        }
        return null;
      },
      ...config,
    })

    this.setupInterceptors()
    this.startCleanupTimer()
  }

  private setupInterceptors() {
    // Request interceptor - Enhanced for credentials debugging
    this.client.interceptors.request.use((config) => {
      // Ensure credentials are always included
      config.credentials = 'include';
      
      // ✅ Remove problematic headers that cause CORS issues
      if (config.headers) {
        // Remove headers that might cause CORS preflight issues
        delete config.headers['Pragma'];
        delete config.headers['pragma'];
        delete config.headers['Cache-Control'];
        delete config.headers['cache-control'];
      }
      
      return config
    })

    // Response interceptor - Enhanced for auto token refresh
    this.client.interceptors.response.use({
      onFulfilled: (response) => {
        
        return response
      },
      onRejected: async (error: ApiError) => {
        console.error('❌ API Error:', {
          status: error.status,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
          isAuth: error.status === 401,
          isCORS: error.message?.includes('CORS') || error.message?.includes('cors'),
          hasCookies: typeof document !== 'undefined' ? document.cookie.includes('access_token') : false,
          timestamp: new Date().toISOString()
        });

        // Handle CORS errors
        if (error.message?.includes('CORS') || error.message?.includes('cors')) {
          console.error('🚨 CORS Error detected:', {
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          });
        }

        // Handle 401 Unauthorized errors with auto-refresh attempt
        if (error.status === 401) {
          console.warn('🔐 Authentication failed - attempting token refresh');
          
          // Try to refresh token first
          try {
            const refreshResult = await this.attemptTokenRefresh();
            if (refreshResult.success) {
              // For now, just reject the promise to prevent infinite loops
              // You can implement retry logic here if needed
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
          }
          
          // If refresh fails, clear tokens and redirect
          this.clearAuthTokens();
          this.redirectToLogin();
        }

        // Enhanced error handling
        const enhancedError: ProjectApiError = {
          ...error,
          isNetworkError: error.code === 'NETWORK_ERROR',
          isTimeoutError: error.message === 'Request Timeout',
          isClientError: error.status ? error.status >= 400 && error.status < 500 : false,
          isServerError: error.status ? error.status >= 500 : false,
        }
        return enhancedError;
      }
    })
  }

  private async attemptTokenRefresh(): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies for refresh
        headers: {
          'Content-Type': 'application/json',
          // ✅ Only essential headers to avoid CORS issues
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Optionally store new token in localStorage as backup
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('🔄 Token refresh error:', error);
      return { success: false };
    }
  }

  private clearAuthTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      
      // Clear cookies (best effort - httpOnly cookies can't be cleared from JS)
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
    }
  }

  private redirectToLogin() {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Optionally redirect immediately
      // window.location.href = '/login';
    }
  }

  private startCleanupTimer() {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupCache()
      }, 60000)
    }
  }

  private cleanupCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }

    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  private getCacheKey(endpoint: string, config?: RequestConfig): string {
    const method = config?.method || 'GET'
    const params = JSON.stringify(config?.params || {})
    return `${method}:${endpoint}:${params}`
  }

  private shouldCache(endpoint: string, method: string): boolean {
    if (method !== 'GET') return false
    
    const skipCachePatterns = [
      '/auth/',
      '/login',
      '/logout',
      '/refresh',
      '/statistics/',
      'admin/hierarchy',
      '/dashboard/',
      '/reports/',
      '/profile',
      '/notifications',
      '/activity',
      '/status',
      '/current',
      '/live',
      '/realtime'
    ]
    
    return !skipCachePatterns.some(pattern => 
      endpoint.toLowerCase().includes(pattern)
    )
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async requestWithRetry<T>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {},
    attempt: number = 1
  ): Promise<ApiResult<T>> {
    const { retries = 2, retryDelay = 1000, ...requestConfig } = config

    // Always ensure credentials are included
    requestConfig.credentials = 'include';

    // ✅ Ensure headers don't contain CORS-problematic entries
    if (requestConfig.headers) {
      delete requestConfig.headers['Pragma'];
      delete requestConfig.headers['pragma'];
      delete requestConfig.headers['Cache-Control'];
      delete requestConfig.headers['cache-control'];
    }

    try {
      let response: ApiResponse<T>

      switch (method.toUpperCase()) {
        case 'GET':
          response = await this.client.get<T>(endpoint, requestConfig)
          break
        case 'POST':
          response = await this.client.post<T>(endpoint, data, requestConfig)
          break
        case 'PUT':
          response = await this.client.put<T>(endpoint, data, requestConfig)
          break
        case 'PATCH':
          response = await this.client.patch<T>(endpoint, data, requestConfig)
          break
        case 'DELETE':
          response = await this.client.delete<T>(endpoint, requestConfig)
          break
        default:
          throw new Error(`Unsupported HTTP method: ${method}`)
      }

      if (response.status >= 200 && response.status < 300) {
        return { success: true, data: response.data }
      } else {
        const errorMessage =
          (typeof response.data === 'object' && response.data !== null && 'message' in response.data
            ? (response.data as { message?: string }).message
            : undefined) ||
          (typeof response.data === 'object' && response.data !== null && 'error' in response.data
            ? (response.data as { error?: string }).error
            : undefined) ||
          `HTTP ${response.status}`
        
        const apiError: ProjectApiError = {
          message: errorMessage,
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          config: requestConfig,
          code: `HTTP_${response.status}`,
          isNetworkError: false,
          isTimeoutError: false,
          isClientError: response.status >= 400 && response.status < 500,
          isServerError: response.status >= 500,
        }
        
        console.error('🚫 HTTP Error Response:', {
          status: response.status,
          message: errorMessage,
          data: response.data
        })
        
        return { success: false, error: apiError }
      }

    } catch (error: any) {
      const apiError = error as ProjectApiError

      // Retry on server errors if retries are available
      if (apiError.isServerError && attempt <= retries) {
        await this.sleep(retryDelay * attempt)
        return this.requestWithRetry<T>(method, endpoint, data, config, attempt + 1)
      }

      // Retry on network errors if retries are available
      if ((apiError.isNetworkError || apiError.isTimeoutError) && attempt <= retries) {
        await this.sleep(retryDelay * attempt)
        return this.requestWithRetry<T>(method, endpoint, data, config, attempt + 1)
      }

      const enhancedError: ProjectApiError = {
        message: apiError.message || 'Request failed',
        status: apiError.status,
        statusText: apiError.statusText,
        data: apiError.data,
        config: requestConfig,
        code: apiError.code || 'UNKNOWN_ERROR',
        isNetworkError: apiError.isNetworkError || false,
        isTimeoutError: apiError.isTimeoutError || false,
        isClientError: apiError.isClientError || false,
        isServerError: apiError.isServerError || false,
      }

      return { success: false, error: enhancedError }
    }
  }

  async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResult<T>> {
    const { enableCache = true, dedupe = true, ...requestConfig } = config
    
    // Always ensure credentials are included
    requestConfig.credentials = 'include';
    
    const shouldCache = enableCache && this.shouldCache(endpoint, method)
    const cacheKey = shouldCache ? this.getCacheKey(endpoint, config) : null
    const dedupeKey = dedupe ? `${method}:${endpoint}` : null

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!
      if (Date.now() - entry.timestamp < this.CACHE_TTL) {
        return { success: true, data: entry.data }
      }
      this.cache.delete(cacheKey)
    }

    // Request deduplication
    if (dedupeKey && this.pendingRequests.has(dedupeKey)) {
      return this.pendingRequests.get(dedupeKey)!
    }

    // Create request promise
    const requestPromise = this.requestWithRetry<T>(method, endpoint, data, requestConfig)

    // Store pending request for deduplication
    if (dedupeKey) {
      this.pendingRequests.set(dedupeKey, requestPromise)
      requestPromise.finally(() => {
        setTimeout(() => this.pendingRequests.delete(dedupeKey), 1000)
      })
    }

    const result = await requestPromise

    // Cache successful GET responses
    if (cacheKey && method === 'GET' && result.success) {
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      })
    }

    return result
  }

  // Convenience methods returning ApiResult
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResult<T>> {
    return this.request<T>('GET', endpoint, undefined, config)
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResult<T>> {
    return this.request<T>('POST', endpoint, data, { ...config, enableCache: false })
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResult<T>> {
    return this.request<T>('PUT', endpoint, data, { ...config, enableCache: false })
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResult<T>> {
    return this.request<T>('PATCH', endpoint, data, { ...config, enableCache: false })
  }

  async delete<T = void>(endpoint: string, config?: RequestConfig): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', endpoint, undefined, { ...config, enableCache: false })
  }

  // Legacy methods for backward compatibility
  async getLegacy<T>(endpoint: string, config?: RequestConfig): Promise<T | null> {
    const result = await this.get<T>(endpoint, config)
    if (!result.success) {
      console.error(`[API Error] GET ${endpoint}:`, result.error)
      return null
    }
    return result.data || null
  }

  async postLegacy<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T | null> {
    const result = await this.post<T>(endpoint, data, config)
    if (!result.success) {
      console.error(`[API Error] POST ${endpoint}:`, result.error)
      return null
    }
    return result.data || null
  }

  async putLegacy<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T | null> {
    const result = await this.put<T>(endpoint, data, config)
    if (!result.success) {
      console.error(`[API Error] PUT ${endpoint}:`, result.error)
      return null
    }
    return result.data || null
  }

  async patchLegacy<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T | null> {
    const result = await this.patch<T>(endpoint, data, config)
    if (!result.success) {
      console.error(`[API Error] PATCH ${endpoint}:`, result.error)
      return null
    }
    return result.data || null
  }

  async deleteLegacy<T = void>(endpoint: string, config?: RequestConfig): Promise<T | null> {
    const result = await this.delete<T>(endpoint, config)
    if (!result.success) {
      console.error(`[API Error] DELETE ${endpoint}:`, result.error)
      return null
    }
    return result.data || null
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.get('/health', { timeout: 3000 })
      return result.success
    } catch (error) {
      console.error('[API] Health check failed:', error)
      return false
    }
  }

  // Enhanced auth check with cookie debugging
  async checkAuth(): Promise<{ isAuthenticated: boolean; user?: any }> {
    try {
      

      const result = await this.get<{ user: any }>('/auth/me', { 
        timeout: 5000,
        enableCache: false 
      })
      
      if (result.success && result.data) {
        return { isAuthenticated: true, user: result.data.user || result.data }
      }
      
      return { isAuthenticated: false }
    } catch (error) {
      console.error('[API] Auth check failed:', error)
      return { isAuthenticated: false }
    }
  }

  // Enhanced refresh auth
  async refreshAuth(): Promise<boolean> {
    try {
      const result = await this.post('/auth/refresh', {}, { 
        timeout: 5000,
        enableCache: false 
      })
      
      return result.success
    } catch (error) {
      console.error('[API] Auth refresh failed:', error)
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

  // Access underlying client for advanced usage
  getClient(): ApiClient {
    return this.client
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
const apiClient = new EnhancedApiClient()

// Export the new Result-based API (recommended)
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) => 
    apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.put<T>(endpoint, data, config),
  patch: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.patch<T>(endpoint, data, config),
  delete: <T = void>(endpoint: string, config?: RequestConfig) => 
    apiClient.delete<T>(endpoint, config),
}

// Export legacy API for backward compatibility
export const legacyApi = {
  get: <T>(endpoint: string, config?: RequestConfig) => 
    apiClient.getLegacy<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.postLegacy<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.putLegacy<T>(endpoint, data, config),
  patch: <T>(endpoint: string, data?: any, config?: RequestConfig) => 
    apiClient.patchLegacy<T>(endpoint, data, config),
  delete: <T = void>(endpoint: string, config?: RequestConfig) => 
    apiClient.deleteLegacy<T>(endpoint, config),
}

// Export utility functions
export const checkApiHealth = () => apiClient.checkHealth()
export const clearApiCache = () => apiClient.clearCache()
export const getApiCacheStats = () => apiClient.getCacheStats()

// Export types for better TypeScript support
export type { 
  ApiResult, 
  ProjectApiError as ApiError, 
  RequestConfig, 
  ProjectApiResponse as ApiResponse, 
  PaginatedResponse 
}

// Export the client instance for advanced usage
export { apiClient }

// Access to underlying fetch-api-client
export const rawClient = apiClient.getClient()

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