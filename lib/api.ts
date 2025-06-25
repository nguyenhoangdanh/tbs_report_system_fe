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
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  
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
    credentials: 'include', // Critical for cookie transmission
    cache: 'no-cache',
    signal: controller.signal,
    ...options,
  }

  try {
    console.log('[API] Making request to:', url)
    console.log('[API] Environment:', process.env.NODE_ENV)
    
    // Only log cookies in development to avoid noise
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[API] Client cookies before request:', document.cookie)
    }
    
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    
    console.log('[API] Response status:', response.status)
    
    // Only log detailed headers in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()))
      
      const corsOrigin = response.headers.get('access-control-allow-origin')
      const corsCredentials = response.headers.get('access-control-allow-credentials')
      console.log('[API] CORS headers:', { origin: corsOrigin, credentials: corsCredentials })
      
      const setCookieHeader = response.headers.get('set-cookie')
      if (setCookieHeader) {
        console.log('[API] Set-Cookie header received:', setCookieHeader)
      }
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
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (parseError) {
        errorMessage = response.statusText || `Lỗi ${response.status}`
      }
      
      throw new ApiError(response.status, errorMessage)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    } else {
      return {} as T
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    if (error?.name === 'AbortError') {
      throw new ApiError(0, 'Request timeout - vui lòng thử lại sau')
    }
    
    if (error?.name === 'TypeError') {
      if (error?.message?.includes('fetch')) {
        throw new ApiError(0, 'Không thể kết nối đến server. Kiểm tra kết nối mạng.')
      }
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
