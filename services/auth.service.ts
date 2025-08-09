import { api, type ApiResult } from '@/lib/api'
import { deviceStore } from '@/store/device-store'
import type { 
  LoginDto, 
  RegisterDto, 
  ChangePasswordDto, 
  ForgotPasswordDto,
  ResetPasswordDto,
  User,
  ForgotPasswordResponse,
  AuthResponse
} from '@/types'

interface LoginResponse {
  user: User
  access_token: string
  refresh_token?: string
  accessToken?: string
  refreshToken?: string
  message: string
}

interface RefreshResponse {
  access_token: string
  refresh_token: string
  accessToken?: string
  refreshToken?: string
  user?: User
  message: string
}

export class AuthService {
  /**
   * Login user with dual authentication support - Fixed return type
   */
  static async login(data: LoginDto): Promise<ApiResult<AuthResponse>> {
    try {
      const deviceState = deviceStore.getState()
      const isIOSOrMac = deviceState.isIOSOrMac

      console.log('🔐 Login attempt:', {
        isIOSOrMac,
        authMode: isIOSOrMac ? 'token' : 'cookie'
      })

      // Prepare login request based on device
      const loginEndpoint = isIOSOrMac ? '/auth/login?mode=token' : '/auth/login'
      
      const result = await api.post<LoginResponse>(loginEndpoint, data, {
        headers: {
          ...(isIOSOrMac && { 'X-Auth-Mode': 'token' })
        }
      })

      if (result.success && result.data) {
        const { user, access_token, refresh_token, accessToken, refreshToken, message } = result.data

        // iOS/Mac: Store tokens in Zustand
        if (isIOSOrMac) {
          const finalAccessToken = accessToken || access_token
          const finalRefreshToken = refreshToken || refresh_token
          
          if (finalAccessToken && finalRefreshToken) {
            deviceState.setTokens(finalAccessToken, finalRefreshToken)
            console.log('✅ iOS/Mac tokens stored in memory')
          }
        }
        
        // ✅ Return proper AuthResponse format
        return {
          success: true,
          data: {
            access_token: access_token || '',
            refresh_token: refresh_token || '',
            user,
            message: message || 'Đăng nhập thành công'
          }
        }
      }

      return {
        success: false,
        error: result.error
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      return {
        success: false,
        error: {
          message: error?.message || 'Đăng nhập thất bại',
          status: error?.status || 500,
          code: `ERROR_${error?.status || 500}`,
          statusText: 'Login Failed',
          data: null,
          config: {},
          isNetworkError: false,
          isTimeoutError: false,
          isClientError: (error?.status || 500) >= 400 && (error?.status || 500) < 500,
          isServerError: (error?.status || 500) >= 500,
        }
      }
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterDto): Promise<ApiResult<AuthResponse>> {
    return await api.post<AuthResponse>('/auth/register', data)
  }

  /**
   * Logout user with dual authentication support
   */
  static async logout() {
    try {
      const deviceState = deviceStore.getState()

      // Call logout endpoint
      await api.post('/auth/logout')

      // Clear tokens based on device
      if (deviceState.isIOSOrMac) {
        deviceState.clearTokens()
        console.log('✅ iOS/Mac tokens cleared from memory')
      }
      // Cookies will be cleared by backend

      return { success: true }
    } catch (error) {
      // Even if logout fails, clear local tokens
      deviceStore.getState().clearTokens()
      return { success: true }
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile() {
    try {
      const result = await api.get<User>('/users/profile')
      
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          error: null
        }
      }

      return {
        success: false,
        data: null,
        error: result.error
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          message: error?.message || 'Lỗi lấy thông tin người dùng',
          status: error?.status || 500
        }
      }
    }
  }

  /**
   * Change password
   */
  static async changePassword(data: ChangePasswordDto): Promise<ApiResult<void>> {
    return await api.patch<void>('/auth/change-password', data)
  }

  /**
   * Refresh access token with dual authentication support - Fixed return type
   */
  static async refreshToken(): Promise<ApiResult<AuthResponse>> {
    try {
      const deviceState = deviceStore.getState()
      
      if (deviceState.isIOSOrMac) {
        const refreshToken = deviceState.getRefreshToken()
        if (!refreshToken) {
          return { 
            success: false, 
            error: { 
              message: 'No refresh token available',
              status: 401,
              code: 'ERROR_401',
              statusText: 'Unauthorized',
              data: null,
              config: {},
              isNetworkError: false,
              isTimeoutError: false,
              isClientError: true,
              isServerError: false,
            } 
          }
        }

        const result = await api.post<RefreshResponse>('/auth/refresh', { refreshToken }, {
          headers: { 'X-Auth-Mode': 'token' }
        })

        if (result.success && result.data) {
          const { access_token, refresh_token, accessToken, refreshToken: newRefreshToken, user, message } = result.data
          
          // Handle both response formats
          const finalAccessToken = accessToken || access_token
          const finalRefreshToken = newRefreshToken || refresh_token
          
          if (finalAccessToken && finalRefreshToken) {
            deviceState.setTokens(finalAccessToken, finalRefreshToken)
            
            return { 
              success: true, 
              data: {
                access_token: finalAccessToken,
                refresh_token: finalRefreshToken,
                user: user || null,
                message: message || 'Token refreshed successfully'
              }
            }
          }
        }
        
        return { success: false, error: result.error }
      } else {
        // Cookie-based refresh
        const result = await api.post('/auth/refresh-cookie')
        if (result.success) {
          return { 
            success: true,
            data: {
              access_token: '',
              refresh_token: '',
              user: null,
              message: 'Token refreshed successfully'
            }
          }
        }
        
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error?.message || 'Lỗi refresh token',
          status: error?.status || 500,
          code: `ERROR_${error?.status || 500}`,
          statusText: 'Refresh Failed',
          data: null,
          config: {},
          isNetworkError: false,
          isTimeoutError: false,
          isClientError: (error?.status || 500) >= 400 && (error?.status || 500) < 500,
          isServerError: (error?.status || 500) >= 500,
        }
      }
    }
  }

  /**
   * Forgot password - verify employee info
   */
  static async forgotPassword(data: ForgotPasswordDto): Promise<ApiResult<ForgotPasswordResponse>> {
    return await api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
  }

  /**
   * Reset password with verified employee info
   */
  static async resetPassword(data: ResetPasswordDto): Promise<ApiResult<void>> {
    return await api.post<void>('/auth/reset-password', data)
  }

  /**
   * Check cookie persistence (debug endpoint)
   */
  static async checkCookie(): Promise<ApiResult<any>> {
    return await api.post<any>('/auth/check-cookie')
  }
}

