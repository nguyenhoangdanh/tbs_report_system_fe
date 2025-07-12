"use client"

import { memo } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, RefreshCw, BarChart3 } from 'lucide-react'
import { FiltersComponent } from './hierarchy-filters'
import { HierarchyFilters } from '@/hooks/use-hierarchy-filters'

interface HierarchyHeaderProps {
  filterDisplayText: string
  filters: HierarchyFilters
  onFiltersChange: (filters: HierarchyFilters) => void
  onRefresh: () => void
}

export const HierarchyHeader = memo(({
  filterDisplayText,
  filters,
  onFiltersChange,
  onRefresh
}: HierarchyHeaderProps) => {
  return (
    <Card className="backdrop-blur-sm bg-card/90 border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Báo cáo Hierarchy
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2 bg-background/50">
                <Calendar className="w-3 h-3" />
                {filterDisplayText}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-2 bg-background/50 hover:bg-background/80"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Làm mới</span>
              </Button>
            </div>
          </div>

          <FiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </CardHeader>
    </Card>
  )
})

HierarchyHeader.displayName = 'HierarchyHeader'
