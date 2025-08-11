import { api, type ApiResult } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
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
   * Login user - store tokens with rememberMe preference
   */
  static async login(data: LoginDto): Promise<ApiResult<AuthResponse>> {
    const result = await api.post<AuthResponse>('/auth/login', data);
    
    // ✅ CRITICAL: Store tokens with rememberMe preference
    if (result.success && result.data) {
      const { access_token, refresh_token, deviceInfo, iosDetected } = result.data;
      const rememberMe = data.rememberMe || false; // ✅ Get rememberMe from login data

      if (access_token && refresh_token) {
        // Set tokens in auth store with rememberMe preference
        useAuthStore.getState().setAuth({
          access_token,
          refresh_token,
          deviceInfo: {
            isIOSSafari: iosDetected,
            iosDetected,
            ...deviceInfo
          }
        }, rememberMe); // ✅ Pass rememberMe preference
        
        console.log('✅ Auth tokens stored with rememberMe:', rememberMe);
      }
    }
    
    return result;
  }

  /**
   * Register new user
   */
  static async register(data: RegisterDto): Promise<ApiResult<AuthResponse>> {
    return await api.post<AuthResponse>('/auth/register', data)
  }

  /**
   * Logout user - clear tokens from auth store
   */
  static async logout(): Promise<ApiResult<void>> {
    const result = await api.post<void>('/auth/logout');
    
    // ✅ Always clear tokens from auth store regardless of server response
    useAuthStore.getState().clearAuth();
    console.log('✅ Auth tokens cleared after logout');
    
    return result;
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
   * Refresh access token - update tokens in auth store
   */
  static async refreshToken(): Promise<ApiResult<AuthResponse>> {
    const result = await api.post<AuthResponse>('/auth/refresh');
    
    // ✅ Update tokens in auth store if refresh successful
    if (result.success && result.data) {
      const { access_token, refresh_token, deviceInfo, iosDetected } = result.data;

      if (access_token && refresh_token) {
        const currentAuth = useAuthStore.getState().tokens;
        useAuthStore.getState().setAuth({
          access_token,
          refresh_token,
          deviceInfo: currentAuth?.deviceInfo // Preserve device info
        });
        
        console.log('✅ Auth tokens refreshed in store');
      }
    }
    
    return result;
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

