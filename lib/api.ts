const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Add timeout to avoid hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // Increased timeout for production
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      // Add User-Agent for server identification
      ...(typeof window !== 'undefined' && {
        'X-Requested-With': 'XMLHttpRequest',
      }),
      ...options.headers,
    },
    credentials: 'include', // Critical for cookie transmission
    cache: 'no-cache',
    signal: controller.signal,
    ...options,
  }

  try {
    console.log('[API] Making request to:', url)
    console.log('[API] Environment:', process.env.NODE_ENV)
    console.log('[API] Request config:', {
      method: config.method || 'GET',
      credentials: config.credentials,
      mode: config.mode,
      headers: config.headers
    })
    
    // Log cookies before request
    if (typeof window !== 'undefined') {
      console.log('[API] Client cookies before request:', document.cookie)
    }
    
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    
    console.log('[API] Response status:', response.status)
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()))
    
    // Check CORS headers in response
    const corsOrigin = response.headers.get('access-control-allow-origin')
    const corsCredentials = response.headers.get('access-control-allow-credentials')
    console.log('[API] CORS headers:', { origin: corsOrigin, credentials: corsCredentials })
    
    // Log cookie handling
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      console.log('[API] Set-Cookie header received:', setCookieHeader)
    }
    
    // Log cookies after response
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('[API] Client cookies after response:', document.cookie)
      }, 100)
    }
    
    if (!response.ok) {
      let errorMessage = 'Có lỗi xảy ra'
      
      try {
        const errorData = await response.json()
        console.log('[API] Error response data:', errorData)
        
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message) 
            ? errorData.message.join(', ') 
            : errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (parseError) {
        console.log('[API] Failed to parse error response:', parseError)
        errorMessage = response.statusText || `Lỗi ${response.status}`
      }
      
      // Special handling for CORS errors
      if (response.status === 0 || !corsOrigin) {
        errorMessage = 'Lỗi kết nối CORS. Vui lòng kiểm tra cấu hình server.'
      }
      
      throw new ApiError(response.status, errorMessage)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('[API] Success response for', endpoint, '- Data type:', typeof data)
      return data
    } else {
      console.log('[API] Non-JSON response for', endpoint)
      return {} as T
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('[API] Request failed for', endpoint, ':', error)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error?.name === 'AbortError') {
      throw new ApiError(0, 'Request timeout - vui lòng thử lại sau')
    }
    
    // Network errors
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      throw new ApiError(0, 'Không thể kết nối đến server. Kiểm tra kết nối mạng.')
    }
    
    // CORS errors
    if (error?.message?.includes('CORS')) {
      throw new ApiError(0, 'Lỗi CORS. Vui lòng liên hệ admin.')
    }
    
    throw new ApiError(0, 'Lỗi không xác định. Vui lòng thử lại.')
  }
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
    })
    return response.ok
  } catch {
    return false
  }
}
