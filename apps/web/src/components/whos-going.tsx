'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AttendeeProfile {
  id: string
  name: string
  imageUrl: string | null
  bio: string | null
  fitnessInterests: string[]
  goingSolo: boolean
  isFollowing: boolean
  mutualEvents: string[]
}

interface WhosGoingProps {
  activityId: string
  hasJoined: boolean
  currentUserId: string | null
}

const VISIBLE_WHEN_NOT_JOINED = 6

export function WhosGoing({ activityId, hasJoined, currentUserId }: WhosGoingProps) {
  const [attendees, setAttendees] = useState<AttendeeProfile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeProfile | null>(null)
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAttendees() {
      try {
        const res = await fetch(`/api/events/${activityId}/attendees/profiles`)
        if (!res.ok) return
        const data = await res.json()
        setAttendees(data.attendees)
        setTotalCount(data.totalCount)
      } catch {
        // Silently handle errors
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendees()
  }, [activityId])

  const handleFollowToggle = async (attendee: AttendeeProfile) => {
    if (!currentUserId) {
      toast.error('Please sign in to follow people')
      return
    }

    setFollowLoading(attendee.id)

    try {
      const method = attendee.isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/users/${attendee.id}/follow`, { method })

      if (!res.ok) throw new Error('Failed to update follow status')

      const data = await res.json()

      // Update the attendee list
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendee.id ? { ...a, isFollowing: data.following } : a
        )
      )

      // Update the selected attendee if open
      if (selectedAttendee?.id === attendee.id) {
        setSelectedAttendee({ ...selectedAttendee, isFollowing: data.following })
      }

      toast.success(data.following ? `Following ${attendee.name}` : `Unfollowed ${attendee.name}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setFollowLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who&apos;s Going
        </h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who&apos;s Going
        </h2>
        <p className="text-sm text-muted-foreground">No one has joined yet. Be the first!</p>
      </div>
    )
  }

  const displayedAttendees = attendees
  const maxAvatars = 12
  const visibleAvatars = displayedAttendees.slice(0, maxAvatars)
  const surplus = totalCount - maxAvatars

  return (
    <>
      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who&apos;s Going
          <span className="text-sm font-normal text-muted-foreground">
            ({totalCount})
          </span>
        </h2>

        <div className="relative">
          <div className="flex flex-wrap gap-2">
            {visibleAvatars.map((attendee, index) => {
              const isBlurred = !hasJoined && index >= VISIBLE_WHEN_NOT_JOINED
              return (
                <button
                  key={attendee.id}
                  onClick={() => {
                    if (!isBlurred) setSelectedAttendee(attendee)
                  }}
                  className={`relative w-10 h-10 rounded-full border-2 border-background shadow-sm overflow-hidden transition-transform hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    isBlurred ? 'blur-sm pointer-events-none' : 'cursor-pointer'
                  }`}
                  disabled={isBlurred}
                  aria-label={isBlurred ? 'RSVP to see attendee' : `View ${attendee.name}'s profile`}
                >
                  {attendee.imageUrl ? (
                    <Image
                      src={attendee.imageUrl}
                      alt={attendee.name}
                      className="w-full h-full object-cover"
                      width={40}
                      height={40}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {attendee.name[0]}
                    </div>
                  )}
                </button>
              )
            })}
            {surplus > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-background shadow-sm bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{surplus}
              </div>
            )}
          </div>

          {/* Blur gate CTA for non-RSVP'd users */}
          {!hasJoined && attendees.length > VISIBLE_WHEN_NOT_JOINED && (
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                RSVP to see who&apos;s going
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile card dialog */}
      <Dialog
        open={!!selectedAttendee}
        onOpenChange={(open) => {
          if (!open) setSelectedAttendee(null)
        }}
      >
        <DialogContent className="max-w-sm">
          {selectedAttendee && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-background shadow-sm shrink-0">
                    {selectedAttendee.imageUrl ? (
                      <Image
                        src={selectedAttendee.imageUrl}
                        alt={selectedAttendee.name}
                        className="w-full h-full object-cover"
                        width={64}
                        height={64}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl font-medium text-primary">
                        {selectedAttendee.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-left">{selectedAttendee.name}</DialogTitle>
                    <DialogDescription className="text-left">
                      {selectedAttendee.goingSolo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium mt-1">
                          Going Solo
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                {selectedAttendee.bio && (
                  <p className="text-sm text-muted-foreground">{selectedAttendee.bio}</p>
                )}

                {selectedAttendee.fitnessInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAttendee.fitnessInterests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                {selectedAttendee.mutualEvents.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Also attending {selectedAttendee.mutualEvents.join(' and ')}
                  </p>
                )}

                {currentUserId && currentUserId !== selectedAttendee.id && (
                  <Button
                    variant={selectedAttendee.isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                    disabled={followLoading === selectedAttendee.id}
                    onClick={() => handleFollowToggle(selectedAttendee)}
                  >
                    {followLoading === selectedAttendee.id
                      ? 'Loading...'
                      : selectedAttendee.isFollowing
                        ? 'Following'
                        : 'Follow'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
