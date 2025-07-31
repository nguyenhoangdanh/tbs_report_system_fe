"use client"

import { memo, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Filter, Calendar, TrendingUp } from "lucide-react"
import { getCurrentWeek } from "@/utils/week-utils"

interface AdminOverviewHeaderProps {
  filterDisplayText: string
  filters: {
    period: 'week' | 'month' | 'year'
    weekNumber?: number
    month?: number
    year: number
    periodWeeks?: number
  }
  onFiltersChange: (filters: any) => void
  onRefresh: () => void
}

export const AdminOverviewHeader = memo(({ 
  filterDisplayText, 
  filters, 
  onFiltersChange, 
  onRefresh 
}: AdminOverviewHeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const currentWeek = getCurrentWeek()
  const currentYear = new Date().getFullYear()

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      onRefresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }, [onRefresh])

  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    
    // Reset dependent filters
    if (key === 'period') {
      if (value === 'week') {
        newFilters.weekNumber = currentWeek.weekNumber
        delete newFilters.month
      } else if (value === 'month') {
        newFilters.month = new Date().getMonth() + 1
        delete newFilters.weekNumber
      } else {
        delete newFilters.weekNumber
        delete newFilters.month
      }
    }
    
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange, currentWeek])

  // Generate options
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)
//   const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))
  const weekOptions = Array.from({ length: 53 }, (_, i) => ({ value: i + 1, label: `Tuần ${i + 1}` }))

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-green border-green-500/20 shadow-green-glow/30">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-gradient shadow-green-glow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-gradient">
                  Quản lý người dùng
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng quan báo cáo và hiệu suất làm việc
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="glass-green border-green-500/30 hidden sm:flex">
                <Calendar className="w-3 h-3 mr-1" />
                {filterDisplayText}
              </Badge>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-green-500/10 glass-green border-green-500/30"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-muted/30 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Bộ lọc:</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Period selector */}
              {/* <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Thời gian:</span>
                <Select
                  value={filters.period}
                  onValueChange={(value) => handleFilterChange('period', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Tuần</SelectItem>
                    <SelectItem value="month">Tháng</SelectItem>
                    <SelectItem value="year">Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* Week selector */}
              {filters.period === 'week' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Tuần:</span>
                  <Select
                    value={filters.weekNumber?.toString()}
                    onValueChange={(value) => handleFilterChange('weekNumber', parseInt(value))}
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

              {/* Month selector */}
              {/* {filters.period === 'month' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Tháng:</span>
                  <Select
                    value={filters.month?.toString()}
                    onValueChange={(value) => handleFilterChange('month', parseInt(value))}
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
              )} */}

              {/* Year selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Năm:</span>
                <Select
                  value={filters.year.toString()}
                  onValueChange={(value) => handleFilterChange('year', parseInt(value))}
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

            {/* Mobile filter display */}
            <div className="sm:hidden">
              <Badge variant="outline" className="glass-green border-green-500/30">
                <Calendar className="w-3 h-3 mr-1" />
                {filterDisplayText}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

AdminOverviewHeader.displayName = "AdminOverviewHeader"
