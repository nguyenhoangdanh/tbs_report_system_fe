"use client"

import { memo, useMemo, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import { getCurrentWeek } from "@/utils/week-utils"
import type { HierarchyFilters } from "@/hooks/use-hierarchy-filters"

interface FiltersComponentProps {
  filters: HierarchyFilters
  onFiltersChange: (filters: HierarchyFilters) => void
}

export const FiltersComponent = memo(({ filters, onFiltersChange }: FiltersComponentProps) => {
  const currentWeek = getCurrentWeek()
  const currentYear = new Date().getFullYear()

  const yearOptions = useMemo(() => [currentYear - 2, currentYear - 1, currentYear, currentYear + 1], [currentYear])

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`,
      })),
    [],
  )

  const weekOptions = useMemo(
    () =>
      Array.from({ length: 53 }, (_, i) => ({
        value: i + 1,
        label: `Tuần ${i + 1}`,
      })),
    [],
  )

  const handleFilterChange = useCallback(
    (key: keyof HierarchyFilters, value: any) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      })
    },
    [filters, onFiltersChange],
  )

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Bộ lọc:</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
        {filters.period === "week" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Tuần:</span>
            <Select
              value={filters.weekNumber?.toString()}
              onValueChange={(value) => handleFilterChange("weekNumber", Number.parseInt(value))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-[400px] overflow-y-auto">
                {weekOptions.map((week) => (
                  <SelectItem key={week.value} value={week.value.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filters.period === "month" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Tháng:</span>
            <Select
              value={filters.month?.toString()}
              onValueChange={(value) => handleFilterChange("month", Number.parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Năm:</span>
          <Select
            value={filters.year.toString()}
            onValueChange={(value) => handleFilterChange("year", Number.parseInt(value))}
          >
            <SelectTrigger className="w-24">
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
      </div>
    </div>
  )
})

FiltersComponent.displayName = "FiltersComponent"
