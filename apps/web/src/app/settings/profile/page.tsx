'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Loader2, ExternalLink, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  name: string | null
  firstName: string | null
  username: string | null
  slug: string | null
  email: string
  imageUrl: string | null
  bio: string | null
  instagram: string | null
  isHost: boolean
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    username: '',
    bio: '',
    instagram: '',
  })

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/profile')
      if (res.status === 401) {
        router.push('/sign-in')
        return
      }
      const data = await res.json()
      setProfile(data.profile)
      setFormData({
        name: data.profile.name || '',
        firstName: data.profile.firstName || '',
        username: data.profile.username || '',
        bio: data.profile.bio || '',
        instagram: data.profile.instagram || '',
      })
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('Profile saved!')
      setProfile(data.profile)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </button>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Edit Profile</h1>
            </div>
            {profile?.slug && (
              <Link
                href={`/user/${profile.slug}`}
                target="_blank"
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-24 px-4">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
              {profile?.imageUrl ? (
                <Image
                  src={profile.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-400">
                  {formData.firstName?.[0] || formData.name?.[0] || '?'}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file || !clerkUser) return
                setUploadingPhoto(true)
                try {
                  await clerkUser.setProfileImage({ file })
                  toast.success('Photo updated!')
                  fetchProfile()
                } catch {
                  toast.error('Failed to upload photo')
                }
                setUploadingPhoto(false)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4" />
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          {/* Fields */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
            {/* Display Name */}
            <div className="px-4 py-3">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Display Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full mt-1 text-sm text-neutral-900 dark:text-white bg-transparent outline-none placeholder-neutral-400"
              />
            </div>

            {/* Username */}
            <div className="px-4 py-3">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Username</label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-neutral-400">@</span>
                <input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    }))
                  }
                  placeholder="username"
                  className="flex-1 text-sm text-neutral-900 dark:text-white bg-transparent outline-none placeholder-neutral-400"
                />
              </div>
            </div>

            {/* Instagram */}
            <div className="px-4 py-3">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Instagram Handle</label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-neutral-400">@</span>
                <input
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      instagram: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
                    }))
                  }
                  placeholder="instagram_handle"
                  className="flex-1 text-sm text-neutral-900 dark:text-white bg-transparent outline-none placeholder-neutral-400"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">Required to manage events you host</p>
            </div>

            {/* Bio */}
            <div className="px-4 py-3">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people about yourself..."
                rows={3}
                maxLength={300}
                className="w-full mt-1 text-sm text-neutral-900 dark:text-white bg-transparent outline-none placeholder-neutral-400 resize-none"
              />
              <p className="text-right text-[10px] text-neutral-400">{formData.bio.length}/300</p>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </main>
    </div>
  )
}
