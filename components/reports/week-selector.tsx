'use client'

import { memo, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { 
  getCurrentWeek, 
  getWeekDateRange, 
  formatDateRange, 
  getNextWeek,
  getPreviousWeek
} from '@/lib/date-utils'
import { useRouter } from 'next/navigation'

interface WeekSelectorProps {
  weekNumber: number
  year: number
  onWeekChange: (weekNumber: number, year: number) => void
  disabled?: boolean
}

const WeekSelector = memo(function WeekSelector({
  weekNumber,
  year,
  onWeekChange,
  disabled = false
}: WeekSelectorProps) {
  const router = useRouter()

  // Memoize week calculations
  const { currentWeek, nextWeek, previousWeek, validWeekNumber, validYear } = useMemo(() => {
    const current = getCurrentWeek()
    const next = getNextWeek()
    const previous = getPreviousWeek()
    
    return {
      currentWeek: current,
      nextWeek: next,
      previousWeek: previous,
      validWeekNumber: Number(weekNumber) || current.weekNumber,
      validYear: Number(year) || current.year
    }
  }, [weekNumber, year])

  // Memoize date range calculation
  const { dateRange, weekTypeInfo } = useMemo(() => {
    const { start, end } = getWeekDateRange(validWeekNumber, validYear)
    const range = formatDateRange(start, end)
    
    const isCurrentWeek = validWeekNumber === currentWeek.weekNumber && validYear === currentWeek.year
    const isNextWeek = validWeekNumber === nextWeek.weekNumber && validYear === nextWeek.year
    const isPreviousWeek = validWeekNumber === previousWeek.weekNumber && validYear === previousWeek.year
    
    let typeInfo = null
    if (isPreviousWeek) {
      typeInfo = { label: '⏮️ Tuần trước', color: 'text-orange-600' }
    } else if (isCurrentWeek) {
      typeInfo = { label: '📍 Tuần hiện tại', color: 'text-green-600' }
    } else if (isNextWeek) {
      typeInfo = { label: '⏭️ Tuần tiếp theo', color: 'text-blue-600' }
    }
    
    return { dateRange: range, weekTypeInfo: typeInfo }
  }, [validWeekNumber, validYear, currentWeek, nextWeek, previousWeek])

  // Memoize navigation handlers
  const handleCurrentWeek = useCallback(() => {
    if (!disabled) {
      onWeekChange(currentWeek.weekNumber, currentWeek.year)
    }
  }, [disabled, onWeekChange, currentWeek])

  const handleStepPrevious = useCallback(() => {
    if (disabled) return
    
    if (validWeekNumber > 1) {
      onWeekChange(validWeekNumber - 1, validYear)
    } else if (validYear > 2020) {
      onWeekChange(52, validYear - 1)
    }
  }, [disabled, validWeekNumber, validYear, onWeekChange])

  const handleStepNext = useCallback(() => {
    if (disabled) return
    
    if (validWeekNumber < 52) {
      onWeekChange(validWeekNumber + 1, validYear)
    } else if (validYear < 2030) {
      onWeekChange(1, validYear + 1)
    }
  }, [disabled, validWeekNumber, validYear, onWeekChange])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Memoize navigation buttons
  const navigationButtons = useMemo(() => {
    const buttons = []
    
    // Previous button
    if (validWeekNumber > 1 || validYear > 2020) {
      buttons.push({
        key: 'prev',
        label: 'Trước',
        icon: ChevronLeft,
        variant: 'outline' as const,
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-950 dark:border-gray-600 dark:text-gray-300',
        onClick: handleStepPrevious
      })
    }

    // Current week button
    if (!weekTypeInfo || weekTypeInfo.label !== '📍 Tuần hiện tại') {
      buttons.push({
        key: 'current',
        label: 'Hiện tại',
        icon: Calendar,
        variant: 'default' as const,
        className: 'bg-green-600 hover:bg-green-700 text-white',
        onClick: handleCurrentWeek
      })
    }

    // Next button
    if (validWeekNumber < 52 || validYear < 2030) {
      buttons.push({
        key: 'next',
        label: 'Sau',
        icon: ChevronRight,
        variant: 'outline' as const,
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-950 dark:border-gray-600 dark:text-gray-300',
        onClick: handleStepNext
      })
    }

    return buttons
  }, [validWeekNumber, validYear, weekTypeInfo, handleStepPrevious, handleCurrentWeek, handleStepNext])

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
      {/* Back Button */}
      <div className="text-left">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
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
        {weekTypeInfo && (
          <div className="mt-1">
            <span className={`text-xs font-medium ${weekTypeInfo.color}`}>
              {weekTypeInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {navigationButtons.length > 0 && (
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {navigationButtons.map((button) => (
            <Button
              key={button.key}
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

WeekSelector.displayName = 'WeekSelector'

export { WeekSelector }
