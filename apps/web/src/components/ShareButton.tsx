'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Share2, Check, Copy, X } from 'lucide-react'

interface ShareButtonProps {
  eventId: string
  eventName: string
  compact?: boolean
  iconOnly?: boolean
}

export function ShareButton({ eventId, eventName, compact = false, iconOnly = false }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Short, clean URL for sharing: sweatbuddies.co/e/[id]
  const shareUrl = `https://sweatbuddies.co/e/${eventId}`

  const shareText = `Join me at ${eventName} on SweatBuddies!`

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if it's a mobile device (not desktop)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // Only use native share on mobile devices
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // User cancelled or share failed, show menu instead
      }
    }

    // Show full-screen modal menu on desktop (always) or mobile fallback
    setShowMenu(!showMenu)
  }

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowMenu(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareToWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
    window.open(whatsappUrl, '_blank')
    setShowMenu(false)
  }

  const shareToTelegram = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(telegramUrl, '_blank')
    setShowMenu(false)
  }

  const shareModal = mounted && showMenu ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowMenu(false)
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Share Event</h3>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(false)
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Event Preview */}
        <div className="px-4 py-3 bg-gray-50">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{eventName}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{shareUrl}</p>
        </div>

        {/* Share Options */}
        <div className="p-2">
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-green-600 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Copy className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-medium">Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <span className="font-medium">WhatsApp</span>
          </button>

          <button
            onClick={shareToTelegram}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="font-medium">Telegram</span>
          </button>
        </div>

        {/* Cancel button for mobile */}
        <div className="p-2 pt-0 sm:hidden">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(false)
            }}
            className="w-full py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  // Different button styles based on context
  const buttonStyles = iconOnly
    ? 'w-11 h-11 bg-white hover:bg-gray-50 text-gray-500 shadow-sm border border-gray-100'
    : compact
      ? 'w-6 h-6 sm:w-7 sm:h-7 bg-black/30 backdrop-blur-sm hover:bg-black/50'
      : 'w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg'

  const iconStyles = iconOnly
    ? 'w-5 h-5 text-gray-500'
    : compact
      ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 text-white'
      : 'w-5 h-5 text-gray-700'

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleShare}
        className={`flex items-center justify-center rounded-full transition-all ${buttonStyles}`}
        aria-label="Share event"
        title="Share"
      >
        <Share2 className={iconStyles} />
      </button>

      {shareModal}
    </>
  )
}
