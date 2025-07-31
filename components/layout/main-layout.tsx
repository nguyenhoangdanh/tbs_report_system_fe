"use client"

import type React from "react"

import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"
import { useThemeBackground } from "@/hooks/use-theme-background"
import { motion, useReducedMotion } from "framer-motion"
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
  const shouldReduceMotion = useReducedMotion()

  // Reduce particle count based on performance and motion preferences
  const optimizedParticleCount = shouldReduceMotion ? 0 : Math.min(particleCount, 6)

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Enhanced Modern Animated Background - with performance optimization */}
      {enableBackgroundAnimation && canAnimate && !shouldReduceMotion && (
        <div className="fixed inset-0 z-0">
          <ModernAnimatedBackground
            enableAnimation={enableAnimation}
            particleCount={optimizedParticleCount}
            variant={backgroundVariant}
            performanceMode={performanceMode}
            intensity={backgroundIntensity}
          />
        </div>
      )}

      {/* Enhanced static background with better light theme contrast */}
      {(shouldReduceMotion || !enableBackgroundAnimation) && (
        <div className="fixed inset-0 z-0">
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 bg-grid-green opacity-60 dark:opacity-30"
          />
          {/* Gradient overlay with stronger contrast for light theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 to-emerald-50/30 dark:from-green-950/5 dark:to-emerald-950/3" />
        </div>
      )}

      {/* Header */}
      <AppHeader />  
        
      {/* Breadcrumbs with reduced animation */}
      {showBreadcrumb && breadcrumbItems.length > 0 && (
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.1, duration: shouldReduceMotion ? 0 : 0.3 }}
        >
          <Breadcrumbs items={breadcrumbItems} />
        </motion.div>
      )}

      {/* Main content with optimized animation */}
      <motion.main
        className="flex-1 container mx-auto px-0 sm:px-2 md:px-4 lg:px-6 py-2 sm:py-4 md:py-6 lg:py-8 relative z-10"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : 0.4 }}
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
