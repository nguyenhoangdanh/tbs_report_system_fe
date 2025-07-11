import { memo, useMemo, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter } from 'lucide-react'
import { getCurrentWeek } from '@/utils/week-utils'

export type FilterPeriod = 'week' | 'month' | 'year'

export interface HierarchyFilters {
  period: FilterPeriod
  weekNumber?: number
  month?: number
  year: number
  periodWeeks?: number
}

interface HierarchyFiltersProps {
  filters: HierarchyFilters
  onFiltersChange: (filters: HierarchyFilters) => void
}

export const HierarchyFiltersComponent = memo(({ 
  filters, 
  onFiltersChange 
}: HierarchyFiltersProps) => {
  const currentWeek = getCurrentWeek()
  const currentYear = new Date().getFullYear()
  
  const yearOptions = useMemo(() => [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1
  ], [currentYear])

  const monthOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `Tháng ${i + 1}`
    }))
  , [])

  const weekOptions = useMemo(() => 
    Array.from({ length: 53 }, (_, i) => ({
      value: i + 1,
      label: `Tuần ${i + 1}`
    }))
  , [])

  const handlePeriodChange = useCallback((period: FilterPeriod) => {
    const newFilters: HierarchyFilters = {
      ...filters,
      period,
    }

    if (period === 'week') {
      newFilters.weekNumber = currentWeek.weekNumber
      newFilters.year = currentWeek.year
      delete newFilters.month
    } else if (period === 'month') {
      newFilters.month = new Date().getMonth() + 1
      newFilters.year = currentYear
      delete newFilters.weekNumber
    } else if (period === 'year') {
      newFilters.year = currentYear
      delete newFilters.weekNumber
      delete newFilters.month
    }

    onFiltersChange(newFilters)
  }, [filters, onFiltersChange, currentWeek, currentYear])

  const handleFilterChange = useCallback((key: keyof HierarchyFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }, [filters, onFiltersChange])

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium hidden sm:inline">Bộ lọc:</span>
      </div>
      
      {/* Period Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Theo:</span>
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Tuần</SelectItem>
            <SelectItem value="month">Tháng</SelectItem>
            <SelectItem value="year">Năm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Week Selection */}
      {filters.period === 'week' && (
        <div className="flex items-center gap-2">
          <Select 
            value={filters.weekNumber?.toString()} 
            onValueChange={(value) => handleFilterChange('weekNumber', parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map(week => (
                <SelectItem key={week.value} value={week.value.toString()}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Month Selection */}
      {filters.period === 'month' && (
        <div className="flex items-center gap-2">
          <Select 
            value={filters.month?.toString()} 
            onValueChange={(value) => handleFilterChange('month', parseInt(value))}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Năm:</span>
        <Select 
          value={filters.year.toString()} 
          onValueChange={(value) => handleFilterChange('year', parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period Weeks for Analysis */}
      {filters.period === 'week' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Phân tích:</span>
          <Select 
            value={filters.periodWeeks?.toString() || '4'} 
            onValueChange={(value) => handleFilterChange('periodWeeks', parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 tuần</SelectItem>
              <SelectItem value="4">4 tuần</SelectItem>
              <SelectItem value="8">8 tuần</SelectItem>
              <SelectItem value="12">12 tuần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
})

HierarchyFiltersComponent.displayName = 'HierarchyFiltersComponent'
