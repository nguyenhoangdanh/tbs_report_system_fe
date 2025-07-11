"use client"

import { memo, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number | string
  className?: string
}

export const ResponsiveGrid = memo(({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className = '' 
}: ResponsiveGridProps) => {
  const gridClasses = cn(
    'grid',
    // Default columns
    cols.default && `grid-cols-${cols.default}`,
    // Responsive columns
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    // Gap
    typeof gap === 'number' ? `gap-${gap}` : gap,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
})

ResponsiveGrid.displayName = 'ResponsiveGrid'
