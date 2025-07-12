import { useState, useCallback, useMemo } from 'react'
import { getCurrentWeek } from '@/utils/week-utils'

export type FilterPeriod = 'week' | 'month' | 'year'

export interface HierarchyFilters {
  period: FilterPeriod
  weekNumber?: number
  month?: number
  year: number
  periodWeeks?: number
}

export const useHierarchyFilters = () => {
  const currentWeekInfo = useMemo(() => getCurrentWeek(), [])
  
  const [filters, setFilters] = useState<HierarchyFilters>({
    period: 'week',
    weekNumber: currentWeekInfo.weekNumber,
    year: currentWeekInfo.year,
    periodWeeks: 4
  })

  const apiFilters = useMemo(() => {
    const baseFilters: any = {
      year: filters.year,
    }

    if (filters.period === 'week' && filters.weekNumber) {
      baseFilters.weekNumber = filters.weekNumber
    } else if (filters.period === 'month' && filters.month) {
      baseFilters.month = filters.month
    }

    return baseFilters
  }, [filters])

  const filterDisplayText = useMemo(() => {
    const { period, weekNumber, month, year } = filters

    if (period === 'week' && weekNumber) {
      return `Tuần ${weekNumber}/${year}`
    } else if (period === 'month' && month) {
      return `Tháng ${month}/${year}`
    } else {
      return `Năm ${year}`
    }
  }, [filters])

  const handleFiltersChange = useCallback((newFilters: HierarchyFilters) => {
    setFilters(newFilters)
  }, [])

  return {
    filters,
    apiFilters,
    filterDisplayText,
    handleFiltersChange
  }
}
