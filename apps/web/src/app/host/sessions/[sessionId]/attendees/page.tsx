'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Minus, Users, X } from 'lucide-react'

interface Attendee {
  id: string
  name: string | null
  imageUrl: string | null
  actuallyAttended: boolean | null
}

interface SessionDetails {
  id: string
  title: string
  startTime: string | null
  address: string | null
  city: string
  maxPeople: number | null
}

function getAttendanceLabel(value: boolean | null) {
  if (value === true) return 'Attended'
  if (value === false) return 'No-show'
  return 'Unmarked'
}

export default function ActivityAttendeesPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [sessionRes, attendeesRes] = await Promise.all([
          fetch(`/api/activities/${sessionId}`),
          fetch(`/api/buddy/sessions/${sessionId}/attendance`),
        ])

        if (attendeesRes.status === 401) {
          router.push(`/sign-in?redirect_url=/host/sessions/${sessionId}/attendees`)
          return
        }
        if (!sessionRes.ok || !attendeesRes.ok) {
          throw new Error('Could not load attendees for this session.')
        }

        const sessionData = await sessionRes.json()
        const attendeeData = await attendeesRes.json()
        setSession({
          id: sessionData.id,
          title: sessionData.title,
          startTime: sessionData.startTime,
          address: sessionData.address,
          city: sessionData.city,
          maxPeople: sessionData.maxPeople,
        })
        setAttendees(attendeeData.attendees ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router, sessionId])

  async function markAttendance(attendeeId: string, attended: boolean | null) {
    setSavingId(attendeeId)
    const previous = attendees
    setAttendees((current) =>
      current.map((attendee) =>
        attendee.id === attendeeId ? { ...attendee, actuallyAttended: attended } : attendee,
      ),
    )

    try {
      const res = await fetch(`/api/buddy/sessions/${sessionId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, attended }),
      })
      if (!res.ok) throw new Error('Failed to update attendance')
    } catch {
      setAttendees(previous)
      setError('Could not update attendance. Try again.')
    } finally {
      setSavingId(null)
    }
  }

  const markedAttended = attendees.filter((a) => a.actuallyAttended === true).length
  const markedNoShow = attendees.filter((a) => a.actuallyAttended === false).length
  const unmarked = attendees.length - markedAttended - markedNoShow

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-6 w-6 animate-spin text-[#666666]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="sticky top-0 z-20 border-b border-[#333333] bg-[#0D0D0D]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#1A1A1A]"
          >
            <ArrowLeft className="h-4 w-4 text-[#999999]" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">Attendees</h1>
            <p className="truncate text-xs text-[#666666]">{session?.title ?? 'Session'}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#666666]">
                Session roster
              </p>
              <h2 className="mt-1 truncate text-lg font-bold">{session?.title ?? 'Session'}</h2>
              <p className="mt-1 text-xs text-[#666666]">
                {session?.address || session?.city || 'Location to be confirmed'}
              </p>
            </div>
            <Link
              href={`/activities/${sessionId}`}
              className="shrink-0 rounded-full border border-[#333333] px-3 py-2 text-xs font-bold text-[#999999]"
            >
              View
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Attended', value: markedAttended },
              { label: 'No-show', value: markedNoShow },
              { label: 'Unmarked', value: unmarked },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#242424] px-3 py-3 text-center">
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-[#666666]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#666666]">
              Who is coming
            </h2>
            <span className="text-xs text-[#666666]">
              {attendees.length}{session?.maxPeople ? ` / ${session.maxPeople}` : ''} spots
            </span>
          </div>

          {attendees.length === 0 ? (
            <div className="rounded-2xl border border-[#333333] bg-[#1A1A1A] p-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-[#666666]" />
              <p className="text-sm font-semibold">No attendees yet</p>
              <p className="mt-1 text-xs text-[#666666]">Share the session link to get the first RSVP.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#333333] bg-[#1A1A1A]">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 border-b border-[#333333] px-4 py-3 last:border-0"
                >
                  {attendee.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attendee.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2A2A] text-xs font-bold text-[#666666]">
                      {(attendee.name ?? '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{attendee.name ?? 'Anonymous'}</p>
                    <p className="text-xs text-[#666666]">{getAttendanceLabel(attendee.actuallyAttended)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => markAttendance(attendee.id, attendee.actuallyAttended === true ? null : true)}
                      disabled={savingId === attendee.id}
                      aria-label={`Mark ${attendee.name ?? 'attendee'} attended`}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        attendee.actuallyAttended === true ? 'bg-white text-black' : 'bg-[#2A2A2A] text-[#999999]'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => markAttendance(attendee.id, attendee.actuallyAttended === false ? null : false)}
                      disabled={savingId === attendee.id}
                      aria-label={`Mark ${attendee.name ?? 'attendee'} no-show`}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        attendee.actuallyAttended === false ? 'bg-red-500/20 text-red-300' : 'bg-[#2A2A2A] text-[#999999]'
                      }`}
                    >
                      {attendee.actuallyAttended === null ? <Minus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
