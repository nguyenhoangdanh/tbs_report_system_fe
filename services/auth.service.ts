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
  static async login(data: LoginDto): Promise<AuthResponse> {
    return await api.post<AuthResponse>('/auth/login', data)
  }

  static async register(data: RegisterDto): Promise<AuthResponse> {
    return await api.post<AuthResponse>('/auth/register', data)
  }

  static async logout(): Promise<void> {
    return await api.post<void>('/auth/logout')
  }

  static async getProfile(): Promise<User> {
    return await api.get<User>('/users/profile')
  }

  static async changePassword(data: ChangePasswordDto): Promise<void> {
    return await api.patch<void>('/auth/change-password', data)
  }

  static async refreshToken(): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/refresh')
  }

  static async forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return await api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
  }

  static async resetPassword(data: ResetPasswordDto): Promise<void> {
    return await api.post<void>('/auth/reset-password', data)
  }
}
