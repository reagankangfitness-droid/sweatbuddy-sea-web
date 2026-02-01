'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Users,
  Calendar,
  Settings,
  Instagram,
  Globe,
  MessageCircle,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Crown,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/host/DashboardHeader'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  category: string
  city: string
  privacy: string
  memberCount: number
  eventCount: number
  isVerified: boolean
  instagramHandle: string | null
  websiteUrl: string | null
  communityLink: string | null
  createdAt: string
}

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    imageUrl: string | null
    username: string | null
  }
}

type Tab = 'overview' | 'members' | 'settings'

export default function ManageCommunityPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [communityRes, membersRes] = await Promise.all([
          fetch(`/api/communities/${slug}`),
          fetch(`/api/communities/${slug}/members`),
        ])

        if (communityRes.ok) {
          const data = await communityRes.json()
          setCommunity(data.community)
        }

        if (membersRes.ok) {
          const data = await membersRes.json()
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch community:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const copyInviteLink = () => {
    const link = `${window.location.origin}/communities/${slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/communities/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Community deleted')
        router.push('/host/communities')
      } else {
        throw new Error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete community')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const member = members.find((m) => m.id === memberId)
      if (!member) return

      const res = await fetch(`/api/communities/${slug}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })

      if (res.ok) {
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
        toast.success('Role updated')
      }
    } catch {
      toast.error('Failed to update role')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const member = members.find((m) => m.id === memberId)
      if (!member) return

      const res = await fetch(`/api/communities/${slug}/members?userId=${member.userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId))
        toast.success('Member removed')
      }
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <DashboardHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-pulse">
            <span className="text-4xl mb-4 block">🏠</span>
            <p className="text-neutral-400 dark:text-neutral-500">Loading community...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <DashboardHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Community not found</h1>
            <Link href="/host/communities" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to communities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Link */}
        <Link
          href="/host/communities"
          className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </Link>

        {/* Community Header Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 relative">
            {community.coverImage && (
              <Image src={community.coverImage} alt="" fill className="object-cover opacity-60" />
            )}
          </div>

          {/* Info */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{community.name}</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                  {community.city} · {community.category}
                </p>
              </div>
              <Link
                href={`/communities/${community.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                View Public Page
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 mt-4">
              <span className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Users className="w-4 h-4" />
                {community.memberCount} members
              </span>
              <span className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Calendar className="w-4 h-4" />
                {community.eventCount} events
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full capitalize">
                {community.privacy.toLowerCase()}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Invite Link'}
              </button>
              <Link
                href={`/host/events/new?communityId=${community.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                activeTab === tab.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-3">About</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                {community.description || 'No description yet.'}
              </p>
            </div>

            {/* Links */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Links</h2>
              <div className="space-y-3">
                {community.instagramHandle && (
                  <a
                    href={`https://instagram.com/${community.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <Instagram className="w-5 h-5" />
                    @{community.instagramHandle}
                  </a>
                )}
                {community.websiteUrl && (
                  <a
                    href={community.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <Globe className="w-5 h-5" />
                    {community.websiteUrl}
                  </a>
                )}
                {community.communityLink && (
                  <a
                    href={community.communityLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Community Chat
                  </a>
                )}
                {!community.instagramHandle && !community.websiteUrl && !community.communityLink && (
                  <p className="text-neutral-400 dark:text-neutral-500">No links added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900 dark:text-white">Members ({members.length})</h2>
            </div>

            {members.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">No members yet</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        {member.user.imageUrl ? (
                          <Image
                            src={member.user.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {member.user.name || member.user.username || 'Unknown'}
                          </span>
                          {member.role === 'OWNER' && (
                            <Crown className="w-4 h-4 text-amber-500" />
                          )}
                          {member.role === 'ADMIN' && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                          {member.role.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {member.role !== 'OWNER' && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value)}
                          className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Edit Link */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Edit Community</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">Update your community details, description, and settings.</p>
              <Link
                href={`/host/communities/${slug}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300"
              >
                <Settings className="w-4 h-4" />
                Edit Community
              </Link>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4 sm:p-6">
              <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Deleting your community will remove all members and cannot be undone.
              </p>

              {showDeleteConfirm ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Community
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
