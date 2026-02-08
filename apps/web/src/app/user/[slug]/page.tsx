'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Calendar,
  Users,
  Share2,
  Loader2,
  Lock,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'

interface ProfileUser {
  id: string
  slug: string
  name: string | null
  firstName: string | null
  imageUrl: string | null
  bio: string | null
  headline: string | null
  location: string | null
  website: string | null
  instagram: string | null
  twitter: string | null
  createdAt: string
  isPublic: boolean
}

interface EventStats {
  eventsAttended: number
  communitiesHosted: number
  totalEventsHosted: number
}

interface ProfileData {
  user: ProfileUser
  stats: EventStats | null
  summary: string | null
  isOwnProfile: boolean
  isPrivate: boolean
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/profile/${slug}`)
      if (res.status === 404) {
        setError('Profile not found')
        setLoading(false)
        return
      }
      if (!res.ok) {
        throw new Error('Failed to fetch profile')
      }
      const profileData = await res.json()
      setData(profileData)
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchProfile()
    }
  }, [slug, fetchProfile])

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${slug}`
    const name = data?.user?.name || 'This user'

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} on SweatBuddies`,
          text: `Check out ${name} on SweatBuddies!`,
          url,
        })
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">{error || 'Profile not found'}</p>
        <Link
          href="/"
          className="text-neutral-900 font-medium hover:underline"
        >
          Go back home
        </Link>
      </div>
    )
  }

  const { user, stats, summary, isOwnProfile, isPrivate } = data

  // Private profile view
  if (isPrivate) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
          </div>
        </header>

        <main className="pt-24 px-4 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-neutral-100">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.name || 'User'}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-3xl font-bold text-white">
                {user.name?.[0] || '?'}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {user.firstName || user.name?.split(' ')[0] || 'User'}
          </h2>
          <div className="flex items-center gap-2 text-neutral-500">
            <Lock className="h-4 w-4" />
            <p>This profile is private</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <Share2 className="w-5 h-5 text-neutral-700" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-4 border-neutral-100 overflow-hidden mx-auto">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.name || 'User'}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-4xl font-bold text-white">
                  {user.firstName?.[0] || user.name?.[0] || '?'}
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-neutral-900 mt-5">
              {user.name}
            </h1>

            {/* Headline */}
            {user.headline && (
              <p className="text-neutral-600 mt-2">{user.headline}</p>
            )}

            {/* Location */}
            {user.location && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-500 mt-2">
                <MapPin className="h-4 w-4" />
                {user.location}
              </div>
            )}

            {/* Member Since */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mt-2">
              <Calendar className="h-3.5 w-3.5" />
              Member since {formatDate(user.createdAt)}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Summary */}
            {summary && (
              <p className="text-sm font-medium text-neutral-700 mt-4 py-3 px-4 bg-neutral-50 rounded-xl">
                {summary}
              </p>
            )}

            {/* Stats */}
            {stats && (
              <div className="flex justify-center gap-8 py-5 border-t border-neutral-100 mt-5">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">
                    {stats.eventsAttended}
                  </div>
                  <div className="text-xs text-neutral-500">Events Attended</div>
                </div>
                {stats.communitiesHosted > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {stats.communitiesHosted}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {stats.communitiesHosted === 1 ? 'Community' : 'Communities'}
                    </div>
                  </div>
                )}
                {stats.totalEventsHosted > 0 && stats.totalEventsHosted !== stats.communitiesHosted && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {stats.totalEventsHosted}
                    </div>
                    <div className="text-xs text-neutral-500">Events Hosted</div>
                  </div>
                )}
              </div>
            )}

            {/* Social Links */}
            {(user.instagram || user.twitter || user.website) && (
              <div className="flex justify-center gap-4 pt-4 border-t border-neutral-100 mt-4">
                {user.instagram && (
                  <a
                    href={`https://instagram.com/${user.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    @{user.instagram}
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={`https://x.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    @{user.twitter}
                  </a>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Website
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 mt-6">
              {isOwnProfile && (
                <Link
                  href="/settings/profile"
                  className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && (
                <Link
                  href="/#events"
                  className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-700 transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Find Events
                </Link>
              )}
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              ← Back to SweatBuddies
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
