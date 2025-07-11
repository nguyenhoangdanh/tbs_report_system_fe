import { startOfWeek, endOfWeek, format as dateFnsFormat, getWeek, getYear, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Frontend utility functions for work week calculations (Friday-Thursday cycle)
 */

export interface WeekInfo {
  weekNumber: number;
  year: number;
}

/**
 * Get current work week (Friday to Thursday cycle)
 * Work week được tính theo logic thực tế:
 * - Work week N = T6,T7 của ISO week (N-1) + T2,T3,T4,T5 của ISO week N
 * - Ví dụ: Work week 28 = T6,T7 của ISO week 27 + T2,T3,T4,T5 của ISO week 28
 */
export function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date();
  return getWorkWeekFromDate(now);
}

/**
 * Get work week number and year from a specific date
 * Logic chính xác:
 * - T6, T7: thuộc work week = ISO week + 1
 * - T2, T3, T4, T5: thuộc work week = ISO week hiện tại
 * - CN: thuộc work week = ISO week hiện tại
 */
export function getWorkWeekFromDate(date: Date): { weekNumber: number; year: number } {
  const targetDate = new Date(date.getTime());
  const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Lấy ISO week của ngày hiện tại
  const isoWeekNumber = getWeek(targetDate, { 
    weekStartsOn: 1, // Monday = 1
    firstWeekContainsDate: 4 
  });
  const isoYear = getYear(targetDate);
  
  let workWeekNumber: number;
  let workYear: number;
  
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    // Friday or Saturday (T6, T7) - thuộc work week tiếp theo
    workWeekNumber = isoWeekNumber + 1;
    workYear = isoYear;
    
    // Handle year transition
    if (workWeekNumber > 52) {
      // Check if week 53 exists
      const lastDayOfYear = new Date(isoYear, 11, 31);
      const lastWeekOfYear = getWeek(lastDayOfYear, { 
        weekStartsOn: 1, 
        firstWeekContainsDate: 4 
      });
      
      if (workWeekNumber > lastWeekOfYear) {
        workWeekNumber = 1;
        workYear = isoYear + 1;
      }
    }
  } else {
    // Monday to Thursday + Sunday - thuộc work week hiện tại
    workWeekNumber = isoWeekNumber;
    workYear = isoYear;
  }

  return { weekNumber: workWeekNumber, year: workYear };
}

/**
 * Get first Friday of the year
 */
function getFirstFridayOfYear(year: number): Date {
  const firstDay = new Date(year, 0, 1); // January 1st
  const firstFriday = new Date(firstDay.getTime());
  
  // Find first Friday
  while (firstFriday.getDay() !== 5) {
    firstFriday.setDate(firstFriday.getDate() + 1);
  }
  
  return firstFriday;
}

/**
 * Get work week range (Friday to Thursday - 6-day work week, excluding Sunday)
 * Work week N bao gồm:
 * - T6, T7 của ISO week (N-1) 
 * - T2, T3, T4, T5 của ISO week N
 */
export function getWorkWeekRange(weekNumber: number, year: number): {
  startDate: Date;
  endDate: Date;
  workDays: Date[];
  resultDays: Date[]; // Mon-Thu for result calculation
  displayInfo: {
    weekTitle: string;
    dateRange: string;
    workDaysText: string;
    resultDaysText: string;
  };
} {
  // Step 1: Tìm thứ 2 đầu tiên của năm (ISO week 1)
  const jan4 = new Date(year, 0, 4); // Ngày 4 tháng 1 luôn thuộc tuần 1
  const jan4DayOfWeek = (jan4.getDay() + 6) % 7; // Chuyển Sunday=0 thành Monday=0
  const firstMondayOfYear = new Date(jan4.getTime());
  firstMondayOfYear.setDate(jan4.getDate() - jan4DayOfWeek); // Lùi về thứ 2 của tuần 1
  
  // Step 2: Tính thứ 2 của ISO week N
  const mondayOfWeekN = new Date(firstMondayOfYear.getTime());
  mondayOfWeekN.setDate(firstMondayOfYear.getDate() + (weekNumber - 1) * 7);
  
  // Step 3: Tính các ngày làm việc cho work week N
  const workDays: Date[] = [];
  
  // T6 của tuần ISO (N-1) = T6 trước thứ 2 của tuần N
  const friday = new Date(mondayOfWeekN.getTime());
  friday.setDate(mondayOfWeekN.getDate() - 3); // Thứ 2 - 3 = Thứ 6 tuần trước
  workDays.push(friday);
  
  // T7 của tuần ISO (N-1) = T7 trước thứ 2 của tuần N
  const saturday = new Date(mondayOfWeekN.getTime());
  saturday.setDate(mondayOfWeekN.getDate() - 2); // Thứ 2 - 2 = Thứ 7 tuần trước
  workDays.push(saturday);
  
  // T2, T3, T4, T5 của tuần ISO N
  for (let i = 0; i < 4; i++) {
    const day = new Date(mondayOfWeekN.getTime());
    day.setDate(mondayOfWeekN.getDate() + i); // Thứ 2, 3, 4, 5
    workDays.push(day);
  }
  
  // Result calculation days: Monday to Thursday only (4 ngày chính của tuần)
  const resultDays = workDays.slice(2); // Skip Friday and Saturday
  
  const startDate = friday; // Work week bắt đầu từ T6
  const endDate = workDays[5]; // Work week kết thúc ở T5 (index 5)
  
  // Display information
  const displayInfo = {
    weekTitle: `Tuần ${weekNumber}/${year}`,
    dateRange: `${dateFnsFormat(startDate, 'dd/MM', { locale: vi })} - ${dateFnsFormat(endDate, 'dd/MM/yyyy', { locale: vi })}`,
    workDaysText: 'Làm việc: T6, T7, T2, T3, T4, T5',
    resultDaysText: 'Báo cáo: T2, T3, T4, T5'
  };
  
  console.log('🔍 Frontend getWorkWeekRange - Work week details:', {
    workWeek: `${weekNumber}/${year}`,
    startDate: dateFnsFormat(startDate, 'dd/MM/yyyy (E)', { locale: vi }),
    endDate: dateFnsFormat(endDate, 'dd/MM/yyyy (E)', { locale: vi }),
    workDays: workDays.map(d => dateFnsFormat(d, 'dd/MM (E)', { locale: vi })),
    resultDays: resultDays.map(d => dateFnsFormat(d, 'dd/MM (E)', { locale: vi }))
  });
  
  return {
    startDate,
    endDate,
    workDays,
    resultDays,
    displayInfo
  };
}

/**
 * Check if current time is in reporting period (Monday to Thursday)
 */
export function isInReportingPeriod(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Monday (1) to Thursday (4) is reporting period
  return dayOfWeek >= 1 && dayOfWeek <= 4;
}

/**
 * Format work week for display with date range
 */
export function formatWorkWeek(
  weekNumber: number, 
  year: number, 
  formatType: 'short' | 'long' | 'range' | 'full' = 'short'
): string {
  switch (formatType) {
    case 'short':
      return `Tuần ${weekNumber}/${year}`;
    case 'long':
      return `Tuần làm việc ${weekNumber} năm ${year}`;
    case 'range': {
      const { startDate, endDate } = getWorkWeekRange(weekNumber, year);
      return `${dateFnsFormat(startDate, 'dd/MM', { locale: vi })} - ${dateFnsFormat(endDate, 'dd/MM/yyyy', { locale: vi })}`;
    }
    case 'full': {
      const { displayInfo } = getWorkWeekRange(weekNumber, year);
      return `${displayInfo.weekTitle} (${displayInfo.dateRange})`;
    }
    default:
      return `Tuần ${weekNumber}/${year}`;
  }
}

/**
 * Get list of available weeks for selection
 */
export function getAvailableWeeks(currentWeek: number, currentYear: number): Array<{
  weekNumber: number;
  year: number;
  label: string;
  isValid: boolean;
}> {
  const weeks = [];
  
  // Previous week
  let prevWeek = currentWeek - 1;
  let prevYear = currentYear;
  if (prevWeek <= 0) {
    const weeksInPreviousYear = getWeek(new Date(currentYear - 1, 11, 31), { 
      weekStartsOn: 1, 
      firstWeekContainsDate: 4 
    });
    prevWeek = weeksInPreviousYear;
    prevYear = currentYear - 1;
  }
  
  weeks.push({
    weekNumber: prevWeek,
    year: prevYear,
    label: formatWorkWeek(prevWeek, prevYear, 'range'),
    isValid: true
  });
  
  // Current week
  weeks.push({
    weekNumber: currentWeek,
    year: currentYear,
    label: formatWorkWeek(currentWeek, currentYear, 'range'),
    isValid: true
  });
  
  // Next week
  let nextWeek = currentWeek + 1;
  let nextYear = currentYear;
  const weeksInCurrentYear = getWeek(new Date(currentYear, 11, 31), { 
    weekStartsOn: 1, 
    firstWeekContainsDate: 4 
  });
  
  if (nextWeek > weeksInCurrentYear) {
    nextWeek = 1;
    nextYear = currentYear + 1;
  }
  
  weeks.push({
    weekNumber: nextWeek,
    year: nextYear,
    label: formatWorkWeek(nextWeek, nextYear, 'range'),
    isValid: true
  });
  
  return weeks;
}

export interface WeekValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Check if a week is valid for report creation
 * Logic: Allow creation for current week, previous week, and next week
 */
export function isValidWeekForCreation(
  weekNumber: number,
  year: number
): WeekValidationResult {
  const current = getCurrentWeek();
  
  // Current week
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true };
  }
  
  // Previous week
  if (isPreviousWeek(weekNumber, year, current.weekNumber, current.year)) {
    return { isValid: true };
  }
  
  // Next week
  if (isNextWeek(weekNumber, year, current.weekNumber, current.year)) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể tạo báo cáo cho tuần trước, tuần hiện tại và tuần tiếp theo' 
  };
}

/**
 * Check if a week is valid for report editing
 * Logic: Allow editing for current week, previous week, and next week
 */
export function isValidWeekForEdit(
  weekNumber: number,
  year: number
): WeekValidationResult {
  return isValidWeekForCreation(weekNumber, year);
}

/**
 * Check if a week is valid for report deletion
 * Logic: Allow deletion for current week and next week only
 */
export function isValidWeekForDeletion(
  weekNumber: number,
  year: number
): WeekValidationResult {
  const current = getCurrentWeek();
  
  // Current week
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true };
  }
  
  // Next week
  if (isNextWeek(weekNumber, year, current.weekNumber, current.year)) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể xóa báo cáo của tuần hiện tại và tuần tiếp theo' 
  };
}

/**
 * Helper: Check if target week is previous week
 */
function isPreviousWeek(
  weekNumber: number,
  year: number,
  currentWeek: number,
  currentYear: number,
): boolean {
  if (year === currentYear) {
    return weekNumber === currentWeek - 1;
  }
  
  // Handle year transition (current week 1, target week 52/53 of previous year)
  if (year === currentYear - 1 && currentWeek === 1) {
    return weekNumber >= 52;
  }
  
  return false;
}

/**
 * Helper: Check if target week is next week
 */
function isNextWeek(
  weekNumber: number,
  year: number,
  currentWeek: number,
  currentYear: number,
): boolean {
  if (year === currentYear) {
    return weekNumber === currentWeek + 1;
  }
  
  // Handle year transition (current week 52/53, target week 1 of next year)
  if (year === currentYear + 1 && currentWeek >= 52) {
    return weekNumber === 1;
  }
  
  return false;
}
