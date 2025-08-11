import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthTokens {
  access_token: string
  refresh_token: string
  expiresAt: number
  deviceInfo?: {
    isIOSSafari?: boolean
    iosDetected?: boolean
    version?: string
  }
}

interface AuthStore {
  // State
  tokens: AuthTokens | null
  
  // Actions
  setAuth: (tokens: { access_token: string; refresh_token: string; deviceInfo?: any }, rememberMe?: boolean) => void
  clearAuth: () => void
  getAuthToken: () => string | null
  getRefreshToken: () => string | null
  hasValidAuth: () => boolean
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      tokens: null,

      setAuth: (tokens, rememberMe = false) => {
        const now = Date.now()
        // ✅ Simple logic: 7 days for non-rememberMe, 30 days for rememberMe
        const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        
        const authData = {
          ...tokens,
          expiresAt: now + expiresIn,
        }
        
        set({ tokens: authData })
        
        console.log('✅ Auth tokens set with persistence:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          rememberMe,
          expiresIn: rememberMe ? '30 days' : '7 days',
          expiresAt: new Date(now + expiresIn).toISOString(),
        })
      },

      clearAuth: () => {
        set({ tokens: null })
        console.log('🧹 Auth tokens cleared')
      },

      getAuthToken: () => {
        const state = get()
        
        // Check if token exists and not expired
        if (!state.tokens || state.isTokenExpired()) {
          return null
        }
        
        return state.tokens.access_token
      },

      getRefreshToken: () => {
        const state = get()
        
        if (!state.tokens || state.isTokenExpired()) {
          return null
        }
        
        return state.tokens.refresh_token
      },

      hasValidAuth: () => {
        const state = get()
        return !!(state.tokens?.access_token && state.tokens?.refresh_token && !state.isTokenExpired())
      },

      isTokenExpired: () => {
        const { tokens } = get()
        if (!tokens?.expiresAt) return false
        
        const now = Date.now()
        const isExpired = now > tokens.expiresAt
        
        if (isExpired) {
          console.log('⏰ Token expired, clearing auth')
          get().clearAuth()
        }
        
        return isExpired
      },
    }),
    {
      name: 'auth-tokens',
      storage: createJSONStorage(() => {
        // ✅ ALWAYS use localStorage for maximum persistence
        if (typeof window !== 'undefined') {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }),
      partialize: (state) => ({
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check and clean expired tokens on hydration
          if (state.isTokenExpired?.()) {
            state.clearAuth()
            console.log('🧹 Expired tokens cleared on hydration')
          } else if (state.tokens) {
            console.log('✅ Valid tokens restored from storage')
          }
        }
      },
    }
  )
)

// ✅ Make auth store globally available for API client
if (typeof window !== 'undefined') {
  (window as any).authStore = {
    getAuthToken: () => useAuthStore.getState().getAuthToken(),
    getRefreshToken: () => useAuthStore.getState().getRefreshToken(),
    setAuth: (tokens: any, rememberMe?: boolean) => useAuthStore.getState().setAuth(tokens, rememberMe),
    clearAuth: () => useAuthStore.getState().clearAuth(),
    hasValidAuth: () => useAuthStore.getState().hasValidAuth(),
  };
}
