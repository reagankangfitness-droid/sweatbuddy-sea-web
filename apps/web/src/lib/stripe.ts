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

// =====================================================
// PAID EVENTS - FEE CALCULATIONS
// =====================================================

// Fee percentages for paid events
const PLATFORM_FEE_PERCENT_FREE = 5 // Free tier hosts pay 5%
const PLATFORM_FEE_PERCENT_PREMIUM = 2 // Premium tier hosts pay 2%
const STRIPE_FEE_PERCENT = 2.9
const STRIPE_FEE_FIXED_CENTS = 40 // 40 cents fixed Stripe fee

export interface FeeCalculation {
  priceInCents: number
  platformFee: number
  stripeFee: number
  totalFees: number
  hostPayout: number
  platformFeePercent: number
  // For PASS fee handling (attendee pays fees)
  totalChargedToAttendee: number
}

/**
 * Calculate fees for a ticket purchase
 * @param priceInCents - The ticket price in cents (e.g., 1500 = $15.00)
 * @param isPremiumHost - Whether the host is on Premium tier (lower fees)
 * @param feeHandling - 'PASS' = attendee pays fees, 'ABSORB' = host absorbs fees
 */
export function calculateFees(
  priceInCents: number,
  isPremiumHost: boolean = false,
  feeHandling: 'PASS' | 'ABSORB' = 'ABSORB'
): FeeCalculation {
  if (priceInCents <= 0) {
    return {
      priceInCents: 0,
      platformFee: 0,
      stripeFee: 0,
      totalFees: 0,
      hostPayout: 0,
      platformFeePercent: 0,
      totalChargedToAttendee: 0,
    }
  }

  const platformFeePercent = isPremiumHost ? PLATFORM_FEE_PERCENT_PREMIUM : PLATFORM_FEE_PERCENT_FREE

  if (feeHandling === 'ABSORB') {
    // Host absorbs all fees - attendee pays exact ticket price
    const platformFee = Math.round(priceInCents * platformFeePercent / 100)
    const stripeFee = Math.round(priceInCents * STRIPE_FEE_PERCENT / 100) + STRIPE_FEE_FIXED_CENTS
    const totalFees = platformFee + stripeFee
    const hostPayout = Math.max(0, priceInCents - totalFees) // Ensure hostPayout is never negative


    return {
      priceInCents,
      platformFee,
      stripeFee,
      totalFees,
      hostPayout,
      platformFeePercent,
      totalChargedToAttendee: priceInCents,
    }
  } else {
    // PASS: Attendee pays fees on top of ticket price
    // We need to calculate what to charge so host gets full ticket price after fees
    // Formula: chargeAmount = (priceInCents + STRIPE_FEE_FIXED_CENTS) / (1 - totalFeePercent)
    const totalFeePercent = (platformFeePercent + STRIPE_FEE_PERCENT) / 100
    const chargeAmount = Math.round((priceInCents + STRIPE_FEE_FIXED_CENTS) / (1 - totalFeePercent))

    const platformFee = Math.round(chargeAmount * platformFeePercent / 100)
    const stripeFee = Math.round(chargeAmount * STRIPE_FEE_PERCENT / 100) + STRIPE_FEE_FIXED_CENTS
    const totalFees = platformFee + stripeFee
    const hostPayout = Math.max(0, chargeAmount - totalFees) // Ensure hostPayout is never negative

    return {
      priceInCents,
      platformFee,
      stripeFee,
      totalFees,
      hostPayout,
      platformFeePercent,
      totalChargedToAttendee: chargeAmount,
    }
  }
}

/**
 * Format cents to price display string
 * @param cents - Amount in cents
 * @param currency - Currency code (default: SGD)
 * @returns Formatted string like "$15.00"
 */
export function formatPrice(cents: number, currency: string = 'SGD'): string {
  const currencySymbols: Record<string, string> = {
    SGD: 'S$',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    THB: '฿',
    MYR: 'RM',
  }
  const symbol = currencySymbols[currency.toUpperCase()] || '$'
  return `${symbol}${(cents / 100).toFixed(2)}`
}

