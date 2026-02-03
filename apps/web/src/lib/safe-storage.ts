/**
 * Safe localStorage utilities with error handling
 * Prevents crashes from malformed JSON or storage quota issues
 * All keys are namespaced with STORAGE_PREFIX to avoid conflicts
 */

// Storage namespace prefix - change version when data format changes
const STORAGE_PREFIX = 'sweatbuddy_v1_'

/**
 * Get the namespaced key
 */
export function getNamespacedKey(key: string): string {
  // If key already has prefix, don't add it again
  if (key.startsWith(STORAGE_PREFIX) || key.startsWith('sweatbuddies_')) {
    return key
  }
  return `${STORAGE_PREFIX}${key}`
}

/**
 * Safely get and parse JSON from localStorage
 * Returns defaultValue if parsing fails or key doesn't exist
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const namespacedKey = getNamespacedKey(key)
    const item = localStorage.getItem(namespacedKey)
    if (item === null) {
      // Try legacy key without prefix for backwards compatibility
      const legacyItem = localStorage.getItem(key)
      if (legacyItem !== null) {
        // Migrate to new key
        try {
          const parsed = JSON.parse(legacyItem) as T
          localStorage.setItem(namespacedKey, legacyItem)
          localStorage.removeItem(key)
          return parsed
        } catch {
          return defaultValue
        }
      }
      return defaultValue
    }
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

  const namespacedKey = getNamespacedKey(key)

  try {
    localStorage.setItem(namespacedKey, JSON.stringify(value))
    return true
  } catch (error) {
    // If quota exceeded, try to clear old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        // Clear less important data first
        localStorage.removeItem(`${STORAGE_PREFIX}session_cache`)
        localStorage.setItem(namespacedKey, JSON.stringify(value))
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

  const namespacedKey = getNamespacedKey(key)

  try {
    localStorage.removeItem(namespacedKey)
    // Also try to remove legacy key
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
