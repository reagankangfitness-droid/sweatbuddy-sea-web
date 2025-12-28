'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'blur'

interface ScrollRevealProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  duration?: number
  threshold?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, once])

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0'

    switch (animation) {
      case 'fade-up':
        return 'scroll-reveal visible'
      case 'fade-down':
        return 'scroll-reveal-down visible'
      case 'fade-left':
        return 'scroll-reveal-left visible'
      case 'fade-right':
        return 'scroll-reveal-right visible'
      case 'scale':
        return 'scroll-reveal-scale visible'
      case 'blur':
        return 'scroll-reveal visible'
      default:
        return 'scroll-reveal visible'
    }
  }

  return (
    <div
      ref={ref}
      className={`${getAnimationClass()} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

// Staggered children animation
interface StaggerRevealProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerReveal({
  children,
  staggerDelay = 100,
  className = '',
}: StaggerRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={isVisible ? 'scroll-reveal visible' : 'opacity-0'}
              style={{
                animationDelay: `${index * staggerDelay}ms`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
