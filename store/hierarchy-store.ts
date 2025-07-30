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
        console.log('🔄 HierarchyStore: Force refresh triggered - CLEARING ALL DATA')
        set({
          lastRefreshTimestamp: Date.now(),
          isRefreshing: true,
          // ✅ CRITICAL: Clear existing data to force complete refetch
          hierarchyData: null,
          currentFilters: null, // ✅ Also clear filters to force fresh fetch
        })
      },

      setRefreshing: (refreshing: boolean) => {
        console.log('🔄 HierarchyStore: Setting refreshing state:', refreshing)
        set({ isRefreshing: refreshing })
      },

      // Helper method to determine if we should refetch
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        // ✅ ALWAYS refetch if data was cleared by forceRefresh
        if (!state.hierarchyData) {
          console.log('✅ shouldRefetch: No data (possibly cleared), refetching')
          return true
        }
        
        // Refetch if user changed
        if (state.currentUserId !== userId) {
          console.log('✅ shouldRefetch: User changed, refetching')
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
        
        // ✅ CRITICAL: Don't always return true - this causes infinite loop
        console.log('✅ shouldRefetch: Data exists and filters match, no need to refetch')
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
