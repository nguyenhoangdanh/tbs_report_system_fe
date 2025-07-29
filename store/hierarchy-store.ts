import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  HierarchyResponse
} from '@/types/hierarchy'

// ✅ FIXED: Use the correct HierarchyResponse type directly
type HierarchyData = HierarchyResponse | null

interface HierarchyState {
  // Current user context
  currentUserId: string | null
  
  // Hierarchy data cache
  hierarchyData: HierarchyData
  
  // Current filters
  currentFilters: {
    weekNumber?: number
    year?: number
    month?: number
  } | null
  
  // Force refresh tracking
  lastRefreshTimestamp: number
  
  // Loading states
  isRefreshing: boolean
  
  // Actions
  setCurrentUser: (userId: string | null) => void
  setHierarchyData: (data: HierarchyData, filters?: any) => void
  clearHierarchyData: () => void
  forceRefresh: () => void
  setRefreshing: (refreshing: boolean) => void
  
  // Helper methods
  shouldRefetch: (userId: string, filters: any) => boolean
}

const useHierarchyStore = create<HierarchyState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentUserId: null,
      hierarchyData: null,
      currentFilters: null,
      lastRefreshTimestamp: 0,
      isRefreshing: false,

      // User management
      setCurrentUser: (userId: string | null) => {
        const state = get()
        
        // Clear data when user changes
        if (state.currentUserId !== userId) {
          console.log('🔄 HierarchyStore: User changed, clearing data')
          set({
            currentUserId: userId,
            hierarchyData: null,
            currentFilters: null,
            lastRefreshTimestamp: 0,
            isRefreshing: false,
          })
        } else {
          set({ currentUserId: userId })
        }
      },

      // Data management
      setHierarchyData: (data: HierarchyData, filters?: any) => {
        const state = get()
        
        if (!state.currentUserId) {
          console.warn('⚠️ HierarchyStore: No current user, skipping data set')
          return
        }
        
        console.log('📊 HierarchyStore: Setting hierarchy data for user:', state.currentUserId)
        
        set({
          hierarchyData: data,
          currentFilters: filters || state.currentFilters,
          lastRefreshTimestamp: Date.now(),
          isRefreshing: false,
        })
      },

      clearHierarchyData: () => {
        console.log('🧹 HierarchyStore: Clearing hierarchy data')
        set({
          hierarchyData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefreshing: false,
        })
      },

      forceRefresh: () => {
        console.log('🔄 HierarchyStore: Force refresh triggered')
        set({
          lastRefreshTimestamp: Date.now(),
          isRefreshing: true,
          // ✅ NEW: Clear existing data to force refetch
          hierarchyData: null,
        })
      },

      setRefreshing: (refreshing: boolean) => {
        console.log('🔄 HierarchyStore: Setting refreshing state:', refreshing)
        set({ isRefreshing: refreshing })
      },

      // Helper method to determine if we should refetch
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        // Always refetch if no data
        if (!state.hierarchyData) {
          console.log('✅ shouldRefetch: No data, refetching')
          return true
        }
        
        // Refetch if user changed
        if (state.currentUserId !== userId) {
          console.log('✅ shouldRefetch: User changed, refetching')
          return true
        }
        
        // ✅ ENHANCED: Allow refetch if force refresh was triggered recently (within 10 seconds)
        const timeSinceRefresh = Date.now() - state.lastRefreshTimestamp
        if (state.lastRefreshTimestamp > 0 && timeSinceRefresh < 10000) {
          console.log('✅ shouldRefetch: Recent force refresh, allowing refetch:', timeSinceRefresh, 'ms')
          return true
        }
        
        // Refetch if filters changed significantly
        if (!state.currentFilters || 
            state.currentFilters.weekNumber !== filters?.weekNumber ||
            state.currentFilters.year !== filters?.year ||
            state.currentFilters.month !== filters?.month) {
          console.log('✅ shouldRefetch: Filters changed, refetching')
          return true
        }
        
        // ✅ ENHANCED: Only prevent rapid successive calls (within 500ms)
        if (timeSinceRefresh < 500 && state.hierarchyData && state.lastRefreshTimestamp > 0) {
          console.log('🚫 shouldRefetch: Too rapid successive call, skipping:', timeSinceRefresh, 'ms')
          return false
        }
        
        console.log('🚫 shouldRefetch: No conditions met, skipping refetch')
        return false
      }
    }),
    { name: 'HierarchyStore' }
  )
)

// Export actions for use in components
export const hierarchyStoreActions = {
  clearAll: () => useHierarchyStore.getState().clearHierarchyData(),
  forceRefresh: () => useHierarchyStore.getState().forceRefresh(),
}

export default useHierarchyStore
