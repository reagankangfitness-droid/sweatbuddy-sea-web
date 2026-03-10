# SweatBuddies Codebase Audit Report
**Date:** March 2026
**Scope:** Full codebase audit prior to P2P feature buildout

---

## 1. Current State Analysis

### Scale
| Metric | Count |
|--------|-------|
| Prisma models | 94 |
| API route files | 211 |
| Page routes | 57 |
| Cron job routes | 13 |
| Lines in schema.prisma | 3,032 |

### Tech Stack
- **Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **ORM:** Prisma + PostgreSQL (Neon serverless)
- **Auth:** Clerk (primary users) + OrganizerMagicLink/cookie (legacy organizer portal)
- **Payments:** Stripe Connect (destination charges)
- **Email:** Resend
- **Storage:** UploadThing
- **Hosting:** Vercel (Hobby plan — daily cron only)
- **Monorepo:** pnpm + turbo (`apps/web`, `apps/api`, `packages/database`)

---

## 2. Overlapping Features Identified

### 2.1 Dual Authentication Systems

| System | Models | Used By | Status |
|--------|--------|---------|--------|
| Clerk | `User` | All user-facing features | **Active / Primary** |
| OrganizerMagicLink + cookie | `Organizer`, `OrganizerMagicLink` | Organizer portal (`/organizer/*`) | **Active but siloed** |

**Problem:** `Organizer` has no relation to `User`. A person who is both a user and an organizer has 2 separate records. They cannot share state (followers, history, profile).

**Files affected:**
- `/src/app/organizer/**` (all routes)
- `/src/app/api/organizer/**` (all API routes)
- `/src/middleware.ts` (dual auth logic)
- `/src/lib/organizer-auth.ts`

---

### 2.2 Dual Booking Systems

| System | Models | Used By |
|--------|--------|---------|
| System A (Primary) | `Activity`, `UserActivity`, `Payment` | `/activities/*`, `/buddy/*`, checkout flows |
| System B (Organizer) | `EventSubmission`, `EventAttendance`, `EventTransaction` | `/organizer/*`, `/my-events/*`, `/event/*` |

**Problem:** Both systems handle the same concept — "a fitness event that people attend and pay for." No data sharing between systems. Duplicate logic for RSVPs, payments, reminders, cancellations.

**Estimated duplication:** ~60 API routes doing equivalent work across both systems.

---

### 2.3 Dual Host Models

| Model | Auth | Relations | Status |
|-------|------|-----------|--------|
| `User` (isHost flag) | Clerk | Connected to Activity | **Active** |
| `Organizer` | Magic link | Connected to EventSubmission | **Active but separate** |
| `HostApplication` | None | No relations to User/Organizer | **Orphaned** |
| `HostStripeAccount` | None | Linked to EventSubmission, not User | **Partially active** |

**Problem:** `HostApplication` model exists with no foreign key relations — it's an island. `HostStripeAccount` is tied to the legacy `EventSubmission` system, not the primary `User`/`Activity` system.

---

### 2.4 Duplicate Communication Models

| Feature | Model A | Model B |
|---------|---------|---------|
| Group chats | `Group` (per-activity) | `Community` (standalone) |
| Activity tracking | `WaveActivity` | `Activity` |
| Stats/metrics | `UserStats` | fields on `User` (sessionsHostedCount, etc.) |

**Problem:** `Group` is created per Activity but `Community` is a standalone group — both are effectively "groups of people around fitness." `WaveActivity` appears to be a legacy name for `Activity`.

---

### 2.5 Routing Confusion

Multiple URL patterns serving overlapping purposes:

| Pattern | Purpose |
|---------|---------|
| `/activities/[id]` | Primary activity detail page |
| `/events/[id]` | Organizer-side event page |
| `/event/[id]` | Another event detail variant |
| `/e/[id]` | Short-link event redirect |
| `/my-events/[id]` | Attendee's event management |
| `/buddy/sessions/[id]` | P2P session detail (planned) |

**Problem:** Users (and the codebase) have 5+ different URL patterns for "view an event." SEO impact: backlinks and shares fragment across URLs.

---

### 2.6 Redundant Cron Jobs

13 cron job routes, several with overlapping logic:

| Route | Schedule | Potential Overlap |
|-------|----------|-------------------|
| `/api/cron/daily-jobs` | 8am daily | Catch-all — unknown what it calls |
| `/api/cron/process-event-reminders` | 8am daily | Same time as daily-jobs |
| `/api/cron/review-prompts` | 9am daily | Could be part of daily-jobs |
| `/api/cron/schedule-review-prompts` | 9:30am daily | Adjacent to review-prompts — two crons 30 min apart for same feature |
| `/api/cron/process-nudges` | 1am daily | Could consolidate |
| `/api/cron/weekly-pulse` | Monday 12am | |
| `/api/cron/host-weekly-summary` | Monday 12am | Same time as weekly-pulse — could consolidate |

---

## 3. Usage Signals

### High-Activity Areas (likely user-facing, keep)
- `/activities/*` — primary event pages
- `/api/activities/*` — main activity CRUD
- `/api/checkout/*` — Stripe payments
- `/api/webhooks/stripe` — payment processing
- `/api/user/*` — user profile management
- `/onboarding/*` — user onboarding
- `/discover` — browse/search

### Low-Signal / Possibly Unused
- `/api/waves/*` — wave system (may be deprecated in favor of activities)
- `/organizer/*` — organizer portal (separate user base, small)
- `HostApplication` model — no routes reference it in create/read flows
- `/api/cron/daily-jobs` — unclear what it actually does without reading the file
- `WaveActivity` model — possible alias or legacy name for Activity

### Never-Reached Paths
- Multiple `@relation` fields on orphaned models point to tables that are never queried

---

## 4. Complexity Scores

| Area | Score (1-10) | Notes |
|------|-------------|-------|
| Auth system | 8 | Two completely separate auth stacks |
| Booking/payments | 9 | Dual systems with zero shared code |
| Host management | 7 | 4 models, no unified concept |
| Routing | 6 | 5 URL patterns for events |
| Database schema | 8 | 94 models, several orphaned |
| Cron jobs | 5 | 13 jobs, some overlapping schedules |
| Overall | **7.5/10** | High complexity relative to product maturity |

---

## 5. Risk Areas

### Critical (fix before P2P launch)
- Cron job timing conflicts (`daily-jobs` + `process-event-reminders` both at 8am could duplicate emails)
- `HostStripeAccount` not linked to `User` — P2P paid sessions need Stripe Connect on `User`

### High (address in Phase 0)
- P2P sessions will add a 3rd booking pattern if System A and System B are not consolidated
- Dual auth makes it impossible to have a unified "host profile" page

### Medium (technical debt, address in Phase 1)
- `HostApplication` orphaned model wastes schema space and creates confusion
- `WaveActivity` vs `Activity` naming inconsistency
- 5 URL patterns for events fragments SEO

### Low (nice to have)
- `UserStats` vs inline User stats fields
- `Group` vs `Community` consolidation
