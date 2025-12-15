'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Database,
  Save,
  RefreshCw
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    notifyOnNewEvent: true,
    notifyOnNewAttendee: true,
    autoApproveOrganizers: false,
    requireEmailVerification: true,
    maxAttendeesPerEvent: 100,
    adminEmail: '',
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Settings saved successfully')
    setSaving(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/50 mt-1">Configure your admin dashboard</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-sm text-white/50">Configure email notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">New event submissions</p>
                <p className="text-sm text-white/50">Get notified when new events are submitted for review</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnNewEvent}
                onChange={(e) => setSettings({ ...settings, notifyOnNewEvent: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-[#2563EB] focus:ring-[#38BDF8]"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">New attendee registrations</p>
                <p className="text-sm text-white/50">Get notified when someone RSVPs to an event</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnNewAttendee}
                onChange={(e) => setSettings({ ...settings, notifyOnNewAttendee: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-[#2563EB] focus:ring-[#38BDF8]"
              />
            </label>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Email Settings</h2>
              <p className="text-sm text-white/50">Configure email preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                placeholder="admin@sweatbuddies.co"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">Require email verification</p>
                <p className="text-sm text-white/50">Users must verify their email before RSVPing</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-[#2563EB] focus:ring-[#38BDF8]"
              />
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Security</h2>
              <p className="text-sm text-white/50">Security and access settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <p className="text-white font-medium">Auto-approve trusted organizers</p>
                <p className="text-sm text-white/50">Skip review for verified organizers</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveOrganizers}
                onChange={(e) => setSettings({ ...settings, autoApproveOrganizers: e.target.checked })}
                className="w-5 h-5 rounded bg-white/10 border-white/20 text-[#2563EB] focus:ring-[#38BDF8]"
              />
            </label>
          </div>
        </div>

        {/* Event Settings */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Event Settings</h2>
              <p className="text-sm text-white/50">Default event configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Max Attendees Per Event
              </label>
              <input
                type="number"
                value={settings.maxAttendeesPerEvent}
                onChange={(e) => setSettings({ ...settings, maxAttendeesPerEvent: parseInt(e.target.value) || 0 })}
                min="1"
                max="10000"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]"
              />
              <p className="text-xs text-white/40 mt-1">Default limit for new events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
