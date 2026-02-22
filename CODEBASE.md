# SweatBuddies Codebase

> Last updated: 2026-02-22 (post Phase 0 cleanup)

## Project Structure

Monorepo managed with pnpm + Turborepo.

```
apps/
  web/          Next.js 14 (App Router) — primary application
  api/          NestJS 10 — unused/dormant backend
  mobile/       Expo/React Native — unused/dormant
packages/
  database/     Shared Prisma schema (re-exported)
  ui/           Shared UI package (minimal)
  types/        Shared TypeScript types
```

Only `apps/web` is actively developed and deployed (Vercel).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Clerk (primary) + legacy cookie-based organizer sessions |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Payments | Stripe Checkout + Connect + PayNow (Singapore manual) |
| Email | Resend |
| AI | Anthropic Claude (host content/planning) |
| Maps | Google Maps API (@react-google-maps/api) |
| File Upload | UploadThing |
| UI | Tailwind CSS + shadcn/ui components |
| Charts | Recharts |
| Animations | Framer Motion |
| Validation | Zod |
| Toasts | Sonner |

## File Counts (post-cleanup)

| Type | Count |
|------|-------|
| Pages | 52 |
| Components | 92 |
| API routes | 169 |
| Lib utilities | 63 |

## Page Routes

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page (dual CTA: attendees + hosts) |
| `/events` | Browse fitness experiences (main discovery) |
| `/e/[id]` | Event detail (EventSubmission system) |
| `/event/[slug]` | Event detail (slug-based, with DM to host) |
| `/activities/[id]` | Activity detail (Activity system) |
| `/activities/[id]/edit` | Edit activity (host only) |
| `/cities` | Browse cities |
| `/cities/[slug]` | City detail with events/communities |
| `/communities` | Browse communities |
| `/communities/[slug]` | Community detail with events/members |
| `/community` | Community social feed |
| `/crews` | Crew chat list (wave system) |
| `/h/[slug]` | Host public profile |
| `/user/[slug]` | User public profile |
| `/join/[code]` | Invite/referral link |
| `/support` | FAQ + contact form |

### Authenticated Pages
| Route | Description |
|-------|-------------|
| `/dashboard` | User activity dashboard |
| `/profile` | Current user menu/profile |
| `/saved` | User schedule + calendar export |
| `/my-bookings` | Booking history with cancellation |
| `/my-events/[token]` | Token-based RSVP list (no auth needed) |
| `/settings/profile` | Edit profile (name, bio, social links) |
| `/booking/success` | Post-booking confirmation + confetti |
| `/booking/ticket` | QR code ticket for check-in |
| `/ticket/[code]` | Check-in ticket by code |
| `/review/[bookingId]` | Submit post-event review |

### Host Pages
| Route | Description |
|-------|-------------|
| `/host` | Host application/onboarding form |
| `/host/dashboard` | Main host dashboard (stats, events, pulse) |
| `/host/analytics` | Charts and trends |
| `/host/community` | Attendee management + messaging |
| `/host/content` | AI content generator |
| `/host/growth` | Growth insights + AI recommendations |
| `/host/earnings` | Earnings + payment history |
| `/host/payments` | Payment verification (PayNow/Stripe) |
| `/host/plan` | AI event planning chat |
| `/host/events/[eventId]/attendees` | Attendance tracking + CSV export |
| `/host/events/[eventId]/edit` | Edit event details |
| `/host/events/[eventId]/checkin` | QR code check-in scanner |
| `/host/events/[eventId]/summary` | Post-event summary |

### Admin Pages
| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard with stats + charts |
| `/admin/activities` | Experience approval queue |
| `/admin/attendees` | Attendee + subscriber management |
| `/admin/event-submissions` | Event submission review |
| `/admin/events` | Event management + geocoding |
| `/admin/hosts` | Host account management |
| `/admin/newsletter` | Newsletter subscribers |
| `/admin/pending` | Pending experience review |
| `/admin/reports` | User report moderation |
| `/admin/settings` | Admin config (stub — UI only, no backend) |

### Auth & Legacy
| Route | Description |
|-------|-------------|
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up (supports `?intent=host` / `?intent=rsvp`) |
| `/organizer/verify/[token]` | Legacy magic link verification |

### Config Redirects (next.config.js)
| Source | Destination |
|--------|-------------|
| `/discover` | `/events` |
| `/explore` | `/events` |
| `/app` | `/events` |
| `/activities/create` | `/dashboard` |
| `/organizer` | `/sign-in?intent=host` |
| `/organizer/dashboard` | `/host/dashboard` |
| `/organizer/dashboard/:id/edit` | `/host/events/:id/edit` |
| `/organizer/dashboard/:id` | `/host/events/:id/attendees` |
| `/my-events` | `/` |
| `/my-activities` | `/dashboard` |

## Component Directories

```
components/
  community/     Community feed, share, join
  event/         Event-specific components
  host/          Host dashboard components (HostForm, AgentChat, etc.)
  landing/       Landing page sections (Hero, DualPath, BuiltFor, etc.)
  ui/            shadcn/ui primitives (button, dialog, input, etc.)
  waiver/        Waiver signing flow
  wave/          Crew chat (CrewChatList, CrewChatView)
  *.tsx          Top-level shared components
```

## Two Event Systems

The app has two parallel event systems:

### 1. Public Events (EventSubmission)
- Model: `EventSubmission` + `EventAttendance`
- Routes: `/e/[id]`, `/event/[slug]`
- API: `/api/events/*`, `/api/attendance/*`
- Features: RSVP, waitlist, payments, check-in, reviews
- Used by: organizer/host dashboard

### 2. Internal Activities (Activity)
- Model: `Activity` + `UserActivity`
- Routes: `/activities/[id]`
- API: `/api/activities/*`
- Features: RSVP, waitlist, group chat, reviews
- Used by: wave/crew system

Both systems use Clerk auth. EventSubmission also supports legacy cookie auth.

## Auth

- **Primary**: Clerk (OAuth, session management)
- **Legacy**: Cookie-based organizer sessions via `organizer-session.ts`
- **Admin**: Clerk user ID allowlist in `admin-auth.ts`
- **Hybrid**: `getHostSession()` tries Clerk first, falls back to organizer cookie

## Database

PostgreSQL (Neon) via Prisma. Schema at `apps/web/prisma/schema.prisma`.

Key models: `User`, `Organizer`, `EventSubmission`, `EventAttendance`, `Activity`, `UserActivity`, `WaveActivity`, `CrewChat`, `Community`, `Booking`, `EventReview`, `UserReport`, `Notification`, `Newsletter`.

~50 models total.

## Third-Party Services

| Service | Purpose | Env Var |
|---------|---------|---------|
| Clerk | Auth | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Neon | Database | `DATABASE_URL` |
| Stripe | Payments | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Resend | Email | `RESEND_API_KEY` |
| Anthropic | AI features | `ANTHROPIC_API_KEY` |
| Google Maps | Maps + geocoding | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY` |
| UploadThing | File uploads | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` |

## Known Stubs / Incomplete

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Settings | UI only | No `/api/admin/settings` backend — saves show toast only |
| Wave Creation UI | Missing | API + DB complete, no UI for creating/discovering waves |
| Mobile app | Dormant | Expo project exists but unused |
| NestJS API | Dormant | `apps/api` exists but unused |

## Cleanup History

Phase 0 cleanup (Feb 2026):
- Deleted 3 dead directories (`map/`, `screens/`, `home/`)
- Deleted 78 dead components
- Deleted 1 dead duplicate (`ui/AvatarStack.tsx`)
- Converted 10 redirect stubs to `next.config.js` redirects
- Stripped orphaned event chat API (backend with no frontend)
- Stripped 4 organizer legacy redirect pages
- Fixed organizer verify page to redirect to `/host/dashboard`
- **Total removed: ~110 files, ~17,500 lines**
