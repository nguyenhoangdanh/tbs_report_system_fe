import { api } from '@/lib/api'
import type { 
  LoginDto, 
  RegisterDto, 
  ChangePasswordDto, 
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
  User,
  ForgotPasswordResponse
} from '@/types'

export class AuthService {
  /**
   * Login user
   */
  static async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response
  }

  /**
   * Register new user
   */
  static async register(data: RegisterDto): Promise<AuthResponse> {
    return await api.post<AuthResponse>('/auth/register', data)
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    return await api.post<void>('/auth/logout')
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    return await api.get<User>('/users/profile')
  }

  /**
   * Change password
   */
  static async changePassword(data: ChangePasswordDto): Promise<void> {
    return await api.patch<void>('/auth/change-password', data)
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthResponse> {
    return await api.post<AuthResponse>('/auth/refresh')
  }

  /**
   * Forgot password - verify employee info
   */
  static async forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return await api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
  }

  /**
   * Reset password with verified employee info
   */
  static async resetPassword(data: ResetPasswordDto): Promise<void> {
    return await api.post<void>('/auth/reset-password', data)
  }

  /**
   * Check cookie persistence (debug endpoint)
   */
  static async checkCookie(): Promise<any> {
    return await api.post<any>('/auth/check-cookie')
  }
}
