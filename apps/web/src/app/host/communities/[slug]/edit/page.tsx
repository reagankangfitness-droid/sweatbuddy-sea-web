'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'running', label: 'Running', emoji: '🏃' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘' },
  { value: 'gym', label: 'Gym & Fitness', emoji: '💪' },
  { value: 'cycling', label: 'Cycling', emoji: '🚴' },
  { value: 'swimming', label: 'Swimming', emoji: '🏊' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'martial-arts', label: 'Martial Arts', emoji: '🥋' },
  { value: 'dance', label: 'Dance', emoji: '💃' },
  { value: 'crossfit', label: 'CrossFit', emoji: '🏋️' },
  { value: 'climbing', label: 'Climbing', emoji: '🧗' },
  { value: 'wellness', label: 'Wellness', emoji: '🧖' },
  { value: 'other', label: 'Other', emoji: '🌟' },
]

const CITIES = [
  { value: 'Singapore', label: 'Singapore 🇸🇬' },
  { value: 'Bangkok', label: 'Bangkok 🇹🇭' },
  { value: 'Kuala Lumpur', label: 'Kuala Lumpur 🇲🇾' },
  { value: 'Jakarta', label: 'Jakarta 🇮🇩' },
  { value: 'Manila', label: 'Manila 🇵🇭' },
  { value: 'Ho Chi Minh City', label: 'Ho Chi Minh City 🇻🇳' },
  { value: 'Bali', label: 'Bali 🏝️' },
]

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', description: 'Anyone can join' },
  { value: 'PRIVATE', label: 'Private', description: 'Must request to join' },
  { value: 'INVITE_ONLY', label: 'Invite Only', description: 'Only via invite link' },
]

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  category: string
  privacy: string
  instagramHandle: string | null
  websiteUrl: string | null
  communityLink: string | null
}

export default function EditCommunityPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: 'Singapore',
    category: 'running',
    privacy: 'PUBLIC',
    instagramHandle: '',
    websiteUrl: '',
    communityLink: '',
  })

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch(`/api/communities/${slug}`)
        if (res.ok) {
          const data = await res.json()
          const c = data.community as Community
          setFormData({
            name: c.name || '',
            description: c.description || '',
            city: c.city || 'Singapore',
            category: c.category || 'running',
            privacy: c.privacy || 'PUBLIC',
            instagramHandle: c.instagramHandle || '',
            websiteUrl: c.websiteUrl || '',
            communityLink: c.communityLink || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch community:', error)
        toast.error('Failed to load community')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCommunity()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a community name')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/communities/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update community')
      }

      toast.success('Community updated!')
      router.push(`/host/communities/${slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update community')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/host/communities/${slug}`}
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Community</h1>
          <p className="text-neutral-500 mt-1">Update your community details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Basic Info</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Singapore Morning Runners"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people what your community is about..."
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
                  >
                    {CITIES.map((city) => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Privacy</h2>

            <div className="space-y-3">
              {PRIVACY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                    formData.privacy === option.value
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    checked={formData.privacy === option.value}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                    className="w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">{option.label}</div>
                    <div className="text-sm text-neutral-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Social Links (Optional)</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                  <input
                    type="text"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    placeholder="yourhandle"
                    className="w-full pl-8 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Community Chat Link
                </label>
                <input
                  type="url"
                  value={formData.communityLink}
                  onChange={(e) => setFormData({ ...formData, communityLink: e.target.value })}
                  placeholder="WhatsApp, Telegram, or Discord link"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/host/communities/${slug}`}
              className="px-6 py-3 text-neutral-600 font-medium hover:text-neutral-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
