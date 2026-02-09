'use client'

import { Share2 } from 'lucide-react'

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
          alert('Link copied to clipboard!')
        }
      }}
      className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
    >
      <Share2 className="w-5 h-5" />
    </button>
  )
}
