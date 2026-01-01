import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Heart, Users, Settings, ChevronRight } from 'lucide-react'

// Fetch user's event RSVPs
async function getUserEventRSVPs(email: string) {
  try {
    const rsvps = await prisma.eventAttendance.findMany({
      where: {
        email: email.toLowerCase(),
        confirmed: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
      select: {
        id: true,
        eventId: true,
        eventName: true,
        timestamp: true,
      },
    })
    return rsvps
  } catch (error) {
    console.error('Error fetching event RSVPs:', error)
    return []
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in?redirect_url=/dashboard')
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress

  // Fetch RSVPs if we have an email
  const rsvps = email ? await getUserEventRSVPs(email) : []

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 bg-neutral-50">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white text-xl font-semibold">
                    {user?.firstName?.[0] || email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {user?.fullName || user?.firstName || 'SweatBuddy'}
                </h2>
                <p className="text-sm text-neutral-500">{email}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-center">
              <Calendar className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{rsvps.length}</p>
              <p className="text-sm text-neutral-500">Events Joined</p>
            </div>
            <Link
              href="/saved"
              className="bg-white rounded-2xl border border-neutral-200 p-5 text-center hover:border-neutral-300 transition-colors"
            >
              <Heart className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-900">-</p>
              <p className="text-sm text-neutral-500">Saved</p>
            </Link>
          </div>

          {/* My Events */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900">My Events</h3>
            </div>

            {rsvps.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 mb-4">No events yet</p>
                <Link
                  href="/#events"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
                >
                  Find Events
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {rsvps.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    href={`/e/${rsvp.eventId}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-neutral-900 line-clamp-1">{rsvp.eventName}</p>
                      <p className="text-sm text-neutral-500">
                        Joined {new Date(rsvp.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <Link
              href="/host/dashboard"
              className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800">
                <Users className="w-5 h-5 text-neutral-400" />
                Host Dashboard
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </Link>
            <Link
              href="/saved"
              className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800">
                <Heart className="w-5 h-5 text-neutral-400" />
                Saved Events
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </Link>
            <Link
              href="/settings/profile"
              className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
            >
              <span className="flex items-center gap-3 text-neutral-800">
                <Settings className="w-5 h-5 text-neutral-400" />
                Settings
              </span>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
