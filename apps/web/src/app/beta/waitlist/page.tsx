'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'

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

  const interestOptions: { value: InterestedAs; title: string; desc: string }[] = [
    { value: 'member', title: 'Joining activities', desc: 'Find workouts and meet people' },
    { value: 'host', title: 'Hosting activities', desc: 'Lead sessions & earn money' },
    { value: 'both', title: 'Both!', desc: 'Join and host activities' },
  ]

  return (
    <div className="min-h-screen bg-[#0A1628] p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        {/* Back Link */}
        <Link
          href="/beta"
          className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">😊</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Join the Waitlist
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Be the first to know when new spots open up. We&apos;ll send you an exclusive invite code.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-gray-400">(optional)</span>
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
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            interestedAs === option.value
                              ? 'border-[#0025CC] bg-[#0025CC]'
                              : 'border-gray-300'
                          }`}
                        >
                          {interestedAs === option.value && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
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
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                You&apos;re on the list!
              </h2>
              {position && (
                <p className="text-lg text-gray-600 mb-2">
                  Your position: <span className="font-bold text-[#0025CC]">#{position}</span>
                </p>
              )}
              <p className="text-sm text-gray-500 mb-8">
                We&apos;ll email you when a spot opens up. Keep an eye on your inbox!
              </p>

              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0025CC] bg-blue-50 px-4 py-3 rounded-xl">
                <Sparkles size={18} />
                <span>Move up the list by sharing with friends!</span>
              </div>

              <div className="mt-8 pt-6 border-t">
                <Link href="/beta">
                  <Button variant="outline" className="w-full h-12 rounded-xl">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Beta Access
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
