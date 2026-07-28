'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Bookmark, Check, ExternalLink, Flag, Mail, ShieldCheck } from 'lucide-react'

type MetadataValue = string | number | boolean | null

interface TrackedExternalLinkProps {
  href: string
  event: string
  metadata?: Record<string, MetadataValue>
  className?: string
  children: ReactNode
  ariaLabel?: string
}

export function TrackedExternalLink({
  href,
  event,
  metadata,
  className,
  children,
  ariaLabel,
}: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
      onClick={() => trackCommunityDirectoryEvent(event, metadata)}
    >
      {children}
    </a>
  )
}

interface SaveCommunityButtonProps {
  communitySlug: string
  communityName: string
  source: 'card' | 'detail' | 'sticky'
  className?: string
}

export function SaveCommunityButton({
  communitySlug,
  communityName,
  source,
  className,
}: SaveCommunityButtonProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(readSavedCommunities().includes(communitySlug))
  }, [communitySlug])

  function toggleSaved() {
    const savedCommunities = new Set(readSavedCommunities())
    const nextSaved = !savedCommunities.has(communitySlug)

    if (nextSaved) {
      savedCommunities.add(communitySlug)
    } else {
      savedCommunities.delete(communitySlug)
    }

    try {
      window.localStorage.setItem('sweatbuddies_saved_communities', JSON.stringify([...savedCommunities]))
    } catch {}

    setSaved(nextSaved)
    trackCommunityDirectoryEvent('community_saved', {
      communitySlug,
      communityName,
      source,
      saved: nextSaved,
    })
  }

  return (
    <button
      type="button"
      onClick={toggleSaved}
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${communityName} from saved communities` : `Save ${communityName}`}
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

interface ReportOutdatedButtonProps {
  communitySlug: string
  communityName: string
  className?: string
}

export function ReportOutdatedButton({
  communitySlug,
  communityName,
  className,
}: ReportOutdatedButtonProps) {
  const [reported, setReported] = useState(false)

  function report() {
    setReported(true)
    trackCommunityDirectoryEvent('community_report_outdated_clicked', {
      communitySlug,
      communityName,
    })
  }

  return (
    <button
      type="button"
      onClick={report}
      className={className}
      disabled={reported}
      aria-label={`Report outdated information for ${communityName}`}
    >
      {reported ? <Check className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
      {reported ? 'Reported' : 'Report outdated'}
    </button>
  )
}

interface CommunityViewTrackerProps {
  communitySlug: string
  communityName: string
  source: 'detail' | 'saved' | 'seo'
}

export function CommunityViewTracker({
  communitySlug,
  communityName,
  source,
}: CommunityViewTrackerProps) {
  useEffect(() => {
    trackCommunityDirectoryEvent('community_viewed', {
      communitySlug,
      communityName,
      source,
    })
  }, [communityName, communitySlug, source])

  return null
}

interface JoinedCommunityButtonProps {
  communitySlug: string
  communityName: string
  source: 'detail' | 'sticky'
  className?: string
}

export function JoinedCommunityButton({
  communitySlug,
  communityName,
  source,
  className,
}: JoinedCommunityButtonProps) {
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    setJoined(readStoredList('sweatbuddies_joined_communities').includes(communitySlug))
  }, [communitySlug])

  function confirmJoined() {
    const joinedCommunities = new Set(readStoredList('sweatbuddies_joined_communities'))
    joinedCommunities.add(communitySlug)

    try {
      window.localStorage.setItem('sweatbuddies_joined_communities', JSON.stringify([...joinedCommunities]))
    } catch {}

    setJoined(true)
    trackCommunityDirectoryEvent('community_outbound_join_confirmed', {
      communitySlug,
      communityName,
      source,
    })
  }

  return (
    <button
      type="button"
      onClick={confirmJoined}
      disabled={joined}
      className={className}
      aria-pressed={joined}
      aria-label={joined ? `${communityName} marked as joined` : `Mark ${communityName} as joined`}
    >
      <Check className="h-3.5 w-3.5" />
      {joined ? 'Joined' : 'I joined this'}
    </button>
  )
}

interface DirectoryClaimIntentLinkProps {
  href: string
  communitySlug: string
  communityName: string
  className?: string
}

export function DirectoryClaimIntentLink({
  href,
  communitySlug,
  communityName,
  className,
}: DirectoryClaimIntentLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackCommunityDirectoryEvent('community_claim_intent_clicked', {
        communitySlug,
        communityName,
      })}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Claim or update
    </a>
  )
}

interface CommunityWeeklyPicksFormProps {
  source: 'directory' | 'detail' | 'saved' | 'seo'
  city?: string | null
  activityType?: string | null
  communityName?: string | null
  title?: string
  body?: string
}

export function CommunityWeeklyPicksForm({
  source,
  city = 'Singapore',
  activityType = 'communities',
  communityName,
  title = 'Get weekly community picks.',
  body = 'A short list of active communities worth checking before the weekend.',
}: CommunityWeeklyPicksFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || status === 'saving') return

    setStatus('saving')
    try {
      const response = await fetch('/api/landing-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WEEKLY_DROP',
          city,
          activityType,
          contactMethod: 'EMAIL',
          email: normalizedEmail,
          sourcePage: typeof window !== 'undefined' ? window.location.pathname : null,
          sourcePlacement: source,
          metadata: {
            product: 'community_directory',
            communityName,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to save lead')

      setStatus('saved')
      setEmail('')
      trackCommunityDirectoryEvent('community_weekly_picks_submitted', {
        source,
        city,
        activityType,
        communityName: communityName ?? null,
      })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="rounded-lg border border-[#63FF8F]/22 bg-[#63FF8F]/8 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#63FF8F] text-black">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/58">{body}</p>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (status === 'error') setStatus('idle')
              }}
              placeholder="Email"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-white/12 bg-black/24 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#63FF8F]"
              aria-label="Email for weekly community picks"
            />
            <button
              type="submit"
              disabled={status === 'saving' || status === 'saved'}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-xs font-black uppercase tracking-wide text-black transition-colors hover:bg-[#63FF8F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'saving' ? 'Saving' : status === 'saved' ? 'Saved' : 'Get picks'}
            </button>
          </form>
          {status === 'error' && (
            <p className="mt-2 text-xs font-semibold text-red-300">Could not save this email. Try again.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export function OfficialJoinIcon() {
  return <ExternalLink className="h-3.5 w-3.5" />
}

interface MobileCommunityStickyActionsProps {
  href: string
  communitySlug: string
  communityName: string
  joinPlatform?: string | null
}

export function MobileCommunityStickyActions({
  href,
  communitySlug,
  communityName,
  joinPlatform,
}: MobileCommunityStickyActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0B0B0B]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_104px] gap-2">
        <TrackedExternalLink
          href={href}
          event="official_join_clicked"
          metadata={{
            communitySlug,
            communityName,
            source: 'mobile_sticky',
            joinPlatform: joinPlatform ?? null,
          }}
          className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-full bg-[#63FF8F] px-4 text-sm font-black text-black transition-colors hover:bg-[#83FFA6]"
          ariaLabel={`Join ${communityName} through the official link`}
        >
          Join official link
          <OfficialJoinIcon />
        </TrackedExternalLink>
        <SaveCommunityButton
          communitySlug={communitySlug}
          communityName={communityName}
          source="sticky"
          className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-white/14 px-3 text-xs font-bold text-white transition-colors hover:border-[#63FF8F]/60 hover:bg-white/5"
        />
      </div>
    </div>
  )
}

function readSavedCommunities() {
  return readStoredList('sweatbuddies_saved_communities')
}

function readStoredList(key: string) {
  if (typeof window === 'undefined') return []
  try {
    const value = window.localStorage.getItem(key)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function trackCommunityDirectoryEvent(event: string, metadata?: Record<string, MetadataValue>) {
  const body = JSON.stringify({ event, metadata })

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
    return
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
