import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ManagerReportsEmployee, UserDetailsResponse } from '@/types/hierarchy'
import { EvaluationType, type Task, type TaskEvaluation, type WeeklyReport } from '@/types'

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

const useAdminOverviewStore = create<AdminOverviewState>()(
  devtools(
    (set, get) => ({
      // Search state
      search: '',
      setSearch: (search) => set({ search }, false, 'setSearch'),

      // User tracking
      lastUserId: null,

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

      // ✅ NEW: Data cache
      managerReportsData: null,
      currentFilters: null,
      lastRefreshTimestamp: 0,

      // User management
      setLastUserId: (userId: string | null) => {
        const state = get()
        
        // Clear data when user changes
        if (state.lastUserId !== userId) {
          set({
            lastUserId: userId,
            managerReportsData: null,
            currentFilters: null,
            lastRefreshTimestamp: 0,
            isRefetching: false,
          })
        } else {
          set({ lastUserId: userId })
        }
      },


      setManagerReportsData: (data, filters = null) => {
        const state = get()

        if (!state.lastUserId) {
          console.warn('Cannot set manager reports data without a user ID')
          return
        }

        set({
          managerReportsData: data,
          currentFilters: filters || state.currentFilters,
          lastRefreshTimestamp: Date.now(),
          isRefetching: false,
        })
      },

     

      clearManagerReportsData: () => {
        set({
          managerReportsData: null,
          currentFilters: null,
          lastRefreshTimestamp: 0,
          isRefetching: false,
        })
      },

       // ✅ ENHANCED: Force refresh with better logging and state management
      forceRefresh: () => {
        set({
          lastRefreshTimestamp: Date.now(),
          isRefetching: true,
          managerReportsData: null, // ✅ Clear data to force refetch
          currentFilters: null, // ✅ Clear filters to force refetch
        })
        
      },

      // ✅ ENHANCED: shouldRefetch with detailed logging for debugging
      shouldRefetch: (userId: string, filters: any) => {
        const state = get()
        
        // ✅ CRITICAL: Always refetch if data was cleared by forceRefresh
        if (!state.managerReportsData) {
          return true
        }
        
        // ✅ Refetch if user changed
        if (state.lastUserId !== userId) {
          return true
        }
        
        // ✅ Refetch if filters changed - More thorough comparison
        if (!state.currentFilters || 
            state.currentFilters.weekNumber !== filters?.weekNumber ||
            state.currentFilters.year !== filters?.year ||
            state.currentFilters.month !== filters?.month) {
          return true
        }
        
        return false
      },

      // ✅ FIXED: Add missing setRefreshing implementation (same as HierarchyStore)
      setRefreshing: (loading: boolean) => {
        set({ isRefetching: loading })
      },

      // Reset all states - ✅ Updated
      resetAllStates: () => {
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
    }),
    {
      name: 'admin-overview-store',
    }
  )
)


// ✅ Enhanced actions
export const adminOverviewStoreActions = {
  forceRefresh: () => useAdminOverviewStore.getState().forceRefresh(),
  clearAll: () => useAdminOverviewStore.getState().clearManagerReportsData(),
}

export default useAdminOverviewStore
