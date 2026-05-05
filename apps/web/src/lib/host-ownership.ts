import type { HostSession } from './auth'

interface HostOwnedEvent {
  submittedByUserId?: string | null
  organizerInstagram?: string | null
}

export function isHostEventOwner(session: HostSession, event: HostOwnedEvent): boolean {
  if (session.userId && event.submittedByUserId && event.submittedByUserId === session.userId) {
    return true
  }

  if (session.source !== 'legacy') return false

  return !!event.organizerInstagram &&
    event.organizerInstagram.toLowerCase() === session.instagramHandle.toLowerCase()
}
