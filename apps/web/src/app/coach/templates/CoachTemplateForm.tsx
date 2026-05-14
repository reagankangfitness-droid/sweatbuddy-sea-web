'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

const DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

type FormState = {
  title: string
  description: string
  categorySlug: string
  sessionType: string
  daysOfWeek: string[]
  startTime: string
  endTime: string
  price: string
  currency: string
  maxParticipants: string
  fitnessLevel: string
  whatToBring: string
  locationName: string
  address: string
}

type TemplateResponse = {
  title: string
  description: string | null
  categorySlug: string | null
  sessionType: string
  daysOfWeek: string[]
  startTime: string
  endTime: string | null
  price: number | null
  currency: string
  maxParticipants: number | null
  fitnessLevel: string | null
  whatToBring: string | null
  locationName: string | null
  address: string | null
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  categorySlug: '',
  sessionType: 'GROUP',
  daysOfWeek: [],
  startTime: '07:00',
  endTime: '',
  price: '',
  currency: 'SGD',
  maxParticipants: '',
  fitnessLevel: 'ALL',
  whatToBring: '',
  locationName: '',
  address: '',
}

export function CoachTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(Boolean(templateId))
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(templateId)

  const featuredCategories = useMemo(
    () => ACTIVITY_CATEGORIES.filter((category) => category.featured).sort((a, b) => a.displayOrder - b.displayOrder),
    []
  )

  useEffect(() => {
    if (!templateId) return

    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/coaches/templates/${templateId}`)
        if (!res.ok) throw new Error('Failed to load template')
        const template: TemplateResponse = await res.json()
        setForm({
          title: template.title || '',
          description: template.description || '',
          categorySlug: template.categorySlug || '',
          sessionType: template.sessionType || 'GROUP',
          daysOfWeek: template.daysOfWeek || [],
          startTime: template.startTime || '07:00',
          endTime: template.endTime || '',
          price: template.price != null ? String(template.price / 100) : '',
          currency: template.currency || 'SGD',
          maxParticipants: template.maxParticipants != null ? String(template.maxParticipants) : '',
          fitnessLevel: template.fitnessLevel || 'ALL',
          whatToBring: template.whatToBring || '',
          locationName: template.locationName || '',
          address: template.address || '',
        })
      } catch {
        toast.error('Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId])

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((value) => value !== day)
        : [...current.daysOfWeek, day],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (form.daysOfWeek.length === 0) {
      toast.error('Pick at least one day')
      return
    }

    setSaving(true)
    try {
      const price = form.price.trim() ? Math.round(Number(form.price) * 100) : null
      const maxParticipants = form.maxParticipants.trim() ? Number(form.maxParticipants) : null
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        categorySlug: form.categorySlug || null,
        sessionType: form.sessionType,
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        endTime: form.endTime || null,
        price,
        currency: form.currency,
        maxParticipants,
        fitnessLevel: form.fitnessLevel || null,
        whatToBring: form.whatToBring.trim() || null,
        locationName: form.locationName.trim() || null,
        address: form.address.trim() || null,
      }

      const res = await fetch(isEditing ? `/api/coaches/templates/${templateId}` : '/api/coaches/templates', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save template')
      }

      toast.success(isEditing ? 'Template updated' : 'Template created')
      router.push('/coach/templates')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/coach/templates" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>

        <h1 className="text-2xl font-bold">{isEditing ? 'Edit template' : 'Create template'}</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm text-neutral-400">Title</span>
            <input
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-neutral-400">Category</span>
              <select
                value={form.categorySlug}
                onChange={(event) => setField('categorySlug', event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              >
                <option value="">Choose category</option>
                {featuredCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">Session type</span>
              <select
                value={form.sessionType}
                onChange={(event) => setField('sessionType', event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              >
                <option value="GROUP">Group</option>
                <option value="ONE_ON_ONE">One on one</option>
                <option value="WORKSHOP">Workshop</option>
              </select>
            </label>
          </div>

          <div>
            <span className="text-sm text-neutral-400">Days</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    form.daysOfWeek.includes(day)
                      ? 'bg-white text-black'
                      : 'border border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-neutral-400">Start time</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setField('startTime', event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">End time</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setField('endTime', event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm text-neutral-400">Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setField('price', event.target.value)}
                placeholder="Free"
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">Currency</span>
              <input
                value={form.currency}
                onChange={(event) => setField('currency', event.target.value.toUpperCase())}
                maxLength={3}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block">
              <span className="text-sm text-neutral-400">Max participants</span>
              <input
                type="number"
                min="1"
                value={form.maxParticipants}
                onChange={(event) => setField('maxParticipants', event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-neutral-400">Fitness level</span>
            <select
              value={form.fitnessLevel}
              onChange={(event) => setField('fitnessLevel', event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            >
              <option value="ALL">All levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">Location name</span>
            <input
              value={form.locationName}
              onChange={(event) => setField('locationName', event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">Address</span>
            <input
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">What to bring</span>
            <textarea
              value={form.whatToBring}
              onChange={(event) => setField('whatToBring', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/coach/templates" className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
