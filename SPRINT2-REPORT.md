# Sprint 2: SOLIDIFY — Final Report

> Generated: 2026-02-22
> Commits: `fdf27ae` through `f0e8b42` (12 commits across Sprint 1 + 2)
> Branch: `main`

---

## Executive Summary

Sprint 2 audited all 5 critical systems (user journeys, Prisma schema, Stripe integration, cron/email pipeline, AI features) and fixed the highest-priority issues found. The codebase is now functionally solid for its core flows: event discovery, RSVP, payment, check-in, and host dashboard.

**Bottom line:** The platform works end-to-end for its primary Singapore market. The remaining issues are reliability/scale concerns, not blockers.

---

## 2A — User Journey Verdicts

| Journey | Verdict | Key Finding |
|---------|---------|-------------|
| **Discover → RSVP → Attend** | WORKING | Free events fully functional. Paid events (Stripe) work with proper capacity checks. PayNow is manual-verify by design. |
| **Host → Create → Get Paid** | WORKING | HostForm → EventSubmission → Stripe Connect → destination charges. PayNow verification dashboard exists. |
| **Reminders → Check-in → Review** | WORKING | Event reminders (24h), QR check-in, review prompts + reminders all wired. Post-event follow-ups send 3.5h after. |
| **Community & Social** | PARTIALLY WORKING | Communities, user profiles, DMs, crew chat lists exist. Wave creation UI is missing (API + DB done, no frontend). |
| **Dashboard & Analytics** | WORKING | User dashboard, host dashboard (stats, pulse, demand signals, earnings), admin dashboard all functional. |

### What's NOT working

| Gap | Severity | Notes |
|-----|----------|-------|
| Wave creation UI | Medium | API + schema complete, no frontend to create/discover waves |
| Host analytics trend charts | Low | Page exists but no historical aggregation endpoint for chart data |
| Admin settings backend | Low | UI-only stub, saves show toast but no API persists |

---

## 2B — Prisma Schema Audit

**Schema:** `apps/web/prisma/schema.prisma` (~50 models)

### Missing Cascade Deletes

32 foreign-key relations lack `onDelete: Cascade` where the child record should be cleaned up when the parent is deleted. The most impactful:

| Parent | Child | Risk |
|--------|-------|------|
| User | Activity (created/hosted) | Orphaned activities |
| User | UserActivity | Orphaned bookings + payments |
| User | Message, Conversation | Orphaned messages |
| User | Notification, NotificationPreference | Orphaned notifications |
| Activity | UserActivity, Group, Conversation | Orphaned attendees/chat |
| Activity | ReferralInvite, WorkoutBuddy | Orphaned social records |
| Group | Message, UserGroup | Orphaned chat data |
| EventSubmission | submittedByUser relation | Orphaned event submissions |

**Note:** The `packages/database` schema (dormant) HAS these cascades. Only `apps/web` (active) is missing them.

**Recommendation:** Add cascades in a single `prisma db push` migration. No data loss — only affects future deletes.

### Data Type Issues

| Field | Current | Should Be | Impact |
|-------|---------|-----------|--------|
| `Activity.price` | `Float` | `Int` (cents) | Floating-point rounding in money calculations |
| `UserActivity.amountPaid` | `Float` | `Int` (cents) | Inconsistent with EventSubmission (which uses Int) |
| `ReferralConversion.discountValue/Amount` | `Float` | `Int` (cents) | Same inconsistency |
| `EventAttendance.paymentStatus` | `String @db.VarChar(20)` | `PaymentStatus` enum | No DB-level validation |
| `EventReminder.status` | `String @db.VarChar(20)` | Enum | Same |

### Missing Indexes

~20 indexes needed for common query patterns. Highest-impact:

- `Activity(hostId, status)` — host dashboard
- `Activity(startTime, status)` — upcoming events
- `UserActivity(activityId, status)` — attendee lists
- `EventSubmission(eventDate, status)` — upcoming event queries
- `EventAttendance(email, paymentStatus)` — payment lookups
- `ScheduledReminder(scheduledFor, status)` — reminder cron
- `EventTransaction(hostId, status)` — payout queries

### Missing Timestamps

8 models lack `updatedAt`: Mention, StatsAggregationJob, EventReminder, PostEventFollowUp, EventChatMessage, EventDirectMessage, BetaWaitlist, RetentionAction.

---

## 2C — Stripe Integration Audit

### Security: STRONG

- Secret key server-only (Proxy pattern, never exposed at build time)
- Webhook signature verification via `constructEvent()` with timing-safe check
- All payment endpoints require Clerk or organizer session auth
- Price pulled from DB, never from request body
- Cross-event access prevented with scoped queries

### Payment Flows

| Flow | Status | Notes |
|------|--------|-------|
| Stripe Checkout (EventSubmission) | WORKING | Destination charges, application fee, capacity check |
| Stripe Connect onboarding | WORKING | Express accounts, Singapore, webhook status sync |
| PayNow (manual) | WORKING | Attendee submits reference → host verifies in dashboard |
| Refunds (individual) | FIXED | Now uses `calculateRefund()` with policy enforcement |
| Refunds (bulk) | WORKING | Already used refund policy engine |
| Webhook: checkout.session.completed | WORKING | Idempotent (checks existing transaction) |
| Webhook: charge.refunded | WORKING | Idempotent (checks existing refund status) |
| Webhook: account.updated | WORKING | Syncs Connect onboarding status |

### Issues Found & Fixed

| Issue | Status |
|-------|--------|
| Individual refund skipped policy check | FIXED (`f0e8b42`) — now uses `calculateRefund()` |
| `calculateRefundAmount()` in stripe.ts defined but never called | N/A — superseded by `lib/refund-policy.ts` engine |

### Remaining Issues (not blockers)

| Issue | Severity | Notes |
|-------|----------|-------|
| Two fee calculation systems | Medium | `lib/stripe.ts` (5%/2%) vs `lib/constants/fees.ts` (3.7% fixed) — EventSubmission vs Activity |
| Premium tier not implemented | Low | `HostSubscription` model exists, `isPremiumHost` param accepted, but no code checks subscription status |
| Connect account creation not idempotent | Low | Calling twice creates duplicate accounts (has existing-check but race-prone) |
| No Stripe API retry logic | Low | Mitigated by webhook idempotency |

---

## 2D — Cron Jobs & Email Audit

### Cron Jobs: 10 built, 7 scheduled

| Job | Schedule | maxDuration | Auth |
|-----|----------|-------------|------|
| `daily-jobs` | 8 AM daily | 60s | Yes |
| `process-event-reminders` | 6 AM daily | 60s | Yes |
| `weekly-pulse` | Monday midnight | 300s | Yes |
| `process-nudges` | 1 AM daily | 120s | Yes |
| `review-prompts` | Every 6h | 60s | Yes |
| `schedule-review-prompts` | Every 6h (offset) | 60s | Yes |
| `process-post-event-followups` | 10 AM daily | 60s | Yes |
| `process-waitlist` | Via daily-jobs | 60s | Yes |
| `process-reminders` | Via daily-jobs | 60s | Yes |
| `aggregate-stats` | Via daily-jobs | 300s | Yes |

**All 10/10 cron routes have auth protection (timing-safe secret comparison).**
**All 10/10 cron routes now have `maxDuration` set.**

### Issues Found & Fixed

| Issue | Status |
|-------|--------|
| daily-jobs missing `maxDuration` (would timeout) | FIXED (`f0e8b42`) |
| 4 cron routes missing `maxDuration` | FIXED (`f0e8b42`) |
| 6 cron routes not scheduled in vercel.json | FIXED — 3 added to vercel.json, 3 intentionally run via daily-jobs |

### Email System: 15 types implemented

| Category | Types | Status |
|----------|-------|--------|
| Welcome | 1 | Working (Clerk webhook) |
| Event status (submitted/approved/rejected) | 3 | Working |
| Event reminders (24h) | 1 | Working (6 AM cron) |
| Activity reminders (1-week/1-day/2-hour) | 3 | Working (via daily-jobs) |
| Review prompts + reminders | 2 | Working (via daily-jobs + dedicated cron) |
| Host notifications (new review, RSVP) | 2 | Working |
| Post-event follow-up | 1 | Working (dedicated cron) |
| Organizer magic link | 1 | Working |
| Event inquiry (attendee→host) | 1 | Working (fire-and-forget) |

### Missing Email Types

| Email | Severity | Notes |
|-------|----------|-------|
| Booking confirmation | Medium | User gets no email confirmation after RSVP. Booking success page exists but no email sent. |
| Booking cancellation | Low | No email on cancellation. User sees UI confirmation only. |
| Event cancellation (to all attendees) | Low | No bulk notification when host cancels event |

---

## 2E — AI Integration Audit

### Status: WELL-IMPLEMENTED

10 AI features using Anthropic Claude (`@anthropic-ai/sdk ^0.71.2`):

| Feature | Endpoint | Status |
|---------|----------|--------|
| Content generation | `/api/host/content` | Working |
| Event planning chat | `/api/host/ai/plan` | Working |
| Weekly pulse digest | `/api/cron/weekly-pulse` | Working |
| Retention insights | `/api/host/retention` | Working |
| Post-event summary | `/api/host/events/[id]/summary` | Working |
| AI pricing suggestions | `/api/host/ai/pricing` | Working |
| Nudge copy generation | `lib/nudges/ai-copy.ts` | Working |
| Content moderation | `lib/content-moderation.ts` | Working |
| Growth recommendations | `/api/host/growth` | Working |
| Demand signal analysis | `/api/host/demand` | Working |

**Architecture:** Clean separation — `lib/ai/client.ts` (singleton), `lib/ai/prompts.ts` (templates), `lib/ai/context.ts` (data fetching). All AI calls server-side only.

**Rate limiting:** Claude calls are behind auth (Clerk/host session). No per-user rate limiting on AI endpoints — low risk given small user base, but should add if scaling.

---

## 2F — Fixes Applied

| Commit | Fix | Files |
|--------|-----|-------|
| `fdf27ae` | Payment validation, XSS, idempotency, input limits | (prior sprint) |
| `0920517` | Auth bypasses, token reuse, info leaks, resource exhaustion | (prior sprint) |
| `0cea4be` | HTML injection in emails, JSON parse crash, dependency bugs | (prior sprint) |
| `2f9133e` | Remove 78 dead components | 78 files deleted |
| `34e5da5` | Delete unused map/screens/home directories | 3 dirs deleted |
| `7007002` | Delete AvatarStack, convert redirect stubs | 12 files |
| `e89ee38` | Strip orphaned event chat API + organizer redirect pages | 6 files |
| `602aece` | Consolidate core, fix redirect stubs, add CODEBASE.md | 5 files |
| `ea7a983` | Remove dead dependencies + jest config | 4 files |
| `f0e8b42` | Enforce refund policy, cron timeouts, schedule jobs, fix tests | 8 files |

**Total across Sprint 1 + 2: 149 files changed, ~26,500 lines removed, ~4,800 lines added.**

---

## Current Codebase Health

| Metric | Value |
|--------|-------|
| API routes | 169 |
| Pages | 52 |
| Components | 92 |
| Lib utilities | 62 |
| Scheduled cron jobs | 7 |
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Test suites | 1 (7/7 passing) |
| Dead code | Eliminated (Sprint 1) |
| Dead dependencies | Eliminated (Sprint 1) |

---

## Remaining Work → Sprint 3 Candidates

### Priority 1 — Schema hardening (single migration)

- Add `onDelete: Cascade` to 32 relations
- Add ~20 missing indexes
- Fix `Float` → `Int` for money fields (Activity.price, UserActivity.amountPaid)
- Add `updatedAt` to 8 models
- Convert string status fields to enums (EventAttendance.paymentStatus, EventReminder.status)

### Priority 2 — Reliability

- Add booking confirmation email (RSVP triggers email with event details + calendar link)
- Unify fee calculation (single `calculateFees()` used by both EventSubmission and Activity flows)
- Add per-user rate limiting on AI endpoints

### Priority 3 — Gaps

- Wave creation UI (API + DB ready, needs frontend)
- Host analytics trend charts (needs aggregation endpoint)
- Admin settings backend (needs API to persist config)
- Event cancellation notification email (bulk notify attendees)

### Not recommended for Sprint 3

- Mobile app (Expo project dormant, web-first is correct)
- NestJS API (dormant, Next.js API routes cover all needs)
- Consolidating Activity + EventSubmission models (too risky, both work, would touch 100+ files)

---

## Conclusion

The SweatBuddies codebase went from ~26,500 lines of dead code and 3 failing tests to a clean, type-safe, fully-linted codebase with all critical flows working. The schema needs cascade deletes and indexes (mechanical, low-risk), and 1-2 missing emails would improve UX, but nothing is blocking production use.
