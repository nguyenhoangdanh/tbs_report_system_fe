"use client"

import { memo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, RefreshCw, BarChart3 } from "lucide-react"
import { FiltersComponent } from "./hierarchy-filters"
import type { HierarchyFilters } from "@/hooks/use-hierarchy-filters"

interface HierarchyHeaderProps {
  filterDisplayText: string
  filters: HierarchyFilters
  onFiltersChange: (filters: HierarchyFilters) => void
  onRefresh: () => void
}

export const HierarchyHeader = memo(
  ({ filterDisplayText, filters, onFiltersChange, onRefresh }: HierarchyHeaderProps) => {
    const shouldReduceMotion = useReducedMotion()

    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -15 }} // Reduced from -20
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { duration: 0.2 }} // Reduced from 0.3
      >
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-lg bg-primary text-primary-foreground"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: 2 }} // Reduced rotation
                    transition={shouldReduceMotion ? {} : { duration: 0.1 }} // Faster transition
                  >
                    <BarChart3 className="w-6 h-6" />
                  </motion.div>
                  Thống kê dữ liệu
                </CardTitle>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {filterDisplayText}
                  </Badge>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }} // Reduced scale
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }} // Reduced scale
                    transition={shouldReduceMotion ? {} : { duration: 0.1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      className="flex items-center gap-2 bg-transparent transition-all duration-150" // Reduced duration
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Làm mới</span>
                    </Button>
                  </motion.div>
                </div>
              </div>

              <FiltersComponent filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    )
  },
)

HierarchyHeader.displayName = "HierarchyHeader"
