'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Calendar,
  Share2,
  Loader2,
  Lock,
  ExternalLink,
  ArrowLeft,
  X,
  UserPlus,
  UserCheck,
} from 'lucide-react'
import { getCategoryDisplay } from '@/lib/categories'

// ——— Types ———

interface CommunityCard {
  name: string
  slug: string
  logoImage: string | null
  category: string
  memberCount: number
}

interface EventCard {
  id: string
  title: string
  startTime: string
  city: string | null
  imageUrl: string | null
  categorySlug: string | null
}

interface FollowCounts {
  followers: number
  following: number
}

interface AttendedStats {
  activitiesAttended: number
  uniqueHosts: number
}

interface ProfileData {
  profile: {
    id: string
    slug: string
    name: string | null
    firstName: string | null
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
    fitnessInterests: string[]
    goingSolo: boolean
    followCounts: FollowCounts
    attendedStats: AttendedStats | null
    hostStats: Record<string, number> | null
    createdAt: string
  }
  communities: CommunityCard[]
  upcomingEvents: EventCard[]
  isOwnProfile: boolean
  isFollowing: boolean
}

interface FollowerUser {
  id: string
  name: string | null
  firstName: string | null
  imageUrl: string | null
  slug: string | null
  isFollowing: boolean
}

// ——— Component ———

export default function UserProfilePage() {
  const params = useParams()
  const slug = params.slug as string

  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [localFollowing, setLocalFollowing] = useState(false)
  const [localFollowCounts, setLocalFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 })

  // Modal state
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null)
  const [modalUsers, setModalUsers] = useState<FollowerUser[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${slug}`)
      if (res.status === 404) {
        setError('Profile not found')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch profile')
      const profileData: ProfileData = await res.json()
      setData(profileData)
      setLocalFollowing(profileData.isFollowing)
      setLocalFollowCounts(profileData.profile.followCounts)
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) fetchProfile()
  }, [slug, fetchProfile])

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${slug}`
    const name = data?.profile?.name || 'This user'
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} on SweatBuddies`, text: `Check out ${name} on SweatBuddies!`, url })
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  const handleFollow = async () => {
    if (!data || followLoading) return
    setFollowLoading(true)
    try {
      const res = await fetch(`/api/profiles/${slug}/follow`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setLocalFollowing(result.following)
      setLocalFollowCounts(prev => ({
        ...prev,
        followers: result.following ? prev.followers + 1 : prev.followers - 1,
      }))
    } catch {
      // ignore
    } finally {
      setFollowLoading(false)
    }
  }

  const openModal = async (type: 'followers' | 'following') => {
    setModalType(type)
    setModalUsers([])
    setModalLoading(true)
    try {
      const res = await fetch(`/api/profiles/${slug}/${type}?limit=20`)
      if (res.ok) {
        const json = await res.json()
        setModalUsers(json.users)
      }
    } catch { /* ignore */ }
    setModalLoading(false)
  }

  const handleModalFollow = async (targetSlug: string, targetId: string) => {
    try {
      const res = await fetch(`/api/profiles/${targetSlug}/follow`, { method: 'POST' })
      if (!res.ok) return
      const result = await res.json()
      setModalUsers(prev => prev.map(u => u.id === targetId ? { ...u, isFollowing: result.following } : u))
    } catch { /* ignore */ }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  // ——— Loading ———
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // ——— Error ———
  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">{error || 'Profile not found'}</p>
        <Link href="/" className="text-neutral-900 font-medium hover:underline">Go back home</Link>
      </div>
    )
  }

  const { profile, communities, upcomingEvents, isOwnProfile } = data

  // ——— Private profile ———
  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
          </div>
        </header>
        <main className="pt-24 px-4 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-neutral-100">
            {profile.imageUrl ? (
              <Image src={profile.imageUrl} alt={profile.name || 'User'} width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-3xl font-bold text-white">
                {profile.name?.[0] || '?'}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {profile.firstName || profile.name?.split(' ')[0] || 'User'}
          </h2>
          <div className="flex items-center gap-2 text-neutral-500">
            <Lock className="h-4 w-4" />
            <p>This profile is private</p>
          </div>
        </main>
      </div>
    )
  }

  // ——— Public profile ———
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors">
            <Share2 className="w-5 h-5 text-neutral-700" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-4 border-neutral-100 overflow-hidden mx-auto">
              {profile.imageUrl ? (
                <Image src={profile.imageUrl} alt={profile.name || 'User'} width={112} height={112} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-4xl font-bold text-white">
                  {profile.firstName?.[0] || profile.name?.[0] || '?'}
                </div>
              )}
            </div>

            {/* Name + headline */}
            <h1 className="text-2xl font-bold text-neutral-900 mt-4">{profile.name}</h1>
            {profile.headline && <p className="text-neutral-600 mt-1">{profile.headline}</p>}

            {/* Stats row */}
            <div className="flex justify-center gap-6 mt-4">
              {profile.attendedStats && (
                <div className="text-center">
                  <div className="text-lg font-bold text-neutral-900">{profile.attendedStats.activitiesAttended}</div>
                  <div className="text-xs text-neutral-500">events</div>
                </div>
              )}
              <button onClick={() => openModal('followers')} className="text-center hover:opacity-70 transition-opacity">
                <div className="text-lg font-bold text-neutral-900">{localFollowCounts.followers}</div>
                <div className="text-xs text-neutral-500">followers</div>
              </button>
              <button onClick={() => openModal('following')} className="text-center hover:opacity-70 transition-opacity">
                <div className="text-lg font-bold text-neutral-900">{localFollowCounts.following}</div>
                <div className="text-xs text-neutral-500">following</div>
              </button>
            </div>

            {/* Follow button */}
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  localFollowing
                    ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    : 'bg-neutral-900 text-white hover:bg-neutral-700'
                }`}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : localFollowing ? (
                  <><UserCheck className="w-4 h-4" /> Following</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Follow</>
                )}
              </button>
            )}

            {/* Edit profile link for own profile */}
            {isOwnProfile && (
              <Link
                href="/settings/profile"
                className="block w-full mt-4 py-2.5 rounded-xl font-semibold text-sm text-center bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Edit Profile
              </Link>
            )}

            {/* Going Solo badge */}
            {profile.goingSolo && (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                <span>&#x1f44b;</span> Going Solo
              </div>
            )}

            {/* Location + Member since */}
            <div className="mt-4 space-y-1">
              {profile.location && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(profile.createdAt)}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-neutral-600 mt-4 leading-relaxed text-left">{profile.bio}</p>
            )}

            {/* Fitness Interests */}
            {profile.fitnessInterests && profile.fitnessInterests.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {profile.fitnessInterests.map(slug => {
                    const cat = getCategoryDisplay(slug)
                    return (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          borderColor: cat.color + '40',
                          backgroundColor: cat.color + '10',
                          color: cat.color,
                        }}
                      >
                        {cat.emoji} {cat.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(profile.instagram || profile.twitter || profile.linkedin || profile.tiktok || profile.website) && (
              <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-neutral-100 mt-4">
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    @{profile.instagram}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    @{profile.twitter}
                  </a>
                )}
                {profile.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    LinkedIn
                  </a>
                )}
                {profile.tiktok && (
                  <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    TikTok
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Communities Section */}
          {communities.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">Communities</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {communities.map(community => (
                  <Link
                    key={community.slug}
                    href={`/community/${community.slug}`}
                    className="flex-shrink-0 w-28 text-center group"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto bg-neutral-100 border border-neutral-200">
                      {community.logoImage ? (
                        <Image src={community.logoImage} alt={community.name} width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {getCategoryDisplay(community.category).emoji}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-neutral-900 mt-1.5 truncate group-hover:text-neutral-600">{community.name}</p>
                    <p className="text-[10px] text-neutral-400">{community.memberCount} members</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">Upcoming Events</h2>
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const cat = event.categorySlug ? getCategoryDisplay(event.categorySlug) : null
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        {event.imageUrl ? (
                          <Image src={event.imageUrl} alt={event.title} width={56} height={56} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            {cat?.emoji || '🏃'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-600">{event.title}</p>
                        <p className="text-xs text-neutral-500">{formatEventDate(event.startTime)}</p>
                        {event.city && <p className="text-xs text-neutral-400">{event.city}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center pt-4">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              &larr; Back to SweatBuddies
            </Link>
          </div>
        </div>
      </main>

      {/* Follower/Following Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setModalType(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-lg font-semibold text-neutral-900 capitalize">{modalType}</h3>
              <button onClick={() => setModalType(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-4">
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : modalUsers.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">No {modalType} yet</p>
              ) : (
                <div className="space-y-3">
                  {modalUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Link href={`/user/${user.slug}`} onClick={() => setModalType(null)} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
                          {user.imageUrl ? (
                            <Image src={user.imageUrl} alt={user.name || ''} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-sm font-bold text-white">
                              {user.firstName?.[0] || user.name?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900 truncate">{user.name || user.firstName || 'User'}</span>
                      </Link>
                      {user.slug && (
                        <button
                          onClick={() => handleModalFollow(user.slug!, user.id)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            user.isFollowing
                              ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              : 'bg-neutral-900 text-white hover:bg-neutral-700'
                          }`}
                        >
                          {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
