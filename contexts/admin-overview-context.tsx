"use client"

import React, { createContext, useContext, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/auth-provider'
import { useAdminOverviewStore } from '@/store/admin-overview-store'
import { createCacheUtils } from '@/lib/cache-utils'
import { toast } from 'react-toast-kit'
import type { ManagerReportsEmployee } from '@/types/hierarchy'
import type { Task, TaskEvaluation } from '@/types'

interface AdminOverviewContextType {
  // Cache utilities
  invalidateUserData: (userId: string) => Promise<void>
  clearAllCaches: () => Promise<void>
  forceRefetchManagerReports: () => Promise<void>
  
  // User change detection
  handleUserChange: (newUserId: string) => Promise<void>
  
  // Error handling
  handleError: (error: any, message: string) => void
  
  // User isolation
  ensureUserIsolation: () => Promise<void>

  // UI actions
  handleOpenEval: (employee: ManagerReportsEmployee, task: Task) => void
  handleViewEmployee: (employee: ManagerReportsEmployee) => void
}

const AdminOverviewContext = createContext<AdminOverviewContextType | undefined>(undefined)

export function AdminOverviewProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { lastUserId, setLastUserId, setIsRefetching, resetAllStates, setEvaluationModal, setEmployeeModal } = useAdminOverviewStore()
  
  // CRITICAL: Refs to prevent infinite loops
  const isHandlingUserChange = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const lastClearTime = useRef<number>(0)
  const isInitialized = useRef(false)
  const hasRunInitialCleanup = useRef(false)
  
  // Memoized cache utilities - STABLE reference
  const cacheUtils = useMemo(() => createCacheUtils(queryClient), [queryClient])
  
  // CRITICAL: Reduce debounce time to allow more frequent updates
  const ensureUserIsolation = useCallback(async () => {
    if (!currentUser?.id) {
      console.log('🔒 No current user, skipping isolation')
      return
    }
    
    const now = Date.now()
    // REDUCED: Shorter debounce time to allow AdminOverview updates
    if (now - lastClearTime.current < 1000) { // Changed from 2000 to 1000
      console.log('🔒 Cache clearing too frequent, skipping (debounced)')
      return
    }
    
    // CRITICAL: Prevent concurrent isolation
    if (isHandlingUserChange.current) {
      console.log('🔒 User change in progress, skipping isolation')
      return
    }
    
    console.log('🔒 CRITICAL: Ensuring user isolation for:', {
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    })
    
    try {
      // STEP 1: Force cancel all ongoing queries
      await queryClient.cancelQueries()
      
      // STEP 2: SELECTIVE clear - don't clear everything for performance
      queryClient.removeQueries({ queryKey: ['hierarchy', 'managerReports'] })
      queryClient.removeQueries({ queryKey: ['hierarchy', 'userDetails'] })
      
      // STEP 3: Clear Zustand store
      resetAllStates()
      
      // STEP 4: Shorter wait time
      await new Promise(resolve => setTimeout(resolve, 100)) // Reduced from 200
      
      // STEP 5: Update tracking
      lastClearTime.current = now
      currentUserIdRef.current = currentUser.id
      setLastUserId(currentUser.id)
      
      console.log('✅ User isolation completed for:', currentUser.id)
    } catch (error) {
      console.error('❌ User isolation failed:', error)
      // Nuclear option: force page reload
      if (typeof window !== 'undefined') {
        console.log('🔥 NUCLEAR: Forcing page reload due to isolation failure')
        window.location.reload()
      }
    }
  }, [currentUser?.id, queryClient, resetAllStates, setLastUserId])
  
  // STABLE cache operations with useCallback
  const invalidateUserData = useCallback(async (userId: string) => {
    if (!currentUser?.id || userId !== currentUser.id) {
      console.warn('🚨 SECURITY: Attempted to invalidate data for different user:', { 
        requestedUserId: userId, 
        currentUserId: currentUser?.id 
      })
      // FORCE ISOLATION if user mismatch detected
      await ensureUserIsolation()
      return
    }
    
    console.log('🧹 Invalidating user data for:', userId)
    await cacheUtils.invalidateUserData(userId)
  }, [cacheUtils, currentUser?.id, ensureUserIsolation])
  
  const clearAllCaches = useCallback(async () => {
    console.log('🧹 AdminOverview: NUCLEAR CLEAR - Clearing ALL caches')
    await queryClient.cancelQueries()
    queryClient.clear()
    resetAllStates()
    await new Promise(resolve => setTimeout(resolve, 100))
  }, [queryClient, resetAllStates])
  
  const forceRefetchManagerReports = useCallback(async () => {
    if (!currentUser?.id) return
    
    console.log('🔄 AdminOverview: Force refetching manager reports for user:', currentUser.id)
    setIsRefetching(true)
    try {
      // CRITICAL: Clear cache first to ensure fresh data
      await ensureUserIsolation()
      // Wait a bit more for cache to clear completely
      await new Promise(resolve => setTimeout(resolve, 300))
      // Force refetch active queries
      await cacheUtils.refetchActiveQueries()
    } catch (error) {
      console.error('❌ AdminOverview: Refetch failed:', error)
      throw error
    } finally {
      setIsRefetching(false)
    }
  }, [cacheUtils, setIsRefetching, currentUser?.id, ensureUserIsolation])
  
  // ENHANCED: User change detection - STABLE function
  const handleUserChange = useCallback(async (newUserId: string) => {
    // Prevent concurrent user change handling
    if (isHandlingUserChange.current) {
      console.log('🚫 User change already in progress, skipping...')
      return
    }
    
    const previousUserId = currentUserIdRef.current || lastUserId
    
    // Check if user actually changed
    if (previousUserId === newUserId) {
      console.log('👤 Same user, no change needed:', newUserId)
      return
    }
    
    console.log('🚨 CRITICAL: User change detected - SECURITY ALERT:', { 
      previousUserId,
      newUserId,
      timestamp: new Date().toISOString()
    })
    
    try {
      isHandlingUserChange.current = true
      
      // STEP 1: Cancel all ongoing queries immediately
      await queryClient.cancelQueries()
      
      // STEP 2: NUCLEAR CACHE CLEAR - Remove ALL data
      console.log('🧹 STEP 2: Nuclear cache clear for user change...')
      queryClient.clear()
      
      // STEP 3: Reset all local states
      resetAllStates()
      
      // STEP 4: Wait longer for complete clearing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // STEP 5: Update tracking variables
      currentUserIdRef.current = newUserId
      setLastUserId(newUserId)
      lastClearTime.current = Date.now()
      
      console.log('✅ User change completed successfully for:', newUserId)
    } catch (error) {
      console.error('❌ CRITICAL: Failed to handle user change:', error)
      
      // NUCLEAR option - force page reload
      console.log('🔥 NUCLEAR: Forcing page reload due to critical user change failure')
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } finally {
      setTimeout(() => {
        isHandlingUserChange.current = false
      }, 1000) // Longer delay to prevent rapid changes
    }
  }, [lastUserId, resetAllStates, queryClient, setLastUserId])
  
  // Error handling - STABLE
  const handleError = useCallback((error: any, message: string) => {
    console.error('❌ AdminOverview error:', error)
    toast.error(error?.message || message)
  }, [])
  
  // CRITICAL: Monitor user changes - FIXED dependencies
  useEffect(() => {
    if (!currentUser?.id) {
      if (currentUserIdRef.current) {
        // User logged out
        console.log('👤 User logged out, clearing all references')
        currentUserIdRef.current = null
        hasRunInitialCleanup.current = false
        isInitialized.current = false
        clearAllCaches()
      }
      return
    }

    const currentUserId = currentUser.id
    const previousUserId = currentUserIdRef.current
    
    // CRITICAL: Only log once to avoid spam
    if (!isInitialized.current) {
      console.log('👤 User effect - FIRST initialization:', {
        currentUserId,
        previousUserId,
        isHandling: isHandlingUserChange.current,
        hasRunInitialCleanup: hasRunInitialCleanup.current
      })
    }
    
    // CRITICAL: First time initialization - ONLY ONCE
    if (!isInitialized.current) {
      isInitialized.current = true
      currentUserIdRef.current = currentUserId
      setLastUserId(currentUserId)
      
      // CRITICAL: Only run initial cleanup ONCE
      if (!hasRunInitialCleanup.current) {
        hasRunInitialCleanup.current = true
        console.log('🔒 Running INITIAL cleanup for:', currentUserId)
        
        // Use setTimeout to avoid blocking the render
        setTimeout(() => {
          if (currentUser?.id === currentUserId && !isHandlingUserChange.current) {
            ensureUserIsolation()
          }
        }, 500) // Longer delay to let everything settle
      }
      return
    }
    
    // CRITICAL: Handle user change - ONLY if actually different
    if (previousUserId && 
        previousUserId !== currentUserId && 
        !isHandlingUserChange.current) {
      console.log('🚨 DETECTED USER MISMATCH - Triggering isolation')
      handleUserChange(currentUserId)
    } else if (!previousUserId && currentUserId !== lastUserId) {
      // Set user for first time after initialization
      console.log('👤 Setting user for first time after init:', currentUserId)
      currentUserIdRef.current = currentUserId
      setLastUserId(currentUserId)
    }
  }, [currentUser?.id]) // ONLY depend on user ID
  
  // CRITICAL: Cleanup effect - separate from user effect
  useEffect(() => {
    return () => {
      console.log('🧹 AdminOverviewProvider unmounting - cleaning up')
      isHandlingUserChange.current = false
      currentUserIdRef.current = null
      isInitialized.current = false
      hasRunInitialCleanup.current = false
    }
  }, [])
  
  // UI action handlers - STABLE functions
  const handleOpenEval = useCallback((employee: ManagerReportsEmployee, task: Task) => {
    const myEval = task.evaluations?.find((ev: TaskEvaluation) => ev.evaluatorId === currentUser?.id) || null
    setEvaluationModal(true, employee, task, myEval)
  }, [currentUser?.id, setEvaluationModal])

  const handleViewEmployee = useCallback((employee: ManagerReportsEmployee) => {
    if (!employee?.user?.id) {
      toast.error("Thông tin nhân viên không hợp lệ")
      return
    }
    setEmployeeModal(true, employee)
  }, [setEmployeeModal])
  
  // STABLE context value with proper memoization
  const contextValue = useMemo(() => ({
    invalidateUserData,
    clearAllCaches,
    forceRefetchManagerReports,
    handleUserChange,
    handleError,
    ensureUserIsolation,
    handleOpenEval,
    handleViewEmployee,
  }), [invalidateUserData, clearAllCaches, forceRefetchManagerReports, handleUserChange, handleError, ensureUserIsolation, handleOpenEval, handleViewEmployee])
  
  return (
    <AdminOverviewContext.Provider value={contextValue}>
      {children}
    </AdminOverviewContext.Provider>
  )
}

export function useAdminOverviewContext() {
  const context = useContext(AdminOverviewContext)
  if (!context) {
    throw new Error('useAdminOverviewContext must be used within AdminOverviewProvider')
  }
  return context
}
