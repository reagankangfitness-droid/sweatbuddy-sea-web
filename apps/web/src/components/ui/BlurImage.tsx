'use client'

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface BlurImageProps extends Omit<ImageProps, 'onLoad'> {
  lowQualitySrc?: string
  blurDataURL?: string
}

// Progressive blur-up image loading
export function BlurImage({
  src,
  alt,
  className = '',
  lowQualitySrc,
  blurDataURL,
  ...props
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src)

  useEffect(() => {
    // Preload the high-quality image
    const img = new window.Image()
    img.src = src as string
    img.onload = () => {
      setCurrentSrc(src as string)
      setIsLoaded(true)
    }
  }, [src])

  return (
    <div className="relative overflow-hidden">
      <Image
        src={currentSrc}
        alt={alt}
        className={`transition-all duration-500 ${
          isLoaded ? 'blur-0 scale-100' : 'blur-sm scale-105'
        } ${className}`}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  )
}

// Shimmer placeholder for images
export function ImageShimmer({
  width,
  height,
  className = '',
}: {
  width?: number | string
  height?: number | string
  className?: string
}) {
  return (
    <div
      className={`skeleton-shimmer bg-neutral-200 ${className}`}
      style={{ width, height }}
    />
  )
}

// Lazy image with intersection observer
export function LazyImage({
  src,
  alt,
  className = '',
  threshold = 0.1,
  ...props
}: BlurImageProps & { threshold?: number }) {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '50px' }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return (
    <div ref={setRef} className="relative overflow-hidden">
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          className={`transition-all duration-500 ${
            isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      ) : (
        <div className="skeleton-shimmer bg-neutral-200 w-full h-full absolute inset-0" />
      )}
    </div>
  )
}

// Aspect ratio container with blur-up
export function AspectImage({
  src,
  alt,
  aspectRatio = '1/1',
  className = '',
  containerClassName = '',
  ...props
}: BlurImageProps & {
  aspectRatio?: string
  containerClassName?: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Shimmer placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton-shimmer bg-neutral-200" />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  )
}
