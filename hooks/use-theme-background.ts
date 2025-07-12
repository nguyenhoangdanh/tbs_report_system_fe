import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'

interface BackgroundSettings {
  enableAnimation: boolean
  particleCount: number
  reducedMotion: boolean
}

export const useThemeBackground = () => {
  const { theme, resolvedTheme } = useTheme()
  const currentTheme = resolvedTheme || theme || 'dark'
  
  const [settings, setSettings] = useState<BackgroundSettings>({
    enableAnimation: true,
    particleCount: 25,
    reducedMotion: false
  })

  // Detect user's motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: e.matches,
        enableAnimation: !e.matches && prev.enableAnimation
      }))
    }

    setSettings(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches,
      enableAnimation: !mediaQuery.matches && prev.enableAnimation
    }))

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Auto adjust particle count based on theme
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      particleCount: currentTheme === 'dark' ? 25 : 20 // Fewer particles in light mode
    }))
  }, [currentTheme])

  const toggleAnimation = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enableAnimation: !prev.enableAnimation && !prev.reducedMotion
    }))
  }, [])

  const updateParticleCount = useCallback((count: number) => {
    setSettings(prev => ({
      ...prev,
      particleCount: Math.max(5, Math.min(50, count))
    }))
  }, [])

  return {
    ...settings,
    theme: currentTheme,
    toggleAnimation,
    updateParticleCount,
    canAnimate: !settings.reducedMotion
  }
}
