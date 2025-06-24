export function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date()
  const year = now.getFullYear()
  
  // Get the first day of the year
  const start = new Date(year, 0, 1)
  
  // Get the number of days since the beginning of the year
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay) + 1
  
  // Calculate week number using ISO 8601 standard
  const startDay = start.getDay() || 7 // Sunday = 7, Monday = 1
  const weekNumber = Math.ceil((dayOfYear + startDay - 1) / 7)
  
  // Ensure week number is within valid range
  let validWeekNumber = weekNumber
  let validYear = year
  
  if (validWeekNumber > 52) {
    validWeekNumber = Math.min(validWeekNumber, 52)
  }
  
  if (validWeekNumber < 1) {
    validWeekNumber = 1
  }
  
  return {
    weekNumber: validWeekNumber,
    year: validYear
  }
}

export function getNextWeek(): { weekNumber: number; year: number } {
  const current = getCurrentWeek()
  
  if (current.weekNumber >= 52) {
    return {
      weekNumber: 1,
      year: current.year + 1
    }
  }
  
  return {
    weekNumber: current.weekNumber + 1,
    year: current.year
  }
}

export function getPreviousWeek(): { weekNumber: number; year: number } {
  const current = getCurrentWeek()
  
  if (current.weekNumber <= 1) {
    return {
      weekNumber: 52,
      year: current.year - 1
    }
  }
  
  return {
    weekNumber: current.weekNumber - 1,
    year: current.year
  }
}

export function getWeekDateRange(weekNumber: number, year: number): { start: Date; end: Date } {
  // Validate inputs - allow full range for viewing historical data
  const validWeekNumber = Math.max(1, Math.min(53, Number(weekNumber)))
  const validYear = Math.max(2020, Math.min(2030, Number(year)))
  
  // Calculate the first day of the year
  const jan1 = new Date(validYear, 0, 1)
  
  // Find the first Monday of the year (or use January 1st if it's already Monday)
  const firstMonday = new Date(jan1)
  const dayOfWeek = jan1.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek !== 1) { // If January 1st is not Monday
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
    firstMonday.setDate(jan1.getDate() + daysToMonday)
  }
  
  // Calculate the start of the requested week
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (validWeekNumber - 1) * 7)
  
  // Calculate the end of the week (Sunday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return { start: weekStart, end: weekEnd }
}

export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit' 
  }
  
  return `${start.toLocaleDateString('vi-VN', options)} - ${end.toLocaleDateString('vi-VN', options)}`
}

export function getWeekDays(weekNumber: number, year: number): Array<{ date: Date; dayName: string; dayKey: string }> {
  const { start } = getWeekDateRange(weekNumber, year)
  const days = []
  
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    
    days.push({
      date,
      dayName: dayNames[i],
      dayKey: dayKeys[i]
    })
  }
  
  return days
}

export function getAllowedWeeksForDisplay(): Array<{ weekNumber: number; year: number; type: 'past' | 'current' | 'next' }> {
  const current = getCurrentWeek()
  const next = getNextWeek()
  const previous = getPreviousWeek()
  
  // Get weeks in a reasonable range (previous week to next week)
  const weeks = []
  
  // Add previous week
  weeks.push({ ...previous, type: 'past' as const })
  
  // Add current week
  weeks.push({ ...current, type: 'current' as const })
  
  // Add next week
  weeks.push({ ...next, type: 'next' as const })
  
  return weeks
}

export function getWeeksInRange(startWeek: number, startYear: number, endWeek: number, endYear: number): Array<{ weekNumber: number; year: number }> {
  const weeks = []
  let currentWeek = startWeek
  let currentYear = startYear
  
  while (currentYear < endYear || (currentYear === endYear && currentWeek <= endWeek)) {
    weeks.push({ weekNumber: currentWeek, year: currentYear })
    
    currentWeek++
    if (currentWeek > 52) {
      currentWeek = 1
      currentYear++
    }
  }
  
  return weeks
}

export function getWeeksInCurrentAndAdjacentYears(): Array<{ weekNumber: number; year: number; label: string }> {
  const current = getCurrentWeek()
  const weeks = []
  
  // Get weeks from current year and adjacent years (1 month buffer)
  const startYear = current.year - 1
  const endYear = current.year + 1
  
  for (let year = startYear; year <= endYear; year++) {
    const maxWeek = year === current.year ? 53 : 52 // Current year might have 53 weeks
    
    for (let week = 1; week <= maxWeek; week++) {
      const isInRange = isWeekInDisplayRange(week, year, current.weekNumber, current.year)
      
      if (isInRange) {
        weeks.push({
          weekNumber: week,
          year: year,
          label: `Tuần ${week}/${year}`
        })
      }
    }
  }
  
  return weeks
}

function isWeekInDisplayRange(weekNumber: number, year: number, currentWeek: number, currentYear: number): boolean {
  // Only show weeks within a reasonable range (about 2 months before and after current week)
  const DISPLAY_RANGE_WEEKS = 8
  
  // Calculate week difference
  const weekDiff = calculateWeekDifference(weekNumber, year, currentWeek, currentYear)
  
  return Math.abs(weekDiff) <= DISPLAY_RANGE_WEEKS
}

function calculateWeekDifference(week1: number, year1: number, week2: number, year2: number): number {
  // Convert to absolute week numbers for easier comparison
  const absWeek1 = year1 * 52 + week1
  const absWeek2 = year2 * 52 + week2
  
  return absWeek1 - absWeek2
}

export function isValidWeekForCreation(weekNumber: number, year: number): { 
  isValid: boolean; 
  reason?: string;
  type?: 'current' | 'next' | 'past' | 'future'
} {
  const current = getCurrentWeek()
  const next = getNextWeek()
  
  // Check if it's current week
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true, type: 'current' }
  }
  
  // Check if it's next week
  if (weekNumber === next.weekNumber && year === next.year) {
    return { isValid: true, type: 'next' }
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể tạo báo cáo cho tuần hiện tại hoặc tuần tiếp theo',
    type: 'future'
  }
}

export function isValidWeekForEdit(weekNumber: number, year: number): { 
  isValid: boolean; 
  reason?: string;
  type?: 'current' | 'next' | 'past' | 'future'
} {
  const current = getCurrentWeek()
  const next = getNextWeek()
  const previous = getPreviousWeek()
  
  // Check if it's current week
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true, type: 'current' }
  }
  
  // Check if it's next week
  if (weekNumber === next.weekNumber && year === next.year) {
    return { isValid: true, type: 'next' }
  }
  
  // Check if it's previous week
  if (weekNumber === previous.weekNumber && year === previous.year) {
    return { isValid: true, type: 'past' }
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể chỉnh sửa báo cáo của tuần hiện tại, tuần trước và tuần sau',
    type: 'future'
  }
}

export function validateWeekYear(weekNumber: number, year: number): { isValid: boolean; error?: string } {
  const numWeek = Number(weekNumber)
  const numYear = Number(year)
  
  if (isNaN(numWeek) || numWeek < 1 || numWeek > 53) {
    return { isValid: false, error: 'Số tuần phải từ 1 đến 53' }
  }
  
  if (isNaN(numYear)) {
    return { isValid: false, error: 'Năm không hợp lệ' }
  }
  
  // Check if week is valid for creation
  const creationValidation = isValidWeekForCreation(numWeek, numYear)
  if (!creationValidation.isValid) {
    return { isValid: false, error: creationValidation.reason }
  }
  
  return { isValid: true }
}

export function getFirstWeekOfYear(year: number): { weekNumber: number; year: number } {
  return {
    weekNumber: 1,
    year: Math.max(2020, Math.min(2030, year))
  }
}

export function getLastWeekOfYear(year: number): { weekNumber: number; year: number } {
  // Most years have 52 weeks, some have 53
  const dec31 = new Date(year, 11, 31)
  const jan1 = new Date(year, 0, 1)
  const jan1DayOfWeek = jan1.getDay()
  
  // If January 1st is a Friday, Saturday, or Sunday, the year likely has 53 weeks
  // But for simplicity, we'll use 52 as the standard
  return {
    weekNumber: 52,
    year: Math.max(2020, Math.min(2030, year))
  }
}

export function isValidWeekForViewing(weekNumber: number, year: number): boolean {
  const numWeek = Number(weekNumber)
  const numYear = Number(year)
  
  // Allow viewing any week from 2020-2030
  if (isNaN(numWeek) || numWeek < 1 || numWeek > 53) {
    return false
  }
  
  if (isNaN(numYear) || numYear < 2020 || numYear > 2030) {
    return false
  }
  
  return true
}

// Enhanced navigation functions
export function canNavigateToPreviousWeek(weekNumber: number, year: number): boolean {
  if (weekNumber > 1) return true
  if (year > 2020) return true
  return false
}

export function canNavigateToNextWeek(weekNumber: number, year: number): boolean {
  if (weekNumber < 52) return true
  if (year < 2030) return true
  return false
}

export function getNavigationPreviousWeek(weekNumber: number, year: number): { weekNumber: number; year: number } {
  if (weekNumber > 1) {
    return { weekNumber: weekNumber - 1, year }
  }
  if (year > 2020) {
    return { weekNumber: 52, year: year - 1 }
  }
  return { weekNumber, year } // Can't go further back
}

export function getNavigationNextWeek(weekNumber: number, year: number): { weekNumber: number; year: number } {
  if (weekNumber < 52) {
    return { weekNumber: weekNumber + 1, year }
  }
  if (year < 2030) {
    return { weekNumber: 1, year: year + 1 }
  }
  return { weekNumber, year } // Can't go further forward
}
