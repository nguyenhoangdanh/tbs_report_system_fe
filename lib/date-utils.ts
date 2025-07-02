export function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const timeDiff = now.getTime() - yearStart.getTime()
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const weekNumber = Math.ceil((dayDiff + yearStart.getDay() + 1) / 7)
  
  return {
    weekNumber: Math.min(weekNumber, 53), // Ensure max 53 weeks
    year: now.getFullYear()
  }
}

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

// Updated validation to allow creation for previous week
export function isValidWeekForCreation(weekNumber: number, year: number): { isValid: boolean; reason?: string } {
  const current = getCurrentWeek()
  const previous = getPreviousWeek()
  const next = getNextWeek()
  
  // Allow creation for previous week, current week, and next week
  if (weekNumber === previous.weekNumber && year === previous.year) {
    return { isValid: true }
  }
  
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true }
  }
  
  if (weekNumber === next.weekNumber && year === next.year) {
    return { isValid: true }
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể tạo báo cáo cho tuần trước, tuần hiện tại hoặc tuần tiếp theo' 
  }
}

// Updated validation to allow editing for more weeks
export function isValidWeekForEdit(weekNumber: number, year: number): { isValid: boolean; reason?: string } {
  const current = getCurrentWeek()
  const previous = getPreviousWeek()
  const next = getNextWeek()
  
  // Allow editing for previous week, current week, and next week
  if (weekNumber === previous.weekNumber && year === previous.year) {
    return { isValid: true }
  }
  
  if (weekNumber === current.weekNumber && year === current.year) {
    return { isValid: true }
  }
  
  if (weekNumber === next.weekNumber && year === next.year) {
    return { isValid: true }
  }
  
  return { 
    isValid: false, 
    reason: 'Chỉ có thể chỉnh sửa báo cáo của tuần trước, tuần hiện tại và tuần tiếp theo' 
  }
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
