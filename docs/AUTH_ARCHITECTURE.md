# Authentication Architecture

SweatBuddies runs two separate authentication systems. This document defines their boundaries and the rule for new feature development.

---

## System A — Clerk (Primary)

**Used by:** All user-facing features, P2P, marketplace, onboarding, discover.

**How it works:**
- Clerk issues JWTs on sign-in
- `clerkMiddleware` in `middleware.ts` validates tokens on every request
- `auth()` and `currentUser()` from `@clerk/nextjs/server` retrieve the authenticated user
- User records are stored in the `User` model (Prisma), keyed by `email`

**Key files:**
- `src/middleware.ts` — route protection, public route list
- `src/lib/prisma.ts` — database client
- Pattern: `const { userId } = await auth()` then look up `User` by email

**Covers routes:**
```
/app, /buddy, /activities, /discover, /onboarding, /profile
/api/activities, /api/buddy, /api/user, /api/checkout
/api/stripe/connect/p2p  (P2P Stripe Connect — Clerk auth only)
```

---

## System B — OrganizerMagicLink (Legacy)

**Used by:** Organizer portal only (`/organizer/*`).

**How it works:**
- Host submits application via `/host` form → `HostApplication` record created
- Admin manually onboards them as an `Organizer` record
- Organizer requests a magic link → `OrganizerMagicLink` record created + email sent
- Clicking the link sets a cookie session
- `getOrganizerSession()` from `lib/organizer-session.ts` validates the cookie

**Key files:**
- `src/lib/organizer-session.ts` — session validation
- `src/lib/organizer-auth.ts` — auth helpers
- Pattern: `const session = await getOrganizerSession()` then use `session.instagramHandle`

**Covers routes:**
```
/organizer, /organizer/dashboard, /organizer/events
/api/organizer, /api/stripe/connect (original — uses HostStripeAccount)
/e/[id], /event/[slug]  (public pages for EventSubmission records)
```

**Limitations:**
- `Organizer` has NO foreign key relation to `User`
- A person who is both a user and organizer has 2 separate accounts
- Cannot share followers, history, or profile between systems

---

## System Comparison

| | System A (Clerk) | System B (OrganizerMagicLink) |
|--|--|--|
| Auth method | JWT via Clerk | Cookie via magic link email |
| User model | `User` | `Organizer` |
| Event model | `Activity` | `EventSubmission` |
| Payment model | `Payment` | `EventTransaction` |
| Stripe | `User.p2pStripeConnectId` | `HostStripeAccount` |
| Booking model | `UserActivity` | `EventAttendance` |

---

## Rules for New Features

1. **All new features use System A (Clerk) only.**
2. Never mix `getOrganizerSession()` into Clerk-auth routes or vice versa.
3. P2P sessions are System A: use `Activity` model with `activityMode = P2P_FREE | P2P_PAID`.
4. P2P Stripe Connect: use `User.p2pStripeConnectId` via `POST /api/stripe/connect/p2p`.
5. If you need host profile data for a P2P session, query the `User` model. Never query `Organizer`.

---

## Migration Path (Future)

Eventually we want one unified system. The migration plan:
1. Add `userId String? @unique` to `Organizer` model
2. Backfill by matching `Organizer.email` to `User.email`
3. Migrate organizer portal routes to use Clerk auth, reading `Organizer` via the `userId` link
4. Deprecate `OrganizerMagicLink` and cookie auth
5. Remove `Organizer` model, fold fields into `User` with an `isOrganizer` flag

This is a Phase 1+ effort requiring data migration. Do not start until organizer count and
activity are assessed (query `SELECT COUNT(*) FROM organizers`).
