# Marketplace Features Cleanup

**Date:** 2026-03-12
**Context:** SweatBuddies is pivoting to P2P (peer-to-peer free sessions). Marketplace features for paid event organizers are being disabled.

---

## Found Features

### Earnings / Payouts
- `src/app/host/earnings/page.tsx` — Full earnings dashboard for marketplace hosts
- `src/components/host/EarningsDashboard.tsx` — Earnings chart and summary component
- `src/app/api/host/earnings/route.ts` — API: fetches PayNow payments and earnings by event
- `src/app/host/dashboard/page.tsx` — Had "Earnings" stat card + "Earnings" quick link
- `src/app/api/host/dashboard/route.ts` — Calculated `totalEarnings` / `totalRevenue` from `eventTransaction`

### Stripe Connect (Marketplace)
- `src/app/api/stripe/connect/create-account/route.ts` — Creates `hostStripeAccount` for marketplace hosts
- `src/app/api/stripe/connect/status/route.ts` — Returns `payoutsEnabled` for marketplace Stripe account
- `src/app/api/stripe/connect/dashboard/route.ts` — Opens Stripe Connect Express dashboard
- `src/app/api/stripe/connect/create-account-link/route.ts` — Onboards marketplace host to Stripe
- `src/app/api/stripe/checkout/create-session/route.ts` — Creates Stripe checkout for marketplace tickets
- `src/hooks/useStripeAccountStatus.ts` — Checks Stripe Connect payout status
- `src/contexts/StripeConnectContext.tsx` — Stores `stripeConnectAccountId` in localStorage

### Stripe Connect (P2P — KEEP)
- `src/app/api/stripe/connect/p2p/route.ts` — Uses `User.p2pStripeConnectId` — **KEEP for P2P paid**

### Fee Calculations
- `src/lib/constants/fees.ts` — Platform fee rates, commission description
- `src/lib/stripe.ts` — `calculateEventSubmissionFees()`, `isPremiumHost`, `hostPayout`

### Analytics with Earnings
- `src/app/host/analytics/page.tsx` — "Projected earnings next 3 months", "Monthly earnings" charts
- `src/app/api/host/dashboard/route.ts` — `paidAttendeesCount`, `pendingPaymentsCount` (marketplace metrics)

### Payment Verification
- `src/app/host/payments/page.tsx` — Verify PayNow payments from attendees

### Featured Categories (NOT marketplace-specific)
- `src/lib/categories.ts` — `featured: boolean` on category definitions — used for display ordering, not paid placement

### Verified Reviews (NOT marketplace-specific)
- `src/components/review-card.tsx` — `isVerified` on review records — about review authenticity, not host tier

---

## Actions Taken

### DISABLED (returns 410 / shows placeholder)
- `src/app/host/earnings/page.tsx` — Shows "Earnings Not Available" message
- `src/app/api/host/earnings/route.ts` — Returns 410 Gone

### REMOVED from UI
- Earnings stat card removed from host dashboard (`/host/dashboard`)
- "Earnings" quick link removed from host dashboard nav

### REMOVED from API
- `totalEarnings` + `totalRevenue` calculation removed from `/api/host/dashboard`
  (was querying `eventTransaction` table unnecessarily on every dashboard load)

---

## Kept (Used by P2P or Future P2P Paid)

| Feature | Reason to Keep |
|---|---|
| `User.p2pStripeConnectId` | Needed for P2P_PAID sessions |
| `api/stripe/connect/p2p` | Sets up P2P Stripe Connect accounts |
| `lib/constants/fees.ts` | Fee config may apply to P2P_PAID |
| `lib/stripe.ts` | General Stripe utilities |
| Activity creation/editing | Core P2P functionality |
| User profiles | Core P2P functionality |
| Session booking/joining | Core P2P functionality |
| `featured` in categories | Controls display ordering, not paid placement |
| `isVerified` in reviews | Review authenticity flag, not marketplace tier |

---

## Still Exists (Not Yet Disabled — Lower Priority)

These files still have marketplace earnings code but are lower traffic / less critical:

| File | What's There | Action |
|---|---|---|
| `src/app/host/analytics/page.tsx` | "Projected earnings" projections | Disable earnings sections if analytics page is P2P-facing |
| `src/app/host/payments/page.tsx` | PayNow payment verification | Disable if PayNow not used for P2P |
| `src/app/api/stripe/connect/create-account/route.ts` | Marketplace Stripe onboarding | Keep (low risk, not linked from UI) |
| `src/lib/ai/context.ts` | `totalEarnings` in AI context | Remove `totalEarnings` field |
| `src/app/support/page.tsx` | FAQ about earnings/Stripe | Update FAQ text |

---

## Schema Models — Marketplace-Specific

These models exist in `schema.prisma` and are used by marketplace but NOT by P2P:

| Model | Used By | Action |
|---|---|---|
| `EventTransaction` | Stripe checkout, earnings tracking | Keep in schema for now (3-month rule) |
| `HostStripeAccount` | Marketplace host Stripe Connect | Keep in schema for now |
| `EventAttendance` | PayNow payment tracking | Keep (has P2P relevance too) |

**Rule:** Comment out schema models only after 3 months of confirmed non-use.

---

## Notes

- `activityMode: 'MARKETPLACE'` kept in schema for potential future use
- `activityMode: 'P2P_PAID'` may use `User.p2pStripeConnectId` in future
- All P2P sessions currently use `activityMode: 'P2P_FREE'`
- Marketplace organizer flow (`/host/` routes) is separate from P2P user flow (`/buddy/` routes)
