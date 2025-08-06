import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Task, TaskEvaluation, WeeklyReport } from '@/types'

interface EvaluationDialogState {
  // Core state
  isOpen: boolean
  report: WeeklyReport | null
  selectedTask: Task | null
  editEvaluation: TaskEvaluation | null
  
  // Form state
  formData: {
    evaluatedIsCompleted: boolean
    evaluatorComment: string
    evaluationType: string
  }
  
  // Loading states
  isSubmitting: boolean
  isDeleting: boolean
  
  // ✅ Protection states
  isLocked: boolean
  lockReason: string
  shouldPersist: boolean
  persistenceId: string | null
  
  // Actions
  openDialog: (report: WeeklyReport, taskId?: string) => void
  closeDialog: () => void
  forceClose: () => void
  enablePersistence: () => void
  disablePersistence: () => void
  selectTask: (task: Task, currentUserId?: string) => void
  setFormData: (data: Partial<EvaluationDialogState['formData']>) => void
  setSubmitting: (submitting: boolean) => void
  setDeleting: (deleting: boolean) => void
  selectNextUnevaluatedTask: (currentUserId?: string) => boolean
  
  // Getters
  getTasks: () => Task[]
  getEvaluationProgress: (currentUserId?: string) => { completed: number; total: number }
}

const initialFormData = {
  evaluatedIsCompleted: true,
  evaluatorComment: '',
  evaluationType: 'REVIEW'
}

const useEvaluationDialogStore = create<EvaluationDialogState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOpen: false,
      report: null,
      selectedTask: null,
      editEvaluation: null,
      formData: initialFormData,
      isSubmitting: false,
      isDeleting: false,
      isLocked: false,
      lockReason: '',
      shouldPersist: false,
      persistenceId: null,

      // Basic actions
      openDialog: (report: WeeklyReport, taskId?: string) => {
        
        const tasks = report.tasks || []
        let initialTask: Task | null = null
        
        if (taskId) {
          initialTask = tasks.find(t => t.id === taskId) || null
        }
        
        if (!initialTask && tasks.length > 0) {
          initialTask = tasks[0]
        }

        let myEval: TaskEvaluation | null = null
        let newFormData = initialFormData

        if (initialTask) {
          myEval = initialTask.evaluations?.find(ev => ev.evaluatorId) || null
          newFormData = {
            evaluatedIsCompleted: myEval?.evaluatedIsCompleted ?? initialTask.isCompleted,
            evaluatorComment: myEval?.evaluatorComment ?? '',
            evaluationType: myEval?.evaluationType ?? 'REVIEW'
          }
        }
        
        set({
          isOpen: true,
          report,
          selectedTask: initialTask,
          editEvaluation: myEval,
          formData: newFormData,
          isSubmitting: false,
          isDeleting: false,
          isLocked: false,
          shouldPersist: false,
        })
      },

      closeDialog: () => {
        set({
          isOpen: false,
          report: null,
          selectedTask: null,
          editEvaluation: null,
          formData: initialFormData,
          isSubmitting: false,
          isDeleting: false,
          isLocked: false,
          shouldPersist: false,
        })
      },

      forceClose: () => {
        set({
          isOpen: false,
          report: null,
          selectedTask: null,
          editEvaluation: null,
          formData: initialFormData,
          isSubmitting: false,
          isDeleting: false,
          isLocked: false,
          shouldPersist: false,
        })
      },


      enablePersistence: () => {
        const id = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set({ shouldPersist: true, persistenceId: id })
      },

      disablePersistence: () => {
        set({ shouldPersist: false, persistenceId: null })
      },

      // Select task
      selectTask: (task: Task, currentUserId?: string) => {
        
        const myEval = task.evaluations?.find(ev => ev.evaluatorId === currentUserId) || null
        
        const newFormData = {
          evaluatedIsCompleted: myEval?.evaluatedIsCompleted ?? task.isCompleted,
          evaluatorComment: myEval?.evaluatorComment ?? '',
          evaluationType: myEval?.evaluationType ?? 'REVIEW'
        }
        
        set({
          selectedTask: task,
          editEvaluation: myEval,
          formData: newFormData,
        })
      },

      // Update form data
      setFormData: (data) => {
        const currentFormData = get().formData
        set({
          formData: { ...currentFormData, ...data }
        })
      },

      // Loading states
      setSubmitting: (submitting: boolean) => {
        set({ isSubmitting: submitting })
      },

      setDeleting: (deleting: boolean) => {
        set({ isDeleting: deleting })
      },

      // Select next unevaluated task
      selectNextUnevaluatedTask: (currentUserId?: string) => {
        const state = get()
        const tasks = state.getTasks()
        
        if (!state.selectedTask || !currentUserId) return false
        
        const currentIndex = tasks.findIndex(t => t.id === state.selectedTask?.id)
        const nextTasks = tasks.slice(currentIndex + 1)
        
        const nextUnevaluatedTask = nextTasks.find(task =>
          !task.evaluations?.some(ev => ev.evaluatorId === currentUserId)
        )
        
        if (nextUnevaluatedTask) {
          state.selectTask(nextUnevaluatedTask, currentUserId)
          return true
        }
        
        return false
      },

      // Get tasks from current report
      getTasks: () => {
        const state = get()
        return state.report?.tasks || []
      },

      // Get evaluation progress
      getEvaluationProgress: (currentUserId?: string) => {
        const state = get()
        const tasks = state.getTasks()
        
        if (!currentUserId) {
          return { completed: 0, total: tasks.length }
        }
        
        const completed = tasks.filter(t => 
          t.evaluations?.some(ev => ev.evaluatorId === currentUserId)
        ).length
        
        return { completed, total: tasks.length }
      },
    }),
    { name: 'EvaluationDialogStore' }
  )
)

export default useEvaluationDialogStore
