'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  formatNumber?: boolean
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  formatNumber = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true)
          hasAnimated.current = true
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (value - startValue) * easeOut)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isVisible, duration])

  const formattedValue = formatNumber
    ? displayValue.toLocaleString()
    : displayValue.toString()

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}

// Animated counter that pulses when value changes
interface LiveCounterProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
}

export function LiveCounter({
  value,
  className = '',
  prefix = '',
  suffix = '',
}: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isUpdating, setIsUpdating] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsUpdating(true)

      // Animate the number change
      const diff = value - prevValue.current
      const steps = Math.abs(diff)
      const stepDuration = Math.min(500 / steps, 100)
      let current = prevValue.current

      const interval = setInterval(() => {
        if (diff > 0) {
          current++
        } else {
          current--
        }
        setDisplayValue(current)

        if (current === value) {
          clearInterval(interval)
          setTimeout(() => setIsUpdating(false), 300)
        }
      }, stepDuration)

      prevValue.current = value

      return () => clearInterval(interval)
    }
  }, [value])

  return (
    <span
      className={`tabular-nums inline-block transition-transform ${
        isUpdating ? 'animate-count-up scale-110 text-green-600' : ''
      } ${className}`}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

// Countdown timer
interface CountdownProps {
  targetDate: Date | string
  className?: string
  onComplete?: () => void
}

export function Countdown({ targetDate, className = '', onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const target = new Date(targetDate).getTime()

    const updateCountdown = () => {
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setIsComplete(true)
        onComplete?.()
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete])

  if (isComplete) {
    return <span className={className}>Event started!</span>
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{timeLeft.days}</div>
          <div className="text-xs text-neutral-500">days</div>
        </div>
      )}
      <div className="text-center">
        <div className="text-2xl font-bold tabular-nums">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-neutral-500">hrs</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold tabular-nums">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-neutral-500">min</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold tabular-nums animate-pulse">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-neutral-500">sec</div>
      </div>
    </div>
  )
}
