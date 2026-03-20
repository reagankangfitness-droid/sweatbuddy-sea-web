'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Globe,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { eventFormSchema, step1Schema, step2Schema, step3Schema } from '@/lib/validations/event'
import type { EventFormData } from '@/lib/validations/event'
import { parseLocalDate } from '@/lib/event-dates'
import { StepDetails } from './StepDetails'
import { StepLocation } from './StepLocation'
import { StepPricing } from './StepPricing'
import { StepReview } from './StepReview'

interface EventWizardProps {
  mode: 'create' | 'edit'
  initialData?: Partial<EventFormData>
  eventId?: string
  currentAttendees?: number
}

const STEPS = [
  { label: 'Details', number: 1 },
  { label: 'Location', number: 2 },
  { label: 'Pricing', number: 3 },
  { label: 'Review', number: 4 },
] as const

export function EventWizard({ mode, initialData, eventId, currentAttendees }: EventWizardProps) {
  const router = useRouter()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  const [currentStep, setCurrentStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)
  const [direction, setDirection] = useState(0) // -1 = back, 1 = forward

  const userTimezone = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const abbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || ''
      const offset = new Date().toLocaleTimeString('en-US', { timeZoneName: 'shortOffset' }).split(' ').pop() || ''
      return { name: tz, abbr, offset }
    } catch {
      return { name: 'Asia/Singapore', abbr: 'SGT', offset: 'GMT+8' }
    }
  }, [])

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      eventName: '',
      description: '',
      eventType: '',
      eventDate: '',
      eventTime: '',
      endTime: '',
      location: '',
      latitude: 0,
      longitude: 0,
      placeId: '',
      isRecurring: false,
      eventDay: '',
      scheduleEnabled: false,
      scheduleDate: '',
      scheduleTime: '',
      isFree: true,
      price: '',
      paynowQrCode: '',
      paynowNumber: '',
      stripeEnabled: false,
      maxSpots: '',
      isFull: false,
      imageUrl: null,
      organizerName: '',
      instagramHandle: '',
      email: '',
      ...initialData,
    },
    mode: 'onTouched',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to sign-in if not authenticated (create mode only)
  useEffect(() => {
    if (mode === 'create' && authLoaded && !isSignedIn) {
      router.push('/sign-in?intent=host')
    }
  }, [authLoaded, isSignedIn, router, mode])

  // Pre-fill organizer fields from Clerk user data
  useEffect(() => {
    if (user && !formInitialized && mode === 'create') {
      const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      const userEmail = user.primaryEmailAddress?.emailAddress || ''
      const userInstagram = (user.unsafeMetadata?.instagram as string) || ''

      if (userName && !methods.getValues('organizerName')) methods.setValue('organizerName', userName)
      if (userEmail && !methods.getValues('email')) methods.setValue('email', userEmail)
      if (userInstagram && !methods.getValues('instagramHandle')) methods.setValue('instagramHandle', userInstagram)
      setFormInitialized(true)
    }
  }, [user, formInitialized, methods, mode])

  // Format time for display
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    let isValid = false
    const values = methods.getValues()

    if (currentStep === 1) {
      const result = step1Schema.safeParse(values)
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof EventFormData
          methods.setError(field, { message: issue.message })
        })
        return false
      }
      isValid = true
    } else if (currentStep === 2) {
      const result = step2Schema.safeParse(values)
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof EventFormData
          methods.setError(field, { message: issue.message })
        })
        return false
      }
      isValid = true
    } else if (currentStep === 3) {
      const result = step3Schema.safeParse(values)
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof EventFormData
          methods.setError(field, { message: issue.message })
        })
        return false
      }
      isValid = true
    } else {
      isValid = true
    }

    return isValid
  }

  const handleNext = async () => {
    setError('')
    const valid = await validateCurrentStep()
    if (valid && currentStep < 4) {
      setDirection(1)
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((s) => (s - 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleSubmit = async () => {
    setError('')

    // Validate organizer fields
    const values = methods.getValues()
    if (!values.organizerName || !values.instagramHandle || !values.email) {
      setError('Please check your organizer info (name, instagram, email) in the review section.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        // Format day display
        let dayDisplay = ''
        if (values.isRecurring && values.eventDay) {
          dayDisplay = values.eventDay
        } else {
          const date = parseLocalDate(values.eventDate)
          dayDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }

        const eventSubmissionData = {
          eventName: values.eventName,
          category: values.eventType,
          day: dayDisplay,
          eventDate: values.eventDate,
          time: formatTime12Hour(values.eventTime),
          recurring: values.isRecurring,
          location: values.location,
          latitude: values.latitude || null,
          longitude: values.longitude || null,
          placeId: values.placeId || null,
          description: values.description || '',
          communityLink: null,
          imageUrl: values.imageUrl || null,
          organizerName: values.organizerName,
          organizerInstagram: values.instagramHandle.replace('@', ''),
          contactEmail: values.email,
          isFree: values.isFree,
          price: values.isFree ? null : Math.round(parseFloat(values.price || '0') * 100),
          paynowEnabled: !values.isFree && !!values.paynowQrCode,
          paynowQrCode: values.paynowQrCode || null,
          paynowNumber: values.paynowNumber || null,
          stripeEnabled: values.stripeEnabled || false,
          clerkUserId: user?.id || null,
          maxSpots: values.maxSpots ? parseInt(values.maxSpots, 10) : null,
          scheduledPublishAt: values.scheduleEnabled && values.scheduleDate && values.scheduleTime
            ? new Date(`${values.scheduleDate}T${values.scheduleTime}`).toISOString()
            : null,
        }

        const response = await fetch('/api/submit-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventSubmissionData),
        })

        const text = await response.text()
        let data: Record<string, unknown> = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          // non-JSON
        }

        if (!response.ok) {
          throw new Error((data.error as string) || `Server error: ${response.status}`)
        }

        setIsSubmitted(true)
      } else {
        // Edit mode
        const submitData = {
          name: values.eventName,
          category: values.eventType,
          day: values.isRecurring && values.eventDay
            ? values.eventDay
            : parseLocalDate(values.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          date: values.eventDate || null,
          time: formatTime12Hour(values.eventTime),
          location: values.location,
          description: values.description || '',
          recurring: values.isRecurring,
          imageUrl: values.imageUrl || null,
          isFree: values.isFree,
          price: values.isFree ? null : Math.round(parseFloat(values.price || '0') * 100),
          paynowQrCode: values.paynowQrCode || null,
          paynowNumber: values.paynowNumber || null,
          stripeEnabled: values.stripeEnabled || false,
          maxSpots: values.maxSpots ? parseInt(values.maxSpots, 10) : null,
          isFull: values.isFull || false,
        }

        const res = await fetch(`/api/host/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Couldn't save your changes. Try again?")
        }

        router.push('/host/dashboard')
        router.refresh()
        return
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while mounting or checking auth
  if (!mounted || (mode === 'create' && (!authLoaded || !isSignedIn))) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Success state (create mode only)
  if (isSubmitted) {
    const values = methods.getValues()
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800">
          <div className="pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-300" />
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-32 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              You&apos;re all set!
            </h2>
            <p className="text-neutral-400 mb-8">
              {values.scheduleEnabled && values.scheduleDate && values.scheduleTime
                ? `Your event is scheduled to go live on ${new Date(`${values.scheduleDate}T${values.scheduleTime}`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(`${values.scheduleDate}T${values.scheduleTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
                : 'Your event is live. Share the link and start building your crew.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-950 text-neutral-100 px-6 py-3 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <Link
              href={mode === 'edit' ? '/host/dashboard' : '/'}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-full">
              <Globe className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-300">
                {mode === 'edit' ? 'Edit Event' : 'Public'}
              </span>
            </div>

            <div className="w-10" />
          </div>

          {/* Progress Bar */}
          <div className="px-4 pb-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => (
                <div key={step.number} className="flex items-center flex-1 last:flex-initial">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.number < currentStep) {
                        setDirection(-1)
                        setCurrentStep(step.number as 1 | 2 | 3 | 4)
                      }
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        step.number < currentStep
                          ? 'bg-neutral-950 text-neutral-100'
                          : step.number === currentStep
                            ? 'bg-neutral-950 text-neutral-100'
                            : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        step.number <= currentStep ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors ${
                        step.number < currentStep ? 'bg-neutral-950' : 'bg-neutral-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <FormProvider {...methods}>
        <div className="pt-32 pb-28 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {currentStep === 1 && (
                  <StepDetails userTimezone={userTimezone} />
                )}
                {currentStep === 2 && (
                  <StepLocation mode={mode} userTimezone={userTimezone} />
                )}
                {currentStep === 3 && (
                  <StepPricing mode={mode} currentAttendees={currentAttendees} />
                )}
                {currentStep === 4 && (
                  <StepReview mode={mode} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </FormProvider>

      {/* Sticky Bottom Nav */}
      <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-40">
        <div className="bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3.5 rounded-full font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <div className="flex-1" />

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3.5 bg-neutral-950 text-neutral-100 rounded-full font-semibold text-lg hover:bg-neutral-800 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3.5 bg-neutral-950 text-neutral-100 rounded-full font-semibold text-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'edit' ? 'Saving...' : 'Publishing...'}
                  </>
                ) : mode === 'edit' ? (
                  'Save Changes'
                ) : (
                  'Publish'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
