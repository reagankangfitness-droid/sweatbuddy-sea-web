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
    <>
      <Header />
      <main className="container mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground" style={{ fontSize: '15px' }}>
            Track your sessions and see what you&apos;re hosting
          </p>
        </div>

        <DashboardTabs
          initialHostedActivities={hostedActivities}
          initialJoinedBookings={joinedBookings}
          userId={userId}
        />
      </main>
    </>
  )
}
