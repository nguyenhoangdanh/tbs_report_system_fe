'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Mobile view - wrap to multiple lines */}
        <ol className="flex sm:hidden items-center flex-wrap gap-x-1 gap-y-1 text-xs text-muted-foreground leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-1 min-w-0">
              {idx > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground truncate max-w-[120px]">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
        
        {/* Desktop view */}
        <ol className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center space-x-2">
              {idx > 0 && <ChevronRight className="w-4 h-4" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors flex items-center truncate">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground truncate">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
