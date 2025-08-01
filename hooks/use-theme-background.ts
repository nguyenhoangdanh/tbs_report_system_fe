"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"

interface BackgroundSettings {
  enableAnimation: boolean
  particleCount: number
  reducedMotion: boolean
  performanceMode: boolean
  intensity: "subtle" | "normal" | "vibrant"
}

export const useThemeBackground = () => {
  const { theme, resolvedTheme } = useTheme()
  const currentTheme = resolvedTheme || theme || "dark"

  const [settings, setSettings] = useState<BackgroundSettings>({
    enableAnimation: true,
    particleCount: 8, // Reduced from 20 for better mobile performance
    reducedMotion: false,
    performanceMode: false,
    intensity: "subtle", // Default to subtle for better performance
  })

  // Enhanced performance detection with stricter thresholds
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const isLowPerformance = () => {
      const connection = (navigator as any).connection
      const deviceMemory = (navigator as any).deviceMemory
      const hardwareConcurrency = navigator.hardwareConcurrency || 4

      // More aggressive performance detection
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSlowConnection = connection && (
        connection.effectiveType === "2g" || 
        connection.effectiveType === "3g" || 
        connection.effectiveType === "slow-2g"
      )
      const isLowMemory = deviceMemory && deviceMemory < 6 // Increased threshold
      const isLowCPU = hardwareConcurrency < 6 // Increased threshold

      return isMobile || isSlowConnection || isLowMemory || isLowCPU
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({
        ...prev,
        reducedMotion: e.matches,
        enableAnimation: !e.matches && prev.enableAnimation,
      }))
    }

    const performanceMode = isLowPerformance()

    setSettings((prev) => ({
      ...prev,
      reducedMotion: mediaQuery.matches,
      enableAnimation: !mediaQuery.matches && !performanceMode, // Disable on low perf devices
      performanceMode,
      particleCount: performanceMode ? 3 : (currentTheme === "dark" ? 8 : 5), // Heavily reduced
      intensity: performanceMode ? "subtle" : "normal", // Never use vibrant on low perf
    }))

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [currentTheme])

  const toggleAnimation = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      enableAnimation: !prev.enableAnimation && !prev.reducedMotion && !prev.performanceMode,
    }))
  }, [])

  const updateParticleCount = useCallback((count: number) => {
    setSettings((prev) => ({
      ...prev,
      particleCount: Math.max(2, Math.min(prev.performanceMode ? 5 : 12, count)), // Reduced limits
    }))
  }, [])

  const updateIntensity = useCallback((intensity: "subtle" | "normal" | "vibrant") => {
    setSettings((prev) => ({
      ...prev,
      intensity: prev.performanceMode ? "subtle" : (intensity === "vibrant" ? "normal" : intensity), // Prevent vibrant on low perf
    }))
  }, [])

  return {
    ...settings,
    theme: currentTheme,
    toggleAnimation,
    updateParticleCount,
    updateIntensity,
    canAnimate: !settings.reducedMotion && !settings.performanceMode,
  }
}
