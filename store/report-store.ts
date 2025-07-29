import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Task, WeeklyReport } from '@/types'
import { getCurrentWeek } from '@/utils/week-utils'

interface ReportState {
  // User-specific state
  currentUserId: string | null
  
  // Report data
  selectedReport: WeeklyReport | null
  cachedReports: Record<string, WeeklyReport>
  
  // Navigation state
  currentWeekNumber: number
  currentYear: number
  
  // UI state
  isSaving: boolean
  
  // Actions
  setCurrentUser: (userId: string | null) => void
  syncReportToStore: (report: WeeklyReport | null) => void
  navigateToWeek: (weekNumber: number, year: number, clearData?: boolean) => void
  
  // Task management
  currentTasks: Task[]
  addTask: () => void
  addMultipleTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, field: keyof Task, value: any) => void
  removeTask: (taskId: string) => void
  clearTasks: () => void
  
  // Cache management
  setCachedReport: (key: string, report: WeeklyReport) => void
  getCachedReport: (key: string) => WeeklyReport | null
  removeCachedReport: (reportId: string) => void
  clearCacheForWeek: (weekNumber: number, year: number) => void
  
  // State management
  setSaving: (saving: boolean) => void
  clearAllState: () => void
  clearUserSpecificState: () => void

  // Add new method for complete state reset
  forceResetForNewOperation: (weekNumber: number, year: number) => void
}

const createTask = (): Task => ({
  id: `temp-${Date.now()}-${Math.random()}`,
  taskName: '',
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  isCompleted: false,
  reasonNotDone: '',
  reportId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const useReportStore = create<ReportState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUserId: null,
        selectedReport: null,
        currentTasks: [],
        cachedReports: {},
        currentWeekNumber: getCurrentWeek().weekNumber,
        currentYear: getCurrentWeek().year,
        isSaving: false,

        // User management
        setCurrentUser: (userId: string | null) => {
          const state = get()
          
          // If switching to different user, clear all state
          if (state.currentUserId && state.currentUserId !== userId) {
            
            // Clear everything for user switch
            const currentWeek = getCurrentWeek()
            set({
              currentUserId: userId,
              selectedReport: null,
              currentTasks: [],
              cachedReports: {},
              currentWeekNumber: currentWeek.weekNumber,
              currentYear: currentWeek.year,
              isSaving: false,
            })
          } else {
            // Same user or first time login
            set({ currentUserId: userId })
          }
        },

        // Report management
        syncReportToStore: (report: WeeklyReport | null) => {
          const state = get()
          
          // User validation
          if (!state.currentUserId) {
            console.warn('⚠️ No current user set, skipping report sync')
            return
          }
          
          if (report) {
            
            set({
              selectedReport: report,
              currentTasks: report.tasks || [],
              currentWeekNumber: report.weekNumber,
              currentYear: report.year,
            })
          } else {
            set({
              selectedReport: null,
              currentTasks: [],
              // Don't clear week info when clearing report
            })
          }
        },

        // Week navigation - Enhanced clearing
        navigateToWeek: (weekNumber: number, year: number, clearData = false) => {
          const state = get()
          
          if (!state.currentUserId) {
            console.warn('⚠️ No current user set, skipping week navigation')
            return
          }
          
          
          // Always clear data when navigating to different week
          const isDifferentWeek = weekNumber !== state.currentWeekNumber || year !== state.currentYear
          
          if (clearData || isDifferentWeek) {
            set({
              currentWeekNumber: weekNumber,
              currentYear: year,
              selectedReport: null,
              currentTasks: [],
            })
          } else {
            set({
              currentWeekNumber: weekNumber,
              currentYear: year,
            })
          }
        },

        // Task management
        addTask: () => {
          const state = get()
          if (!state.currentUserId) {
            console.warn('⚠️ No current user set, cannot add task')
            return
          }
          
          const newTask = createTask()
          set({
            currentTasks: [...state.currentTasks, newTask]
          })
        },

        addMultipleTasks: (tasks: Task[]) => {
          const state = get()
          if (!state.currentUserId) {
            console.warn('⚠️ No user ID, cannot add multiple tasks')
            return
          }

          // ✅ ENHANCED: Ensure imported tasks don't inherit evaluations
          const cleanTasks = tasks.map(task => ({
            ...task,
            id: task.id || `temp-${Date.now()}-${Math.random()}`, // Ensure unique ID
            evaluations: [], // ✅ CRITICAL: Always clear evaluations for imported tasks
            reportId: '', // Clear report association
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          console.log('📥 Adding multiple clean tasks:', cleanTasks.length, 'for user:', state.currentUserId)
          
          set({
            currentTasks: [...state.currentTasks, ...cleanTasks]
          })
        },

        updateTask: (taskId: string, field: keyof Task, value: any) => {
          const state = get()
          if (!state.currentUserId) return
          
          set({
            currentTasks: state.currentTasks.map(task =>
              task.id === taskId ? { ...task, [field]: value } : task
            )
          })
        },

        removeTask: (taskId: string) => {
          const state = get()
          if (!state.currentUserId) return
          
          set({
            currentTasks: state.currentTasks.filter(task => task.id !== taskId)
          })
        },

        clearTasks: () => {
          const state = get()
          if (!state.currentUserId) {
            console.warn('⚠️ No current user set, cannot clear tasks')
            return
          }
          
          set({ currentTasks: [] })
        },

        // Cache management
        setCachedReport: (key: string, report: WeeklyReport) => {
          const state = get()
          if (!state.currentUserId) return
          
          // User-specific cache key
          const userCacheKey = `${state.currentUserId}-${key}`
          
          set({
            cachedReports: {
              ...state.cachedReports,
              [userCacheKey]: report
            }
          })
        },

        getCachedReport: (key: string) => {
          const state = get()
          if (!state.currentUserId) return null
          
          const userCacheKey = `${state.currentUserId}-${key}`
          return state.cachedReports[userCacheKey] || null
        },

        // Remove cached report - Enhanced
        removeCachedReport: (reportId: string) => {
          const state = get()
          if (!state.currentUserId) return
          
          console.log('🗑️ Removing cached report:', reportId, 'for user:', state.currentUserId)
          
          const newCache = { ...state.cachedReports }
          Object.keys(newCache).forEach(key => {
            if (key.startsWith(state.currentUserId!) && newCache[key]?.id === reportId) {
              delete newCache[key]
            }
          })
          
          // Clear current data if it matches this report
          const shouldClearCurrent = state.selectedReport?.id === reportId
          
          set({
            cachedReports: newCache,
            ...(shouldClearCurrent && {
              selectedReport: null,
              currentTasks: [],
            })
          })
        },

        // Clear cache for week - Enhanced
        clearCacheForWeek: (weekNumber: number, year: number) => {
          const state = get()
          if (!state.currentUserId) return
          
          const weekKey = `${weekNumber}-${year}`
          const userCacheKey = `${state.currentUserId}-${weekKey}`
          
          const newCache = { ...state.cachedReports }
          delete newCache[userCacheKey]
          
          // Also clear current data if it matches this week
          const shouldClearCurrent = state.currentWeekNumber === weekNumber && state.currentYear === year
          
          set({
            cachedReports: newCache,
            ...(shouldClearCurrent && {
              selectedReport: null,
              currentTasks: [],
            })
          })
        },

        // UI state
        setSaving: (saving: boolean) => {
          set({ isSaving: saving })
        },

        // State cleanup
        clearUserSpecificState: () => {
          const state = get()
          if (!state.currentUserId) return
          
          // Clear user-specific cache
          const newCache = { ...state.cachedReports }
          Object.keys(newCache).forEach(key => {
            if (key.startsWith(state.currentUserId!)) {
              delete newCache[key]
            }
          })
          
          const currentWeek = getCurrentWeek()
          set({
            selectedReport: null,
            currentTasks: [],
            cachedReports: newCache,
            currentWeekNumber: currentWeek.weekNumber,
            currentYear: currentWeek.year,
            isSaving: false,
          })
        },

        // Force complete reset for new operations (prevent stale state)
        forceResetForNewOperation: (weekNumber: number, year: number) => {
          const state = get()
          if (!state.currentUserId) {
            console.warn('⚠️ No current user set, skipping force reset')
            return
          }
          
          // Clear everything for this week
          const weekKey = `${weekNumber}-${year}`
          const userCacheKey = `${state.currentUserId}-${weekKey}`
          const newCache = { ...state.cachedReports }
          delete newCache[userCacheKey]
          
          set({
            selectedReport: null,
            currentTasks: [],
            cachedReports: newCache,
            currentWeekNumber: weekNumber,
            currentYear: year,
            isSaving: false,
          })
          
        },

        // Clear all state
        clearAllState: () => {
          console.log('🧹 Clearing ALL report store state')
          
          const currentWeek = getCurrentWeek()
          set({
            currentUserId: null,
            selectedReport: null,
            currentTasks: [],
            cachedReports: {},
            currentWeekNumber: currentWeek.weekNumber,
            currentYear: currentWeek.year,
            isSaving: false,
          })
        },
      }),
      {
        name: 'report-store',
        // Only persist user-agnostic data
        partialize: (state) => ({
          currentWeekNumber: state.currentWeekNumber,
          currentYear: state.currentYear,
        }),
      }
    ),
    { name: 'ReportStore' }
  )
)

// Export the clearAllState function for use in auth-provider
export const clearAllState = () => {
  useReportStore.getState().clearAllState()
}

export default useReportStore