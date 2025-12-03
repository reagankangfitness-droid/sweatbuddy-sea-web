'use client'

import { useEffect, useState } from 'react'

interface GradientBackgroundProps {
  className?: string
  variant?: 'hero' | 'section' | 'subtle'
}

export function GradientBackground({ className = '', variant = 'hero' }: GradientBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    if (variant === 'hero') {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [variant])

  const opacityMap = {
    hero: 'opacity-70',
    section: 'opacity-40',
    subtle: 'opacity-25'
  }

  return (
    <>
      {/* Animated gradient blobs */}
      <div className={`gradient-bg ${opacityMap[variant]} ${className}`}>
        <div className="gradient-blob blob-1" />
        <div className="gradient-blob blob-2" />
        <div className="gradient-blob blob-3" />
        {variant === 'hero' && (
          <>
            <div className="gradient-blob blob-4" />
            <div className="gradient-blob blob-5" />
          </>
        )}
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Interactive cursor bubble - only on hero */}
      {variant === 'hero' && (
        <div
          className="cursor-bubble hidden lg:block"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
          }}
        />
      )}
    </>
  )
}

// Simpler version for sections that don't need all the effects
export function SectionGradient({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(168 58% 52% / 0.4), transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(262 80% 74% / 0.4), transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}
