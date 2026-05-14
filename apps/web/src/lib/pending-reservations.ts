import { prisma } from './prisma'
import { STRIPE_CONFIG } from './stripe'

const RESERVATION_GRACE_MS = 5 * 60 * 1000

export async function expireStalePendingReservations(now = new Date()) {
  const cutoff = new Date(
    now.getTime() - (STRIPE_CONFIG.SESSION_EXPIRES_IN_SECONDS * 1000 + RESERVATION_GRACE_MS)
  )

  const staleReservations = await prisma.userActivity.findMany({
    where: {
      deletedAt: null,
      status: 'INTERESTED',
      paymentStatus: 'PENDING',
      stripeCheckoutSessionId: { not: null },
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      p2pPaymentStatus: true,
    },
  })

  const ids = staleReservations.map((reservation) => reservation.id)
  if (ids.length === 0) {
    return { expired: 0, p2pExpired: 0, cutoff }
  }

  const p2pIds = staleReservations
    .filter((reservation) => reservation.p2pPaymentStatus === 'PENDING')
    .map((reservation) => reservation.id)

  await prisma.userActivity.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'EXPIRED',
      deletedAt: now,
    },
  })

  if (p2pIds.length > 0) {
    await prisma.userActivity.updateMany({
      where: { id: { in: p2pIds } },
      data: {
        p2pPaymentStatus: 'REJECTED',
        hostVerificationNotes: 'Stripe checkout expired before payment was completed.',
      },
    })
  }

  return { expired: ids.length, p2pExpired: p2pIds.length, cutoff }
}
