import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ManagerReportsEmployee, UserDetailsResponse } from '@/types/hierarchy'
import { EvaluationType, type Task, type TaskEvaluation, type WeeklyReport } from '@/types'

interface EvaluationFormState {
  evaluatedIsCompleted: boolean
  evaluatedReasonNotDone: string
  evaluatorComment: string
  evaluationType: EvaluationType
}

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

  // Evaluation modal state - RESTORED ORIGINAL INTERFACE
  openEvalModal: boolean
  selectedEmployee: ManagerReportsEmployee | null
  selectedTask: Task | null
  editEvaluation: TaskEvaluation | null
  evaluationForm: EvaluationFormState
  setEvaluationModal: (
    open: boolean,
    employee?: ManagerReportsEmployee | null,
    task?: Task | null,
    evaluation?: TaskEvaluation | null
  ) => void
  updateEvaluationForm: (updates: Partial<EvaluationFormState>) => void
  resetEvaluationForm: () => void

  // Employee detail modal state
  openEmployeeModal: boolean
  selectedEmployeeDetail: ManagerReportsEmployee | null
  weeklyReport: WeeklyReport | null
  setEmployeeModal: (
    open: boolean,
    employee?: ManagerReportsEmployee | null
  ) => void
  setWeeklyReport: (report: WeeklyReport | null) => void

  // Reset all states
  resetAllStates: () => void

  // ✅ ADDED: Helper methods for ReportTemplate compatibility
  setSelectedTask: (task: Task | null) => void
  setSelectedEmployee: (employee: ManagerReportsEmployee | null) => void
  setEditEvaluation: (evaluation: TaskEvaluation | null) => void
  closeEvaluationModal: () => void
}

const defaultEvaluationForm: EvaluationFormState = {
  evaluatedIsCompleted: true,
  evaluatedReasonNotDone: '',
  evaluatorComment: '',
  evaluationType: EvaluationType.REVIEW,
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

      // Evaluation modal state - RESTORED ORIGINAL LOGIC
      openEvalModal: false,
      selectedEmployee: null,
      selectedTask: null,
      editEvaluation: null,
      evaluationForm: { ...defaultEvaluationForm },

      setEvaluationModal: (open, employee = null, task = null, evaluation = null) => {
        if (open && employee && task) {
          // Populate form with existing values or defaults
          const form: EvaluationFormState = {
            evaluatedIsCompleted: evaluation?.evaluatedIsCompleted ?? task.isCompleted,
            evaluatedReasonNotDone: evaluation?.evaluatedReasonNotDone ?? task.reasonNotDone ?? '',
            evaluatorComment: evaluation?.evaluatorComment ?? '',
            evaluationType: evaluation?.evaluationType ?? EvaluationType.REVIEW,
          }
          
          set({
            openEvalModal: open,
            selectedEmployee: employee,
            selectedTask: task,
            editEvaluation: evaluation,
            evaluationForm: form,
          }, false, 'setEvaluationModal')
        } else {
          set({
            openEvalModal: open,
            selectedEmployee: null,
            selectedTask: null,
            editEvaluation: null,
            evaluationForm: { ...defaultEvaluationForm },
          }, false, 'closeEvaluationModal')
        }
      },

      updateEvaluationForm: (updates) => {
        set((state) => ({
          evaluationForm: { ...state.evaluationForm, ...updates }
        }), false, 'updateEvaluationForm')
      },

      resetEvaluationForm: () => {
        set({ evaluationForm: { ...defaultEvaluationForm } }, false, 'resetEvaluationForm')
      },

      // Employee detail modal state
      openEmployeeModal: false,
      selectedEmployeeDetail: null,
      weeklyReport: null,

      setEmployeeModal: (open, employee = null) => {
        set({
          openEmployeeModal: open,
          selectedEmployeeDetail: employee,
          weeklyReport: null, // Reset weekly report when opening modal
        }, false, 'setEmployeeModal')
      },

      setWeeklyReport: (report) => {
        set({ weeklyReport: report }, false, 'setWeeklyReport')
      },

      // Reset all states
      resetAllStates: () => {
        set({
          search: '',
          lastUserId: null,
          openEvalModal: false,
          selectedEmployee: null,
          selectedTask: null,
          editEvaluation: null,
          evaluationForm: { ...defaultEvaluationForm },
          openEmployeeModal: false,
          selectedEmployeeDetail: null,
          weeklyReport: null,
          isSubmittingEvaluation: false,
          isRefetching: false,
        }, false, 'resetAllStates')
      },

      // ✅ ADDED: Helper methods for ReportTemplate compatibility
      setSelectedTask: (task) => {
        console.log('📋 AdminOverviewStore: Setting selected task:', task?.id)
        set({ selectedTask: task })
      },

      setSelectedEmployee: (employee) => {
        console.log('👤 AdminOverviewStore: Setting selected employee:', employee?.user?.id)
        set({ selectedEmployee: employee })
      },

      setEditEvaluation: (evaluation) => {
        console.log('✏️ AdminOverviewStore: Setting edit evaluation:', evaluation?.id)
        set({ editEvaluation: evaluation })
      },

      closeEvaluationModal: () => {
        console.log('❌ AdminOverviewStore: Closing evaluation modal')
        set({
          openEvalModal: false,
          selectedTask: null,
          editEvaluation: null,
          // Keep selectedEmployee for reference
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
  setEvaluationModal: state.setEvaluationModal,
  setEmployeeModal: state.setEmployeeModal,
  setSearch: state.setSearch,
  resetAllStates: state.resetAllStates,
}))
