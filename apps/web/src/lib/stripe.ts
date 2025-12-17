import Stripe from 'stripe'

// Server-side Stripe instance
// Only use this in API routes, never expose to client

let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Stripe payments will not work.')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Export a getter function for the stripe instance
// This avoids initialization at build time
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const instance = getStripeInstance()
    const value = instance[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Supported currencies
  SUPPORTED_CURRENCIES: ['SGD', 'USD', 'EUR', 'GBP', 'AUD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],

  // Default currency
  DEFAULT_CURRENCY: 'SGD',

  // Checkout session expiration (30 minutes)
  SESSION_EXPIRES_IN_SECONDS: 30 * 60,

  // Cancellation policy (hours before activity for full refund)
  FULL_REFUND_HOURS: 24,
  PARTIAL_REFUND_HOURS: 2,
  PARTIAL_REFUND_PERCENTAGE: 50,
}

// Helper to convert amount to Stripe cents/smallest unit
export function toStripeAmount(amount: number, currency: string): number {
  // Most currencies use cents (multiply by 100)
  // Some currencies like JPY, VND don't have decimal places
  const zeroDecimalCurrencies = ['JPY', 'VND', 'KRW', 'BIF', 'CLP', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount)
  }

  return Math.round(amount * 100)
}

// Helper to convert from Stripe amount back to regular amount
export function fromStripeAmount(stripeAmount: number, currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'VND', 'KRW', 'BIF', 'CLP', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF']

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return stripeAmount
  }

  return stripeAmount / 100
}

// Format currency for display
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Calculate refund amount based on cancellation policy
export function calculateRefundAmount(
  amountPaid: number,
  activityStartTime: Date,
  now: Date = new Date()
): { amount: number; percentage: number; policy: 'full' | 'partial' | 'none' } {
  const hoursUntilActivity = (activityStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilActivity > STRIPE_CONFIG.FULL_REFUND_HOURS) {
    return {
      amount: amountPaid,
      percentage: 100,
      policy: 'full',
    }
  }

  if (hoursUntilActivity > STRIPE_CONFIG.PARTIAL_REFUND_HOURS) {
    const refundAmount = amountPaid * (STRIPE_CONFIG.PARTIAL_REFUND_PERCENTAGE / 100)
    return {
      amount: refundAmount,
      percentage: STRIPE_CONFIG.PARTIAL_REFUND_PERCENTAGE,
      policy: 'partial',
    }
  }

  return {
    amount: 0,
    percentage: 0,
    policy: 'none',
  }
}
