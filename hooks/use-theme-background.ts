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
    particleCount: 20, // Increased for better visual impact
    reducedMotion: false,
    performanceMode: false,
    intensity: "normal",
  })

  // Enhanced performance detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const isLowPerformance = () => {
      const connection = (navigator as any).connection
      const deviceMemory = (navigator as any).deviceMemory
      const hardwareConcurrency = navigator.hardwareConcurrency || 4

      return (
        (deviceMemory && deviceMemory < 4) ||
        (connection && (connection.effectiveType === "2g" || connection.effectiveType === "3g")) ||
        hardwareConcurrency < 4 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      )
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
      enableAnimation: !mediaQuery.matches && prev.enableAnimation,
      performanceMode,
      particleCount: performanceMode ? 10 : currentTheme === "dark" ? 20 : 16,
      intensity: performanceMode ? "subtle" : "normal",
    }))

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [currentTheme])

  const toggleAnimation = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      enableAnimation: !prev.enableAnimation && !prev.reducedMotion,
    }))
  }, [])

  const updateParticleCount = useCallback((count: number) => {
    setSettings((prev) => ({
      ...prev,
      particleCount: Math.max(5, Math.min(prev.performanceMode ? 15 : 30, count)),
    }))
  }, [])

  const updateIntensity = useCallback((intensity: "subtle" | "normal" | "vibrant") => {
    setSettings((prev) => ({
      ...prev,
      intensity: prev.performanceMode && intensity === "vibrant" ? "normal" : intensity,
    }))
  }, [])

  return {
    ...settings,
    theme: currentTheme,
    toggleAnimation,
    updateParticleCount,
    updateIntensity,
    canAnimate: !settings.reducedMotion,
  }
}
