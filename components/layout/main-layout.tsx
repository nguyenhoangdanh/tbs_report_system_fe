"use client"

import type React from "react"

import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"
import { useThemeBackground } from "@/hooks/use-theme-background"
import { motion } from "framer-motion"
import { BreadcrumbItem, Breadcrumbs } from "./breadcrumbs"
import { ModernAnimatedBackground } from "./modern-animated-background"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: BreadcrumbItem[]
  enableBackgroundAnimation?: boolean
  backgroundVariant?: "default" | "login" | "hero"
  backgroundIntensity?: "subtle" | "normal" | "vibrant"
}

export function MainLayout({
  children,
  title,
  subtitle,
  showBreadcrumb,
  breadcrumbItems = [],
  enableBackgroundAnimation = true,
  backgroundVariant = "default",
  backgroundIntensity = "subtle",
}: MainLayoutProps) {
  const { enableAnimation, particleCount, canAnimate, performanceMode } = useThemeBackground()

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Enhanced Modern Animated Background */}
      {enableBackgroundAnimation && canAnimate && (
        <div className="fixed inset-0 z-0">
          <ModernAnimatedBackground
            enableAnimation={enableAnimation}
            particleCount={particleCount}
            variant={backgroundVariant}
            performanceMode={performanceMode}
            intensity={backgroundIntensity}
          />
        </div>
      )}

      {/* Header */}
      <AppHeader title={title} subtitle={subtitle} />

      {/* Breadcrumbs */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Breadcrumbs items={breadcrumbItems} />
        </motion.div>
      )}

      {/* Main content */}
      <motion.main
        className="flex-1 container mx-auto px-0 sm:px-2 md:px-4 lg:px-6 py-2 sm:py-4 md:py-6 lg:py-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <div className="relative z-50">
        <AppFooter />
      </div>
    </div>
  )
}
