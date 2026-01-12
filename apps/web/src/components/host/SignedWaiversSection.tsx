'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface SignedWaiver {
  id: string
  signeeEmail: string
  signeeName: string
  signatureType: string
  signedAt: string
  templateName: string
  templateVersion: number | null
  isCustom: boolean
  hasPdf: boolean
  rsvpDate: string | null
  paymentStatus: string | null
}

// Helper to download PDF
const downloadWaiverPdf = async (waiverId: string, signeeName: string) => {
  try {
    const res = await fetch(`/api/waiver/${waiverId}/pdf`)
    if (!res.ok) {
      throw new Error('Failed to download PDF')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `waiver-${signeeName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('PDF download error:', err)
    alert('Failed to download PDF')
  }
}

interface SignedWaiversSectionProps {
  eventId: string
}

export function SignedWaiversSection({ eventId }: SignedWaiversSectionProps) {
  const [waivers, setWaivers] = useState<SignedWaiver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [waiverEnabled, setWaiverEnabled] = useState(false)

  useEffect(() => {
    const fetchWaivers = async () => {
      try {
        const res = await fetch(`/api/host/events/${eventId}/waivers`)
        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated, silently skip
            setLoading(false)
            return
          }
          throw new Error('Failed to load waivers')
        }
        const data = await res.json()
        setWaivers(data.waivers || [])
        setWaiverEnabled(data.event?.waiverEnabled || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load waivers')
      } finally {
        setLoading(false)
      }
    }

    fetchWaivers()
  }, [eventId])

  // Don't show section if waivers are not enabled for this event
  if (!loading && !waiverEnabled) {
    return null
  }

  if (loading) {
    return (
      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading waiver data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return null // Silently fail - waivers are supplementary info
  }

  const displayWaivers = expanded ? waivers : waivers.slice(0, 3)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Signed Waivers ({waivers.length})
        </h2>
        {waivers.length > 0 && (
          <button
            onClick={() => {
              // Download all waivers as CSV
              const headers = ['Name', 'Email', 'Signed At', 'Template', 'Signature Type']
              const rows = waivers.map(w => [
                w.signeeName,
                w.signeeEmail,
                new Date(w.signedAt).toLocaleString(),
                w.templateName,
                w.signatureType,
              ])
              const csvContent = [
                headers.join(','),
                ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
              ].join('\n')
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `waivers-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
              link.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {waivers.length === 0 ? (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
          <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-blue-700">No waivers signed yet</p>
          <p className="text-xs text-blue-500 mt-1">
            Waivers are required during RSVP for this event
          </p>
        </div>
      ) : (
        <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50">
          {displayWaivers.map((waiver, index) => (
            <div
              key={waiver.id}
              className={`flex items-center justify-between p-4 bg-white ${
                index !== displayWaivers.length - 1 ? 'border-b border-blue-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{waiver.signeeName}</p>
                  <p className="text-sm text-neutral-500">{waiver.signeeEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-600">
                    {waiver.isCustom ? 'Custom Waiver' : waiver.templateName}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Signed {new Date(waiver.signedAt).toLocaleDateString()} at{' '}
                    {new Date(waiver.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => downloadWaiverPdf(waiver.id, waiver.signeeName)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {waivers.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full p-3 text-sm text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show {waivers.length - 3} more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
