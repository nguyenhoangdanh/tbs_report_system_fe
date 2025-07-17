import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { WeeklyReport, Task } from '@/types'
import { getCurrentWeek } from '@/utils/week-utils'

interface ReportState {
  // Current form state
  currentTasks: Task[]
  currentWeekNumber: number
  currentYear: number
  selectedReport: WeeklyReport | null
  
  // UI states
  isLoading: boolean
  isSaving: boolean
  isFormDirty: boolean
  
  // Cache for reports
  reportsCache: Map<string, WeeklyReport>
  
  // Actions
  setCurrentTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, field: keyof Task, value: Task[keyof Task]) => void
  addTask: () => void
  removeTask: (taskId: string) => void
  clearTasks: () => void
  
  // Week navigation
  setCurrentWeek: (weekNumber: number, year: number) => void
  navigateToWeek: (weekNumber: number, year: number, clearData?: boolean) => void
  
  // Report management
  setSelectedReport: (report: WeeklyReport | null) => void
  syncReportToStore: (report: WeeklyReport | null) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setFormDirty: (dirty: boolean) => void
  
  // Cache management
  setCachedReport: (key: string, report: WeeklyReport) => void
  getCachedReport: (key: string) => WeeklyReport | null
  removeCachedReport: (key: string) => void
  clearCacheForWeek: (weekNumber: number, year: number) => void
  clearCache: () => void
  
  // Reset functions
  resetFormState: () => void
  resetToWeek: (weekNumber: number, year: number) => void
  forceRefresh: () => void
}

const createTask = (reportId?: string): Task => ({
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
  reportId: reportId || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

const useReportStore = create<ReportState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentTasks: [],
      currentWeekNumber: getCurrentWeek().weekNumber,
      currentYear: getCurrentWeek().year,
      selectedReport: null,
      isLoading: false,
      isSaving: false,
      isFormDirty: false,
      reportsCache: new Map(),
      
      // Task actions
      setCurrentTasks: (tasks) => {
        set({ 
          currentTasks: [...tasks],
          isFormDirty: false 
        }, false, 'setCurrentTasks')
      },
      
      updateTask: (taskId, field, value) => {
        set((state) => {
          const tasks = [...state.currentTasks]
          const taskIndex = tasks.findIndex(task => task.id === taskId)
          
          if (taskIndex === -1) {
            // Create new task if it doesn't exist
            const newTask = createTask(state.selectedReport?.id)
            newTask.id = taskId
            // Type-safe assignment
            switch (field) {
              case 'taskName':
              case 'reasonNotDone':
                newTask[field] = typeof value === 'string' ? value : ''
                break
              case 'monday':
              case 'tuesday':
              case 'wednesday':
              case 'thursday':
              case 'friday':
              case 'saturday':
              case 'isCompleted':
                newTask[field] = typeof value === 'boolean' ? value : false
                break
              default:
                (newTask as any)[field] = value
            }
            tasks.push(newTask)
          } else {
            // Update existing task
            const task = { ...tasks[taskIndex] }
            if (field === 'isCompleted' && value === true) {
              task.isCompleted = true
              task.reasonNotDone = ''
            } else {
              (task as any)[field] = value
            }
            tasks[taskIndex] = task
          }
          
          return { 
            currentTasks: tasks,
            isFormDirty: true
          }
        }, false, 'updateTask')
      },
      
      addTask: () => {
        set((state) => {
          const newTask = createTask(state.selectedReport?.id)
          return {
            currentTasks: [...state.currentTasks, newTask],
            isFormDirty: true
          }
        }, false, 'addTask')
      },
      
      removeTask: (taskId) => {
        set((state) => {
          return {
            currentTasks: state.currentTasks.filter(task => task.id !== taskId),
            isFormDirty: true
          }
        }, false, 'removeTask')
      },
      
      clearTasks: () => {
        set({ 
          currentTasks: [],
          isFormDirty: false
        }, false, 'clearTasks')
      },
      
      // Week navigation with proper cleanup
      setCurrentWeek: (weekNumber, year) => {
        set({ 
          currentWeekNumber: weekNumber, 
          currentYear: year 
        }, false, 'setCurrentWeek')
      },
      
      navigateToWeek: (weekNumber, year, clearData = true) => {
        set((state) => {
          const newState: Partial<ReportState> = {
            currentWeekNumber: weekNumber,
            currentYear: year
          }
          
          if (clearData) {
            newState.currentTasks = []
            newState.selectedReport = null
            newState.isFormDirty = false
          }
          
          return newState
        }, false, 'navigateToWeek')
      },
      
      // Report management with proper sync
      setSelectedReport: (report) => {
        set((state) => ({
          selectedReport: report,
          currentTasks: report?.tasks ? [...report.tasks] : [],
          currentWeekNumber: report?.weekNumber || state.currentWeekNumber,
          currentYear: report?.year || state.currentYear,
          isFormDirty: false
        }), false, 'setSelectedReport')
      },
      
      syncReportToStore: (report) => {
        const state = get()

        // THÊM: Force clear selectedReport nếu report là null
  if (!report) {
    set({
      selectedReport: null,
      currentTasks: [],
      isFormDirty: false
    }, false, 'syncReportToStore-clear')
    return
  }
        
        // Only update if week matches current navigation
        if (report && (
          report.weekNumber !== state.currentWeekNumber || 
          report.year !== state.currentYear
        )) {
          return
        }
        
        set({
          selectedReport: report,
          currentTasks: report?.tasks ? [...report.tasks] : [],
          isFormDirty: false
        }, false, 'syncReportToStore')
      },
      
      // Loading actions
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      setSaving: (saving) => set({ isSaving: saving }, false, 'setSaving'),
      setFormDirty: (dirty) => set({ isFormDirty: dirty }, false, 'setFormDirty'),
      
      // Cache actions
      setCachedReport: (key, report) => {
        set((state) => {
          const newCache = new Map(state.reportsCache)
          newCache.set(key, report)
          return { reportsCache: newCache }
        }, false, 'setCachedReport')
      },
      
      getCachedReport: (key) => {
        const cached = get().reportsCache.get(key)
        return cached || null
      },
      
      removeCachedReport: (key) => {
        set((state) => {
          const newCache = new Map(state.reportsCache)
          
          // Remove by key (cache key) or by report ID
          if (typeof key === 'string') {
            // Try to remove by cache key first
            if (newCache.has(key)) {
              newCache.delete(key)
            } else {
              // Try to find and remove by report ID
              for (const [cacheKey, report] of newCache.entries()) {
                if (report.id === key) {
                  newCache.delete(cacheKey)
                  break
                }
              }
            }
          }
          
          return { reportsCache: newCache }
        }, false, 'removeCachedReport')
      },
      
      clearCacheForWeek: (weekNumber, year) => {
        const cacheKey = `${weekNumber}-${year}`
        set((state) => {
          const newCache = new Map(state.reportsCache)
          newCache.delete(cacheKey)
          return { reportsCache: newCache }
        }, false, 'clearCacheForWeek')
      },
      
      clearCache: () => {
        set({ reportsCache: new Map() }, false, 'clearCache')
      },
      
      // Reset functions
      resetFormState: () => {
        set({
          currentTasks: [],
          selectedReport: null,
          isLoading: false,
          isSaving: false,
          isFormDirty: false
        }, false, 'resetFormState')
      },
      
      resetToWeek: (weekNumber, year) => {
        set({
          currentTasks: [],
          currentWeekNumber: weekNumber,
          currentYear: year,
          selectedReport: null,
          isLoading: false,
          isFormDirty: false
        }, false, 'resetToWeek')
      },
      
      forceRefresh: () => {
        const state = get()
        set({
          currentTasks: [],
          selectedReport: null,
          isFormDirty: false,
          isLoading: true
        }, false, 'forceRefresh')
        
        // Reset loading after a brief moment
        setTimeout(() => {
          set({ isLoading: false }, false, 'forceRefresh-complete')
        }, 100)
      }
    }),
    {
      name: 'report-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

export default useReportStore