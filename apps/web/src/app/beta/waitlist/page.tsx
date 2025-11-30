'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Check, Sparkles, Mail, Dumbbell, Users, MapPin } from 'lucide-react'

type InterestedAs = 'member' | 'host' | 'both'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [interestedAs, setInterestedAs] = useState<InterestedAs>('member')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/beta/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, interestedAs }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.position) {
          // Already on waitlist
          setSuccess(true)
          setPosition(data.position)
          toast.info("You're already on the waitlist!")
        } else {
          setError(data.error || 'Something went wrong')
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setPosition(data.position)
      toast.success("You're on the list!")
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const interestOptions: { value: InterestedAs; title: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'member', title: 'Joining activities', desc: 'Find workouts and meet people', icon: <Dumbbell className="w-5 h-5" /> },
    { value: 'host', title: 'Hosting activities', desc: 'Lead sessions & earn money', icon: <MapPin className="w-5 h-5" /> },
    { value: 'both', title: 'Both!', desc: 'Join and host activities', icon: <Users className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0025CC]/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-[96px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Back Link */}
        <Link
          href="/beta"
          className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0025CC] to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">SweatBuddies Waitlist</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Get Early Access
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Join the waitlist and be the first to know when SweatBuddies launches in your area.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 pl-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">I&apos;m interested in...</Label>
                  <div className="space-y-2">
                    {interestOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setInterestedAs(option.value)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                          interestedAs === option.value
                            ? 'border-[#0025CC] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            interestedAs === option.value
                              ? 'bg-[#0025CC] text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {option.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{option.title}</p>
                          <p className="text-xs text-gray-500">{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 sm:h-14 text-base font-semibold bg-[#0025CC] hover:bg-[#001EB3] rounded-xl transition-all"
                >
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  We&apos;ll only email you about SweatBuddies updates. No spam, ever.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                You&apos;re on the list!
              </h2>
              {position && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-[#0025CC]" />
                  <span className="text-sm font-medium text-gray-700">
                    Position <span className="font-bold text-[#0025CC]">#{position}</span>
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-8">
                We&apos;ll email you as soon as SweatBuddies is ready for you.
                <br />Keep an eye on your inbox!
              </p>

              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Want to move up the list?
                </p>
                <p className="text-xs text-gray-500">
                  Share SweatBuddies with friends and get priority access!
                </p>
              </div>

              <Link href="/beta">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Beta Access
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 SweatBuddies. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
