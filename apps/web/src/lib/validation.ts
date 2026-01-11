/**
 * Form validation utilities
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates phone number (basic format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  // Allow digits, spaces, dashes, parentheses, and + for international
  const phoneRegex = /^[\d\s\-\(\)\+]+$/
  const digitsOnly = phone.replace(/\D/g, '')
  return phoneRegex.test(phone) && digitsOnly.length >= 8 && digitsOnly.length <= 15
}

/**
 * Validates Instagram handle
 */
export function isValidInstagramHandle(handle: string): boolean {
  if (!handle || typeof handle !== 'string') return false
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle
  // Instagram usernames: 1-30 chars, alphanumeric + underscores + periods
  const handleRegex = /^[a-zA-Z0-9_.]{1,30}$/
  return handleRegex.test(cleanHandle)
}

/**
 * Validates required string field
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates minimum length
 */
export function hasMinLength(value: string, min: number): boolean {
  return typeof value === 'string' && value.trim().length >= min
}

/**
 * Validates maximum length
 */
export function hasMaxLength(value: string, max: number): boolean {
  return typeof value === 'string' && value.trim().length <= max
}

/**
 * Validates price (positive number)
 */
export function isValidPrice(price: number | string): boolean {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return !isNaN(num) && num >= 0
}

/**
 * Validates date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d instanceof Date && !isNaN(d.getTime()) && d > new Date()
}

/**
 * Sanitizes string input (removes XSS vectors)
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Form validation result type
 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validates multiple fields at once
 */
export function validateFields(
  fields: Record<string, { value: unknown; rules: Array<(val: unknown) => string | null> }>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [fieldName, { value, rules }] of Object.entries(fields)) {
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors[fieldName] = error
        break // Only show first error per field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Common validation rules
export const rules = {
  required: (fieldName: string) => (val: unknown) =>
    isNotEmpty(val as string) ? null : `${fieldName} is required`,

  email: () => (val: unknown) =>
    isValidEmail(val as string) ? null : 'Please enter a valid email',

  url: () => (val: unknown) =>
    !val || isValidUrl(val as string) ? null : 'Please enter a valid URL',

  minLength: (min: number, fieldName: string) => (val: unknown) =>
    hasMinLength(val as string, min) ? null : `${fieldName} must be at least ${min} characters`,

  maxLength: (max: number, fieldName: string) => (val: unknown) =>
    hasMaxLength(val as string, max) ? null : `${fieldName} must be no more than ${max} characters`,

  futureDate: () => (val: unknown) =>
    isFutureDate(val as Date | string) ? null : 'Date must be in the future',
}
