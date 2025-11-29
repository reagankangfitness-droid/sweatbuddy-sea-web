'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MapPin, Calendar, MessageSquare, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface HostReminderSettingsData {
  enableOneWeekReminder: boolean
  enableOneDayReminder: boolean
  enableTwoHourReminder: boolean
  oneDaySubject: string | null
  oneDayMessage: string | null
  twoHourSubject: string | null
  twoHourMessage: string | null
  oneWeekSubject: string | null
  oneWeekMessage: string | null
  includeMapLink: boolean
  includeCalendarLink: boolean
  includeHostContact: boolean
  customInstructions: string | null
}

interface HostReminderSettingsProps {
  activityId: string
  activityTitle: string
  className?: string
  onSettingsChange?: (settings: HostReminderSettingsData) => void
}

export function HostReminderSettings({
  activityId,
  activityTitle,
  className,
  onSettingsChange,
}: HostReminderSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [settings, setSettings] = useState<HostReminderSettingsData>({
    enableOneWeekReminder: false,
    enableOneDayReminder: true,
    enableTwoHourReminder: true,
    oneDaySubject: null,
    oneDayMessage: null,
    twoHourSubject: null,
    twoHourMessage: null,
    oneWeekSubject: null,
    oneWeekMessage: null,
    includeMapLink: true,
    includeCalendarLink: true,
    includeHostContact: false,
    customInstructions: null,
  })

  useEffect(() => {
    fetchSettings()
  }, [activityId])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/host/reminders/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof HostReminderSettingsData, value: unknown) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)

    setSaving(true)
    try {
      const res = await fetch(`/api/host/reminders/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) {
        throw new Error('Failed to update')
      }

      toast.success('Settings updated')
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update settings')
      // Revert on error
      setSettings(settings)
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
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Reminder Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the reminders sent to attendees for &quot;{activityTitle}&quot;.
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Reminders reduce no-shows by 20-30%</p>
          <p className="mt-1 text-blue-700">
            Attendees receive automatic reminders before your activity. You can customize the
            messages and timing.
          </p>
        </div>
      </div>

      {/* Reminder Timing */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Which reminders to send</h3>

        {/* 1 Week Reminder */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div>
              <Label className="font-medium">1 week before</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                For activities booked well in advance
              </p>
            </div>
            <Switch
              checked={settings.enableOneWeekReminder}
              onCheckedChange={(checked) =>
                updateSetting('enableOneWeekReminder', checked)
              }
            />
          </div>
          {settings.enableOneWeekReminder && (
            <div className="p-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Subject (optional)
                </Label>
                <Input
                  placeholder="e.g., See you next week!"
                  value={settings.oneWeekSubject || ''}
                  onChange={(e) =>
                    updateSetting('oneWeekSubject', e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Message (optional)
                </Label>
                <Textarea
                  placeholder="Add a personal message to attendees..."
                  value={settings.oneWeekMessage || ''}
                  onChange={(e) =>
                    updateSetting('oneWeekMessage', e.target.value || null)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* 24 Hour Reminder */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div>
              <Label className="font-medium">24 hours before</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed reminder with all activity info
              </p>
            </div>
            <Switch
              checked={settings.enableOneDayReminder}
              onCheckedChange={(checked) =>
                updateSetting('enableOneDayReminder', checked)
              }
            />
          </div>
          {settings.enableOneDayReminder && (
            <div className="p-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Subject (optional)
                </Label>
                <Input
                  placeholder="e.g., Tomorrow: Get ready for..."
                  value={settings.oneDaySubject || ''}
                  onChange={(e) =>
                    updateSetting('oneDaySubject', e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Message (optional)
                </Label>
                <Textarea
                  placeholder="Add a personal message to attendees..."
                  value={settings.oneDayMessage || ''}
                  onChange={(e) =>
                    updateSetting('oneDayMessage', e.target.value || null)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2 Hour Reminder */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div>
              <Label className="font-medium">2 hours before</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quick reminder right before the activity
              </p>
            </div>
            <Switch
              checked={settings.enableTwoHourReminder}
              onCheckedChange={(checked) =>
                updateSetting('enableTwoHourReminder', checked)
              }
            />
          </div>
          {settings.enableTwoHourReminder && (
            <div className="p-4 space-y-4 border-t">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Subject (optional)
                </Label>
                <Input
                  placeholder="e.g., Starting soon!"
                  value={settings.twoHourSubject || ''}
                  onChange={(e) =>
                    updateSetting('twoHourSubject', e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Custom Message (optional)
                </Label>
                <Textarea
                  placeholder="Add a personal message to attendees..."
                  value={settings.twoHourMessage || ''}
                  onChange={(e) =>
                    updateSetting('twoHourMessage', e.target.value || null)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What to include */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">What to include</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Map Link</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Include Google Maps directions
                </p>
              </div>
            </div>
            <Switch
              checked={settings.includeMapLink}
              onCheckedChange={(checked) => updateSetting('includeMapLink', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Calendar Link</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add to Google Calendar button
                </p>
              </div>
            </div>
            <Switch
              checked={settings.includeCalendarLink}
              onCheckedChange={(checked) =>
                updateSetting('includeCalendarLink', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Host Contact</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Include your email in reminders
                </p>
              </div>
            </div>
            <Switch
              checked={settings.includeHostContact}
              onCheckedChange={(checked) =>
                updateSetting('includeHostContact', checked)
              }
            />
          </div>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Special Instructions</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Add any special instructions for attendees (e.g., &quot;Bring a towel&quot;,
          &quot;Park in Lot B&quot;, &quot;Wear comfortable shoes&quot;).
        </p>

        <Textarea
          placeholder="What should attendees know before the activity?"
          value={settings.customInstructions || ''}
          onChange={(e) =>
            updateSetting('customInstructions', e.target.value || null)
          }
          rows={3}
        />
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
