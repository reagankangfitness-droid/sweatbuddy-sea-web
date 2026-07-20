'use client'

import Image from 'next/image'
import { useState } from 'react'

const DEFAULT_FALLBACK = '/images/cities/singapore.jpg'

function shouldBypassOptimizer(src: string) {
  return src.startsWith('/api/') || src.startsWith('http://') || src.startsWith('https://')
}

export function PlaceCoverImage({
  src,
  alt = '',
  sizes,
  className,
  fallback = DEFAULT_FALLBACK,
}: {
  src: string | null | undefined
  alt?: string
  sizes: string
  className?: string
  fallback?: string
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback)

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      unoptimized={shouldBypassOptimizer(currentSrc)}
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback)
      }}
    />
  )
}
