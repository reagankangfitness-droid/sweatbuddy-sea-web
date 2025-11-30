'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowRight, Lock, Dumbbell, Users, MapPin, Sparkles, ChevronRight } from 'lucide-react'

export default function BetaAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const urlCode = searchParams.get('code')

  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill code from URL
  useEffect(() => {
    if (urlCode) {
      setPasscode(urlCode.toUpperCase())
    }
  }, [urlCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passcode.trim()) {
      setError('Please enter the passcode')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/beta/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passcode.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid passcode')
        setLoading(false)
        return
      }

      toast.success('Welcome to SweatBuddies!')
      router.push(redirect || '/')
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
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
              <span className="text-3xl">💪</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SweatBuddies</h1>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-3 py-1.5 rounded-full border border-indigo-500/30">
            <Lock size={12} />
            Beta Testing
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Enter Passcode
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter the beta passcode to access SweatBuddies.
            </p>
          </div>

          {/* Passcode Input Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                type="text"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Enter passcode"
                autoComplete="off"
                autoFocus
                className="h-14 text-center text-xl font-bold uppercase bg-gray-100 border-2 border-gray-200 rounded-xl focus:border-[#0025CC] focus:ring-2 focus:ring-[#0025CC]/20 transition-all"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full h-12 sm:h-14 text-base font-semibold bg-[#0025CC] hover:bg-[#001EB3] rounded-xl transition-all"
            >
              {loading ? (
                'Validating...'
              ) : (
                <>
                  Enter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Don&apos;t have a passcode?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Waitlist CTA */}
          <Link
            href="/beta/waitlist"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0025CC] to-indigo-500 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Join the Waitlist</p>
                <p className="text-xs text-gray-500">Be first to know when we launch</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0025CC] transition-colors" />
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-10 text-center">
          <h3 className="text-sm font-semibold text-indigo-300 mb-5">
            What you&apos;ll get access to
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Dumbbell className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-white">Find Activities</p>
              <p className="text-[10px] text-gray-400 mt-1">Discover local fitness events</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <MapPin className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-white">Host Sessions</p>
              <p className="text-[10px] text-gray-400 mt-1">Create & monetize activities</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Users className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
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
