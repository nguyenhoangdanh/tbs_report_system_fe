import { api, type ApiResult } from '@/lib/api'
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

export class AuthService {
  /**
   * Login user
   */
  static async login(data: LoginDto): Promise<ApiResult<AuthResponse>> {
    return await api.post<AuthResponse>('/auth/login', data)
  }

  /**
   * Register new user
   */
  static async register(data: RegisterDto): Promise<ApiResult<AuthResponse>> {
    return await api.post<AuthResponse>('/auth/register', data)
  }

  /**
   * Logout user
   */
  static async logout(): Promise<ApiResult<void>> {
    return await api.post<void>('/auth/logout')
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ApiResult<User>> {
    return await api.get<User>('/users/profile')
  }

  /**
   * Change password
   */
  static async changePassword(data: ChangePasswordDto): Promise<ApiResult<void>> {
    return await api.patch<void>('/auth/change-password', data)
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<ApiResult<AuthResponse>> {
    return await api.post<AuthResponse>('/auth/refresh')
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

