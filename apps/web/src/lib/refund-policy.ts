/**
 * Centralized refund policy engine
 * All refund paths (host cancel, attendee cancel, bulk refund) use this.
 */

export interface RefundCalculation {
  eligible: boolean
  percent: number
  amount: number // in cents
  reason: string
}

/**
 * Calculate refund based on event's refund policy
 * @param event - Event with refundPolicy and eventDate
 * @param paymentAmount - Amount paid in cents
 * @param cancellationTime - When the cancellation is happening
 * @param isHostCancellation - If host cancelled, always 100% refund
 */
export function calculateRefund(
  event: { refundPolicy: string | null; eventDate: Date | null; price: number | null },
  paymentAmount: number,
  cancellationTime: Date = new Date(),
  isHostCancellation: boolean = false
): RefundCalculation {
  // Host cancellation always gets 100% refund
  if (isHostCancellation) {
    return {
      eligible: true,
      percent: 100,
      amount: paymentAmount,
      reason: 'Event cancelled by host - full refund',
    }
  }

  // No payment amount = nothing to refund
  if (!paymentAmount || paymentAmount <= 0) {
    return {
      eligible: false,
      percent: 0,
      amount: 0,
      reason: 'No payment to refund',
    }
  }

  const policy = event.refundPolicy || 'NONE'

  switch (policy) {
    case 'FULL_ANYTIME':
      return {
        eligible: true,
        percent: 100,
        amount: paymentAmount,
        reason: 'Full refund anytime policy',
      }

    case 'FULL_24H': {
      if (!event.eventDate) {
        // No event date set, default to eligible
        return {
          eligible: true,
          percent: 100,
          amount: paymentAmount,
          reason: 'Full refund - no event date set',
        }
      }

      const hoursUntilEvent = (event.eventDate.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60)

      if (hoursUntilEvent > 24) {
        return {
          eligible: true,
          percent: 100,
          amount: paymentAmount,
          reason: 'Full refund - more than 24 hours before event',
        }
      }

      return {
        eligible: false,
        percent: 0,
        amount: 0,
        reason: 'No refund - less than 24 hours before event',
      }
    }

    case 'NONE':
    default:
      return {
        eligible: false,
        percent: 0,
        amount: 0,
        reason: 'No refund policy',
      }
  }
}
