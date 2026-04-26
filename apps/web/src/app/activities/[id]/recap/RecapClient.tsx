'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useUploadThing } from '@/lib/uploadthing'

interface Attendee {
  id: string
  name: string | null
  imageUrl: string | null
  slug: string | null
}

interface RecapData {
  session: {
    id: string
    title: string
    startTime: string
    endTime: string | null
    address: string | null
    city: string
    imageUrl: string | null
    categorySlug: string | null
  }
  host: Attendee | null
  attendees: Attendee[]
  attendeeCount: number
  hasReviewed: boolean
  sessionImages: { id: string; photoUrl: string; userId: string }[]
}

export default function RecapClient({ sessionId }: { sessionId: string }) {
  const { isSignedIn, isLoaded } = useUser()
  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { startUpload } = useUploadThing('completionCardPhoto')

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    fetch(`/api/buddy/sessions/${sessionId}/recap`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load recap')
        return r.json()
      })
      .then((d: RecapData) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn, sessionId])

  const handleFollow = useCallback(async (slug: string, userId: string) => {
    setFollowingIds((prev) => new Set(prev).add(userId))
    try {
      const res = await fetch(`/api/profiles/${slug}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setFollowedIds((prev) => new Set(prev).add(userId))
    } catch {
      // silently fail
    } finally {
      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }, [])

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await startUpload([file])
      if (result?.[0]) {
        const url = (result[0] as { ufsUrl?: string; url: string }).ufsUrl ?? result[0].url
        setUploadedPhoto(url)
      }
    } catch {
      // silently fail
    } finally {
      setUploading(false)
    }
  }, [startUpload])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#666] animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
        <p className="text-[#999] mb-4">Sign in to see your recap.</p>
        <Link href="/sign-in" className="px-6 py-3 bg-white text-black font-semibold rounded-full text-sm">
          Sign In
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#666] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
        <p className="text-[#999] mb-4">{error || 'Could not load recap'}</p>
        <Link href="/my-sessions" className="text-sm text-white underline">
          Back to My Sessions
        </Link>
      </div>
    )
  }

  const { session, attendees = [], attendeeCount = 0, hasReviewed = false, sessionImages = [] } = data
  const othersCount = attendeeCount - 1

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-lg border-b border-[#333333]">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/my-sessions"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0D0D0D] border border-[#333333]"
            >
              <ArrowLeft className="w-5 h-5 text-[#999999]" />
            </Link>
            <h1 className="text-sm font-semibold text-white uppercase tracking-wider">Recap</h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-28 px-4 max-w-lg mx-auto">
        {/* Hero */}
        <section className="text-center mb-8">
          <h2
            className="text-4xl font-extrabold text-white uppercase tracking-tight leading-none mb-3"
            style={{ fontFamily: 'var(--font-barlow), sans-serif' }}
          >
            YOU SHOWED UP
          </h2>
          <h3 className="text-lg font-semibold text-white mb-1">{session.title}</h3>
          {session.startTime && (
            <p className="text-sm text-[#999]">
              {format(new Date(session.startTime), "EEEE, MMM d, yyyy '\u00B7' h:mm a")}
            </p>
          )}
          {(session.address || session.city) && (
            <p className="text-xs text-[#666] mt-1">{session.address || session.city}</p>
          )}
          {othersCount > 0 && (
            <p className="text-base text-white/80 mt-3 font-medium">
              with {othersCount} other{othersCount === 1 ? '' : 's'}
            </p>
          )}
        </section>

        {/* Session Images */}
        {sessionImages.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sessionImages.map((img) => (
                <div key={img.id} className="relative w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={img.photoUrl}
                    alt="Session photo"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attendee Grid */}
        {attendees.length > 0 && (
          <section className="mb-8">
            <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-4">
              People you showed up with
            </h4>
            <div className="flex flex-wrap gap-4">
              {attendees.map((attendee) => {
                const isFollowed = followedIds.has(attendee.id)
                const isFollowing = followingIds.has(attendee.id)

                return (
                  <div key={attendee.id} className="flex flex-col items-center w-20">
                    <Link href={attendee.slug ? `/user/${attendee.slug}` : '#'}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#333] mb-1.5">
                        {attendee.imageUrl ? (
                          <Image
                            src={attendee.imageUrl}
                            alt={attendee.name || 'Attendee'}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                            {(attendee.name || '?')[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white text-center line-clamp-1 w-full">
                        {attendee.name || 'User'}
                      </p>
                    </Link>
                    {attendee.slug && !isFollowed && (
                      <button
                        onClick={() => handleFollow(attendee.slug!, attendee.id)}
                        disabled={isFollowing}
                        className="mt-1 px-3 py-0.5 text-[10px] font-semibold text-white border border-[#666] rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {isFollowing ? '...' : 'Follow'}
                      </button>
                    )}
                    {isFollowed && (
                      <span className="mt-1 px-3 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Followed
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Share your moment */}
        <section className="mb-8">
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#333333] p-5">
            <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
              Share your moment
            </h4>
            {!uploadedPhoto ? (
              <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#333] rounded-xl cursor-pointer hover:border-[#666] transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-[#666] animate-spin mb-2" />
                ) : (
                  <Camera className="w-8 h-8 text-[#666] mb-2" />
                )}
                <p className="text-sm text-[#999]">
                  {uploading ? 'Uploading...' : 'Upload a group photo'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            ) : (
              <div>
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2">
                  <Image
                    src={uploadedPhoto}
                    alt="Your group photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Posted!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Leave a review CTA */}
        {!hasReviewed && (
          <section className="mb-8">
            <Link
              href={`/activities/${session.id}`}
              className="block w-full py-3.5 bg-white text-black font-semibold rounded-full text-sm text-center hover:bg-white/90 transition-colors"
            >
              Leave a Review
            </Link>
          </section>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link href="/my-sessions" className="text-xs text-[#666] hover:text-white transition-colors">
            Back to My Sessions
          </Link>
        </div>
      </main>
    </div>
  )
}
