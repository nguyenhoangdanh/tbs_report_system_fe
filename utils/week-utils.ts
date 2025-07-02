/**
 * Frontend utility functions for week calculations and report deadlines
 */

export interface WeekInfo {
  weekNumber: number;
  year: number;
}

/**
 * Get current week number and year
 */
export function getCurrentWeek(): WeekInfo {
  const now = new Date();
  const year = now.getFullYear();
  
  // Get first day of year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Calculate days since first day of year
  const daysSinceFirstDay = Math.floor((now.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
  
  // Calculate week number (ISO week date)
  const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
  
  return { weekNumber, year };
}

/**
 * Get the deadline date for a specific week (Saturday 10:00 AM)
 */
export function getWeekDeadline(weekNumber: number, year: number): Date {
  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayWeekday = firstDayOfYear.getDay();
  
  // Calculate the Monday of the first week
  const daysToFirstMonday = firstDayWeekday <= 1 ? 1 - firstDayWeekday : 8 - firstDayWeekday;
  const firstMondayOfYear = new Date(year, 0, 1 + daysToFirstMonday);
  
  // Calculate the Monday of the target week
  const targetWeekMonday = new Date(firstMondayOfYear.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  
  // Calculate Saturday 10:00 AM of the target week
  const targetWeekSaturday = new Date(targetWeekMonday.getTime() + 5 * 24 * 60 * 60 * 1000); // +5 days to get Saturday
  targetWeekSaturday.setHours(10, 0, 0, 0); // Set to 10:00 AM
  
  return targetWeekSaturday;
}

/**
 * Check if a report is overdue for a given week
 */
export function isReportOverdue(weekNumber: number, year: number, currentDate: Date = new Date()): boolean {
  const deadline = getWeekDeadline(weekNumber, year);
  return currentDate > deadline;
}

/**
 * Calculate days overdue for a report with correct deadline logic
 */
export function calculateDaysOverdue(weekNumber: number, year: number, currentDate: Date = new Date()): number {
  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeek();
  
  // If it's a future week, not overdue
  if (year > currentYear || (year === currentYear && weekNumber > currentWeek)) {
    return 0;
  }
  
  const deadline = getWeekDeadline(weekNumber, year);
  
  // If current time is before deadline, not overdue
  if (currentDate <= deadline) {
    return 0;
  }
  
  // Calculate time difference in milliseconds
  const timeDiff = currentDate.getTime() - deadline.getTime();
  
  // Convert to days and round up
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysDiff);
}

/**
 * Get deadline status for a week report
 */
export function getDeadlineStatus(weekNumber: number, year: number, currentDate: Date = new Date()): {
  deadline: Date;
  isOverdue: boolean;
  daysOverdue: number;
  timeUntilDeadline?: number; // in hours, only if not overdue
  statusText: string;
  statusColor: 'green' | 'yellow' | 'red';
} {
  const deadline = getWeekDeadline(weekNumber, year);
  const isOverdue = currentDate > deadline;
  const daysOverdue = isOverdue ? calculateDaysOverdue(weekNumber, year, currentDate) : 0;
  
  let timeUntilDeadline: number | undefined;
  let statusText: string;
  let statusColor: 'green' | 'yellow' | 'red';
  
  if (!isOverdue) {
    const timeDiff = deadline.getTime() - currentDate.getTime();
    timeUntilDeadline = Math.max(0, timeDiff / (1000 * 60 * 60)); // in hours
    
    if (timeUntilDeadline > 24) {
      statusText = `Còn ${Math.ceil(timeUntilDeadline / 24)} ngày`;
      statusColor = 'green';
    } else if (timeUntilDeadline > 2) {
      statusText = `Còn ${Math.ceil(timeUntilDeadline)} giờ`;
      statusColor = 'yellow';
    } else {
      statusText = `Còn ${Math.ceil(timeUntilDeadline)} giờ (Sắp hết hạn!)`;
      statusColor = 'red';
    }
  } else {
    if (daysOverdue === 0) {
      statusText = 'Trễ vài giờ';
    } else if (daysOverdue === 1) {
      statusText = 'Trễ 1 ngày';
    } else {
      statusText = `Trễ ${daysOverdue} ngày`;
    }
    statusColor = 'red';
  }
  
  return {
    deadline,
    isOverdue,
    daysOverdue,
    timeUntilDeadline,
    statusText,
    statusColor,
  };
}

/**
 * Format deadline for display in Vietnamese
 */
export function formatDeadline(weekNumber: number, year: number): string {
  const deadline = getWeekDeadline(weekNumber, year);
  return deadline.toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get week range (Monday to Sunday) for display
 */
export function getWeekDateRange(weekNumber: number, year: number): { start: Date; end: Date } {
  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayWeekday = firstDayOfYear.getDay();
  
  // Calculate the Monday of the first week
  const daysToFirstMonday = firstDayWeekday <= 1 ? 1 - firstDayWeekday : 8 - firstDayWeekday;
  const firstMondayOfYear = new Date(year, 0, 1 + daysToFirstMonday);
  
  // Calculate the Monday of the target week
  const start = new Date(firstMondayOfYear.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  
  // Calculate Sunday of the target week
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  return { start, end };
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
}

/**
 * Check if a week is valid for report creation (current week, previous week, or next week)
 */
export function isValidWeekForCreation(weekNumber: number, year: number): {
  isValid: boolean;
  reason?: string;
  allowedWeeks: Array<{ weekNumber: number; year: number; label: string }>;
} {
  const current = getCurrentWeek();
  
  // Calculate previous week
  let prevWeek = current.weekNumber - 1;
  let prevYear = current.year;
  if (prevWeek < 1) {
    prevWeek = 52;
    prevYear = current.year - 1;
  }
  
  // Calculate next week
  let nextWeek = current.weekNumber + 1;
  let nextYear = current.year;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear = current.year + 1;
  }
  
  const allowedWeeks = [
    { weekNumber: prevWeek, year: prevYear, label: 'Tuần trước' },
    { weekNumber: current.weekNumber, year: current.year, label: 'Tuần hiện tại' },
    { weekNumber: nextWeek, year: nextYear, label: 'Tuần tiếp theo' }
  ];
  
  const isValid = allowedWeeks.some(w => 
    w.weekNumber === weekNumber && w.year === year
  );
  
  let reason = '';
  if (!isValid) {
    reason = `Chỉ có thể tạo báo cáo cho tuần ${prevWeek}/${prevYear} (tuần trước), tuần ${current.weekNumber}/${current.year} (tuần hiện tại), hoặc tuần ${nextWeek}/${nextYear} (tuần tiếp theo)`;
  }
  
  return {
    isValid,
    reason,
    allowedWeeks
  };
}

/**
 * Check if a week is valid for editing (same as creation rules)
 */
export function isValidWeekForEdit(weekNumber: number, year: number): {
  isValid: boolean;
  reason?: string;
} {
  return isValidWeekForCreation(weekNumber, year);
}

/**
 * Get available weeks for report creation
 */
export function getAvailableWeeksForReporting(): Array<{
  weekNumber: number;
  year: number;
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}> {
  const current = getCurrentWeek();
  
  // Calculate previous week
  let prevWeek = current.weekNumber - 1;
  let prevYear = current.year;
  if (prevWeek < 1) {
    prevWeek = 52;
    prevYear = current.year - 1;
  }
  
  // Calculate next week
  let nextWeek = current.weekNumber + 1;
  let nextYear = current.year;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear = current.year + 1;
  }
  
  return [
    {
      weekNumber: prevWeek,
      year: prevYear,
      label: `Tuần ${prevWeek}/${prevYear} (Tuần trước)`,
      isCurrent: false,
      isPast: true,
      isFuture: false
    },
    {
      weekNumber: current.weekNumber,
      year: current.year,
      label: `Tuần ${current.weekNumber}/${current.year} (Tuần hiện tại)`,
      isCurrent: true,
      isPast: false,
      isFuture: false
    },
    {
      weekNumber: nextWeek,
      year: nextYear,
      label: `Tuần ${nextWeek}/${nextYear} (Tuần tiếp theo)`,
      isCurrent: false,
      isPast: false,
      isFuture: true
    }
  ];
}

/**
 * Get week range (Monday to Sunday) for display - alias for getWeekDateRange
 */
export function getWeekRange(weekNumber: number, year: number): { start: Date; end: Date; display: string } {
  const { start, end } = getWeekDateRange(weekNumber, year);
  const display = formatDateRange(start, end);
  
  return { start, end, display };
}

/**
 * Check if a week is valid for deletion (current week and next week only)
 */
export function isValidWeekForDeletion(weekNumber: number, year: number): {
  isValid: boolean;
  reason?: string;
} {
  const current = getCurrentWeek();
  
  // Calculate next week
  let nextWeek = current.weekNumber + 1;
  let nextYear = current.year;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear = current.year + 1;
  }
  
  const isCurrentWeek = weekNumber === current.weekNumber && year === current.year;
  const isNextWeek = weekNumber === nextWeek && year === nextYear;
  
  const isValid = isCurrentWeek || isNextWeek;
  
  let reason = '';
  if (!isValid) {
    reason = `Chỉ có thể xóa báo cáo của tuần ${current.weekNumber}/${current.year} (tuần hiện tại) hoặc tuần ${nextWeek}/${nextYear} (tuần tiếp theo)`;
  }
  
  return {
    isValid,
    reason
  };
}
