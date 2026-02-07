'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'

const ONBOARDING_KEY = 'sb_onboarding_seen'

interface OnboardingStep {
  id: string
  emoji: string
  title: string
  message: string
  position: 'top' | 'bottom' | 'center'
  targetId?: string
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome!',
    message: 'Show up alone. Leave with a crew.',
    position: 'center',
  },
  {
    id: 'discover',
    emoji: '🗺️',
    title: 'Discover',
    message: 'Find runs, yoga, tennis & more happening near you.',
    position: 'bottom',
    targetId: 'hero-cta',
  },
  {
    id: 'start',
    emoji: '🙋',
    title: 'Start Activity',
    message: "Don't see your vibe? Start one & others will join!",
    position: 'bottom',
    targetId: 'how-it-works',
  },
]

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(ONBOARDING_KEY)
    if (!hasSeen) {
      // Small delay for page to load
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }

  if (!mounted || !isVisible) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleSkip}
          />

          {/* Bubble */}
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-[101] w-[90%] max-w-sm ${
              step.position === 'center'
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : step.position === 'top'
                  ? 'top-24 left-1/2 -translate-x-1/2'
                  : 'bottom-32 left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{step.emoji}</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{step.title}</span>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-4">
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                  {step.message}
                </p>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-neutral-900 dark:bg-white'
                          : index < currentStep
                            ? 'bg-neutral-400 dark:bg-neutral-500'
                            : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handleSkip}
                      className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
                  >
                    {isLastStep ? "Let's go!" : 'Next'}
                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow pointer for non-center positions */}
            {step.position !== 'center' && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
                  step.position === 'bottom'
                    ? '-bottom-2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-900'
                    : '-top-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-neutral-900'
                }`}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
