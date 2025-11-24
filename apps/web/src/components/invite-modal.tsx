'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

interface InviteModalProps {
  activityId: string
  activityTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteModal({
  activityId,
  activityTitle,
  open,
  onOpenChange,
}: InviteModalProps) {
  const [friendEmail, setFriendEmail] = useState('')
  const [friendName, setFriendName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  const generateInvite = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          friend_email: friendEmail || undefined,
          friend_name: friendName || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate invite')
      }

      const data = await response.json()
      setInviteLink(data.invite_link)
      setInviteCode(data.invite_code)
      toast.success('Invite link generated!')
    } catch (error) {
      console.error('Error generating invite:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate invite')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey! Join me for "${activityTitle}" on SweatBuddies and get 50% off! ${inviteLink}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const shareViaTelegram = () => {
    const message = encodeURIComponent(
      `Hey! Join me for "${activityTitle}" on SweatBuddies and get 50% off!`
    )
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${message}`, '_blank')
  }

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Hey! Join me for "${activityTitle}" on SweatBuddies and get 50% off! ${inviteLink}`
    )
    window.location.href = `sms:?&body=${message}`
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join me for ${activityTitle} on SweatBuddies`)
    const body = encodeURIComponent(
      `Hey!\n\nI'm going to "${activityTitle}" on SweatBuddies and thought you might want to join me!\n\nAs my friend, you'll get 50% off your booking. Plus, it'll be way more fun to work out together!\n\nClick here to join: ${inviteLink}\n\nSee you there!`
    )
    window.location.href = `mailto:${friendEmail || ''}?subject=${subject}&body=${body}`
  }

  const handleReset = () => {
    setInviteLink('')
    setInviteCode('')
    setFriendEmail('')
    setFriendName('')
    setCopied(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) handleReset()
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Invite a Friend
          </DialogTitle>
          <DialogDescription>
            Share this activity with a friend and they'll get 50% off! You'll earn $5 credit when they join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!inviteLink ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Friend's Email (Optional)
                </label>
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Friend's Name (Optional)
                </label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                onClick={generateInvite}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Invite Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Your invite link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-background px-3 py-2 rounded border overflow-x-auto">
                    {inviteLink}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Invite Code: <span className="font-mono font-semibold">{inviteCode}</span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Share via:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={shareViaWhatsApp}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareViaTelegram}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </Button>
                  <Button
                    onClick={shareViaSMS}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    SMS
                  </Button>
                  <Button
                    onClick={shareViaEmail}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-full"
              >
                Generate Another Invite
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
