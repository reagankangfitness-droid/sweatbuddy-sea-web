'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import { CommunitySkeleton } from '@/components/host/CommunitySkeleton'
import { CommunityStats } from '@/components/host/community/CommunityStats'
import { MemberList } from '@/components/host/community/MemberList'
import { AtRiskAlert } from '@/components/host/community/AtRiskAlert'
import type { Member } from '@/components/host/community/MemberRow'
import { MessageSquare, X, Megaphone } from 'lucide-react'

interface HealthStats {
  totalMembers: number
  activeThisMonth: number
  retentionRate: number
  newMembers: number
}

interface Event {
  id: string
  name: string
  date: string | null
}

export default function CommunityPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [communityLink, setCommunityLink] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'attended'>('all')
  const [sort, setSort] = useState<'lastSeen' | 'events' | 'name'>('lastSeen')

  // Quick message modal
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageAudience, setMessageAudience] = useState<'all' | 'regulars'>('all')

  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementPinned, setAnnouncementPinned] = useState(false)
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [communitySlug, setCommunitySlug] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/sign-in?intent=host')
          return
        }

        // Fetch community data + health stats in parallel
        const params = new URLSearchParams({ filter, sort, search })
        const [communityRes, statsRes] = await Promise.all([
          fetch(`/api/host/community?${params}`),
          fetch('/api/host/community/stats'),
        ])

        if (!communityRes.ok) throw new Error('Failed to load community data')

        const communityData = await communityRes.json()
        setMembers(communityData.attendees || [])
        setEvents(communityData.events || [])
        setCommunityLink(communityData.communityLink || null)

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setHealthStats(statsData)
        }

        // Fetch community slug for announcements
        try {
          const slugRes = await fetch('/api/host/community/slug')
          if (slugRes.ok) {
            const slugData = await slugRes.json()
            setCommunitySlug(slugData.slug || null)
          }
        } catch {
          // Non-critical, announcement feature just won't be available
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, filter, sort, search])

  const sendAnnouncement = async () => {
    if (!communitySlug || !announcementContent.trim()) return
    setSendingAnnouncement(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: announcementContent.trim(),
          isPinned: announcementPinned,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send announcement')
      }
      toast.success('Announcement sent!')
      setShowAnnouncementModal(false)
      setAnnouncementContent('')
      setAnnouncementPinned(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send announcement')
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const generateMessage = () => {
    if (!communityLink) {
      return 'Hey! Join our community group for updates on upcoming experiences!'
    }
    return `Hey! Join our community group for updates on upcoming experiences: ${communityLink}`
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(generateMessage())
    toast.success('Message copied to clipboard!')
    setShowMessageModal(false)
  }

  if (isLoading) {
    return <CommunitySkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => { setError(''); setIsLoading(true) }}
            className="mt-4 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-sm hover:bg-neutral-700"
          >
            Retry
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">Your Community</h1>
            <p className="text-neutral-500">Members across all your experiences</p>
          </div>
          <div className="flex items-center gap-3">
            {communitySlug && (
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-neutral-900 text-sm font-semibold rounded-full hover:bg-amber-400 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                Send Announcement
              </button>
            )}
            <button
              onClick={() => setShowMessageModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-full hover:bg-neutral-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Quick Message
            </button>
          </div>
        </div>

        {/* Community Health Stats */}
        {healthStats && (
          <div className="mb-6">
            <CommunityStats
              totalMembers={healthStats.totalMembers}
              activeThisMonth={healthStats.activeThisMonth}
              retentionRate={healthStats.retentionRate}
              newMembers={healthStats.newMembers}
            />
          </div>
        )}

        {/* At-Risk Member Alerts */}
        {members.length > 0 && (
          <div className="mb-6">
            <AtRiskAlert members={members} />
          </div>
        )}

        {/* Member List */}
        <MemberList
          members={members}
          onMembersChange={setMembers}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          search={search}
          onSearchChange={setSearch}
        />
      </main>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-100">Send Announcement</h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
              Post an announcement visible to all community members on your community page.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Message
              </label>
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Write your announcement..."
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
              />
              <p className="text-xs text-neutral-500 mt-1 text-right">
                {announcementContent.length}/2000
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementPinned}
                  onChange={(e) => setAnnouncementPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-300">Pin this announcement</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-800 text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={sendAnnouncement}
                disabled={!announcementContent.trim() || sendingAnnouncement}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-neutral-900 text-sm font-medium rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingAnnouncement ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-100">Quick Message</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
              Generate a message to share with your community. Copy and paste into WhatsApp, Telegram, or any messaging app.
            </p>

            {/* Audience Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Select Audience
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-900">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={messageAudience === 'all'}
                    onChange={() => setMessageAudience('all')}
                    className="text-neutral-100"
                  />
                  <span className="text-sm text-neutral-100">
                    All members ({healthStats?.totalMembers || 0} people)
                  </span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-900">
                  <input
                    type="radio"
                    name="audience"
                    value="regulars"
                    checked={messageAudience === 'regulars'}
                    onChange={() => setMessageAudience('regulars')}
                    className="text-neutral-100"
                  />
                  <span className="text-sm text-neutral-100">
                    Regulars only ({members.filter((m) => m.status === 'regular').length} people with 5+ sessions)
                  </span>
                </label>
              </div>
            </div>

            {/* Message Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Message Preview
              </label>
              <div className="p-3 bg-neutral-900 rounded-lg text-sm text-neutral-300">
                {generateMessage()}
              </div>
              {!communityLink && (
                <p className="text-xs text-amber-400 mt-2">
                  Tip: Add a community link to your experiences for a better message!
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-800 text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={copyMessage}
                className="flex-1 px-4 py-2.5 bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-200"
              >
                Copy Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
