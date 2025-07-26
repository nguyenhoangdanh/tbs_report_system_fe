import { QueryClient } from '@tanstack/react-query'

/**
 * Centralized cache management utilities
 */
export class CacheUtils {
  constructor(private queryClient: QueryClient) {}

  /**
   * Clear all user-related caches when user logs out or changes
   */
  clearUserCaches(userId?: string) {
    if (userId) {
      console.log('🧹 CacheUtils: Clearing caches for user:', userId)
      // Clear specific user caches with more comprehensive patterns
      this.queryClient.removeQueries({ queryKey: ['reports'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
      this.queryClient.removeQueries({ queryKey: ['statistics'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
      this.queryClient.removeQueries({ queryKey: ['evaluations'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
      this.queryClient.removeQueries({ queryKey: ['hierarchy'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
      this.queryClient.removeQueries({ queryKey: ['users'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
      this.queryClient.removeQueries({ queryKey: ['auth'], predicate: (query) => 
        query.queryKey.includes(userId)
      })
    } else {
      console.log('🧹 CacheUtils: Clearing ALL caches')
      // Clear all caches
      this.queryClient.clear()
    }
  }

  /**
   * Force clear all caches - nuclear option
   */
  clearAllCaches() {
    console.log('🧹 CacheUtils: NUCLEAR CLEAR - Clearing ALL caches')
    this.queryClient.clear()
  }

  /**
   * Invalidate user data after changes
   */
  async invalidateUserData(userId: string) {
    const promises = [
      this.queryClient.invalidateQueries({ queryKey: ['reports', 'user', userId] }),
      this.queryClient.invalidateQueries({ queryKey: ['evaluations', 'user', userId] }),
      this.queryClient.invalidateQueries({ queryKey: ['hierarchy', 'myView', userId] }),
      this.queryClient.invalidateQueries({ queryKey: ['hierarchy', 'managerReports', userId] }),
      this.queryClient.invalidateQueries({ queryKey: ['statistics', 'user', userId] }),
      this.queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] }),
    ]
    await Promise.allSettled(promises)
  }

  /**
   * Force refetch active queries
   */
  async refetchActiveQueries() {
    await this.queryClient.refetchQueries({ type: "active" })
  }

  /**
   * Clear organization-related caches
   */
  clearOrganizationCaches() {
    this.queryClient.removeQueries({ queryKey: ['organizations'] })
  }

  /**
   * Clear authentication-related caches
   */
  clearAuthCaches() {
    this.queryClient.removeQueries({ queryKey: ['auth'] })
  }

  /**
   * Set query data directly - ADDED METHOD
   */
  setQueryData<T>(queryKey: readonly unknown[], updater: T | ((old: T | undefined) => T)) {
    this.queryClient.setQueryData(queryKey, updater)
  }

  /**
   * Get query data - ADDED METHOD
   */
  getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
    return this.queryClient.getQueryData<T>(queryKey)
  }

  /**
   * Remove specific queries - ADDED METHOD
   */
  removeQueries(filters: Parameters<QueryClient['removeQueries']>[0]) {
    this.queryClient.removeQueries(filters)
  }

  /**
   * Invalidate specific queries - ADDED METHOD
   */
  async invalidateQueries(filters: Parameters<QueryClient['invalidateQueries']>[0]) {
    await this.queryClient.invalidateQueries(filters)
  }
}

// Cache for createCacheUtils to avoid creating new instances
const cacheUtilsMap = new WeakMap<QueryClient, CacheUtils>()

/**
 * Create cache utils instance with memoization
 */
export function createCacheUtils(queryClient: QueryClient): CacheUtils {
  if (!cacheUtilsMap.has(queryClient)) {
    cacheUtilsMap.set(queryClient, new CacheUtils(queryClient))
  }
  return cacheUtilsMap.get(queryClient)!
}

/**
 * Standalone function for backward compatibility
 */
export function clearUserCaches(queryClient: QueryClient, userId?: string) {
  const cacheUtils = createCacheUtils(queryClient)
  cacheUtils.clearUserCaches(userId)
}
