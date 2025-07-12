'use client'

import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { useThemeBackground } from '@/hooks/use-theme-background'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
  enableBackgroundAnimation?: boolean
}

export function MainLayout({ 
  children, 
  title,
  subtitle,
  showBreadcrumb,
  breadcrumbItems = [],
  enableBackgroundAnimation = true
}: MainLayoutProps) {
  const { enableAnimation, particleCount, canAnimate } = useThemeBackground()

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Enhanced Animated Background - Lowest z-index */}
      {enableBackgroundAnimation && canAnimate && (
        <div className="fixed inset-0 z-0">
          <AnimatedBackground
            enableAnimation={enableAnimation}
            particleCount={particleCount}
          />
        </div>
      )}
      
      {/* Header with highest z-index for sticky behavior */}
      <AppHeader 
        title={title}
        subtitle={subtitle}
      />
      
      {/* Breadcrumbs with medium z-index */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <div className="relative z-10">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      )}
      
      {/* Main content with optimized mobile padding */}
      <main className="flex-1 container mx-auto px-0 sm:px-2 md:px-4 lg:px-6 py-2 sm:py-4 md:py-6 lg:py-8 relative z-10">
        {children}
      </main>
      
      {/* Footer with high z-index */}
      <div className="relative z-50">
        <AppFooter />
      </div>
    </div>
  )
}
