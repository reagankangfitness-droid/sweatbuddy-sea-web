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
        imageUrl: true,
        type: true,
        startTime: true,
        user: { select: { name: true } },
      },
    })

    if (!activity) {
      return { title: 'Activity Not Found' }
    }

    const description =
      activity.description?.slice(0, 160) ||
      `${activity.type} activity in ${activity.city}${activity.user.name ? ` hosted by ${activity.user.name}` : ''}`

    return {
      title: activity.title,
      description,
      openGraph: {
        title: activity.title,
        description,
        type: 'website',
        ...(activity.imageUrl && { images: [{ url: activity.imageUrl }] }),
      },
      twitter: {
        card: activity.imageUrl ? 'summary_large_image' : 'summary',
        title: activity.title,
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
