/**
 * Auth utilities for contextual login
 *
 * Intent types:
 * - 'rsvp': User wants to join an event
 * - 'host': User wants to create/host events
 * - 'general': Generic sign in (default)
 */

export type AuthIntent = 'rsvp' | 'host' | 'general'

interface AuthUrlOptions {
  intent?: AuthIntent
  eventId?: string
  eventSlug?: string
  redirectUrl?: string
}

/**
 * Generate a sign-in URL with intent params
 */
export function getSignInUrl(options: AuthUrlOptions = {}): string {
  const { intent, eventId, eventSlug, redirectUrl } = options
  const params = new URLSearchParams()

  if (intent && intent !== 'general') {
    params.set('intent', intent)
  }

  if (eventId) {
    params.set('eventId', eventId)
  }

  if (eventSlug) {
    params.set('eventSlug', eventSlug)
  }

  if (redirectUrl) {
    params.set('redirect_url', redirectUrl)
  }

  const queryString = params.toString()
  return `/sign-in${queryString ? `?${queryString}` : ''}`
}

/**
 * Generate a sign-up URL with intent params
 */
export function getSignUpUrl(options: AuthUrlOptions = {}): string {
  const { intent, eventId, eventSlug, redirectUrl } = options
  const params = new URLSearchParams()

  if (intent && intent !== 'general') {
    params.set('intent', intent)
  }

  if (eventId) {
    params.set('eventId', eventId)
  }

  if (eventSlug) {
    params.set('eventSlug', eventSlug)
  }

  if (redirectUrl) {
    params.set('redirect_url', redirectUrl)
  }

  const queryString = params.toString()
  return `/sign-up${queryString ? `?${queryString}` : ''}`
}

/**
 * Get RSVP sign-in URL for an event
 */
export function getRsvpSignInUrl(eventSlug: string): string {
  return getSignInUrl({ intent: 'rsvp', eventSlug })
}

/**
 * Get host sign-in URL
 */
export function getHostSignInUrl(): string {
  return getSignInUrl({ intent: 'host' })
}

/**
 * Check if user just completed RSVP intent
 * Call this on event page to auto-trigger RSVP modal
 */
export function checkRsvpIntent(): boolean {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  return params.get('action') === 'rsvp'
}

/**
 * Check if user just completed host intent
 * Call this on host page to show welcome message
 */
export function checkHostWelcome(): boolean {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  return params.get('welcome') === 'true'
}

/**
 * Clear the action param from URL without reload
 */
export function clearActionParam(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('action')
  url.searchParams.delete('welcome')
  window.history.replaceState({}, '', url.toString())
}
