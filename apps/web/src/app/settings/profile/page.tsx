'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  MapPin,
  Globe,
  Instagram,
  Save,
  Camera,
  X,
  Loader2,
  ExternalLink,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CategoryPicker } from '@/components/category-picker'
import { toast } from 'sonner'

interface Profile {
  id: string
  name: string | null
  firstName: string | null
  username: string | null
  slug: string | null
  email: string
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
  isPublic: boolean
  showActivitiesAttended: boolean
  showStats: boolean
  specialties: string[]
  certifications: string[]
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    username: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    tiktok: '',
    isPublic: true,
    showActivitiesAttended: true,
    showStats: true,
    specialties: [] as string[],
    certifications: [] as string[]
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
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
        headline: data.profile.headline || '',
        bio: data.profile.bio || '',
        location: data.profile.location || '',
        website: data.profile.website || '',
        instagram: data.profile.instagram || '',
        twitter: data.profile.twitter || '',
        linkedin: data.profile.linkedin || '',
        tiktok: data.profile.tiktok || '',
        isPublic: data.profile.isPublic ?? true,
        showActivitiesAttended: data.profile.showActivitiesAttended ?? true,
        showStats: data.profile.showStats ?? true,
        specialties: data.profile.specialties || [],
        certifications: data.profile.certifications || []
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      toast.success('Profile saved!')
      setProfile(data.profile)
    } catch (error) {
      console.error('Save error:', error)
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const addCertification = () => {
    const cert = prompt('Enter certification (e.g., "Les Mills BODYPUMP")')
    if (cert?.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, cert.trim()]
      }))
    }
  }

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Edit Profile
          </h1>
          {profile?.slug && (
            <Link
              href={profile.isHost ? `/host/${profile.slug}` : `/user/${profile.slug}`}
              target="_blank"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View Profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-card rounded-2xl border p-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {profile?.imageUrl ? (
                  <Image
                    src={profile.imageUrl}
                    alt=""
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                    {formData.firstName?.[0] || formData.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div>
                <Button type="button" variant="outline" size="sm" disabled>
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Photo is managed through your account settings
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-card rounded-2xl border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="First name (shown publicly)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  id="username"
                  className="rounded-l-none"
                  value={formData.username}
                  onChange={(e) =>
                    handleChange(
                      'username',
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    )
                  }
                  placeholder="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                sweatbuddies.co/{profile?.isHost ? 'host' : 'user'}/
                {formData.username || 'username'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="e.g., Les Mills Instructor | Fitness Coach"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.headline.length}/200
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell people about yourself, your fitness journey, and what you offer..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Singapore"
                />
              </div>
            </div>
          </div>

          {/* Host Information */}
          {profile?.isHost && (
            <div className="bg-card rounded-2xl border p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">
                Host Information
              </h2>

              <div className="space-y-2">
                <Label>Specialties</Label>
                <CategoryPicker
                  value={formData.specialties}
                  onChange={(value) =>
                    handleChange(
                      'specialties',
                      Array.isArray(value) ? value : [value]
                    )
                  }
                  multiple={true}
                  placeholder="Select your activity specialties"
                />
                <p className="text-xs text-muted-foreground">
                  What types of activities do you host?
                </p>
              </div>

              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg"
                    >
                      <Award className="h-3.5 w-3.5" />
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="hover:text-emerald-900 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={addCertification}
                    className="text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 border border-dashed px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Add Certification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="bg-card rounded-2xl border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">
              Social Links
            </h2>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  className="pl-10"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground">
                  <Instagram className="h-4 w-4" />
                </span>
                <Input
                  id="instagram"
                  className="rounded-l-none"
                  value={formData.instagram}
                  onChange={(e) =>
                    handleChange('instagram', e.target.value.replace('@', ''))
                  }
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">X (Twitter)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </span>
                <Input
                  id="twitter"
                  className="rounded-l-none"
                  value={formData.twitter}
                  onChange={(e) =>
                    handleChange('twitter', e.target.value.replace('@', ''))
                  }
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <Input
                  id="linkedin"
                  type="url"
                  className="pl-10"
                  value={formData.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Privacy</h2>

            <label className="flex items-center justify-between py-3 border-b cursor-pointer">
              <div>
                <div className="font-medium text-foreground">Public Profile</div>
                <div className="text-sm text-muted-foreground">
                  Allow anyone to view your profile
                </div>
              </div>
              <input
                type="checkbox"
                className="w-11 h-6 bg-muted rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform after:shadow checked:after:translate-x-5"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between py-3 border-b cursor-pointer">
              <div>
                <div className="font-medium text-foreground">
                  Show Activities Attended
                </div>
                <div className="text-sm text-muted-foreground">
                  Display activities you have joined on your profile
                </div>
              </div>
              <input
                type="checkbox"
                className="w-11 h-6 bg-muted rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform after:shadow checked:after:translate-x-5"
                checked={formData.showActivitiesAttended}
                onChange={(e) =>
                  handleChange('showActivitiesAttended', e.target.checked)
                }
              />
            </label>

            {profile?.isHost && (
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <div className="font-medium text-foreground">
                    Show Statistics
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Display host stats like total events and attendees
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-11 h-6 bg-muted rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform after:shadow checked:after:translate-x-5"
                  checked={formData.showStats}
                  onChange={(e) => handleChange('showStats', e.target.checked)}
                />
              </label>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-4">
            <Button type="submit" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
