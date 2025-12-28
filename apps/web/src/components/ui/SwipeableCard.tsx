'use client'

import { useState, useRef, ReactNode } from 'react'

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  className?: string
  threshold?: number
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  className = '',
  threshold = 100,
}: SwipeableCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState<'left' | 'right' | 'up' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const { x, y } = position

    if (x < -threshold && onSwipeLeft) {
      setIsExiting('left')
      setTimeout(() => {
        onSwipeLeft()
        resetCard()
      }, 300)
    } else if (x > threshold && onSwipeRight) {
      setIsExiting('right')
      setTimeout(() => {
        onSwipeRight()
        resetCard()
      }, 300)
    } else if (y < -threshold && onSwipeUp) {
      setIsExiting('up')
      setTimeout(() => {
        onSwipeUp()
        resetCard()
      }, 300)
    } else {
      resetCard()
    }
  }

  const resetCard = () => {
    setPosition({ x: 0, y: 0 })
    setIsExiting(null)
  }

  const getExitTransform = () => {
    switch (isExiting) {
      case 'left':
        return 'translateX(-150%) rotate(-30deg)'
      case 'right':
        return 'translateX(150%) rotate(30deg)'
      case 'up':
        return 'translateY(-150%) scale(0.8)'
      default:
        return `translate(${position.x}px, ${position.y}px) rotate(${position.x * 0.05}deg)`
    }
  }

  const getOpacity = () => {
    if (isExiting) return 0
    const distance = Math.sqrt(position.x ** 2 + position.y ** 2)
    return Math.max(0.5, 1 - distance / 500)
  }

  // Swipe indicators
  const showLeftIndicator = position.x < -30
  const showRightIndicator = position.x > 30
  const showUpIndicator = position.y < -30

  return (
    <div
      ref={cardRef}
      className={`relative touch-none select-none ${className}`}
      style={{
        transform: getExitTransform(),
        opacity: getOpacity(),
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      {/* Swipe Indicators */}
      {showLeftIndicator && (
        <div className="absolute inset-0 flex items-center justify-start pl-4 pointer-events-none z-10">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-bounce-in">
            SKIP
          </div>
        </div>
      )}
      {showRightIndicator && (
        <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none z-10">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-bounce-in">
            JOIN
          </div>
        </div>
      )}
      {showUpIndicator && (
        <div className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none z-10">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-bounce-in">
            SAVE
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
