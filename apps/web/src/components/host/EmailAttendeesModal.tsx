'use client'

import { useState } from 'react'
import { X, Loader2, Send, Check } from 'lucide-react'

interface Attendee {
  id: string
  email: string
  name: string | null
}

interface EmailAttendeesModalProps {
  eventId: string
  eventName: string
  attendees: Attendee[]
  onClose: () => void
}

export function EmailAttendeesModal({
  eventId,
  eventName,
  attendees,
  onClose,
}: EmailAttendeesModalProps) {
  const [subject, setSubject] = useState(`Update: ${eventName}`)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setError('')
    setIsSending(true)

    try {
      const res = await fetch(`/api/host/events/${eventId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSending(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white w-full max-w-md rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Emails Sent!</h2>
          <p className="text-neutral-500">
            {attendees.length} {attendees.length === 1 ? 'person' : 'people'} will receive your message
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Email Attendees</h2>
            <p className="text-sm text-neutral-500">
              Send to {attendees.length} {attendees.length === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey {name},

Write your message here...

Use {name} to personalize with their name."
              rows={8}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 resize-none"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Tip: Use {'{name}'} to include each person&apos;s name
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send to {attendees.length} {attendees.length === 1 ? 'person' : 'people'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
