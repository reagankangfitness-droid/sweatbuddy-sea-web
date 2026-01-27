'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Users, Tag, UserPlus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InviteData {
  invite_id: string
  invite_code: string
  status: string
  expires_at: string
  referrer: {
    id: string
    name: string | null
    image_url: string | null
  }
  activity: {
    id: string
    title: string
    description: string | null
    type: string
    city: string
    start_time: string | null
    end_time: string | null
    price: number
    currency: string
    image_url: string | null
    max_people: number | null
    current_participants: number
    spots_remaining: number | null
  }
  discount: {
    type: string
    value: number
    description: string
  }
}

export default function JoinInvitePage() {
  const params = useParams<{ code: string }>()
  const code = params.code
  const router = useRouter()
  const { user, isLoaded: userLoaded } = useUser()
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const fetchInviteAndTrackClick = async () => {
      try {
        // Track the click
        await fetch(`/api/invites/${code}/click`, { method: 'POST' })

        // Fetch invite details
        const response = await fetch(`/api/invites/${code}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Invite not found')
          } else {
            setError('Failed to load invite details')
          }
          return
        }

        const data = await response.json()
        setInviteData(data)

        if (data.status === 'EXPIRED') {
          setError('This invite has expired')
        }
      } catch (err) {
        console.error('Error loading invite:', err)
        setError('Failed to load invite details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInviteAndTrackClick()
  }, [code])

  const handleJoinActivity = () => {
    if (!inviteData) return

    // Add invite code to URL for discount tracking
    const activityUrl = `/activities/${inviteData.activity.id}?invite=${code}`

    if (!user) {
      // Redirect to sign in, then back to activity with invite code
      router.push(`/sign-in?redirect_url=${encodeURIComponent(activityUrl)}`)
      return
    }

    // Redirect to activity page with invite code
    router.push(activityUrl)
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">Loading invite...</p>
          </div>
        </main>
      </>
    )
  }

  if (error || !inviteData) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-2">{error || 'Invite Invalid'}</h1>
              <p className="text-muted-foreground mb-4">
                This invite link is no longer valid or has expired.
              </p>
              <Button onClick={() => router.push('/')}>
                Browse Activities
              </Button>
            </div>
          </div>
        </main>
      </>
    )
  }

  const originalPrice = inviteData.activity.price
  const discountedPrice = originalPrice * (1 - inviteData.discount.value / 100)
  const savings = originalPrice - discountedPrice

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="max-w-3xl mx-auto">
          {/* Referral Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              {inviteData.referrer.image_url ? (
                <Image
                  src={inviteData.referrer.image_url}
                  alt={inviteData.referrer.name || 'Friend'}
                  className="w-12 h-12 rounded-full border-2 border-primary"
                  width={48}
                  height={48}
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm text-muted-foreground">
                  {inviteData.referrer.name || 'A friend'} invited you to
                </p>
                <h1 className="text-2xl font-bold">{inviteData.activity.title}</h1>
              </div>
            </div>

            {/* Discount Badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full font-semibold">
              <Tag className="w-4 h-4" />
              {inviteData.discount.value}% OFF - Save {inviteData.activity.currency} {savings.toFixed(2)}!
            </div>
          </div>

          {/* Activity Image */}
          {inviteData.activity.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden border relative h-64">
              <Image
                src={inviteData.activity.image_url}
                alt={inviteData.activity.title}
                className="w-full h-full object-cover"
                fill
                unoptimized
              />
            </div>
          )}

          {/* Activity Details */}
          <div className="rounded-lg border bg-card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Activity Details</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{inviteData.activity.city}</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteData.activity.type}
                  </p>
                </div>
              </div>

              {inviteData.activity.start_time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {new Date(inviteData.activity.start_time).toLocaleString()}
                    </p>
                    {inviteData.activity.end_time && (
                      <p className="text-sm text-muted-foreground">
                        Until {new Date(inviteData.activity.end_time).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {inviteData.activity.current_participants} people going
                  </p>
                  {inviteData.activity.spots_remaining !== null && (
                    <p className="text-sm text-muted-foreground">
                      {inviteData.activity.spots_remaining} spots remaining
                    </p>
                  )}
                </div>
              </div>
            </div>

            {inviteData.activity.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{inviteData.activity.description}</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-lg border bg-card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Special Friend Price</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground line-through">
                  Original: {inviteData.activity.currency} {originalPrice.toFixed(2)}
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {inviteData.activity.currency} {discountedPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">You save</p>
                <p className="text-2xl font-semibold text-green-600">
                  {inviteData.activity.currency} {savings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={handleJoinActivity}
              className="w-full sm:w-auto px-12"
            >
              {user ? 'Join Activity' : 'Sign In to Join'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Join {inviteData.referrer.name || 'your friend'} and other fitness enthusiasts!
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
