/**
 * Safe localStorage utilities with error handling
 * Prevents crashes from malformed JSON or storage quota issues
 */

/**
 * Safely get and parse JSON from localStorage
 * Returns defaultValue if parsing fails or key doesn't exist
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch {
    return defaultValue
  }
}

/**
 * Safely set JSON in localStorage
 * Handles quota exceeded errors gracefully
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    // If quota exceeded, try to clear old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        // Clear less important data first
        localStorage.removeItem('sweatbuddies_session_cache')
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

/**
 * Safely remove item from localStorage
 */
export function safeRemove(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a value is a valid array
 */
export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

/**
 * Ensure a value is an array, returning empty array if not
 */
export function ensureArray<T>(value: unknown): T[] {
  return isValidArray<T>(value) ? value : []
}
