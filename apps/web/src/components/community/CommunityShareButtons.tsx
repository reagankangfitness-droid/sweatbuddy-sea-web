'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { APP_URL } from '@/config/constants'

export function CommunityShareButtons({ communityName, communitySlug }: { communityName: string; communitySlug: string }) {
  const url = `${APP_URL}/communities/${communitySlug}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: communityName, text: `Check out ${communityName} on SweatBuddies`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${communityName} on SweatBuddies!\n${url}`)}`

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
      >
        WhatsApp
      </a>
    </div>
  )
}
