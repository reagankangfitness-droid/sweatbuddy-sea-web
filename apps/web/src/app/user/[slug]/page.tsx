'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Calendar,
  Heart,
  Share2,
  UserPlus,
  UserCheck,
  Loader2,
  Lock
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Profile {
  id: string
  name: string | null
  firstName: string | null
  slug: string | null
  imageUrl: string | null
  headline: string | null
  bio: string | null
  location: string | null
  isHost: boolean
  isPublic: boolean
  showActivitiesAttended: boolean
  createdAt: string
  attendedStats: {
    activitiesAttended: number
    uniqueHosts: number
  } | null
  followCounts: {
    followers: number
    following: number
  }
}

interface AttendedActivity {
  id: string
  title: string
  startTime: string | null
  city: string
  imageUrl: string | null
  categorySlug: string | null
  status: string
  host: {
    id: string
    name: string | null
    firstName: string | null
    imageUrl: string | null
    slug: string | null
  } | null
  joinedAt: string
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<AttendedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchProfile()
    }
  }, [slug])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/profiles/${slug}`)
      if (res.status === 404) {
        router.push('/404')
        return
      }
      const data = await res.json()

      // Redirect hosts to host profile page
      if (data.profile.isHost) {
        router.replace(`/host/${slug}`)
        return
      }

      setProfile(data.profile)
      setIsFollowing(data.isFollowing)
      setIsOwnProfile(data.isOwnProfile)

      // Fetch attended activities
      if (data.profile.showActivitiesAttended || data.isOwnProfile) {
        fetchActivities()
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const res = await fetch(
        `/api/profiles/${slug}/activities?type=attended&limit=6`
      )
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/profiles/${slug}/follow`, { method: 'POST' })
      const data = await res.json()
      setIsFollowing(data.following)

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
    const url = `${window.location.origin}/user/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} on SweatBuddies`,
          text: `Check out ${profile?.name} on SweatBuddies!`,
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Profile Card */}
      <div className="max-w-lg mx-auto">
        <div className="bg-card rounded-3xl border p-8 text-center">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full border-4 border-primary overflow-hidden mx-auto">
            {profile.imageUrl ? (
              <Image
                src={profile.imageUrl}
                alt={profile.name || 'User'}
                width={112}
                height={112}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground">
                {profile.firstName?.[0] || profile.name?.[0] || '?'}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-foreground mt-5">
            {profile.name}
          </h1>

          {/* Headline */}
          {profile.headline && (
            <p className="text-muted-foreground mt-2">{profile.headline}</p>
          )}

          {/* Location */}
          {profile.location && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </div>
          )}

          {/* Member Since */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
            <Calendar className="h-3.5 w-3.5" />
            Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 py-5 border-y mt-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.attendedStats?.activitiesAttended || 0}
              </div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.followCounts?.followers || 0}
              </div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.followCounts?.following || 0}
              </div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-5">
            {!isOwnProfile && (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? 'outline' : 'default'}
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
              <Button asChild>
                <Link href="/settings/profile">Edit Profile</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Attended Activities */}
        {(profile.showActivitiesAttended || isOwnProfile) &&
          activities.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Activities Attended
              </h2>

              <div className="space-y-3">
                {activities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/activities/${activity.id}`}
                    className="flex gap-4 bg-card rounded-xl border p-4 hover:shadow-card transition-shadow"
                  >
                    {/* Activity Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {activity.imageUrl ? (
                        <Image
                          src={activity.imageUrl}
                          alt=""
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Activity Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {activity.title}
                      </h3>
                      {activity.host && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          by{' '}
                          {activity.host.firstName ||
                            activity.host.name?.split(' ')[0]}
                        </p>
                      )}
                      {activity.startTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(activity.startTime),
                            'MMM dd, yyyy'
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
