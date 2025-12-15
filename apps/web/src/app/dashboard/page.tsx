import { Header } from '@/components/header'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardTabs } from '@/components/dashboard-tabs'
import type { Activity } from '@prisma/client'

// Fetch activities user has created (hosting)
async function getUserHostedActivities(userId: string): Promise<Activity[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return activities
  } catch (error) {
    console.error('Error fetching hosted activities:', error)
    return []
  }
}

// Fetch activities user has joined (bookings)
async function getUserJoinedActivities(userId: string) {
  try {
    const bookings = await prisma.userActivity.findMany({
      where: {
        userId,
        status: 'JOINED',
        deletedAt: null,
        activity: {
          deletedAt: null,
        },
      },
      include: {
        activity: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
            userActivities: {
              where: {
                status: 'JOINED',
                deletedAt: null,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        activity: {
          startTime: 'asc',
        },
      },
    })

    return bookings
  } catch (error) {
    console.error('Error fetching joined activities:', error)
    return []
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Ensure user exists in database
  let user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    // Create user if doesn't exist
    const clerkUser = await auth()
    user = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.sessionClaims?.email as string || '',
        name: clerkUser.sessionClaims?.name as string || null,
        imageUrl: clerkUser.sessionClaims?.image_url as string || null,
      },
    })
  }

  // Fetch both hosted and joined activities in parallel
  const [hostedActivities, joinedBookings] = await Promise.all([
    getUserHostedActivities(userId),
    getUserJoinedActivities(userId),
  ])

  return (
    <div className="min-h-screen" style={{ background: '#F0F9FF' }}>
      <Header />

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0A1628 0%, #0D2347 50%, #1E3A5F 100%)'
          }}
        />

        {/* Accent glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 50%)'
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
          <h1
            className="font-heading font-extrabold text-white mb-3 tracking-wide"
            style={{ fontSize: 'clamp(32px, 6vw, 48px)' }}
          >
            My Dashboard
          </h1>
          <p
            className="font-body text-white/70 max-w-xl"
            style={{ fontSize: '17px', lineHeight: '1.6' }}
          >
            Track your sessions, manage your activities, and see what you&apos;re hosting
          </p>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #F0F9FF, transparent)'
          }}
        />
      </section>

      {/* Main Content */}
      <main className="relative z-10 max-w-container mx-auto px-6 lg:px-10 pb-20 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e8eef5] p-6 sm:p-8">
          <DashboardTabs
            initialHostedActivities={hostedActivities}
            initialJoinedBookings={joinedBookings}
            userId={userId}
          />
        </div>
      </main>
    </div>
  )
}
