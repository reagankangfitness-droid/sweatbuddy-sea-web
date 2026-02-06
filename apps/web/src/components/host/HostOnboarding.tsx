'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Check,
  Loader2,
  MessageSquare,
  TrendingUp,
  Zap,
} from 'lucide-react'

// Community type options with icons and descriptions
const COMMUNITY_TYPES = [
  {
    id: 'RUN',
    label: 'Running',
    emoji: '🏃',
    description: 'Run clubs, marathons, trail runs',
    color: 'bg-orange-100 border-orange-300 hover:bg-orange-50',
    selectedColor: 'bg-orange-500 border-orange-500',
  },
  {
    id: 'YOGA',
    label: 'Yoga',
    emoji: '🧘',
    description: 'Yoga classes, retreats, workshops',
    color: 'bg-purple-100 border-purple-300 hover:bg-purple-50',
    selectedColor: 'bg-purple-500 border-purple-500',
  },
  {
    id: 'HIIT',
    label: 'HIIT',
    emoji: '🔥',
    description: 'High intensity, circuit training',
    color: 'bg-red-100 border-red-300 hover:bg-red-50',
    selectedColor: 'bg-red-500 border-red-500',
  },
  {
    id: 'MEDITATION',
    label: 'Meditation',
    emoji: '🧠',
    description: 'Mindfulness, breathwork, wellness',
    color: 'bg-teal-100 border-teal-300 hover:bg-teal-50',
    selectedColor: 'bg-teal-500 border-teal-500',
  },
  {
    id: 'BOOTCAMP',
    label: 'Bootcamp',
    emoji: '💪',
    description: 'Outdoor fitness, group workouts',
    color: 'bg-green-100 border-green-300 hover:bg-green-50',
    selectedColor: 'bg-green-500 border-green-500',
  },
  {
    id: 'STRENGTH',
    label: 'Strength',
    emoji: '🏋️',
    description: 'Weight training, powerlifting',
    color: 'bg-blue-100 border-blue-300 hover:bg-blue-50',
    selectedColor: 'bg-blue-500 border-blue-500',
  },
  {
    id: 'OTHER',
    label: 'Other',
    emoji: '✨',
    description: 'Something else awesome',
    color: 'bg-neutral-100 border-neutral-300 hover:bg-neutral-50',
    selectedColor: 'bg-neutral-700 border-neutral-700',
  },
]

const COMMUNITY_SIZES = [
  { id: 'small', label: 'Just starting', description: 'Under 30 members' },
  { id: 'medium', label: 'Growing', description: '30-100 members' },
  { id: 'large', label: 'Established', description: '100+ members' },
]

// AI Features for the discovery screen
const AI_FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask anything about your community and get instant answers',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: Sparkles,
    title: 'Content Generator',
    description: 'Create Instagram captions, WhatsApp messages, and emails',
    gradient: 'from-violet-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Growth Insights',
    description: 'AI-powered recommendations to grow your community',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Weekly Pulse',
    description: 'Automated AI summaries of your community health',
    gradient: 'from-amber-500 to-orange-500',
  },
]

interface HostOnboardingProps {
  onComplete: () => void
  userName?: string | null
}

type Step = 'welcome' | 'type' | 'details' | 'loading' | 'features'

export function HostOnboarding({ onComplete, userName }: HostOnboardingProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [communityType, setCommunityType] = useState<string>('')
  const [communityName, setCommunityName] = useState('')
  const [communityLocation, setCommunityLocation] = useState('')
  const [communitySchedule, setCommunitySchedule] = useState('')
  const [communitySize, setCommunitySize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Animated loading messages
  useEffect(() => {
    if (step === 'loading') {
      const messages = [
        'Setting up your AI assistant...',
        'Learning about your community type...',
        'Preparing personalized insights...',
        'Almost ready...',
      ]
      let index = 0
      setLoadingMessage(messages[0])

      const interval = setInterval(() => {
        index = (index + 1) % messages.length
        setLoadingMessage(messages[index])
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [step])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setStep('loading')

    try {
      const res = await fetch('/api/host/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityType,
          communityName: communityName.trim() || null,
          communityLocation: communityLocation.trim() || null,
          communitySchedule: communitySchedule.trim() || null,
          communitySize: communitySize || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      // Show loading animation for at least 2 seconds for effect
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Go to features discovery instead of completing
      setStep('features')
      setIsSubmitting(false)
    } catch (error) {
      console.error('Onboarding error:', error)
      setStep('details')
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    try {
      await fetch('/api/host/onboarding', { method: 'PATCH' })
      // Go to features discovery instead of completing
      setStep('features')
      setIsSubmitting(false)
    } catch (error) {
      console.error('Skip error:', error)
      setIsSubmitting(false)
    }
  }

  const selectedType = COMMUNITY_TYPES.find(t => t.id === communityType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3"
            >
              Hey{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-neutral-600 dark:text-neutral-400 mb-8 text-base sm:text-lg"
            >
              I&apos;m your AI assistant. Let me learn about your community so I can give you personalized insights.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <button
                onClick={() => setStep('type')}
                className="w-full py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
              >
                Let&apos;s get started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Community Type Selection */}
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                What type of community do you run?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                This helps me give you relevant insights and suggestions
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {COMMUNITY_TYPES.map((type, index) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setCommunityType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    communityType === type.id
                      ? `${type.selectedColor} text-white`
                      : `${type.color} text-neutral-900 dark:text-white`
                  }`}
                >
                  <span className="text-2xl mb-2 block">{type.emoji}</span>
                  <span className="font-semibold text-sm block">{type.label}</span>
                  <span className={`text-xs ${
                    communityType === type.id ? 'text-white/80' : 'text-neutral-500'
                  }`}>
                    {type.description}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!communityType}
                className="flex-1 py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Community Details */}
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm mb-4">
                <span>{selectedType?.emoji}</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {selectedType?.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                Tell me more about your community
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                All fields are optional - share what you&apos;re comfortable with
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Community Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <Users className="w-4 h-4" />
                  Community Name
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder={`e.g., ${selectedType?.id === 'RUN' ? 'Dawn Runners SG' : selectedType?.id === 'YOGA' ? 'Sunrise Yoga Collective' : 'My Awesome Community'}`}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <MapPin className="w-4 h-4" />
                  Usual Location
                </label>
                <input
                  type="text"
                  value={communityLocation}
                  onChange={(e) => setCommunityLocation(e.target.value)}
                  placeholder="e.g., East Coast Park, Singapore"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Typical Schedule
                </label>
                <input
                  type="text"
                  value={communitySchedule}
                  onChange={(e) => setCommunitySchedule(e.target.value)}
                  placeholder="e.g., Saturdays 6:30am, Tuesdays 7pm"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              {/* Community Size */}
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                  Community Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMMUNITY_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setCommunitySize(size.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        communitySize === size.id
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      <span className="font-medium text-sm block">{size.label}</span>
                      <span className={`text-xs ${
                        communitySize === size.id ? 'text-white/70 dark:text-neutral-900/70' : 'text-neutral-500'
                      }`}>
                        {size.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('type')}
                disabled={isSubmitting}
                className="px-6 py-3 text-neutral-600 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading Screen */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              key={loadingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-neutral-600 dark:text-neutral-400 text-base"
            >
              {loadingMessage}
            </motion.div>

            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-violet-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Feature Discovery Screen */}
        {step === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2"
              >
                You&apos;re all set! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-neutral-500 dark:text-neutral-400"
              >
                Here&apos;s what your AI assistant can do for you
              </motion.p>
            </div>

            <div className="space-y-3 mb-8">
              {AI_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`p-4 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-start gap-4`}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">{feature.title}</h3>
                    <p className="text-sm text-white/80">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={onComplete}
                className="w-full py-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-3">
                Look for the chat button in the bottom-right corner anytime
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
