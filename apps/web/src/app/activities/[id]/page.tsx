import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ActivityPageClient from './ActivityPageClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const activity = await prisma.activity.findUnique({
      where: { id, deletedAt: null, status: 'PUBLISHED' },
      select: {
        title: true,
        description: true,
        city: true,
        address: true,
        imageUrl: true,
        type: true,
        startTime: true,
        maxPeople: true,
        user: { select: { name: true } },
        _count: { select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } } },
      },
    })

    if (!activity) {
      return { title: 'Activity Not Found' }
    }

    const goingCount = activity._count.userActivities
    const spotsLeft = activity.maxPeople ? activity.maxPeople - goingCount : null
    const location = activity.address?.split(',')[0] ?? activity.city
    const timeStr = activity.startTime
      ? activity.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : ''

    const parts = [
      timeStr,
      location,
      goingCount > 0 ? `${goingCount} going` : null,
      spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} spots left` : null,
    ].filter(Boolean)

    const description = parts.join(' · ') ||
      activity.description?.slice(0, 160) ||
      `${activity.type} activity in ${activity.city}${activity.user.name ? ` hosted by ${activity.user.name}` : ''}`

    const ogTitle = `${activity.title}${activity.user.name ? ` — ${activity.user.name}` : ''}`

    return {
      title: activity.title,
      description,
      openGraph: {
        title: ogTitle,
        description,
        type: 'website',
        siteName: 'SweatBuddies',
        ...(activity.imageUrl && { images: [{ url: activity.imageUrl }] }),
      },
      twitter: {
        card: activity.imageUrl ? 'summary_large_image' : 'summary',
        title: ogTitle,
        description,
        ...(activity.imageUrl && { images: [activity.imageUrl] }),
      },
    }
  } catch {
    return { title: 'Activity' }
  }
}

export default async function ActivityPage({ params }: Props) {
  const { id } = await params
  return <ActivityPageClient params={{ id }} />
}
