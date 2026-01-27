'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Instagram,
  Share2,
  UserPlus,
  UserCheck,
  ChevronRight,
  Award,
  Users,
  Loader2,
  Lock
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from '@/components/category-badge'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  name: string | null
  firstName: string | null
  slug: string | null
  imageUrl: string | null
  coverImage: string | null
  headline: string | null
  bio: string | null
  location: string | null
  website: string | null
  instagram: string | null
  twitter: string | null
  linkedin: string | null
  tiktok: string | null
  isHost: boolean
  isVerified: boolean
  isPublic: boolean
  showActivitiesAttended: boolean
  showStats: boolean
  hostSince: string | null
  specialties: string[]
  certifications: string[]
  createdAt: string
  hostStats: {
    totalEvents: number
    completedEvents: number
    totalUniqueAttendees: number
    averageRating: number
    totalReviews: number
    repeatAttendeeRate: number
    totalProfileViews: number
  } | null
  attendedStats: {
    activitiesAttended: number
    uniqueHosts: number
  } | null
  followCounts: {
    followers: number
    following: number
  }
}

interface Activity {
  id: string
  title: string
  description: string | null
  startTime: string | null
  city: string
  address: string | null
  imageUrl: string | null
  price: number
  currency: string
  maxPeople: number | null
  categorySlug: string | null
  status: string
  attendeesCount: number
  spotsRemaining: number | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer: {
    id: string
    name: string | null
    firstName: string | null
    imageUrl: string | null
    slug: string | null
  } | null
  activity: {
    id: string
    title: string
  } | null
}

export default function HostProfilePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [hasMoreActivities, setHasMoreActivities] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/profiles/${slug}/reviews?limit=5`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }, [slug])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`)
      if (res.status === 404) {
        router.push('/404')
        return
      }
      const data = await res.json()
      setProfile(data.profile)
      setIsFollowing(data.isFollowing)
      setIsOwnProfile(data.isOwnProfile)

      // Fetch reviews for hosts
      if (data.profile.isHost) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, router, fetchReviews])

  const fetchActivities = useCallback(async (page = 1, append = false) => {
    if (page > 1) setLoadingMore(true)

    try {
      const res = await fetch(
        `/api/profiles/${slug}/activities?type=${activeTab}&page=${page}&limit=6`
      )
      const data = await res.json()

      if (append) {
        setActivities((prev) => [...prev, ...data.activities])
      } else {
        setActivities(data.activities)
      }

      setActivitiesPage(page)
      setHasMoreActivities(data.pagination.hasMore)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [slug, activeTab])

  useEffect(() => {
    if (slug) {
      fetchProfile()
    }
  }, [slug, fetchProfile])

  useEffect(() => {
    if (profile?.id) {
      fetchActivities(1)
    }
  }, [profile?.id, activeTab, fetchActivities])

  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/profiles/${slug}/follow`, {
        method: 'POST'
      })
      const data = await res.json()
      setIsFollowing(data.following)

      // Update follower count
      if (profile) {
        setProfile({
          ...profile,
          followCounts: {
            ...profile.followCounts,
            followers:
              profile.followCounts.followers + (data.following ? 1 : -1)
          }
        })
      }
    } catch (error) {
      console.error('Failed to follow:', error)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/h/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} on SweatBuddies`,
          text:
            profile?.headline ||
            `Check out ${profile?.name}'s activities on SweatBuddies!`,
          url
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  const loadMore = () => {
    fetchActivities(activitiesPage + 1, true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  // Private profile view
  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-muted">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.name || 'User'}
              width={96}
              height={96}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
              {profile.name?.[0] || '?'}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {profile.firstName || profile.name?.split(' ')[0] || 'User'}
        </h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <p>This profile is private</p>
        </div>
      </div>
    )
  }

  const { hostStats, followCounts } = profile

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover Image */}
      <div className="w-full h-48 md:h-72 relative">
        {profile.coverImage ? (
          <Image
            src={profile.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary via-amber-500 to-pink-500" />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-background overflow-hidden shadow-lg">
              {profile.imageUrl ? (
                <Image
                  src={profile.imageUrl}
                  alt={profile.name || 'Host'}
                  width={144}
                  height={144}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-4xl sm:text-5xl font-bold text-primary-foreground">
                  {profile.firstName?.[0] || profile.name?.[0] || '?'}
                </div>
              )}
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background">
                <Award className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 pt-2 sm:pt-20">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {profile.name}
              </h1>
              {profile.isHost && (
                <span className="text-xs font-semibold uppercase bg-primary text-primary-foreground px-2.5 py-1 rounded">
                  Host
                </span>
              )}
            </div>

            {profile.headline && (
              <p className="text-muted-foreground mt-1">{profile.headline}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.hostSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Hosting since{' '}
                  {format(new Date(profile.hostSince), 'MMM yyyy')}
                </span>
              )}
            </div>

            {/* Specialties */}
            {profile.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.specialties.slice(0, 5).map((slug) => (
                  <CategoryBadge key={slug} slug={slug} size="small" />
                ))}
                {profile.specialties.length > 5 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    +{profile.specialties.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 sm:pt-20">
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}

            <Button onClick={handleShare} variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>

            {isOwnProfile && (
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/profile">Edit Profile</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
        <div className="bg-card rounded-2xl border p-4 flex justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {hostStats?.totalEvents || 0}
            </div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {hostStats?.totalUniqueAttendees || 0}
            </div>
            <div className="text-xs text-muted-foreground">Attendees</div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {followCounts?.followers || 0}
            </div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              {hostStats && hostStats.averageRating > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {Number(hostStats.averageRating).toFixed(1)}
                </>
              ) : (
                '—'
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {hostStats?.totalReviews || 0} reviews
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      {profile.bio && (
        <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground whitespace-pre-line">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Certifications
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg"
              >
                <Award className="h-3.5 w-3.5" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {(profile.website ||
        profile.instagram ||
        profile.twitter ||
        profile.linkedin ||
        profile.tiktok) && (
        <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
          <div className="flex flex-wrap gap-3">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            )}
            {profile.twitter && (
              <a
                href={`https://twitter.com/${profile.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>
      )}

      {/* Activities Section */}
      <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Activities</h2>
          <div className="flex bg-card border rounded-lg p-1">
            <button
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === 'upcoming'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('past')}
            >
              Past
            </button>
          </div>
        </div>

        {activities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="group bg-card rounded-2xl border overflow-hidden hover:shadow-card-hover transition-shadow"
                >
                  <div className="aspect-[4/3] relative bg-muted">
                    {activity.imageUrl ? (
                      <Image
                        src={activity.imageUrl}
                        alt={activity.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    {activity.categorySlug && (
                      <div className="absolute top-2 left-2">
                        <CategoryBadge
                          slug={activity.categorySlug}
                          size="small"
                          variant="filled"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {activity.title}
                    </h3>
                    {activity.startTime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(activity.startTime),
                          'EEE, MMM d · h:mm a'
                        )}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {activity.attendeesCount} going
                      </span>
                      {activity.price > 0 ? (
                        <span className="text-sm font-semibold text-foreground">
                          {activity.currency} {activity.price}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-emerald-600">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMoreActivities && (
              <div className="text-center mt-6">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border">
            <p className="text-muted-foreground">
              {activeTab === 'upcoming'
                ? 'No upcoming activities'
                : 'No past activities'}
            </p>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {profile.isHost && reviews.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Reviews{' '}
              <span className="font-normal text-muted-foreground">
                ({hostStats?.totalReviews || 0})
              </span>
            </h2>
            {hostStats && hostStats.totalReviews > 5 && (
              <Link
                href={`/h/${slug}/reviews`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card rounded-2xl border p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {review.reviewer?.imageUrl ? (
                      <Image
                        src={review.reviewer.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {review.reviewer?.firstName?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">
                      {review.reviewer?.firstName ||
                        review.reviewer?.name?.split(' ')[0] ||
                        'Anonymous'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3 w-3',
                              i < review.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                {review.activity && (
                  <p className="text-xs text-muted-foreground mt-2">
                    for{' '}
                    <Link
                      href={`/activities/${review.activity.id}`}
                      className="text-primary hover:underline"
                    >
                      {review.activity.title}
                    </Link>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
