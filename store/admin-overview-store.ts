import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ManagerReportsEmployee, UserDetailsResponse } from '@/types/hierarchy'
import { EvaluationType, type Task, type TaskEvaluation, type WeeklyReport } from '@/types'

interface AdminOverviewState {
  // Search state
  search: string
  setSearch: (search: string) => void

  // User tracking with stable reference
  lastUserId: string | null
  lastFiltersHash: string | null // ✅ NEW: Track filters hash to prevent loops

  // Loading states - simplified
  isSubmittingEvaluation: boolean
  setSubmittingEvaluation: (loading: boolean) => void
  isRefetching: boolean

  // Employee detail modal state
  openEmployeeModal: boolean
  selectedEmployeeDetail: ManagerReportsEmployee | null
  weeklyReport: WeeklyReport | null
  setEmployeeModal: (
    open: boolean,
    employee?: ManagerReportsEmployee | null
  ) => void
  setWeeklyReport: (report: WeeklyReport | null) => void

  // ✅ FIXED: Simplified data cache with atomic operations
  managerReportsData: any | null
  currentFilters: any | null
  
  // ✅ FIXED: Single source of truth for refresh state
  lastRefreshTimestamp: number
  isInitialized: boolean // ✅ NEW: Track initialization state
  
  // Actions with atomic operations
  initializeStore: (userId: string) => void
  setManagerReportsData: (data: any, filters?: any) => void
  clearManagerReportsData: () => void
  forceRefresh: () => void
  shouldRefetch: (userId: string, filters: any) => boolean
  setRefreshing: (loading: boolean) => void
  resetAllStates: () => void
}

// ✅ HELPER: Create stable hash for filters
const createFiltersHash = (filters: any): string => {
  if (!filters) return 'null'
  const { weekNumber, year, month } = filters
  return `${weekNumber || 'null'}-${year || 'null'}-${month || 'null'}`
}

const useAdminOverviewStore = create<AdminOverviewState>()(
  devtools(
    (set, get) => ({
      // Search state
      search: '',
      setSearch: (search) => set({ search }, false, 'setSearch'),

      // User tracking with stability
      lastUserId: null,
      lastFiltersHash: null,

      // Loading states
      isSubmittingEvaluation: false,
      setSubmittingEvaluation: (loading) => {
        set({ isSubmittingEvaluation: loading }, false, 'setSubmittingEvaluation')
      },
      isRefetching: false,

      // Employee detail modal state
      openEmployeeModal: false,
      selectedEmployeeDetail: null,
      weeklyReport: null,

      setEmployeeModal: (open, employee = null) => {
        set({
          openEmployeeModal: open,
          selectedEmployeeDetail: employee,
          weeklyReport: null,
        }, false, 'setEmployeeModal')
      },

      setWeeklyReport: (report) => {
        set({ weeklyReport: report }, false, 'setWeeklyReport')
      },

      // ✅ FIXED: Stable data cache
      managerReportsData: null,
      currentFilters: null,
      lastRefreshTimestamp: 0,
      isInitialized: false,

      // ✅ ENHANCED: Initialize store with better cleanup
      initializeStore: (userId: string) => {
        set({
          lastUserId: userId,
          lastFiltersHash: null,
          managerReportsData: null, // ✅ Always clear data on init
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefetching: false,
          isInitialized: true,
        }, false, 'initializeStore')
      },

      // ✅ FIXED: Atomic data setting
      setManagerReportsData: (data, filters = null) => {
        const state = get()

        if (!state.lastUserId) {
          console.warn('[AdminOverviewStore] Cannot set manager reports data without a user ID')
          return
        }

        const filtersHash = createFiltersHash(filters || state.currentFilters)
        
        set({
          managerReportsData: data,
          currentFilters: filters || state.currentFilters,
          lastFiltersHash: filtersHash,
          lastRefreshTimestamp: Date.now(),
          isRefetching: false,
        }, false, 'setManagerReportsData')
      },

      // ✅ FIXED: Clear with proper state reset
      clearManagerReportsData: () => {
        set({
          managerReportsData: null,
          currentFilters: null,
          lastFiltersHash: null,
          lastRefreshTimestamp: 0,
          isRefetching: false,
        }, false, 'clearManagerReportsData')
      },

      // ✅ FIXED: Force refresh with atomic state update
      forceRefresh: () => {
        const state = get()
        
        set({
          lastRefreshTimestamp: Date.now(),
          isRefetching: true,
          managerReportsData: null,
          currentFilters: null,
          lastFiltersHash: null,
        }, false, 'forceRefresh')
      },

      // ✅ CRITICAL FIX: Simplified shouldRefetch - always fetch if no data
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        // ✅ Must have user
        if (!userId) {
          return false
        }
        
        // ✅ CRITICAL: Always refetch if no data (for component mount cases)
        if (!state.managerReportsData) {
          return true
        }
        
        // ✅ User changed
        if (state.lastUserId !== userId) {
          return true
        }
        
        // ✅ Check filters using stable hash
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
        
        return false
      },

      // ✅ FIXED: Simple setRefreshing
      setRefreshing: (loading: boolean) => {
        set({ isRefetching: loading }, false, 'setRefreshing')
      },

      // ✅ FIXED: Complete state reset
      resetAllStates: () => {
        set({
          search: '',
          lastUserId: null,
          lastFiltersHash: null,
          openEmployeeModal: false,
          selectedEmployeeDetail: null,
          weeklyReport: null,
          isSubmittingEvaluation: false,
          isRefetching: false,
          managerReportsData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isInitialized: false,
        }, false, 'resetAllStates')
      },
    }),
    {
      name: 'admin-overview-store',
    }
  )
)

// ✅ Enhanced actions with safety checks
export const adminOverviewStoreActions = {
  forceRefresh: () => {
    const state = useAdminOverviewStore.getState()
    if (!state.isRefetching) { // Prevent multiple simultaneous refreshes
      state.forceRefresh()
    }
  },
  clearAll: () => useAdminOverviewStore.getState().clearManagerReportsData(),
  safeInitialize: (userId: string) => {
    if (userId) {
      useAdminOverviewStore.getState().initializeStore(userId)
    }
  }
}

export default useAdminOverviewStore
