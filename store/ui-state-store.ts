import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStateStore {
  // Expanded states for position users table
  expandedUserStates: Record<string, Record<string, 'detail' | 'report' | null>>
  
  // ✅ Scroll position storage
  scrollPositions: Record<string, {
    scrollY: number
    timestamp: number
    pathname: string
  }>
  
  // Actions
  setUserExpanded: (tableId: string, userId: string, state: 'detail' | 'report' | null) => void
  clearUserExpanded: (tableId: string) => void
  clearAllExpanded: () => void
  
  // ✅ Scroll position actions
  saveScrollPosition: (key: string, scrollY: number, pathname?: string) => void
  getScrollPosition: (key: string) => number | null
  clearOldScrollPositions: () => void
  
  // ✅ Clear expanded for specific table pattern
  clearExpandedByPattern: (pattern: string) => void
  clearAllExpandedForPage: () => void
  
  // Get expanded state for a specific table and user
  getUserExpandedState: (tableId: string, userId: string) => 'detail' | 'report' | null
}

const useUIStateStore = create<UIStateStore>()(
  persist(
    (set, get) => ({
      expandedUserStates: {},
      scrollPositions: {},
      
      setUserExpanded: (tableId: string, userId: string, state: 'detail' | 'report' | null) => {
        set((prev) => ({
          expandedUserStates: {
            ...prev.expandedUserStates,
            [tableId]: {
              ...prev.expandedUserStates[tableId],
              [userId]: state
            }
          }
        }))
      },
      
      clearUserExpanded: (tableId: string) => {
        set((prev) => {
          const newStates = { ...prev.expandedUserStates }
          delete newStates[tableId]
          return { expandedUserStates: newStates }
        })
      },
      
      clearAllExpanded: () => {
        set({ expandedUserStates: {} })
      },
      
      // ✅ Save scroll position with timestamp
      saveScrollPosition: (key: string, scrollY: number, pathname?: string) => {
        set((prev) => ({
          scrollPositions: {
            ...prev.scrollPositions,
            [key]: {
              scrollY,
              timestamp: Date.now(),
              pathname: pathname || window.location.pathname
            }
          }
        }))
      },
      
      // ✅ Get scroll position if it's recent (within 5 minutes)
      getScrollPosition: (key: string) => {
        const state = get()
        const saved = state.scrollPositions[key]
        
        if (!saved) return null
        
        // Check if position is still valid (within 5 minutes and same pathname)
        const isRecent = Date.now() - saved.timestamp < 5 * 60 * 1000
        const isSamePage = saved.pathname === window.location.pathname
        
        return isRecent && isSamePage ? saved.scrollY : null
      },
      
      // ✅ Clean up old scroll positions (older than 10 minutes)
      clearOldScrollPositions: () => {
        const state = get()
        const cutoff = Date.now() - 10 * 60 * 1000
        
        const filtered = Object.fromEntries(
          Object.entries(state.scrollPositions).filter(
            ([_, pos]) => pos.timestamp > cutoff
          )
        )
        
        set({ scrollPositions: filtered })
      },
      
      // ✅ Clear expanded states by pattern (e.g., clear all position tables)
      clearExpandedByPattern: (pattern: string) => {
        set((prev) => {
          const newStates = { ...prev.expandedUserStates }
          
          // Remove all keys that match the pattern
          Object.keys(newStates).forEach(key => {
            if (key.includes(pattern)) {
              delete newStates[key]
            }
          })
          
          return { expandedUserStates: newStates }
        })
      },
      
      // ✅ Clear all expanded states (useful for page navigation)
      clearAllExpandedForPage: () => {
        set({ expandedUserStates: {} })
      },
      
      getUserExpandedState: (tableId: string, userId: string) => {
        const state = get()
        return state.expandedUserStates[tableId]?.[userId] || null
      }
    }),
    {
      name: 'ui-state-storage',
      partialize: (state) => ({ 
        expandedUserStates: state.expandedUserStates,
        scrollPositions: state.scrollPositions
      }),
    }
  )
)

export default useUIStateStore
