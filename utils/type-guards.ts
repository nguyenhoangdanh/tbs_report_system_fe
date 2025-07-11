import React from 'react'

/**
 * Type guards to safely handle unknown types in React components
 */

export function isValidReactNode(value: unknown): value is React.ReactNode {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value) ||
    (Array.isArray(value) && value.every(isValidReactNode))
  )
}

/**
 * Type guard utilities for safe property access
 */

export function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return fallback
}

export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

export function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value
  }
  return fallback
}

export function safeObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  return fallback
}

export function safeBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  if (typeof value === 'number') {
    return value > 0
  }
  return fallback
}

export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return obj && typeof obj === 'object' && key in obj
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Safe date conversion with fallback
 */
export function safeDate(value: unknown, fallback: Date = new Date()): Date {
  if (isValidDate(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (isValidDate(parsed)) {
      return parsed
    }
  }
  return fallback
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value is a valid string (not empty after trim)
 */
export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Check if value is a valid number (not NaN)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Safe percentage calculation
 */
export function safePercentage(numerator: unknown, denominator: unknown, fallback = 0): number {
  const num = safeNumber(numerator, 0)
  const den = safeNumber(denominator, 1)
  
  if (den === 0) return fallback
  
  const result = (num / den) * 100
  return Math.round(result * 100) / 100 // Round to 2 decimal places
}

/**
 * Render a React node safely, with an optional fallback
 */
export function safeRender(value: unknown, fallback: React.ReactNode = null): React.ReactNode {
  return isValidReactNode(value) ? value : fallback
}
