'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, SkipBack, SkipForward } from 'lucide-react'
import { 
  getCurrentWeek, 
  getWeekDateRange, 
  formatDateRange, 
  getNextWeek,
  getPreviousWeek,
  getFirstWeekOfYear,
  getLastWeekOfYear
} from '@/lib/date-utils'
import { useRouter } from 'next/navigation'

interface WeekSelectorProps {
  weekNumber: number
  year: number
  onWeekChange: (weekNumber: number, year: number) => void
  disabled?: boolean
}

export const WeekSelector = memo(function WeekSelector({
  weekNumber,
  year,
  onWeekChange,
  disabled = false
}: WeekSelectorProps) {
  const currentWeek = getCurrentWeek()
  const nextWeek = getNextWeek()
  const previousWeek = getPreviousWeek();
  const router = useRouter();
  
  // Ensure weekNumber and year are valid numbers
  const validWeekNumber = Number(weekNumber) || currentWeek.weekNumber
  const validYear = Number(year) || currentWeek.year
  
  const { start, end } = getWeekDateRange(validWeekNumber, validYear)
  const dateRange = formatDateRange(start, end)

  const isCurrentWeek = validWeekNumber === currentWeek.weekNumber && validYear === currentWeek.year
  const isNextWeek = validWeekNumber === nextWeek.weekNumber && validYear === nextWeek.year
  const isPreviousWeek = validWeekNumber === previousWeek.weekNumber && validYear === previousWeek.year

  // Quick navigation functions
  const handleCurrentWeek = () => {
    if (!disabled) {
      onWeekChange(currentWeek.weekNumber, currentWeek.year)
    }
  }

  const handleFirstWeekOfYear = () => {
    if (!disabled) {
      const firstWeek = getFirstWeekOfYear(validYear)
      onWeekChange(firstWeek.weekNumber, firstWeek.year)
    }
  }

  const handleLastWeekOfYear = () => {
    if (!disabled) {
      const lastWeek = getLastWeekOfYear(validYear)
      onWeekChange(lastWeek.weekNumber, lastWeek.year)
    }
  }

  // Navigation to previous week (step by step)
  const handleStepPrevious = () => {
    if (disabled) return
    
    if (validWeekNumber > 1) {
      onWeekChange(validWeekNumber - 1, validYear)
    } else if (validYear > 2020) {
      onWeekChange(52, validYear - 1)
    }
  }

  // Navigation to next week (step by step)
  const handleStepNext = () => {
    if (disabled) return
    
    if (validWeekNumber < 52) {
      onWeekChange(validWeekNumber + 1, validYear)
    } else if (validYear < 2030) {
      onWeekChange(1, validYear + 1)
    }
  }

  // Always show full navigation - let form handle editing restrictions
  const navigationButtons = [
    // Jump to first week of year
    // ...(validWeekNumber > 1 ? [{
    //   label: 'Đầu năm',
    //   icon: SkipBack,
    //   variant: 'outline' as const,
    //   className: 'border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950',
    //   onClick: handleFirstWeekOfYear
    // }] : []),
    
    // Step previous button
    ...(validWeekNumber > 1 || validYear > 2020 ? [{
      label: 'Trước',
      icon: ChevronLeft,
      variant: 'outline' as const,
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-950 dark:border-gray-600 dark:text-gray-300',
      onClick: handleStepPrevious
    }] : []),

    // Current week button
    ...(!isCurrentWeek ? [{
      label: 'Hiện tại',
      icon: Calendar,
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700 text-white',
      onClick: handleCurrentWeek
    }] : []),

    // Step next button
    ...(validWeekNumber < 52 || validYear < 2030 ? [{
      label: 'Sau',
      icon: ChevronRight,
      variant: 'outline' as const,
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-950 dark:border-gray-600 dark:text-gray-300',
      onClick: handleStepNext
    }] : []),

    // Jump to last week of year
    // ...(validWeekNumber < 52 ? [{
    //   label: 'Cuối năm',
    //   icon: SkipForward,
    //   variant: 'outline' as const,
    //   className: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950',
    //   onClick: handleLastWeekOfYear
    // }] : [])
  ]

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      {/* Back to Reports Button */}
      <div className="text-left">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Trở về
        </Button>
      </div>
      {/* Week Info Display */}
      <div className="text-center">
        <div className="font-semibold text-lg">
          Tuần {validWeekNumber} - {validYear}
        </div>
        <div className="text-sm text-muted-foreground">
          {dateRange}
        </div>
        {/* Week type indicator */}
        <div className="mt-1">
          {isPreviousWeek && (
            <span className="text-xs text-orange-600 font-medium">
              ⏮️ Tuần trước
            </span>
          )}
          {isCurrentWeek && (
            <span className="text-xs text-green-600 font-medium">
              📍 Tuần hiện tại
            </span>
          )}
          {isNextWeek && (
            <span className="text-xs text-blue-600 font-medium">
              ⏭️ Tuần tiếp theo
            </span>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      {navigationButtons.length > 0 && (
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {navigationButtons.map((button, index) => (
            <Button
              key={index}
              variant={button.variant}
              size="sm"
              onClick={button.onClick}
              disabled={disabled}
              className={`flex items-center gap-2 text-sm ${button.className || ''}`}
            >
              <button.icon className="w-3 h-3" />
              {button.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
})
