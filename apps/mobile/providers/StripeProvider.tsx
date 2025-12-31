import React from 'react'
import { StripeProvider as StripeProviderBase } from '@stripe/stripe-react-native'
import { config } from '../config'

interface StripeProviderProps {
  children: React.ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <StripeProviderBase
      publishableKey={config.stripe.publishableKey}
      merchantIdentifier="merchant.co.sweatbuddies"
      urlScheme="sweatbuddy"
    >
      {children as any}
    </StripeProviderBase>
  )
}
