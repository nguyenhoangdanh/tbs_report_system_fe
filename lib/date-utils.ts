// Re-export work week functions from week-utils
export {
  getCurrentWeek,
  getWorkWeekFromDate as getWeekFromDate,
  getWorkWeekDateRange as getWeekDateRange,
  getWorkDays as getWeekDays,
  formatWorkWeekRange as formatDateRange,
  isValidWeekForCreation,
  isValidWeekForEdit,
  getAvailableWeeksForReporting,
  calculateDaysOverdue,
  isReportOverdue,
  getDeadlineStatus,
  formatDeadline
} from '../utils/week-utils'

// Import getCurrentWeek from utils
import { getCurrentWeek } from '../utils/week-utils'

// Helper function to get previous week
export function getPreviousWeek(): { weekNumber: number; year: number } {
  const current = getCurrentWeek()
  let prevWeek = current.weekNumber - 1
  let prevYear = current.year
  
  if (prevWeek < 1) {
    prevWeek = 52
    prevYear = current.year - 1
  }
  
  return { weekNumber: prevWeek, year: prevYear }
}

// Helper function to get next week
export function getNextWeek(): { weekNumber: number; year: number } {
  const current = getCurrentWeek()
  let nextWeek = current.weekNumber + 1
  let nextYear = current.year
  
  if (nextWeek > 52) {
    nextWeek = 1
    nextYear = current.year + 1
  }
  
  return { weekNumber: nextWeek, year: nextYear }
}

export function validateWeekYear(weekNumber: number, year: number): { isValid: boolean; error?: string } {
  // Basic validation
  if (!weekNumber || !year) {
    return { isValid: false, error: 'Vui lòng nhập số tuần và năm' }
  }
  
  if (weekNumber < 1 || weekNumber > 52) {
    return { isValid: false, error: 'Số tuần phải từ 1 đến 52' }
  }
  
  if (year < 2020 || year > 2030) {
    return { isValid: false, error: 'Năm phải từ 2020 đến 2030' }
  }
  
  return { isValid: true }
}
