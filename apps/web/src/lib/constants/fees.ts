// =====================================================
// SWEATBUDDIES FEE CONFIGURATION
// Fee Structure: 3.7% + SGD 1.79 per ticket
// =====================================================

export const FEE_CONFIG = {
  // Platform + Processing fee combined
  // This covers both SweatBuddies commission AND Stripe processing
  serviceFee: {
    percentage: 0.037, // 3.7%
    fixed: 1.79, // SGD 1.79 per ticket
    currency: 'SGD',
  },

  // Who pays the service fee
  // 'attendee' = added to ticket price
  // 'host' = deducted from host earnings
  serviceFeePaidBy: 'attendee' as const,

  // Display settings
  showFeeBreakdown: true,
  feeLabel: 'Service fee', // What to call it in UI

  // Minimum ticket price
  minimumTicketPrice: 5.0,

  // Free activities
  allowFreeActivities: true,

  // Internal: Stripe's actual fees (for our accounting)
  // We absorb the difference between what we charge and what Stripe takes
  _stripe: {
    percentage: 0.034, // 3.4%
    fixed: 0.5, // SGD 0.50
  },
}

export interface FeeCalculation {
  // Input
  ticketPrice: number
  quantity: number

  // Subtotal (tickets only)
  subtotal: number

  // Service fee
  serviceFee: number
  serviceFeePerTicket: number
  serviceFeePercentage: number
  serviceFeeFixed: number

  // Total fees
  totalFees: number

  // What attendee pays
  attendeePays: number
  attendeePaysPerTicket: number

  // What host receives
  hostReceives: number
  hostReceivesPerTicket: number

  // Internal accounting (don't show to users)
  _stripeFee: number
  _platformNet: number

  // For display
  breakdown: {
    subtotal: number
    serviceFee: number
    total: number
  }

  // Config reference
  serviceFeePaidBy: 'attendee' | 'host'
  feeLabel: string
}

/**
 * Round to 2 decimal places for currency
 */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100
}

/**
 * Calculate all fees for a booking
 * @param ticketPrice - Base ticket price set by host
 * @param quantity - Number of tickets
 * @returns Fee breakdown
 */
export function calculateFees(ticketPrice: number, quantity: number = 1): FeeCalculation {
  const subtotal = ticketPrice * quantity

  // If free activity, no fees
  if (subtotal === 0) {
    return {
      ticketPrice,
      quantity,
      subtotal: 0,
      serviceFee: 0,
      serviceFeePerTicket: 0,
      serviceFeePercentage: FEE_CONFIG.serviceFee.percentage * 100,
      serviceFeeFixed: FEE_CONFIG.serviceFee.fixed,
      totalFees: 0,
      attendeePays: 0,
      attendeePaysPerTicket: 0,
      hostReceives: 0,
      hostReceivesPerTicket: 0,
      _stripeFee: 0,
      _platformNet: 0,
      breakdown: {
        subtotal: 0,
        serviceFee: 0,
        total: 0,
      },
      serviceFeePaidBy: FEE_CONFIG.serviceFeePaidBy,
      feeLabel: FEE_CONFIG.feeLabel,
    }
  }

  // Calculate service fee: 3.7% + $1.79 per ticket
  const percentageFee = subtotal * FEE_CONFIG.serviceFee.percentage
  const fixedFee = FEE_CONFIG.serviceFee.fixed * quantity
  const serviceFee = roundCurrency(percentageFee + fixedFee)
  const serviceFeePerTicket = roundCurrency(serviceFee / quantity)

  // Calculate totals based on who pays
  let attendeePays: number
  let hostReceives: number

  if (FEE_CONFIG.serviceFeePaidBy === 'attendee') {
    // Attendee pays ticket + service fee
    attendeePays = roundCurrency(subtotal + serviceFee)
    hostReceives = subtotal // Host gets full ticket price
  } else {
    // Host pays fee (deducted from earnings)
    attendeePays = subtotal
    hostReceives = roundCurrency(subtotal - serviceFee)
  }

  // Internal accounting: what Stripe actually takes
  const stripeActualFee = roundCurrency(
    attendeePays * FEE_CONFIG._stripe.percentage + FEE_CONFIG._stripe.fixed
  )
  const platformNet = roundCurrency(serviceFee - stripeActualFee)

  return {
    // Input
    ticketPrice,
    quantity,

    // Subtotal (tickets only)
    subtotal,

    // Service fee
    serviceFee,
    serviceFeePerTicket,
    serviceFeePercentage: FEE_CONFIG.serviceFee.percentage * 100,
    serviceFeeFixed: FEE_CONFIG.serviceFee.fixed,

    // Total fees
    totalFees: serviceFee,

    // What attendee pays
    attendeePays,
    attendeePaysPerTicket: roundCurrency(attendeePays / quantity),

    // What host receives
    hostReceives,
    hostReceivesPerTicket: roundCurrency(hostReceives / quantity),

    // Internal accounting (don't show to users)
    _stripeFee: stripeActualFee,
    _platformNet: platformNet,

    // For display
    breakdown: {
      subtotal,
      serviceFee,
      total: attendeePays,
    },

    // Config reference
    serviceFeePaidBy: FEE_CONFIG.serviceFeePaidBy,
    feeLabel: FEE_CONFIG.feeLabel,
  }
}

/**
 * Calculate fees for a single ticket (convenience function)
 */
export function calculateTicketFees(ticketPrice: number): FeeCalculation {
  return calculateFees(ticketPrice, 1)
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get fee explanation text for attendees
 */
export function getAttendeeFeeExplanation(): string {
  return `A service fee of ${FEE_CONFIG.serviceFee.percentage * 100}% + ${formatCurrency(FEE_CONFIG.serviceFee.fixed)} per ticket is added to cover platform and payment processing costs.`
}

/**
 * Get fee explanation text for hosts
 */
export function getHostFeeExplanation(): string {
  if (FEE_CONFIG.serviceFeePaidBy === 'attendee') {
    return `You receive 100% of your ticket price. A small service fee (${FEE_CONFIG.serviceFee.percentage * 100}% + ${formatCurrency(FEE_CONFIG.serviceFee.fixed)}/ticket) is added for attendees to cover platform costs.`
  }
  return `A service fee of ${FEE_CONFIG.serviceFee.percentage * 100}% + ${formatCurrency(FEE_CONFIG.serviceFee.fixed)} per ticket is deducted from your earnings.`
}

/**
 * Get short fee description
 */
export function getFeeDescription(): string {
  return `${FEE_CONFIG.serviceFee.percentage * 100}% + ${formatCurrency(FEE_CONFIG.serviceFee.fixed)}/ticket`
}
