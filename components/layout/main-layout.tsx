'use client'

import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
}

export function MainLayout({ 
  children, 
  title,
  subtitle,
  showBreadcrumb,
  breadcrumbItems = []
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader 
        title={title}
        subtitle={subtitle}
      />
      {/* {showBreadcrumb && breadcrumbItems.length > 0 && (
        <Breadcrumbs items={breadcrumbItems} />
      )} */}
      <main className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
