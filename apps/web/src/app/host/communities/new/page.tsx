'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardHeader } from '@/components/host/DashboardHeader'

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

export default function NewCommunityPage() {
  const router = useRouter()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a community name')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create community')
      }

      const data = await res.json()
      toast.success('Community created!')
      router.push(`/host/communities/${data.community.slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create community')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/host/communities"
            className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Communities
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Create Community</h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">Build your fitness tribe</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Basic Info</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Singapore Morning Runners"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people what your community is about..."
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                  >
                    {CITIES.map((city) => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
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
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Privacy</h2>

            <div className="space-y-3">
              {PRIVACY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                    formData.privacy === option.value
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    checked={formData.privacy === option.value}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                    className="w-4 h-4 text-neutral-900 dark:text-white focus:ring-neutral-900 dark:focus:ring-white"
                  />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Social Links (Optional)</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">@</span>
                  <input
                    type="text"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    placeholder="yourhandle"
                    className="w-full pl-8 pr-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Community Chat Link
                </label>
                <input
                  type="url"
                  value={formData.communityLink}
                  onChange={(e) => setFormData({ ...formData, communityLink: e.target.value })}
                  placeholder="WhatsApp, Telegram, or Discord link"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/host/communities"
              className="px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
