import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Calendar, MapPin, Instagram, Globe, MessageCircle, CheckCircle, Megaphone, Pin } from 'lucide-react'
import { getCategoryColor, getCategoryEmoji } from '@/lib/categories'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { JoinCommunityButton } from '@/components/community/JoinCommunityButton'
import { ShareButton } from '@/components/community/ShareButton'
import { getUpcomingEventSubmissions } from '@/lib/community-system'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

async function getCommunity(slug: string) {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      city: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          isVerified: true,
          instagram: true,
        },
      },
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
  })
  return community
}

async function getUpcomingEvents(communityId: string) {
  const events = await prisma.activity.findMany({
    where: {
      communityId,
      status: 'PUBLISHED',
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: 'asc' },
    take: 6,
    include: {
      host: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          userActivities: true,
        },
      },
    },
  })
  return events
}

async function getMembers(communityId: string) {
  const members = await prisma.communityMember.findMany({
    where: { communityId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isVerified: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
    take: 12,
  })
  return members
}

async function getAnnouncements(communityId: string) {
  const chat = await prisma.communityChat.findUnique({
    where: { communityId },
  })
  if (!chat) return []

  const announcements = await prisma.communityMessage.findMany({
    where: {
      chatId: chat.id,
      isAnnouncement: true,
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 3,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  })
  return announcements
}

async function getMembership(communityId: string, userId: string | null) {
  if (!userId) return null
  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  })
  return membership
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const community = await getCommunity(slug)

  if (!community) {
    return { title: 'Community Not Found | SweatBuddies' }
  }

  return {
    title: `${community.name} | SweatBuddies`,
    description: community.description || `Join ${community.name} on SweatBuddies. ${community._count.members} members, ${community._count.activities} experiences.`,
    openGraph: {
      title: `${community.name} | SweatBuddies`,
      description: community.description || `Join ${community.name} on SweatBuddies.`,
      url: `https://www.sweatbuddies.co/communities/${slug}`,
      images: community.coverImage ? [community.coverImage] : [],
    },
  }
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params
  const { userId } = await auth()

  const community = await getCommunity(slug)

  if (!community || !community.isActive) {
    notFound()
  }

  const [upcomingEvents, eventSubmissions, members, membership, announcements] = await Promise.all([
    getUpcomingEvents(community.id),
    community.instagramHandle
      ? getUpcomingEventSubmissions(community.instagramHandle)
      : Promise.resolve([]),
    getMembers(community.id),
    getMembership(community.id, userId),
    getAnnouncements(community.id),
  ])

  // Merge activity events and event submissions into a unified list sorted by date
  type UnifiedEvent = {
    id: string
    title: string
    date: Date | null
    time: string | null
    location: string | null
    href: string
    source: 'activity' | 'submission'
    attendeeCount?: number
  }

  const activityEvents: UnifiedEvent[] = upcomingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.startTime,
    time: e.startTime
      ? new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null,
    location: null,
    href: `/activities/${e.id}`,
    source: 'activity' as const,
    attendeeCount: e._count.userActivities,
  }))

  const submissionEvents: UnifiedEvent[] = eventSubmissions.map((e) => ({
    id: e.id,
    title: e.eventName,
    date: e.eventDate,
    time: e.time,
    location: e.location,
    href: `/e/${e.slug || e.id}`,
    source: 'submission' as const,
  }))

  const allUpcomingEvents = [...activityEvents, ...submissionEvents].sort(
    (a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
  ).slice(0, 6)

  const isMember = !!membership
  const isOwner = membership?.role === 'OWNER'
  const isAdmin = membership?.role === 'ADMIN' || isOwner

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/communities"
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Communities</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-100">
              sweatbuddies
            </Link>
            <ShareButton />
          </div>
        </div>
      </header>

      {/* Community Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-neutral-950 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Profile Circle */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg"
              style={{
                border: `3px solid ${getCategoryColor(community.category)}`,
                boxShadow: `0 0 20px ${getCategoryColor(community.category)}22`,
              }}
            >
              {community.logoImage ? (
                <Image
                  src={community.logoImage}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : community.coverImage ? (
                <Image
                  src={community.coverImage}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : community.createdBy?.imageUrl ? (
                <Image
                  src={community.createdBy.imageUrl}
                  alt={community.createdBy.name || ''}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor(community.category)}40, ${getCategoryColor(community.category)}15)`,
                    backgroundColor: '#262626',
                  }}
                >
                  <span className="text-3xl select-none">
                    {getCategoryEmoji(community.category)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100">
                  {community.name}
                </h1>
                {community.isVerified && (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500">
                {community.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {community.city.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {community._count.members} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {Math.max(community._count.activities, community.eventCount)} experiences
                </span>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-3">
                {community.instagramHandle && (
                  <a
                    href={`https://instagram.com/${community.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-pink-500 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {community.websiteUrl && (
                  <a
                    href={community.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-blue-500 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {community.communityLink && (
                  <a
                    href={community.communityLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-green-500 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Join Button */}
            <div className="sm:ml-auto">
              <JoinCommunityButton
                communitySlug={community.slug}
                isMember={isMember}
                isOwner={isOwner}
                privacy={community.privacy}
              />
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="mt-6 text-neutral-400 whitespace-pre-line">
              {community.description}
            </p>
          )}

          {/* Host */}
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden">
                {community.createdBy?.imageUrl ? (
                  <Image
                    src={community.createdBy.imageUrl}
                    alt={community.createdBy.name || ''}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-neutral-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-500">Hosted by</p>
                <p className="font-medium text-neutral-100">
                  {community.createdBy?.name || community.createdBy?.username}
                  {community.createdBy?.isVerified && (
                    <CheckCircle className="w-4 h-4 text-blue-500 inline ml-1" />
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {(announcements.length > 0 || isAdmin) && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-semibold text-neutral-100">Announcements</h2>
          </div>

          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
                      {announcement.sender.imageUrl ? (
                        <Image
                          src={announcement.sender.imageUrl}
                          alt={announcement.sender.name || ''}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-neutral-200">
                          {announcement.sender.name || 'Member'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {announcement.isPinned && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-900/50 text-amber-400 rounded">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-400 whitespace-pre-line">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            isAdmin && (
              <div className="text-center py-8 bg-neutral-900 rounded-xl">
                <Megaphone className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No announcements yet</p>
              </div>
            )
          )}
        </section>
      )}

      {/* Upcoming Events */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-100">Upcoming Events</h2>
        </div>

        {allUpcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allUpcomingEvents.map((event) => (
              <Link
                key={`${event.source}-${event.id}`}
                href={event.href}
                className="group block bg-neutral-950 border border-neutral-800 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-neutral-800 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-neutral-500">
                      {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
                    </span>
                    <span className="text-lg font-bold text-neutral-100">
                      {event.date ? new Date(event.date).getDate() : '--'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-100 group-hover:text-blue-600 transition-colors truncate">
                      {event.title}
                    </h3>
                    {event.time && (
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {event.time}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm text-neutral-400 mt-0.5 flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    )}
                    {event.attendeeCount !== undefined && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                        <Users className="w-3.5 h-3.5" />
                        {event.attendeeCount} going
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-900 rounded-xl">
            <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400">No upcoming experiences</p>
          </div>
        )}
      </section>

      {/* Members */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-100">Members</h2>
          <span className="text-sm text-neutral-500">
            {community._count.members} total
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/user/${member.user.id}`}
              className="group flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden">
                {member.user.imageUrl ? (
                  <Image
                    src={member.user.imageUrl}
                    alt={member.user.name || ''}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-neutral-100">
                {member.user.name?.split(' ')[0] || 'Member'}
              </span>
              {member.role === 'OWNER' && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-900 text-amber-400 rounded">Host</span>
              )}
              {member.role === 'ADMIN' && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-900 text-blue-400 rounded">Admin</span>
              )}
            </Link>
          ))}
        </div>

        {community._count.members > 12 && (
          <p className="mt-4 text-sm text-neutral-500">
            +{community._count.members - 12} more members
          </p>
        )}
      </section>
    </div>
  )
}
