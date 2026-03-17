'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Plus, Pencil, X, Power, ImagePlus } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'
import { toast } from 'sonner'

interface AdminCommunity {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  coverImage: string | null
  logoImage: string | null
  instagramHandle: string | null
  websiteUrl: string | null
  communityLink: string | null
  memberCount: number
  eventCount: number
  isActive: boolean
  isSeeded: boolean
  claimableBy: string | null
  claimedAt: string | null
  claimedById: string | null
  createdAt: string
  city: { name: string } | null
  createdBy: { name: string } | null
}

interface CommunityForm {
  name: string
  category: string
  description: string
  city: string
  logoImage: string
  coverImage: string
  instagramHandle: string
  websiteUrl: string
  communityLink: string
}

const emptyForm: CommunityForm = {
  name: '',
  category: '',
  description: '',
  city: 'Singapore',
  logoImage: '',
  coverImage: '',
  instagramHandle: '',
  websiteUrl: '',
  communityLink: '',
}

const categories = [
  'Run Club', 'Running', 'Cycling', 'HIIT', 'Swimming', 'Dance Fitness',
  'Strength Training', 'Bootcamp', 'CrossFit', 'Hyrox', 'Functional Fitness',
  'Yoga', 'Pilates', 'Breathwork', 'Meditation',
  'Hiking', 'Climbing', 'Outdoor Fitness', 'Outdoor',
  'Volleyball', 'Pickleball', 'Tennis', 'Badminton', 'Basketball',
  'Cold Plunge', 'Sauna', 'Sound Bath', 'Wellness Circle',
  'Fitness Social', 'Sweat Date', 'Corporate Wellness',
  'Workshop', 'Retreat', 'Fitness Festival', 'Other',
]

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<AdminCommunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CommunityForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing('activityImage')

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be under 8MB')
      return
    }
    const setUploading = type === 'logo' ? setLogoUploading : setCoverUploading
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) {
        setForm(prev => ({ ...prev, [type === 'logo' ? 'logoImage' : 'coverImage']: res[0].url }))
        toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} uploaded`)
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/communities')
      if (!res.ok) throw new Error('Failed to fetch communities')
      const data = await res.json()
      setCommunities(data.communities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCommunities() }, [fetchCommunities])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleOpenEdit = (c: AdminCommunity) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      category: c.category,
      description: c.description || '',
      city: c.city?.name || 'Singapore',
      logoImage: c.logoImage || '',
      coverImage: c.coverImage || '',
      instagramHandle: c.instagramHandle || '',
      websiteUrl: c.websiteUrl || '',
      communityLink: c.communityLink || '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.name || !form.category) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/communities/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to update community')
      } else {
        const res = await fetch('/api/admin/communities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to create community')
      }
      handleCloseForm()
      await fetchCommunities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? This will hide it from listings.`)) return
    try {
      const res = await fetch(`/api/admin/communities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate')
      await fetchCommunities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deactivate failed')
    }
  }

  const total = communities.length
  const seeded = communities.filter((c) => c.isSeeded).length
  const claimed = communities.filter((c) => c.claimedAt).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Communities</h1>
          <p className="text-neutral-500 mt-1">
            {total} total &nbsp;&middot;&nbsp; {seeded} seeded &nbsp;&middot;&nbsp; {claimed} claimed
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-xl hover:bg-neutral-200 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Community
        </button>
      </div>

      {/* Modal / Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-100">
                {editingId ? 'Edit Community' : 'Add Community'}
              </h2>
              <button onClick={handleCloseForm} className="text-neutral-400 hover:text-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Community name"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white resize-none"
                  placeholder="Community description"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Singapore"
                />
              </div>

              {/* Logo Image */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Logo Image</label>
                {form.logoImage ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logoImage} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-neutral-700" />
                    <button type="button" onClick={() => setForm({ ...form, logoImage: '' })} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                    className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-600 flex flex-col items-center justify-center text-neutral-500 hover:border-neutral-400 hover:text-neutral-400 transition-colors"
                  >
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'logo'); if (logoInputRef.current) logoInputRef.current.value = '' }} />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Cover Image</label>
                {form.coverImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="Cover" className="w-full h-28 rounded-lg object-cover border border-neutral-700" />
                    <button type="button" onClick={() => setForm({ ...form, coverImage: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={coverUploading}
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-28 rounded-lg border-2 border-dashed border-neutral-600 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:border-neutral-400 hover:text-neutral-400 transition-colors"
                  >
                    {coverUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-5 h-5" /><span className="text-xs">Upload cover</span></>}
                  </button>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'cover'); if (coverInputRef.current) coverInputRef.current.value = '' }} />
              </div>

              {/* Instagram Handle */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="@handle"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Website URL</label>
                <input
                  type="text"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="https://..."
                />
              </div>

              {/* WhatsApp/Telegram Link */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">WhatsApp/Telegram Link</label>
                <input
                  type="text"
                  value={form.communityLink}
                  onChange={(e) => setForm({ ...form, communityLink: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.category}
                className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communities Table */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Community</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">City</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Members</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Instagram</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {communities.map((c) => (
                <tr
                  key={c.id}
                  className={`${!c.isActive ? 'bg-red-950/20 opacity-60' : 'hover:bg-neutral-900/50'} transition-colors`}
                >
                  {/* Community name + thumbnail */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.coverImage ? (
                        <img
                          src={c.coverImage}
                          alt={c.name}
                          className="w-12 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-neutral-800 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-neutral-100 truncate max-w-[200px]">{c.name}</p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-sm text-neutral-400">{c.category}</td>

                  {/* City */}
                  <td className="px-6 py-4 text-sm text-neutral-400">{c.city?.name || '-'}</td>

                  {/* Members */}
                  <td className="px-6 py-4 text-sm text-neutral-300">{c.memberCount}</td>

                  {/* Status badges */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.isSeeded && (
                        <span className="text-xs bg-purple-900/50 text-purple-400 border border-purple-800 px-2 py-0.5 rounded-full">
                          seeded
                        </span>
                      )}
                      {c.claimedAt && (
                        <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                          claimed
                        </span>
                      )}
                      {c.isActive ? (
                        <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-full">
                          active
                        </span>
                      ) : (
                        <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                          inactive
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Instagram */}
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {c.instagramHandle ? `@${c.instagramHandle}` : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivate(c.id, c.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {communities.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No communities found. Click &quot;Add Community&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
