'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, Check, Plus, Users, Gift, Share2 } from 'lucide-react'

interface InviteCode {
  code: string
  used: boolean
  usedAt: string | null
  createdAt: string
}

export function MyInviteCodes() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [invitesRemaining, setInvitesRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/beta/my-invites')
      if (!res.ok) {
        throw new Error('Failed to fetch codes')
      }
      const data = await res.json()
      setCodes(data.codes || [])
      setInvitesRemaining(data.invitesRemaining || 0)
    } catch (error) {
      console.error('Failed to fetch codes:', error)
      toast.error('Failed to load invite codes')
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    if (invitesRemaining <= 0) return

    setGenerating(true)
    try {
      const res = await fetch('/api/beta/my-invites', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setCodes((prev) => [
          { code: data.code, used: false, usedAt: null, createdAt: new Date().toISOString() },
          ...prev,
        ])
        setInvitesRemaining(data.invitesRemaining)
        toast.success('New invite code generated!')
      } else {
        toast.error(data.error || 'Failed to generate code')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async (code: string) => {
    const inviteUrl = `${window.location.origin}/beta?code=${code}`

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedCode(code)
      toast.success('Invite link copied!')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const shareCode = async (code: string) => {
    const inviteUrl = `${window.location.origin}/beta?code=${code}`
    const shareText =
      "I'm inviting you to join SweatBuddies beta! Use my exclusive code to get early access:"

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SweatBuddies Beta',
          text: shareText,
          url: inviteUrl,
        })
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyCode(code)
        }
      }
    } else {
      copyCode(code)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
          <div className="h-20 bg-gray-100 rounded-xl mb-4" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border p-6">
      {/* Header */}
      <div className="flex gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0025CC] flex items-center justify-center shrink-0">
          <Gift size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invite Friends</h3>
          <p className="text-sm text-gray-500">
            Share SweatBuddies with friends and grow the community
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex bg-blue-50 rounded-xl p-4 mb-5">
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-[#0025CC]">{invitesRemaining}</p>
          <p className="text-xs text-gray-500">Invites remaining</p>
        </div>
        <div className="w-px bg-gray-200 mx-4" />
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-[#0025CC]">{codes.filter((c) => c.used).length}</p>
          <p className="text-xs text-gray-500">Friends joined</p>
        </div>
      </div>

      {/* Generate Button */}
      {invitesRemaining > 0 && (
        <Button
          onClick={generateCode}
          disabled={generating}
          className="w-full h-12 mb-5 bg-[#0025CC] hover:bg-[#001EB3] rounded-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          {generating ? 'Generating...' : 'Generate New Invite Code'}
        </Button>
      )}

      {/* Codes List */}
      {codes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Your Invite Codes</h4>
          <div className="space-y-2">
            {codes.map((codeData) => (
              <div
                key={codeData.code}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  codeData.used
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-white border-blue-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <code
                    className={`font-mono text-sm font-semibold tracking-wider ${
                      codeData.used ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {codeData.code}
                  </code>
                  <span
                    className={`text-[10px] font-medium uppercase px-2 py-1 rounded-md ${
                      codeData.used ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {codeData.used ? 'Used' : 'Available'}
                  </span>
                </div>

                {!codeData.used && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCode(codeData.code)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        copiedCode === codeData.code
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Copy invite link"
                    >
                      {copiedCode === codeData.code ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => shareCode(codeData.code)}
                      className="h-9 px-3 bg-[#0025CC] hover:bg-[#001EB3] rounded-lg"
                    >
                      <Share2 className="mr-1.5 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {codes.length === 0 && invitesRemaining > 0 && (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600 mb-1">No codes yet</p>
          <p className="text-sm text-gray-400">Generate an invite code to share with friends</p>
        </div>
      )}

      {/* No Invites Left */}
      {invitesRemaining === 0 && codes.length === 0 && (
        <div className="text-center py-8">
          <p className="font-medium text-gray-600 mb-1">No invites available</p>
          <p className="text-sm text-gray-400">
            You&apos;ve used all your invites. Thanks for spreading the word!
          </p>
        </div>
      )}
    </div>
  )
}
