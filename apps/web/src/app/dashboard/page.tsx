import { Header } from '@/components/header'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { DashboardActivities } from '@/components/dashboard-activities'

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl: string | null
  createdAt: Date
}

async function getUserActivities(userId: string): Promise<Activity[]> {
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
    console.error('Error fetching activities:', error)
    return []
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
          </div>
        </main>
      </>
    )
  }

  const activities = await getUserActivities(userId)

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Activities</h1>
            <p className="text-muted-foreground">
              Activities you&apos;ve created
            </p>
          </div>
          <Link href="/activities/new">
            <Button size="lg">
              + Create Activity
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Activities</h2>
          <DashboardActivities initialActivities={activities} />
        </div>
      </main>
    </>
  )
}
