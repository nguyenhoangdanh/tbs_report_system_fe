import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ManagerReportsEmployee, UserDetailsResponse } from '@/types/hierarchy'
import { EvaluationType, type Task, type TaskEvaluation, type WeeklyReport } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

interface AdminOverviewState {
  // Search state
  search: string
  setSearch: (search: string) => void

  // User tracking
  lastUserId: string | null
  setLastUserId: (userId: string | null) => void

  // Loading states
  isSubmittingEvaluation: boolean
  setSubmittingEvaluation: (loading: boolean) => void
  isRefetching: boolean
  setIsRefetching: (loading: boolean) => void

  // Employee detail modal state
  openEmployeeModal: boolean
  selectedEmployeeDetail: ManagerReportsEmployee | null
  weeklyReport: WeeklyReport | null
  setEmployeeModal: (
    open: boolean,
    employee?: ManagerReportsEmployee | null
  ) => void
  setWeeklyReport: (report: WeeklyReport | null) => void

  // ✅ NEW: Data cache similar to HierarchyStore
  managerReportsData: any | null
  currentFilters: any | null
  
  // ✅ NEW: Enhanced refresh mechanism
  lastRefreshTimestamp: number
  forceRefresh: () => void
  setManagerReportsData: (data: any, filters?: any) => void
  clearManagerReportsData: () => void
  shouldRefetch: (userId: string, filters: any) => boolean
  setRefreshing: (loading: boolean) => void

  // Reset all states
  resetAllStates: () => void
}

export const useAdminOverviewStore = create<AdminOverviewState>()(
  devtools(
    (set, get) => ({
      // Search state
      search: '',
      setSearch: (search) => set({ search }, false, 'setSearch'),

      // User tracking
      lastUserId: null,
      setLastUserId: (userId) => set({ lastUserId: userId }, false, 'setLastUserId'),

      // Loading states
      isSubmittingEvaluation: false,
      setSubmittingEvaluation: (loading) => {
        set({ isSubmittingEvaluation: loading }, false, 'setSubmittingEvaluation')
      },
      isRefetching: false,
      setIsRefetching: (loading) => {
        set({ isRefetching: loading }, false, 'setIsRefetching')
      },

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

      // ✅ NEW: Data cache
      managerReportsData: null,
      currentFilters: null,
      lastRefreshTimestamp: 0,

      // ✅ ENHANCED: Force refresh with better logging and state management
      forceRefresh: () => {
        const currentTimestamp = Date.now()
        console.log('🔄 AdminOverviewStore: Force refresh triggered at:', currentTimestamp)
        
        set({
          lastRefreshTimestamp: currentTimestamp,
          isRefetching: true,
          managerReportsData: null, // ✅ Clear data to force refetch
          currentFilters: null, // ✅ Clear filters to force refetch
        }, false, 'forceRefresh')
        
        console.log('🔄 AdminOverviewStore: State after forceRefresh:', {
          lastRefreshTimestamp: currentTimestamp,
          isRefetching: true,
          managerReportsData: null,
          currentFilters: null,
        })
      },

      setManagerReportsData: (data: any, filters?: any) => {
        console.log('📊 AdminOverviewStore: Setting manager reports data:', !!data)
        const state = get()
        set({
          managerReportsData: data,
          currentFilters: filters || state.currentFilters,
          lastRefreshTimestamp: Date.now(), // ✅ Update timestamp when data is set
          isRefetching: false,
        }, false, 'setManagerReportsData')
      },

      // ✅ ENHANCED: shouldRefetch with detailed logging for debugging
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        console.log('🔍 AdminOverviewStore shouldRefetch check:', {
          userId,
          filters,
          hasData: !!state.managerReportsData,
          lastUserId: state.lastUserId,
          currentFilters: state.currentFilters,
          lastRefreshTimestamp: state.lastRefreshTimestamp,
          timeSinceLastRefresh: Date.now() - state.lastRefreshTimestamp,
          isRefetching: state.isRefetching
        })
        
        // ✅ CRITICAL: Always refetch if data was cleared by forceRefresh
        if (!state.managerReportsData && state.lastRefreshTimestamp > 0) {
          console.log('✅ shouldRefetch: Data cleared by forceRefresh, MUST refetch')
          return true
        }
        
        // ✅ Always refetch if no data at all
        if (!state.managerReportsData) {
          console.log('✅ shouldRefetch: No data, MUST refetch')
          return true
        }
        
        // ✅ Refetch if user changed
        if (state.lastUserId !== userId) {
          console.log('✅ shouldRefetch: User changed, MUST refetch')
          return true
        }
        
        // ✅ Refetch if filters changed - IMPROVED: More thorough comparison
        if (!state.currentFilters || 
            state.currentFilters.weekNumber !== filters?.weekNumber ||
            state.currentFilters.year !== filters?.year ||
            state.currentFilters.userId !== filters?.userId) {
          console.log('✅ shouldRefetch: Filters changed, MUST refetch')
          return true
        }
        
        // ✅ ENHANCED: Refetch if forceRefresh was called recently (within 5 seconds)
        const timeSinceRefresh = Date.now() - state.lastRefreshTimestamp
        if (state.lastRefreshTimestamp > 0 && timeSinceRefresh < 5000) {
          console.log('✅ shouldRefetch: Recent forceRefresh detected, MUST refetch')
          return true
        }
        
        console.log('❌ shouldRefetch: No need to refetch')
        return false
      },

      // ✅ FIXED: Add missing setRefreshing implementation (same as HierarchyStore)
      setRefreshing: (loading: boolean) => {
        console.log('🔄 AdminOverviewStore: Setting refreshing state:', loading)
        set({ isRefetching: loading })
      },

      // Reset all states - ✅ Updated
      resetAllStates: () => {
        console.log('🔄 AdminOverviewStore: Reset all states')
        set({
          search: '',
          lastUserId: null,
          openEmployeeModal: false,
          selectedEmployeeDetail: null,
          weeklyReport: null,
          isSubmittingEvaluation: false,
          isRefetching: false, // ✅ Use isRefetching instead of isRefreshing
          managerReportsData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
        })
      },

      // ✅ FIXED: Add missing clearManagerReportsData implementation
      clearManagerReportsData: () => {
        console.log('🧹 AdminOverviewStore: Clearing manager reports data')
        set({
          managerReportsData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefetching: false,
        })
      },
    }),
    {
      name: 'admin-overview-store',
    }
  )
)

// Export individual selectors for better performance
export const useAdminOverviewActions = () => useAdminOverviewStore((state) => ({
  setEmployeeModal: state.setEmployeeModal,
  setSearch: state.setSearch,
  resetAllStates: state.resetAllStates,
}))

// ✅ Enhanced actions
export const adminOverviewStoreActions = {
  forceRefresh: () => useAdminOverviewStore.getState().forceRefresh(),
  clearAll: () => useAdminOverviewStore.getState().clearManagerReportsData(),
}
