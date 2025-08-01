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
  // setCurrentUser: (userId: string | null) => void
  setHierarchyData: (data: HierarchyData, filters?: any) => void
  clearHierarchyData: () => void
  forceRefresh: () => void
  setRefreshing: (refreshing: boolean) => void
  
  // Helper methods
  shouldRefetch: (userId: string, filters: any) => boolean

  lastFiltersHash: string | null  
  isInitialized: boolean
  initializeStore: (userId: string) => void
}

const createFiltersHash = (filters: any): string => {
  if (!filters) return 'null'
  const { weekNumber, year, month } = filters
  return `${weekNumber || 'null'}-${year || 'null'}-${month || 'null'}`
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
      lastFiltersHash: null,
      isInitialized: false,

      // User management
      // setCurrentUser: (userId: string | null) => {
      //   const state = get()
        
      //   // Clear data when user changes
      //   if (state.currentUserId !== userId) {
      //     set({
      //       currentUserId: userId,
      //       hierarchyData: null,
      //       currentFilters: null,
      //       lastRefreshTimestamp: 0,
      //       isRefreshing: false,
      //     })
      //   } else {
      //     set({ currentUserId: userId })
      //   }
      // },

      // Initialization store with better state management
      initializeStore: (userId: string) => {
        set({
          currentUserId: userId,
          lastFiltersHash: null,
          hierarchyData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefreshing: false,
          isInitialized: true,
        }, false, 'initializeStore')
      },

      // Data management
      setHierarchyData: (data: HierarchyData, filters?: any) => {
        const state = get()
        
        if (!state.currentUserId) {
          console.warn('⚠️ HierarchyStore: No current user, skipping data set')
          return
        }

        const filtersHash = createFiltersHash(filters || state.currentFilters)
        
        set({
          hierarchyData: data,
          currentFilters: filters || state.currentFilters,
          lastFiltersHash: filtersHash,
          lastRefreshTimestamp: Date.now(),
          isRefreshing: false,
        })
      },

      clearHierarchyData: () => {
        set({
          hierarchyData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          lastFiltersHash: null,
          isRefreshing: false,
        }, false, 'clearHierarchyData')
      },

      forceRefresh: () => {
        set({
          lastRefreshTimestamp: Date.now(),
          isRefreshing: true,
          hierarchyData: null,
          currentFilters: null, 
          lastFiltersHash: null,
        }, false, 'forceRefresh')
      },

      setRefreshing: (refreshing: boolean) => {
        set({ isRefreshing: refreshing }, false, 'setRefreshing')
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

        const currentFiltersHash = createFiltersHash(filters)
        if (state.lastFiltersHash !== currentFiltersHash) {
          return true
        }

         // ✅ Data is too old (1 minute for component mount cases)
        const dataAge = Date.now() - state.lastRefreshTimestamp
        const isStale = dataAge > 1 * 60 * 1000 // Reduced to 1 minute
        if (isStale) {
          return true
        }
        
        // // Refetch if filters changed significantly
        // if (!state.currentFilters || 
        //     state.currentFilters.weekNumber !== filters?.weekNumber ||
        //     state.currentFilters.year !== filters?.year ||
        //     state.currentFilters.month !== filters?.month) {
        //   return true
        // }
        
        return false
      }
    }),
    { name: 'HierarchyStore' }
  )
)

// Export actions for use in components
export const hierarchyStoreActions = {
  clearAll: () => useHierarchyStore.getState().clearHierarchyData(),
  // forceRefresh: () => useHierarchyStore.getState().forceRefresh(),
  forceRefresh: () => {
    const state = useHierarchyStore.getState()
    if(!state.isRefreshing) {
      state.forceRefresh()
    }
  },
safeInitialize: (userId: string) => {
    if (userId) {
      useHierarchyStore.getState().initializeStore(userId)
    }
  }
}

export default useHierarchyStore
