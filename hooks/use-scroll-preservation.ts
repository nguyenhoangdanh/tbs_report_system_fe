"use client"

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import useUIStateStore from '@/store/ui-state-store'

interface UseScrollPreservationOptions {
  key: string
  enabled?: boolean
  debounceMs?: number
  restoreDelay?: number
}

export function useScrollPreservation({
  key,
  enabled = true,
  debounceMs = 150,
  restoreDelay = 100
}: UseScrollPreservationOptions) {
  const pathname = usePathname()
  const { saveScrollPosition, getScrollPosition } = useUIStateStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRestoringRef = useRef(false)
  const hasRestoredRef = useRef(false)

  // ✅ Create unique key with pathname
  const scrollKey = `${pathname}-${key}`

  // ✅ Save scroll position with debouncing
  const handleScroll = useCallback(() => {
    if (!enabled || isRestoringRef.current) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce scroll saving
    saveTimeoutRef.current = setTimeout(() => {
      const scrollY = window.scrollY
      saveScrollPosition(scrollKey, scrollY, pathname)
    }, debounceMs)
  }, [enabled, scrollKey, saveScrollPosition, pathname, debounceMs])

  // ✅ Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || hasRestoredRef.current) return

    const savedPosition = getScrollPosition(scrollKey)
    
    if (savedPosition !== null && savedPosition > 0) {
      
      isRestoringRef.current = true
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'auto' // Instant scroll for better UX
        })
        
        // Reset restoring flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false
          hasRestoredRef.current = true
        }, 100)
      })
    }
  }, [enabled, scrollKey, getScrollPosition])

  // ✅ Save scroll position before component unmounts or re-renders
  const saveCurrentPosition = useCallback(() => {
    if (!enabled) return
    
    const scrollY = window.scrollY
    if (scrollY > 0) {
      saveScrollPosition(scrollKey, scrollY, pathname)
    }
  }, [enabled, scrollKey, saveScrollPosition, pathname])

  // ✅ Force scroll to top
  const scrollToTop = useCallback(() => {
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    // Clear saved position since we're resetting
    saveScrollPosition(scrollKey, 0, pathname)
  }, [scrollKey, saveScrollPosition, pathname])

  // ✅ Reset scroll position (clear saved position and scroll to top)
  const resetScrollPosition = useCallback(() => {
    
    // Clear from store
    const state = useUIStateStore.getState()
    const newPositions = { ...state.scrollPositions }
    delete newPositions[scrollKey]
    useUIStateStore.setState({ scrollPositions: newPositions })
    
    // Scroll to top
    scrollToTop()
  }, [scrollKey, scrollToTop])

  // ✅ Setup scroll listener
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [handleScroll, enabled])

  // ✅ Restore scroll position on mount/key change
  useEffect(() => {
    if (!enabled) return

    // Reset restore flag when key changes
    hasRestoredRef.current = false

    // Restore with a small delay to ensure DOM is ready
    const restoreTimeout = setTimeout(() => {
      restoreScrollPosition()
    }, restoreDelay)

    return () => {
      clearTimeout(restoreTimeout)
    }
  }, [scrollKey, enabled, restoreScrollPosition, restoreDelay])

  // ✅ Save position before page unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      saveCurrentPosition()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [saveCurrentPosition, enabled])

  return {
    saveCurrentPosition,
    restoreScrollPosition,
    scrollToTop,
    resetScrollPosition
  }
}

// ✅ Hook specifically for evaluation changes
export function useEvaluationScrollPreservation(tableId?: string) {
  const key = tableId ? `evaluation-${tableId}` : 'evaluation-global'
  
  return useScrollPreservation({
    key,
    enabled: true,
    debounceMs: 100, // Faster debounce for evaluations
    restoreDelay: 150 // Slightly longer delay for DOM updates
  })
}

// ✅ Hook specifically for page navigation with reset
export function usePageNavigationScroll() {
  const { clearOldScrollPositions } = useUIStateStore()
  
  const resetAllScrollPositions = useCallback(() => {
    
    // Clear all scroll positions
    useUIStateStore.setState({ scrollPositions: {} })
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])
  
  return {
    resetAllScrollPositions
  }
}
