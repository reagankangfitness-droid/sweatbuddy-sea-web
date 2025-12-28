'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
  size: number
  shape: 'circle' | 'square' | 'triangle'
}

const CONFETTI_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
]

interface ConfettiProps {
  isActive: boolean
  duration?: number
  pieceCount?: number
  onComplete?: () => void
}

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const generatePieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = []
    const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle']

    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      })
    }
    return newPieces
  }, [pieceCount])

  useEffect(() => {
    if (isActive) {
      setPieces(generatePieces())

      const timer = setTimeout(() => {
        setPieces([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration, generatePieces, onComplete])

  if (!mounted || pieces.length === 0) return null

  const renderShape = (piece: ConfettiPiece) => {
    const baseStyle = {
      position: 'fixed' as const,
      left: `${piece.x}%`,
      top: '-20px',
      width: piece.size,
      height: piece.size,
      backgroundColor: piece.color,
      animation: `confettiFall ${piece.duration}s linear ${piece.delay}s forwards`,
      zIndex: 9999,
      pointerEvents: 'none' as const,
    }

    if (piece.shape === 'circle') {
      return (
        <div
          key={piece.id}
          style={{
            ...baseStyle,
            borderRadius: '50%',
          }}
        />
      )
    }

    if (piece.shape === 'triangle') {
      return (
        <div
          key={piece.id}
          style={{
            ...baseStyle,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderLeft: `${piece.size / 2}px solid transparent`,
            borderRight: `${piece.size / 2}px solid transparent`,
            borderBottom: `${piece.size}px solid ${piece.color}`,
          }}
        />
      )
    }

    // Square
    return (
      <div
        key={piece.id}
        style={{
          ...baseStyle,
          borderRadius: '2px',
          transform: `rotate(${piece.rotation}deg)`,
        }}
      />
    )
  }

  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      {pieces.map(renderShape)}
    </div>,
    document.body
  )
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [isActive, setIsActive] = useState(false)

  const trigger = useCallback(() => {
    setIsActive(true)
  }, [])

  const reset = useCallback(() => {
    setIsActive(false)
  }, [])

  return { isActive, trigger, reset }
}
