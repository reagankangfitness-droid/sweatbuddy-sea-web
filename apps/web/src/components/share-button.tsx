'use client'

import { useState, useCallback } from 'react'
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

interface ShareButtonProps {
  activityId: string
  activityTitle: string
  activityDescription?: string | null
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function ShareButton({
  activityId,
  activityTitle,
  activityDescription,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: ShareButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate share URL client-side
  const getShareUrl = useCallback(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sweatbuddies.co'
    return `${baseUrl}/activities/${activityId}`
  }, [activityId])

  // Check if native share is available
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const handleShare = async () => {
    const url = getShareUrl()

    // Try native share first on supported devices
    if (canNativeShare) {
      try {
        await navigator.share({
          title: activityTitle,
          text: activityDescription || `Join me for ${activityTitle} on SweatBuddies!`,
          url,
        })
        toast.success('Shared successfully!')
        return
      } catch (error: any) {
        // User cancelled or native share failed - fall back to modal
        if (error?.name === 'AbortError') return
      }
    }

    // Fall back to share modal
    setModalOpen(true)
  }

  const shareUrl = getShareUrl()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Hey! Check out "${activityTitle}" on SweatBuddies! ${shareUrl}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const shareViaTelegram = () => {
    const message = encodeURIComponent(`Hey! Check out "${activityTitle}" on SweatBuddies!`)
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${message}`, '_blank')
  }

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out "${activityTitle}" on SweatBuddies!`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join me for ${activityTitle} on SweatBuddies`)
    const body = encodeURIComponent(`Hey!\n\nI found this amazing activity "${activityTitle}" on SweatBuddies and thought you might be interested!\n\nCheck it out: ${shareUrl}\n\nSee you there!`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareViaSMS = () => {
    const message = encodeURIComponent(`Hey! Check out "${activityTitle}" on SweatBuddies! ${shareUrl}`)
    window.location.href = `sms:?&body=${message}`
  }

  return (
    <>
      <Button
        onClick={handleShare}
        variant={variant}
        size={size}
        className={`touch-manipulation ${className || ''}`}
        aria-label="Share activity"
      >
        <Share2 className={size === 'icon' ? 'w-5 h-5' : 'w-4 h-4'} />
        {showLabel && <span className="ml-2">Share</span>}
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Activity
            </DialogTitle>
            <DialogDescription>
              Share this activity with friends and family!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            {/* Share Link */}
            <div className="bg-muted rounded-lg p-3 sm:p-4">
              <p className="text-sm text-muted-foreground mb-2">Share link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs sm:text-sm bg-background px-2 sm:px-3 py-2 rounded border overflow-x-auto whitespace-nowrap">
                  {shareUrl}
                </code>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="touch-manipulation min-w-[44px] min-h-[44px]"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share Options */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Share via:</p>

              {/* Messaging Apps - Primary actions for mobile */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={shareViaWhatsApp}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12 touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">WhatsApp</span>
                </Button>
                <Button
                  onClick={shareViaTelegram}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12 touch-manipulation"
                >
                  <Send className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Telegram</span>
                </Button>
                <Button
                  onClick={shareViaSMS}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12 touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">SMS</span>
                </Button>
                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12 touch-manipulation"
                >
                  <Mail className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Email</span>
                </Button>
              </div>

              {/* Social Networks */}
              <Button
                onClick={shareViaTwitter}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-11 touch-manipulation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm">Share on X</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
