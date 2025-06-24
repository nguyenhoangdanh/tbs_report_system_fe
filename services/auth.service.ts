import { api, ApiError } from '@/lib/api'
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
    try {
      const loginPayload = {
        employeeCode: data.employeeCode,
        password: data.password
      }
      return await api.post<AuthResponse>('/auth/login', loginPayload)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('Mã nhân viên hoặc mật khẩu không đúng')
        } else if (error.status === 403) {
          throw new Error('Tài khoản đã bị khóa')
        } else if (error.status >= 500) {
          throw new Error('Lỗi máy chủ, vui lòng thử lại sau')
        }
        throw new Error(error.message)
      }
      throw new Error('Không thể kết nối đến máy chủ')
    }
  }

  static async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      return await api.post<AuthResponse>('/auth/register', data)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new Error('Mã nhân viên hoặc email đã được sử dụng')
        } else if (error.status === 400) {
          throw new Error('Thông tin đăng ký không hợp lệ')
        } else if (error.status >= 500) {
          throw new Error('Lỗi máy chủ, vui lòng thử lại sau')
        }
        throw new Error(error.message)
      }
      throw new Error('Không thể kết nối đến máy chủ')
    }
  }

  static async logout(): Promise<void> {
    return api.post<void>('/auth/logout')
  }

  static async getProfile(): Promise<User> {
    try {
      return await api.get<User>('/users/profile')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn')
      }
      throw error
    }
  }

  static async changePassword(data: ChangePasswordDto): Promise<void> {
    try {
      return await api.patch<void>('/auth/change-password', data) // Changed from PUT to PATCH
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new Error('Mật khẩu hiện tại không đúng')
        } else if (error.status >= 500) {
          throw new Error('Lỗi máy chủ, vui lòng thử lại sau')
        }
        throw new Error(error.message)
      }
      throw new Error('Không thể kết nối đến máy chủ')
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/refresh')
  }

  static async forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    try {
      return await api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new Error('Thông tin mã nhân viên và CCCD không khớp')
        } else if (error.status >= 500) {
          throw new Error('Lỗi máy chủ, vui lòng thử lại sau')
        }
        throw new Error(error.message)
      }
      throw new Error('Không thể kết nối đến máy chủ')
    }
  }

  static async resetPassword(data: ResetPasswordDto): Promise<void> {
    try {
      await api.post<void>('/auth/reset-password', data)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          throw new Error('Thông tin không hợp lệ hoặc đã hết hạn')
        } else if (error.status >= 500) {
          throw new Error('Lỗi máy chủ, vui lòng thử lại sau')
        }
        throw new Error(error.message)
      }
      throw new Error('Không thể kết nối đến máy chủ')
    }
  }
}
