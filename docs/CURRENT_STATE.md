# SweatBuddies Current State
*Generated: March 2026*
*Last audit before P2P feature build-out*

---

## 1. AUTH SYSTEMS

### Clerk Auth
- **User count:** 14 total users (`User` table)
- **Users with isHost=true:** 9 of 14
- **Routes using Clerk:** All `/app/*`, `/buddy/*`, `/activities/*`, `/discover`, `/onboarding`, `/communities/*`, `/wave/*`, `/admin/*`, and their API counterparts under `/api/activities`, `/api/buddy`, `/api/user`, `/api/checkout`, `/api/stripe/connect/p2p`
- **Middleware:** `src/middleware.ts` — Clerk's `clerkMiddleware()` with a `createRouteMatcher` allowlist for public routes. All routes not on the public list require a valid Clerk JWT. Auth is validated server-side via `auth()` + `currentUser()` from `@clerk/nextjs/server`.
- **Status:** ✅ PRIMARY

### Magic Link Auth (Organizer Portal)
- **Organizer count:** 8 (`Organizer` table records with portal accounts)
- **Distinct Instagram handles in EventSubmission:** 53 — meaning 45 organizers have events in the system but NO portal account. They were added directly to EventSubmission by admin without creating an Organizer record.
- **Routes using magic link:** `/api/organizer/login`, `/api/organizer/register`, `/api/organizer/verify`, `/api/organizer/events/*`, `/api/organizer/conversations`, `/api/stripe/connect/create-account`, `/api/stripe/connect/create-account-link`, `/api/stripe/connect/status`, `/api/stripe/connect/dashboard`, `/api/stripe/connect/account-status/*`
- **Session validation:** `getOrganizerSession()` in `lib/organizer-session.ts` — checks cookie
- **Status:** ✅ ACTIVE (but small user base: 8 portal accounts vs 53 organizer handles)

**Boundary:**
- **Clerk** → anyone who signs up at sweatbuddies.co as a user, attendee, or P2P host. This is the consumer-facing product.
- **Magic link** → organizers who run recurring fitness events and manage them via the organizer portal (`/organizer/*`). Invite-only, set up manually by admin. Their data lives in a completely separate set of tables (`Organizer`, `EventSubmission`, `EventAttendance`).
- These two populations have ZERO overlap at the database level — no shared records, no foreign key relationships between `User` and `Organizer`.

---

## 2. BOOKING SYSTEMS

### System A: Activity + UserActivity + Payment
- **Total activities:** 33 (all published, 0 deleted)
- **By mode:** 32 MARKETPLACE, 1 P2P_FREE, 0 P2P_PAID
- **Activities with at least 1 booking:** 5
- **Total UserActivity records:** 8 (7 with status JOINED or COMPLETED)
- **Total Payment records:** 1 (1 cent — test data)
- **Revenue (System A):** ~$0 (1 cent test payment, `Payment.status=PAID`)
- **Routes:** `GET/PUT/DELETE /api/activities/[id]`, `POST /api/activities` (create), `POST /api/buddy/sessions/[id]/join`, `POST /api/buddy/sessions/[id]/leave`, `POST /api/checkout/*`, `GET /api/checkout/*`
- **UI pages:** `/activities/[id]` (detail + join), `/activities/[id]/edit`, `/buddy` (P2P feed), `/buddy/host/new` (create session), `/discover`, `/my-bookings`, `/review/[bookingId]`
- **Status:** ✅ PRIMARY for new feature development, but **very low actual usage** (8 bookings total)

### System B: EventSubmission + EventAttendance
- **Total EventSubmissions:** 175 (126 approved, 0 pending, remainder rejected/draft)
- **EventSubmissions with at least 1 attendee:** not queried directly, but 212 EventAttendances across all events
- **Total EventAttendances:** 212 (20 marked as paid)
- **Total EventTransactions:** 0
- **Revenue (System B):** $0 via EventTransaction (payment status tracked on EventAttendance directly, not via transaction records)
- **Routes:** `GET/POST /api/organizer/events`, `GET/PUT/DELETE /api/organizer/events/[id]`, `POST /api/submit-event`, `GET/POST /api/events`, `GET /api/events/[eventId]`, `POST /api/attendance`, `GET /api/my-events/*`
- **UI pages:** `/e/[id]` (public event page), `/event/[slug]` (public by slug), `/events` (event listing), `/my-events/[token]` (attendee self-service), `/host/events/*` (host management — see note below), `/organizer/*` (organizer portal)
- **Status:** ✅ PRIMARY by volume (212 attendances vs 8 bookings — this is where the real usage lives)

**Analysis:**
- **System B is overwhelmingly more active.** 212 attendances vs 8 UserActivity records. The organizer portal (`EventSubmission`) is what's actually running the business.
- **System A (Activity) is nascent.** 33 activities created (mostly test data), 8 bookings, ~$0 revenue.
- **They serve fundamentally different use cases:** System B is for recurring fitness communities with organizers (run clubs, yoga sessions). System A is intended for the marketplace where any user can host.
- **They should NOT be merged** in the short term — the data models are too different and System B has real data. P2P is being built on System A (correct choice).
- **Long-term:** System A + P2P should become the primary platform. System B organizers should eventually migrate to System A.

---

## 3. HOST MANAGEMENT

### User.isHost Flag
- **Users with isHost=true:** 9 of 14 total users (64%)
- **Enforced where:** `lib/auth.ts` (`getHostSession()` checks isHost), `GET /api/dashboard`, `GET /api/host/demand`, various host API routes, `src/lib/profile.ts`, `src/components/review-card.tsx`, `src/components/activity-group-chat.tsx`
- **What it gates:** Host dashboard access, host-specific API routes (analytics, earnings, community, content, chat), ability to create activities via the EventWizard
- **How it's set:** Manually by admin via `/api/admin/hosts` or via `organizer/verify` route (sets `isHost=true` when organizer is verified)
- **Status:** ✅ ENFORCED (checked in auth helpers and API middleware)

### HostApplication Model
- **Total applications:** 0
- **Pending:** 0 | **Approved:** 0 | **Rejected:** 0
- **Enforced where:** NOWHERE — activity creation does NOT check HostApplication status. `User.isHost` is set directly by admin without requiring a HostApplication.
- **Status:** ⚠️ NOT ENFORCED — the model exists and the `/host` page + `/api/host-applications` route writes to it, but the approval flow is completely manual (admin reads the email notification and then manually sets `isHost=true`). The HostApplication table has zero records, meaning zero people have gone through this intake form.

### Organizer Table (Portal System)
- **Total Organizer records:** 8 (portal accounts with magic link login)
- **Distinct organizer Instagram handles in EventSubmission:** 53 (organizers who have events but may not have portal accounts)
- **Gap:** 45 organizers have events in the system but no `Organizer` record — they were added by admin directly. These organizers cannot log into the organizer portal.
- **Status:** ✅ ACTIVE (for the 8 with portal accounts)

**Analysis — Is host approval gating anything?**
NO. The host approval flow is:
1. Prospective host fills form at `/host` → `POST /api/host-applications` → creates `HostApplication` record, sends email to admin
2. Admin manually reviews the email notification
3. Admin manually sets `User.isHost = true` via admin dashboard
4. `HostApplication` record is NEVER updated (status stays PENDING forever conceptually)

This means `HostApplication` is a notification mechanism only — not an approval gate. Anyone with `isHost=true` can create activities, regardless of HostApplication. Since HostApplication has 0 records, this entire flow has never been used.

---

## 4. PAYMENT SYSTEMS

### User.p2pStripeConnectId (P2P System — NEW)
- **Users with P2P Stripe connected:** 0
- **Field:** `User.p2pStripeConnectId String?` — added in P2P Phase 2
- **Used by:** `POST /api/buddy/sessions/create` (checks before allowing paid session), `POST/GET /api/stripe/connect/p2p` (creates/retrieves Connect account)
- **Status:** ✅ BUILT, not yet used (no P2P paid sessions exist yet)

### User.stripeConnectAccountId (System A — Note: field does NOT exist on User)
- **Correction:** There is no `stripeConnectAccountId` on the `User` model. This field lives on `HostStripeAccount`. `User` only has `p2pStripeConnectId` (added by us).
- **Users with any Stripe:** 0

### HostStripeAccount Table (System B)
- **Records:** 0
- **Linked to:** `EventSubmission.id` (via `eventSubmissionId`)
- **Status:** ⚠️ NO DATA — the model exists but zero organizers have connected Stripe via the organizer portal. This means all "paid" EventAttendances (20 records) were tracked without actual Stripe processing — likely manual/external payment.

### Organizer Stripe (System B)
- **Organizers with stripeAccountId:** The `Organizer` model does NOT have a `stripeAccountId` field. Stripe for System B flows through `HostStripeAccount` linked to `EventSubmission`, not `Organizer` directly.
- **Status:** ❌ ZERO Stripe usage across either system

**Analysis — Which Stripe for P2P?**
- `User.p2pStripeConnectId` — this is the correct field for P2P. Built and ready.
- `HostStripeAccount` — System B only, zero records, NOT for P2P.
- There is currently **zero Stripe Connect usage anywhere** in production. All 20 "paid" attendances appear to be tracked manually.

---

## 5. CRON JOBS (VERIFIED — NO DUPLICATES)

Reference: See `docs/CRON_AUDIT.md` for full details.

| Route | Fires When | What It Does | System | Status |
|-------|-----------|--------------|--------|--------|
| `daily-jobs` | 8am daily | Schedules + sends review prompts, reminders, waitlist, stats, followups | System A (Activity) | ✅ ACTIVE |
| `process-event-reminders` | 8am daily | Social reminder emails 24h/2h before EventSubmission events | System B (EventSubmission) | ✅ ACTIVE |
| `process-icebreakers` | 7am daily | Posts AI icebreaker questions in event group chats | System B | ✅ ACTIVE |
| `process-nudges` | 1am daily | Nudge notifications | System A | ✅ ACTIVE |
| `draft-post-event-emails` | 4pm daily | AI-drafts post-event thank-you emails | System B | ✅ ACTIVE |
| `weekly-pulse` | Mon 12:00am | Generates AI content → `WeeklyPulse` DB records (no email) | System B | ✅ ACTIVE |
| `host-weekly-summary` | Mon 12:30am | Sends weekly stats email to organizer inbox (now idempotent) | System B | ✅ ACTIVE |

**Active data in cron-related tables:**
- `PostEventFollowUp` records: 46 (pending/scheduled)
- `ScheduledReminder` records: 0 (none created yet — System A has almost no bookings)
- `ReviewPrompt` records: 0 (none triggered yet)
- `WeeklyPulse` records: 0 (cron hasn't run since feature was built)

---

## 6. ROUTING MAP

| Route Pattern | Purpose | Auth | Models Used | System | Status |
|---|---|---|---|---|---|
| `/` | Landing page | None | — | — | ✅ |
| `/activities/[id]` | Activity detail, join/leave | Public (Clerk optional) | Activity, UserActivity | A | ✅ |
| `/activities/[id]/edit` | Edit activity | Clerk (isHost) | Activity | A | ✅ |
| `/buddy` | P2P session feed | Clerk | Activity (P2P_*) | A | ✅ NEW |
| `/buddy/host/new` | Create P2P session | Clerk | Activity | A | ✅ NEW |
| `/buddy/host/connect` | Stripe Connect for P2P | Clerk | User | A | ✅ NEW |
| `/onboarding/p2p` | P2P onboarding | Clerk | User | A | ✅ NEW |
| `/e/[id]` | Organizer event detail (public) | None | EventSubmission, EventAttendance | B | ✅ |
| `/event/[slug]` | Organizer event by slug | None | EventSubmission | B | ✅ |
| `/events` | Organizer event listing | None | EventSubmission | B | ✅ |
| `/my-events/[token]` | Attendee self-service (tokenized) | Token in URL | EventAttendance | B | ✅ |
| `/host/*` | Host dashboard (EventSubmission host) | Clerk (isHost) | EventSubmission, Organizer | B | ✅ |
| `/host/page.tsx` | Host creation wizard | Clerk | Activity (EventWizard) | A/B | ⚠️ MIXED |
| `/organizer/*` | Organizer portal | Magic link cookie | Organizer, EventSubmission | B | ✅ |
| `/h/[slug]` | Public host profile page | None | Organizer or User | B | ✅ |
| `/user/[slug]` | User profile page | Clerk optional | User, Activity | A | ✅ |
| `/communities/[slug]` | Community detail | Clerk | Community, CommunityMember | A | ✅ |
| `/wave/*` | Group workout mode | Clerk | WaveActivity | A | 🚧 INCOMPLETE |
| `/crews` | Crews (wave-related?) | Clerk | WaveActivity | A | 🚧 UNCLEAR |
| `/admin/*` | Admin panel | Clerk + admin secret | All models | — | ✅ |
| `/discover` → redirects | Browse events | None | Activity, EventSubmission | A+B | ✅ |
| `/my-bookings` | User's Activity bookings | Clerk | UserActivity | A | ✅ |
| `/review/[bookingId]` | Submit review | Clerk | Review, UserActivity | A | ✅ |
| `/booking/success` | Post-checkout confirmation | None | Payment | A | ✅ |
| `/dashboard` | User dashboard | Clerk | User, Activity | A | ✅ |
| `/profile` | Edit profile | Clerk | User | A | ✅ |
| `/settings/profile` | Settings | Clerk | User | A | ✅ |
| `/saved` | Saved activities | Clerk | SavedActivity | A | ✅ |

**Overlap/confusion notes:**
- `/host/*` is the **organizer portal host dashboard** (manages EventSubmissions — System B), but uses Clerk auth (not magic link). The `/host/page.tsx` itself renders the `EventWizard` for creating new events in System A. This is a genuine hybrid.
- `/e/[id]` looks like a short-link but is actually a **full event detail page for System B events** (EventSubmission). It's NOT a redirect wrapper for `/activities/[id]`.
- `/activities/[id]` (System A) and `/e/[id]` (System B) are parallel but serve different data sets and different user populations.

---

## 7. DATABASE STATS (ACTUAL NUMBERS)

```
=== SYSTEM A: CLERK USERS ===
Total users:                    14
  isHost = true:                9  (64%)
  P2P onboarding completed:     1
  Any Stripe connected:         0

=== SYSTEM A: ACTIVITIES ===
Total activities:               33  (all published)
  MARKETPLACE mode:             32
  P2P_FREE mode:                1
  P2P_PAID mode:                0
  With at least 1 booking:      5

=== SYSTEM A: BOOKINGS ===
Total UserActivity records:     8
  JOINED or COMPLETED:          7
Total Payment records:          1  (1 cent — test data)
System A revenue:               ~$0

=== SYSTEM B: ORGANIZER PORTAL ===
Organizer portal accounts:      8
Distinct organizer handles:     53  (45 without portal accounts)
Total EventSubmissions:         175
  Approved:                     126
  Pending:                      0

=== SYSTEM B: ATTENDANCE ===
Total EventAttendances:         212
  Marked as paid:               20  (no Stripe — likely external/manual)
Total EventTransactions:        0
HostStripeAccount records:      0
System B revenue (tracked):     $0

=== SHARED/OTHER ===
Reviews:                        0
Communities:                    6  (10 members)
WaveActivities:                 10  (10 participants)
SessionComments:                0  (P2P feature new)
P2P Reports:                    0  (P2P feature new)
HostApplications:               0  (intake form never used)
WeeklyPulse records:            0  (cron hasn't run)
PostEventFollowUp records:      46 (scheduled, awaiting processing)
ScheduledReminder records:      0
ReviewPrompt records:           0
```

---

## 8. KEY FINDINGS

### System B (EventSubmission/Organizer Portal) is the live business
- 212 attendances vs 8 bookings
- 175 events vs 33 activities
- 53 distinct organizers (though only 8 with portal access)
- All actual event activity is happening through System B

### System A (Activity/Clerk) is the future product
- 14 users, 9 hosts, 33 activities (mostly test/dev data)
- 8 bookings total, ~$0 revenue
- P2P is correctly being built on System A

### No Stripe has ever processed a payment
- 0 HostStripeAccount records
- 0 completed EventTransactions
- 0 User.p2pStripeConnectId set
- The 20 "paid" EventAttendances are tracked manually/externally

### HostApplication is theater
- 0 records total — the intake form at `/host` has never been submitted
- isHost is set manually by admin without any HostApplication requirement
- The feature exists but the flow is broken (HostApplication status is never checked)

### Organizer data integrity gap
- 53 distinct organizer Instagram handles in EventSubmission
- Only 8 have Organizer portal accounts
- 45 organizers have no way to log into the organizer portal
- These 45 were added by admin directly to EventSubmission

### WaveActivity exists but is low-usage
- 10 WaveActivities, 10 participants
- Not featured prominently in UI
- Decision needed: invest in it or sunset it

### P2P is brand new (1 test record)
- 1 P2P_FREE activity
- 1 user completed P2P onboarding
- 0 comments, 0 reports, 0 session joins yet
