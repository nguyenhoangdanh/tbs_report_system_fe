'use client'

import { memo, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Calendar } from 'lucide-react'
import { 
  getCurrentWeek, 
  formatWorkWeek,
  getAvailableWeeks
} from '@/utils/week-utils'
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

  // Memoize week calculations with availability info
  const { currentWeek, availableWeeks, weekTypeInfo, dateRange } = useMemo(() => {
    const current = getCurrentWeek()
    const availableWeeksData = getAvailableWeeks(current.weekNumber, current.year)
    
    const selectedWeekInfo = availableWeeksData.find(w => 
      w.weekNumber === weekNumber && w.year === year
    )
    
    let typeInfo = null
    if (selectedWeekInfo) {
      if (selectedWeekInfo.isValid) {
        typeInfo = { label: '📍 Tuần hiện tại', color: 'text-green-600' }
      }
    }
    
    // Calculate date range for current selected week
    const weekRangeInfo = formatWorkWeek(weekNumber, year, 'range')
    
    return {
      currentWeek: current,
      availableWeeks: availableWeeksData,
      weekTypeInfo: typeInfo,
      dateRange: weekRangeInfo
    }
  }, [weekNumber, year])

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Quick navigation handlers
  const handleQuickNavigation = useCallback((targetWeek: { weekNumber: number; year: number }) => {
    if (!disabled) {
      onWeekChange(targetWeek.weekNumber, targetWeek.year)
    }
  }, [disabled, onWeekChange])

  // Previous/Next week navigation
  const handleStepNavigation = useCallback((direction: 'prev' | 'next') => {
    if (disabled) return
    
    let newWeekNumber = weekNumber
    let newYear = year
    
    if (direction === 'prev') {
      newWeekNumber = weekNumber - 1
      if (newWeekNumber < 1) {
        newWeekNumber = 52
        newYear = year - 1
      }
    } else {
      newWeekNumber = weekNumber + 1
      if (newWeekNumber > 52) {
        newWeekNumber = 1
        newYear = year + 1
      }
    }
    
    // Check if the target week is in available weeks
    const isValidTarget = availableWeeks.some(w => w.weekNumber === newWeekNumber && w.year === newYear)
    
    if (isValidTarget) {
      onWeekChange(newWeekNumber, newYear)
    }
  }, [disabled, weekNumber, year, availableWeeks, onWeekChange])

  // Enhanced navigation buttons
  const enhancedNavigationButtons = useMemo(() => {
    const buttons = []
    
    // Previous week step button
    let prevWeekNumber = weekNumber - 1
    let prevYear = year
    if (prevWeekNumber < 1) {
      prevWeekNumber = 52
      prevYear = year - 1
    }
    const canStepPrevious = availableWeeks.some(w => w.weekNumber === prevWeekNumber && w.year === prevYear)
    
    if (canStepPrevious) {
      buttons.push({
        key: 'step-prev',
        label: '← Trước',
        variant: 'outline' as const,
        className: 'text-orange-600 border-orange-200 hover:bg-orange-50',
        onClick: () => handleStepNavigation('prev')
      })
    }
    
    // Quick jump buttons for other available weeks
    availableWeeks.forEach((week) => {
      const isSelected = week.weekNumber === weekNumber && week.year === year
      
      if (!isSelected) {
        buttons.push({
          key: `quick-${week.weekNumber}-${week.year}`,
          label: `Tuần ${week.weekNumber}`,
          variant: week.isValid ? 'default' : 'outline',
          className: week.isValid 
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'text-blue-600 border-blue-200 hover:bg-blue-50',
          onClick: () => handleQuickNavigation(week)
        })
      }
    })
    
    // Next week step button
    let nextWeekNumber = weekNumber + 1
    let nextYear = year
    if (nextWeekNumber > 52) {
      nextWeekNumber = 1
      nextYear = year + 1
    }
    const canStepNext = availableWeeks.some(w => w.weekNumber === nextWeekNumber && w.year === nextYear)
    
    if (canStepNext) {
      buttons.push({
        key: 'step-next',
        label: 'Sau →',
        variant: 'outline' as const,
        className: 'text-blue-600 border-blue-200 hover:bg-blue-50',
        onClick: () => handleStepNavigation('next')
      })
    }

    return buttons
  }, [weekNumber, year, availableWeeks, handleStepNavigation, handleQuickNavigation])

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
          <ChevronLeft className="w-4 h-4 mr-1" />
          Trở về
        </Button>
      </div>

      {/* Week Info Display */}
      <div className="text-center">
        <div className="font-semibold text-lg">
          Tuần {weekNumber} - {year}
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

      {/* Enhanced Navigation Buttons */}
      {enhancedNavigationButtons.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-center text-muted-foreground">
            Tuần có thể chọn:
          </div>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {enhancedNavigationButtons.map((button) => (
              <Button
                key={button.key}
                variant={button.variant}
                size="sm"
                onClick={button.onClick}
                disabled={disabled}
                className={`text-xs ${button.className || ''}`}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Available Weeks Visual Indicator */}
      <div className="text-center">
        <div className="flex justify-center gap-1 flex-wrap">
          {availableWeeks.map((week) => (
            <button
              key={`indicator-${week.weekNumber}-${week.year}`}
              className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                week.weekNumber === weekNumber && week.year === year
                  ? 'bg-primary text-primary-foreground'
                  : week.isValid
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              onClick={() => handleQuickNavigation(week)}
              disabled={disabled}
            >
              {week.weekNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Navigation</span>
        </div>
        <div>Sử dụng các nút để di chuyển giữa các tuần khả dụng</div>
      </div>
    </div>
  )
})

WeekSelector.displayName = 'WeekSelector'

export { WeekSelector }
