'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
  fallbackElement?: React.ReactNode
}

/**
 * SafeImage - Image component with automatic error handling
 * Falls back to a placeholder when image fails to load
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc = '/placeholder-event.svg',
  fallbackElement,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // If src is empty/null, show fallback immediately
  if (!src || error) {
    if (fallbackElement) {
      return <>{fallbackElement}</>
    }

    // Default emoji fallback based on context
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <span className="text-4xl opacity-50">📷</span>
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div className={`absolute inset-0 bg-neutral-100 animate-pulse ${className}`} />
      )}
      <Image
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        {...props}
      />
    </>
  )
}

/**
 * EventImage - Specialized image for event cards
 */
export function EventImage({
  src,
  alt,
  emoji = '✨',
  className,
  ...props
}: SafeImageProps & { emoji?: string }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <span className="text-6xl">{emoji}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  )
}

/**
 * AvatarImage - Specialized image for user avatars
 */
export function AvatarImage({
  src,
  alt,
  name,
  className,
  size = 40,
  ...props
}: Omit<SafeImageProps, 'width' | 'height'> & { name?: string | null; size?: number }) {
  const [error, setError] = useState(false)

  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-200 text-neutral-600 font-medium ${className}`}
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  )
}
