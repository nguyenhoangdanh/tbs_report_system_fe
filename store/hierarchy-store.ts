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
        
        set({
          hierarchyData: data,
          currentFilters: filters || state.currentFilters,
          lastRefreshTimestamp: Date.now(),
          isRefreshing: false,
        })
      },

      clearHierarchyData: () => {
        set({
          hierarchyData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefreshing: false,
        })
      },

      forceRefresh: () => {
        set({
          lastRefreshTimestamp: Date.now(),
          isRefreshing: true,
          // ✅ CRITICAL: Clear existing data to force complete refetch
          hierarchyData: null,
          currentFilters: null, // ✅ Also clear filters to force fresh fetch
        })
      },

      setRefreshing: (refreshing: boolean) => {
        set({ isRefreshing: refreshing })
      },

      // Helper method to determine if we should refetch
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        // ✅ ALWAYS refetch if data was cleared by forceRefresh
        if (!state.hierarchyData) {
          return true
        }
        
        // Refetch if user changed
        if (state.currentUserId !== userId) {
          return true
        }
        
        // Refetch if filters changed significantly
        if (!state.currentFilters || 
            state.currentFilters.weekNumber !== filters?.weekNumber ||
            state.currentFilters.year !== filters?.year ||
            state.currentFilters.month !== filters?.month) {
          return true
        }
        
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
