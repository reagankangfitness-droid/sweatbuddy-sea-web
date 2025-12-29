'use client'

import { useEffect, useState } from 'react'

// Animated dots loader
export function DotsLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Pulse ring loader
export function PulseRing({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
      <div
        className="absolute inset-0 rounded-full border-4 border-t-neutral-900 animate-spin"
        style={{ animationDuration: '0.8s' }}
      />
    </div>
  )
}

// Progress bar loader
export function ProgressLoader({
  progress = 0,
  showPercentage = false,
  className = '',
}: {
  progress?: number
  showPercentage?: boolean
  className?: string
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-neutral-500 mt-1 text-center">{Math.round(progress)}%</p>
      )}
    </div>
  )
}

// Indeterminate progress bar
export function IndeterminateProgress({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-neutral-900 rounded-full animate-indeterminate" />
    </div>
  )
}

// Skeleton text lines
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 skeleton-shimmer rounded"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  )
}

// Full page loading overlay
export function PageLoader({ message = 'One sec...', emoji = '🏃' }: { message?: string; emoji?: string }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl mb-4 block animate-pulse">{emoji}</span>
        <p className="text-neutral-500 font-medium">
          {message}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
      </div>
    </div>
  )
}

// Reusable loading state with emoji
export function LoadingState({
  message = 'Loading...',
  emoji = '⏳',
  className = ''
}: {
  message?: string
  emoji?: string
  className?: string
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="animate-pulse">
        <span className="text-4xl mb-4 block">{emoji}</span>
        <p className="text-neutral-400">{message}</p>
      </div>
    </div>
  )
}

// Button loading state
export function ButtonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <div className="aspect-square skeleton-shimmer" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton-shimmer rounded" />
        <div className="h-5 w-3/4 skeleton-shimmer rounded" />
        <div className="h-4 w-1/2 skeleton-shimmer rounded" />
        <div className="h-4 w-2/3 skeleton-shimmer rounded" />
        <div className="h-10 skeleton-shimmer rounded-lg mt-4" />
      </div>
    </div>
  )
}

// List loading skeleton
export function ListSkeleton({
  count = 5,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white rounded-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="w-12 h-12 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 skeleton-shimmer rounded" />
            <div className="h-3 w-1/2 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Inline loading text
export function LoadingText({
  text = 'Loading',
  className = '',
}: {
  text?: string
  className?: string
}) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-6 text-left">{dots}</span>
    </span>
  )
}

// Success checkmark animation
export function SuccessCheck({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full text-green-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          className="animate-success-circle"
          style={{
            strokeDasharray: '63',
            strokeDashoffset: '63',
            animation: 'draw-circle 0.5s ease-out forwards',
          }}
        />
        <path
          d="M7 13l3 3 7-7"
          className="animate-success-check"
          style={{
            strokeDasharray: '20',
            strokeDashoffset: '20',
            animation: 'draw-check 0.3s ease-out 0.5s forwards',
          }}
        />
      </svg>
    </div>
  )
}
