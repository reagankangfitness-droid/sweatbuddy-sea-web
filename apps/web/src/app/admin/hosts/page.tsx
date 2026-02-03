'use client'

import { useState } from 'react'
import {
  UserPlus,
  Calendar,
  Link2,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Instagram,
  Mail,
  User,
} from 'lucide-react'

type Tab = 'create-host' | 'create-event' | 'magic-link'

export default function AdminHostsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('create-host')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  // Create Host Form State
  const [hostEmail, setHostEmail] = useState('')
  const [hostName, setHostName] = useState('')
  const [hostInstagram, setHostInstagram] = useState('')

  // Create Event Form State
  const [eventHostEmail, setEventHostEmail] = useState('')
  const [eventHostInstagram, setEventHostInstagram] = useState('')
  const [eventHostName, setEventHostName] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventCategory, setEventCategory] = useState('Running')
  const [eventDay, setEventDay] = useState('Saturdays')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('7:00 AM')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventImageUrl, setEventImageUrl] = useState('')
  const [eventCommunityLink, setEventCommunityLink] = useState('')
  const [eventRecurring, setEventRecurring] = useState(true)
  const [eventAutoApprove, setEventAutoApprove] = useState(true)

  // Magic Link Form State
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hostEmail,
          name: hostName,
          instagram: hostInstagram,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message, data })
        // Pre-fill magic link email
        setMagicLinkEmail(hostEmail)
      } else {
        setResult({ success: false, message: data.error || 'Failed to create host' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/hosts/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostEmail: eventHostEmail,
          hostInstagram: eventHostInstagram,
          hostName: eventHostName,
          eventName,
          category: eventCategory,
          day: eventDay,
          eventDate: eventDate || null,
          time: eventTime,
          location: eventLocation,
          description: eventDescription,
          imageUrl: eventImageUrl || null,
          communityLink: eventCommunityLink || null,
          recurring: eventRecurring,
          autoApprove: eventAutoApprove,
          isFree: true,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message, data })
      } else {
        setResult({ success: false, message: data.error || 'Failed to create event' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    setGeneratedLink('')

    try {
      const res = await fetch('/api/admin/hosts/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicLinkEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        setGeneratedLink(data.magicLink)
        setResult({ success: true, message: data.message, data })
      } else {
        setResult({ success: false, message: data.error || 'Failed to generate link' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setResult({ success: true, message: 'Copied to clipboard!' })
  }

  const tabs = [
    { id: 'create-host' as Tab, label: 'Create Host', icon: UserPlus },
    { id: 'create-event' as Tab, label: 'Create Event', icon: Calendar },
    { id: 'magic-link' as Tab, label: 'Magic Link', icon: Link2 },
  ]

  const categories = [
    'Running', 'Yoga', 'HIIT', 'Pilates', 'Swimming', 'Cycling',
    'Strength', 'Dance', 'Boxing', 'CrossFit', 'Meditation', 'Other'
  ]

  const days = [
    'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays',
    'Fridays', 'Saturdays', 'Sundays'
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-neutral-900">
          Host Management
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Create host accounts, events, and generate sign-in links
        </p>
      </div>

      {/* Result Banner */}
      {result && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            result.success
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={result.success ? 'text-emerald-800' : 'text-red-800'}>
              {result.message}
            </p>
            {result.data?.eventUrl && (
              <a
                href={result.data.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-700 hover:text-emerald-900"
              >
                View event <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setResult(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        {/* Create Host Tab */}
        {activeTab === 'create-host' && (
          <form onSubmit={handleCreateHost} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Host Email *
              </label>
              <input
                type="email"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                placeholder="host@example.com"
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram Handle *
              </label>
              <input
                type="text"
                value={hostInstagram}
                onChange={(e) => setHostInstagram(e.target.value)}
                placeholder="runalone_runningclub"
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Display Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Run Alone Running Club"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Create Host Account
            </button>

            <p className="text-xs text-neutral-500">
              This creates a Clerk account + database records. The host can sign in immediately.
            </p>
          </form>
        )}

        {/* Create Event Tab */}
        {activeTab === 'create-event' && (
          <form onSubmit={handleCreateEvent} className="space-y-4 max-w-lg">
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Host Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Host Email *
                  </label>
                  <input
                    type="email"
                    value={eventHostEmail}
                    onChange={(e) => setEventHostEmail(e.target.value)}
                    placeholder="host@example.com"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Instagram Handle *
                  </label>
                  <input
                    type="text"
                    value={eventHostInstagram}
                    onChange={(e) => setEventHostInstagram(e.target.value)}
                    placeholder="runningclub"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Host Name
                </label>
                <input
                  type="text"
                  value={eventHostName}
                  onChange={(e) => setEventHostName(e.target.value)}
                  placeholder="Running Club SG"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                />
              </div>
            </div>

            <h3 className="font-semibold text-neutral-900">Event Details</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Saturday Morning Run"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category *
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Day *
                </label>
                <select
                  value={eventDay}
                  onChange={(e) => setEventDay(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="7:00 AM"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Specific Date (optional)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="East Coast Park, Car Park C"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Join us for a casual morning run..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={eventImageUrl}
                onChange={(e) => setEventImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Direct URL to an image (from Instagram, Google Drive, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Community Link
              </label>
              <input
                type="url"
                value={eventCommunityLink}
                onChange={(e) => setEventCommunityLink(e.target.value)}
                placeholder="https://instagram.com/runningclub or WhatsApp group link"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white text-neutral-900 placeholder:text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Link to Instagram, WhatsApp group, or community page
              </p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={eventRecurring}
                  onChange={(e) => setEventRecurring(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Recurring weekly
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={eventAutoApprove}
                  onChange={(e) => setEventAutoApprove(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Auto-approve
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              Create Event
            </button>
          </form>
        )}

        {/* Magic Link Tab */}
        {activeTab === 'magic-link' && (
          <div className="max-w-md">
            <form onSubmit={handleGenerateMagicLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Host Email *
                </label>
                <input
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="host@example.com"
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-neutral-900 placeholder:text-neutral-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Generate Magic Link
              </button>
            </form>

            {generatedLink && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm font-medium text-emerald-800 mb-2">
                  Magic sign-in link generated!
                </p>
                <div className="bg-white border border-emerald-200 rounded-lg p-3 break-all text-xs text-neutral-700 mb-3">
                  {generatedLink}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedLink)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Link
                  </button>
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Test Link
                  </a>
                </div>
                <p className="text-xs text-emerald-600 mt-3">
                  Send this link to the host. They can sign in directly without a password.
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-neutral-100 rounded-xl">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">How it works:</h4>
              <ol className="text-xs text-neutral-600 space-y-1 list-decimal list-inside">
                <li>Enter the host&apos;s email address</li>
                <li>Click &quot;Generate Magic Link&quot;</li>
                <li>Send the link to the host via email/message</li>
                <li>Host clicks the link → signed in automatically</li>
                <li>Host can access their dashboard at /host/dashboard</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
