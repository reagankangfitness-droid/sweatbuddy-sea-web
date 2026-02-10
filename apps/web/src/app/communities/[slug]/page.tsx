import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Calendar, MapPin, Instagram, Globe, MessageCircle, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { JoinCommunityButton } from '@/components/community/JoinCommunityButton'
import { ShareButton } from '@/components/community/ShareButton'

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

  const [upcomingEvents, members, membership] = await Promise.all([
    getUpcomingEvents(community.id),
    getMembers(community.id),
    getMembership(community.id, userId),
  ])

  const isMember = !!membership
  const isOwner = membership?.role === 'OWNER'
  const isAdmin = membership?.role === 'ADMIN' || isOwner

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/communities"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Communities</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <ShareButton />
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-blue-400 to-indigo-500">
        {community.coverImage && (
          <Image
            src={community.coverImage}
            alt={community.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Community Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-4 border-white shadow-md">
              {community.logoImage ? (
                <Image
                  src={community.logoImage}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : community.createdBy?.imageUrl ? (
                <Image
                  src={community.createdBy.imageUrl}
                  alt={community.createdBy.name || ''}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <Users className="w-8 h-8 text-neutral-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
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
                  {community._count.activities} experiences
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
            <p className="mt-6 text-neutral-600 whitespace-pre-line">
              {community.description}
            </p>
          )}

          {/* Host */}
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden">
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
                <p className="font-medium text-neutral-900">
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

      {/* Upcoming Events */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">Upcoming Experiences</h2>
          {isAdmin && (
            <Link
              href="/activities/create"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Create Experience
            </Link>
          )}
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/activities/${event.id}`}
                className="group block bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-neutral-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-neutral-500">
                      {event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }) : ''}
                    </span>
                    <span className="text-lg font-bold text-neutral-900">
                      {event.startTime ? new Date(event.startTime).getDate() : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {event.startTime ? new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                      <Users className="w-3.5 h-3.5" />
                      {event._count.userActivities} going
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-xl">
            <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No upcoming experiences</p>
            {isAdmin && (
              <Link
                href="/activities/create"
                className="inline-block mt-4 px-6 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Create an Experience
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">Members</h2>
          <span className="text-sm text-neutral-500">
            {community._count.members} total
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/user/${member.user.id}`}
              className="group flex items-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
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
              <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                {member.user.name?.split(' ')[0] || 'Member'}
              </span>
              {member.role === 'OWNER' && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Host</span>
              )}
              {member.role === 'ADMIN' && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Admin</span>
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
