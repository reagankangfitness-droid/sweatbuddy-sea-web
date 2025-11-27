'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowRight,
  Users,
  Sparkles,
  Lock,
  ChevronRight,
  Dumbbell,
  MapPin,
  Heart
} from 'lucide-react'

export default function BetaAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const urlCode = searchParams.get('code')

  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{
    spotsRemaining: number
    totalSpots: number
    percentFilled: number
  } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-fill code from URL
  useEffect(() => {
    if (urlCode && urlCode.length === 8) {
      const codeArray = urlCode.toUpperCase().split('')
      setCode(codeArray)
    }
  }, [urlCode])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/beta/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (cleanValue.length <= 1) {
      const newCode = [...code]
      newCode[index] = cleanValue
      setCode(newCode)
      setError('')

      // Auto-focus next input
      if (cleanValue && index < 7) {
        inputRefs.current[index + 1]?.focus()
      }
    } else if (cleanValue.length > 1) {
      // Handle paste
      const chars = cleanValue.split('').slice(0, 8)
      const newCode = [...code]
      chars.forEach((char, i) => {
        if (index + i < 8) {
          newCode[index + i] = char
        }
      })
      setCode(newCode)

      // Focus appropriate input after paste
      const nextIndex = Math.min(index + chars.length, 7)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const chars = pastedText.split('').slice(0, 8)
    const newCode = Array(8).fill('')
    chars.forEach((char, i) => {
      newCode[i] = char
    })
    setCode(newCode)

    if (chars.length >= 8) {
      inputRefs.current[7]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fullCode = code.join('')
    if (fullCode.length !== 8) {
      setError('Please enter a complete 8-character code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/beta/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid code')
        setLoading(false)
        return
      }

      toast.success('Welcome to the SweatBuddies beta!')

      // Redirect to landing page or original destination
      router.push(redirect || '/')
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const spotsPercentage = stats ? stats.percentFilled : 0

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-direction-column items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0025CC]/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[96px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">😊</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SweatBuddies</h1>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-3 py-1.5 rounded-full border border-indigo-500/30">
            <Lock size={12} />
            Invite-Only Beta
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              You&apos;re invited
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your exclusive invite code to join the SweatBuddies beta community.
            </p>
          </div>

          {/* Stats Bar */}
          {stats && stats.spotsRemaining > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#0025CC] text-white flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">{stats.spotsRemaining}</span>
                  <span className="text-gray-500 ml-2">spots left</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0025CC] to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${spotsPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right mt-1.5">
                {spotsPercentage}% claimed
              </p>
            </div>
          )}

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  placeholder="•"
                  autoComplete="off"
                  autoFocus={index === 0}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold uppercase bg-gray-100 border-2 border-gray-200 rounded-xl focus:border-[#0025CC] focus:ring-2 focus:ring-[#0025CC]/20 transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code.join('').length !== 8}
              className="w-full h-12 sm:h-14 text-base font-semibold bg-[#0025CC] hover:bg-[#001EB3] rounded-xl transition-all"
            >
              {loading ? (
                'Validating...'
              ) : (
                <>
                  Enter Beta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Don&apos;t have a code?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Waitlist CTA */}
          <Link
            href="/beta/waitlist"
            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#0025CC]" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Join the Waitlist</p>
                <p className="text-xs text-gray-500">Be first when spots open up</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0025CC] transition-colors" />
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-10 text-center">
          <h3 className="text-sm font-semibold text-indigo-300 mb-5">
            What&apos;s inside the beta?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">🏃‍♂️</div>
              <p className="text-xs font-medium text-white">Find Activities</p>
              <p className="text-[10px] text-gray-400 mt-1">Discover local fitness events</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-xs font-medium text-white">Host Sessions</p>
              <p className="text-[10px] text-gray-400 mt-1">Create & monetize activities</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">🤝</div>
              <p className="text-xs font-medium text-white">Build Community</p>
              <p className="text-[10px] text-gray-400 mt-1">Connect with fitness lovers</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-gray-500">
            © 2025 SweatBuddies. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
