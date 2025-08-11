import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface AuthTokens {
  access_token: string
  refresh_token: string
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
  setAuth: (tokens: AuthTokens) => void
  clearAuth: () => void
  getAuthToken: () => string | null
  getRefreshToken: () => string | null
  hasValidAuth: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    tokens: null,

    setAuth: (tokens: AuthTokens) => {
      set({ tokens })
    },

    clearAuth: () => {
      set({ tokens: null })
    },

    getAuthToken: () => {
      const { tokens } = get()
      return tokens?.access_token || null
    },

    getRefreshToken: () => {
      const { tokens } = get()
      return tokens?.refresh_token || null
    },

    hasValidAuth: () => {
      const { tokens } = get()
      return !!(tokens?.access_token && tokens?.refresh_token)
    },
  }))
)

// ✅ Make auth store globally available for API client
if (typeof window !== 'undefined') {
  (window as any).authStore = {
    getAuthToken: () => useAuthStore.getState().getAuthToken(),
    getRefreshToken: () => useAuthStore.getState().getRefreshToken(),
    setAuth: (tokens: AuthTokens) => useAuthStore.getState().setAuth(tokens),
    clearAuth: () => useAuthStore.getState().clearAuth(),
    hasValidAuth: () => useAuthStore.getState().hasValidAuth(),
  };
}
