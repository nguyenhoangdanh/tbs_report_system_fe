import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import React from 'react'

interface DeviceState {
  isIOSOrMac: boolean
  userAgent: string
  isHydrated: boolean
  accessToken: string | null
  refreshToken: string | null
  
  // Actions
  initializeDevice: () => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearTokens: () => void
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
}

// Device detection utility
const detectIOSOrMac = (userAgent: string): boolean => {
  return /iPad|iPhone|iPod|Macintosh/i.test(userAgent)
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      isIOSOrMac: false,
      userAgent: '',
      isHydrated: false,
      accessToken: null,
      refreshToken: null,

      initializeDevice: () => {
        if (typeof window !== 'undefined') {
          const userAgent = window.navigator.userAgent
          const isIOSOrMac = detectIOSOrMac(userAgent)
          
          set({
            isIOSOrMac,
            userAgent,
            isHydrated: true
          })

          console.log('🔍 Device Detection:', {
            isIOSOrMac,
            userAgent: userAgent.substring(0, 50) + '...',
            authMode: isIOSOrMac ? 'Authorization Header' : 'HTTP Cookie'
          })
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken })
      },

      clearTokens: () => {
        set({ accessToken: null, refreshToken: null })
      },

      getAccessToken: () => {
        return get().accessToken
      },

      getRefreshToken: () => {
        return get().refreshToken
      },
    }),
    {
      name: 'device-auth-storage',
      storage: createJSONStorage(() => {
        // iOS/Mac: chỉ lưu device info, không lưu token
        // Non-iOS: có thể lưu refreshToken để auto-restore
        if (typeof window !== 'undefined') {
          const isIOSOrMac = detectIOSOrMac(window.navigator.userAgent)
          
          if (isIOSOrMac) {
            // iOS/Mac: Memory only storage (sẽ mất khi reload)
            return {
              getItem: (name: string) => {
                const sessionData = sessionStorage.getItem(name)
                if (sessionData) {
                  const parsed = JSON.parse(sessionData)
                  // Chỉ restore device info, không restore tokens
                  return JSON.stringify({
                    ...parsed,
                    state: {
                      ...parsed.state,
                      accessToken: null,
                      refreshToken: null
                    }
                  })
                }
                return null
              },
              setItem: (name: string, value: string) => {
                const parsed = JSON.parse(value)
                // iOS/Mac: chỉ lưu device info
                const sanitized = {
                  ...parsed,
                  state: {
                    isIOSOrMac: parsed.state.isIOSOrMac,
                    userAgent: parsed.state.userAgent,
                    isHydrated: parsed.state.isHydrated,
                    accessToken: null,
                    refreshToken: null
                  }
                }
                sessionStorage.setItem(name, JSON.stringify(sanitized))
              },
              removeItem: (name: string) => sessionStorage.removeItem(name),
            }
          } else {
            // Non-iOS: có thể lưu refreshToken
            return localStorage
          }
        }
        return localStorage
      }),
      partialize: (state) => ({
        isIOSOrMac: state.isIOSOrMac,
        userAgent: state.userAgent,
        isHydrated: state.isHydrated,
        // Chỉ persist refreshToken cho non-iOS devices
        refreshToken: state.isIOSOrMac ? null : state.refreshToken
      })
    }
  )
)

// Hook để sử dụng device detection
export const useDeviceDetection = () => {
  const { isIOSOrMac, isHydrated, initializeDevice } = useDeviceStore()
  
  React.useEffect(() => {
    if (!isHydrated) {
      initializeDevice()
    }
  }, [isHydrated, initializeDevice])

  return { isIOSOrMac, isHydrated }
}

// Export for use in API client
export const deviceStore = {
  getState: () => useDeviceStore.getState(),
  subscribe: useDeviceStore.subscribe
}
