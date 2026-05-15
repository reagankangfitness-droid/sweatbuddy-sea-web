'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'

type MetadataValue = string | number | boolean | null

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: string
  metadata?: Record<string, MetadataValue>
}

export function TrackedLink({ event, metadata, onClick, ...props }: TrackedLinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return

    const body = JSON.stringify({ event, metadata })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
      return
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }

  return <Link {...props} onClick={handleClick} />
}
