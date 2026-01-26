'use client'

import { useState, useEffect } from 'react'

export function MiniHero() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="bg-neutral-950 pt-20 pb-8 px-5">
      {/* Main headline */}
      <h1
        className="font-bold text-white mb-3"
        style={{
          fontSize: 'clamp(28px, 8vw, 36px)',
          lineHeight: '1.15',
          letterSpacing: '-0.02em',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        Show up alone.
        <br />
        <span className="text-white/80">Leave with a crew.</span>
      </h1>

      {/* One-line description */}
      <p
        className="text-white/60 text-base"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s',
        }}
      >
        Find runs, yoga, and wellness sessions near you
      </p>
    </div>
  )
}
