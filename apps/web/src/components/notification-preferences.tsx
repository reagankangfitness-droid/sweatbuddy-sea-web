'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReminderPreferences {
  enableOneWeekReminder: boolean
  enableOneDayReminder: boolean
  enableTwoHourReminder: boolean
  emailReminders: boolean
  pushReminders: boolean
  smsReminders: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
  timezone: string
}

interface NotificationPreferencesProps {
  className?: string
}

const TIMEZONES = [
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (GMT+8)' },
  { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`,
}))

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    enableOneWeekReminder: false,
    enableOneDayReminder: true,
    enableTwoHourReminder: true,
    emailReminders: true,
    pushReminders: true,
    smsReminders: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'Asia/Singapore',
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/reminders/preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof ReminderPreferences, value: unknown) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    setSaving(true)
    try {
      const res = await fetch('/api/reminders/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      toast.success('Preferences updated')
    } catch (error) {
      console.error('Error updating preference:', error)
      toast.error('Failed to update preferences')
      // Revert on error
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Reminder Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose when and how you want to be reminded about your booked activities.
        </p>
      </div>

      {/* Reminder Types */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Reminder Timing</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="oneWeek" className="font-medium">
                1 week before
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get a heads up a week in advance
              </p>
            </div>
            <Switch
              id="oneWeek"
              checked={preferences.enableOneWeekReminder}
              onCheckedChange={(checked) =>
                updatePreference('enableOneWeekReminder', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="oneDay" className="font-medium">
                24 hours before
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed reminder the day before
              </p>
            </div>
            <Switch
              id="oneDay"
              checked={preferences.enableOneDayReminder}
              onCheckedChange={(checked) =>
                updatePreference('enableOneDayReminder', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="twoHours" className="font-medium">
                2 hours before
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quick reminder right before the activity
              </p>
            </div>
            <Switch
              id="twoHours"
              checked={preferences.enableTwoHourReminder}
              onCheckedChange={(checked) =>
                updatePreference('enableTwoHourReminder', checked)
              }
            />
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Notification Channels</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive detailed reminders via email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.emailReminders}
              onCheckedChange={(checked) => updatePreference('emailReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get instant notifications on your device
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.pushReminders}
              onCheckedChange={(checked) => updatePreference('pushReminders', checked)}
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Quiet Hours</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Reminders won&apos;t be sent during these hours. They&apos;ll be sent at the next
          available time.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Select
              value={preferences.quietHoursStart?.toString() || 'none'}
              onValueChange={(value) =>
                updatePreference(
                  'quietHoursStart',
                  value === 'none' ? null : parseInt(value)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {HOURS.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Select
              value={preferences.quietHoursEnd?.toString() || 'none'}
              onValueChange={(value) =>
                updatePreference(
                  'quietHoursEnd',
                  value === 'none' ? null : parseInt(value)
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {HOURS.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Timezone</Label>
          <Select
            value={preferences.timezone}
            onValueChange={(value) => updatePreference('timezone', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  )
}
