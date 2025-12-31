import { useState, useCallback } from 'react'
import { useStripe } from '@stripe/stripe-react-native'
import { Alert, Linking } from 'react-native'
import { config } from '../config'

interface CreateCheckoutParams {
  eventId: string
  attendeeEmail: string
  attendeeName: string
  quantity?: number
}

interface CheckoutResult {
  sessionId: string
  url: string
}

export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a checkout session via the web API
  const createCheckoutSession = useCallback(async (params: CreateCheckoutParams): Promise<CheckoutResult | null> => {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/stripe/checkout/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to create checkout session')
      }

      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session'
      setError(message)
      return null
    }
  }, [])

  // Open Stripe Checkout in browser (for web-based checkout flow)
  const openCheckout = useCallback(async (params: CreateCheckoutParams) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSession(params)

      if (!result?.url) {
        throw new Error('Failed to get checkout URL')
      }

      // Open the Stripe Checkout URL in the browser
      const canOpen = await Linking.canOpenURL(result.url)
      if (canOpen) {
        await Linking.openURL(result.url)
        return { success: true, sessionId: result.sessionId }
      } else {
        throw new Error('Cannot open checkout URL')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      Alert.alert('Payment Error', message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [createCheckoutSession])

  // Verify payment status
  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(
        `${config.api.baseUrl}/api/stripe/checkout/verify?session_id=${sessionId}`
      )

      if (!response.ok) {
        return { paid: false }
      }

      const data = await response.json()
      return { paid: data.status === 'complete' || data.status === 'paid' }
    } catch {
      return { paid: false }
    }
  }, [])

  return {
    isLoading,
    error,
    openCheckout,
    verifyPayment,
    createCheckoutSession,
  }
}
