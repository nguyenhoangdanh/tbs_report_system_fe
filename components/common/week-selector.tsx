import React from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCurrentWeek } from '@/utils/week-utils'

interface WeekSelectorProps {
  selectedWeek: number
  selectedYear: number
  onWeekChange: (weekNumber: number, year: number) => void
  className?: string
}

export function WeekSelector({ 
  selectedWeek, 
  selectedYear, 
  onWeekChange, 
  className 
}: WeekSelectorProps) {
  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeek()

  const handlePreviousWeek = () => {
    let newWeek = selectedWeek - 1
    let newYear = selectedYear

    if (newWeek < 1) {
      newWeek = 52
      newYear = selectedYear - 1
    }

    onWeekChange(newWeek, newYear)
  }

  const handleNextWeek = () => {
    let newWeek = selectedWeek + 1
    let newYear = selectedYear

    if (newWeek > 52) {
      newWeek = 1
      newYear = selectedYear + 1
    }

    onWeekChange(newWeek, newYear)
  }

  const handleWeekSelect = (value: string) => {
    const weekNumber = parseInt(value)
    onWeekChange(weekNumber, selectedYear)
  }

  const handleYearSelect = (value: string) => {
    const year = parseInt(value)
    onWeekChange(selectedWeek, year)
  }

  // Generate year options (current year ± 2)
  const yearOptions = []
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push(i)
  }

  // Generate week options
  const weekOptions = []
  for (let i = 1; i <= 52; i++) {
    weekOptions.push(i)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousWeek}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        
        <Select value={selectedWeek.toString()} onValueChange={handleWeekSelect}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((week) => (
              <SelectItem key={week} value={week.toString()}>
                {week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">/</span>

        <Select value={selectedYear.toString()} onValueChange={handleYearSelect}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextWeek}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
