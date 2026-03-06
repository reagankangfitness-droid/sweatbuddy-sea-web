'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButton() {
  return (
    <button
      onClick={async () => {
        const url = window.location.href
        if (navigator.share) {
          try {
            await navigator.share({ title: document.title, url })
          } catch {
            // User cancelled share
          }
        } else {
          await navigator.clipboard.writeText(url)
          toast.success('Link copied to clipboard!')
        }
      }}
      className="p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
    >
      <Share2 className="w-5 h-5" />
    </button>
  )
}
