# Admin & Host Dashboard Audit
Date: 2026-03-11

---

## Summary

| Category | Count |
|---|---|
| Admin UI pages | 10 |
| Admin API routes | 21 |
| Host UI pages | ~12 (ALL already redirected → /organizer-deprecated) |
| Host API routes | ~30 (effectively dead — auth is broken) |

**Auth systems in use:**
- Admin dashboard: password-based cookie (`ADMIN_PASSWORD` env var → HMAC token)
- Host UI: **dead** — `/host/:path*` redirects to `/organizer-deprecated` (Day 1)
- Host API: `getHostSession()` → organizer magic link session, which requires `/api/organizer/verify` → now **410 Gone** (Day 1). Every `/api/host/*` request fails auth silently.

---

## Admin Pages (10 total)

### `/admin` — Main Dashboard
- **Purpose**: Platform overview with charts and activity feed
- **Data**: Attendee count, newsletter subscribers, host inquiries, event RSVPs — **all System B metrics**
- **Auth**: Password cookie session
- **P2P Relevant**: Partial — shows zero P2P data today
- **Action**: **ADAPT** — add a P2P stats row (Users, P2P sessions, total attendances via UserActivity)

### `/admin/activities` — Activity Approval
- **Purpose**: Approve/reject Activity records (System A)
- **Data**: `Activity` model with `user` relation
- **Auth**: Layout-inherited password session
- **P2P Relevant**: **YES** — P2P sessions are Activities (`activityMode = 'P2P_FREE' | 'P2P_PAID'`). This page manages them, but currently shows all activities with no P2P filter.
- **Action**: **ADAPT** — add `activityMode` filter + show P2P badge; this becomes primary session moderation tool

### `/admin/event-submissions` — EventSubmission Review
- **Purpose**: Approve/reject EventSubmission records from organizer portal
- **Data**: `EventSubmission` model only
- **Auth**: Layout-inherited password session
- **P2P Relevant**: **NO** — System B only
- **Action**: **KEEP AS-IS** — System B data preservation; don't touch

### `/admin/events` — Live EventSubmission Editor
- **Purpose**: Edit/delete live EventSubmission records + geocoding utility
- **Data**: EventSubmission (live), EventSubmission (pending)
- **Auth**: Clerk token header
- **P2P Relevant**: **NO** — System B only
- **Action**: **KEEP AS-IS**

### `/admin/pending` — Pending EventSubmissions Queue
- **Purpose**: Quick approval queue for EventSubmission records with `status = PENDING`
- **Data**: EventSubmission (PENDING)
- **Auth**: Clerk token header
- **P2P Relevant**: **NO** — System B only
- **Action**: **KEEP AS-IS**

### `/admin/attendees` — Attendees & Newsletter
- **Purpose**: View/delete EventAttendance records + newsletter subscribers; CSV export
- **Data**: EventAttendance (System B), NewsletterSubscriber
- **Auth**: Clerk token header
- **P2P Relevant**: **Partial** — shows System B attendees only; no UserActivity (P2P) records
- **Action**: **KEEP AS-IS** for System B data; separately consider adding a P2P Users tab to `/admin/hosts` instead

### `/admin/hosts` — Host/Organizer Management
- **Purpose**: Create System B organizer accounts, create EventSubmissions directly, generate magic links
- **Data**: Organizer model, EventSubmission
- **Auth**: Layout-inherited password session
- **P2P Relevant**: **Partial** — creation flow is System B specific; magic link is dead (organizer auth 410'd)
- **Action**: **ADAPT** — add a "P2P Users" tab to view/manage Clerk users (`User` model), manually set `isHost`, view session counts

### `/admin/newsletter` — Newsletter Subscribers
- **Purpose**: View/export NewsletterSubscriber records
- **Data**: NewsletterSubscriber
- **Auth**: Clerk token header
- **P2P Relevant**: **NO**
- **Action**: **KEEP AS-IS**

### `/admin/reports` — Moderation Queue
- **Purpose**: View UserReport records, take action (warn / suspend / ban / dismiss) on reported users
- **Data**: `Report` model, `User` (reporter + reported)
- **Auth**: Layout-inherited password session
- **P2P Relevant**: **YES** — user safety is critical for P2P. The `P2PReport` model also exists (from Day 1 schema) but is NOT currently shown here.
- **Action**: **ADAPT** — add P2PReport records to the queue alongside UserReport

### `/admin/settings` — Platform Config
- **Purpose**: Configure notifications, email settings, auto-approve trusted organizers, max attendees
- **Data**: In-memory / env config (no Prisma model)
- **Auth**: Layout-inherited password session
- **P2P Relevant**: **Partial** — some settings apply to both systems
- **Action**: **KEEP AS-IS**

---

## Admin API Routes (21 files)

| Route | System | Keep? |
|---|---|---|
| `GET/POST/DELETE /api/admin/auth` | Both | ✅ Keep (admin login) |
| `GET /api/admin/stats` | System B metrics | Adapt (add P2P counts) |
| `GET /api/admin/messages` | System B conversations | Keep as-is |
| `GET/PATCH /api/admin/activities` | System A | **Keep + Adapt** (P2P filter) |
| `GET/PATCH/DELETE /api/admin/activities/[id]` | System A | Keep |
| `GET/PATCH /api/admin/event-submissions` | System B | Keep as-is |
| `PATCH /api/admin/event-submissions/[id]` | System B | Keep as-is |
| `GET/PATCH /api/admin/events` | System B | Keep as-is |
| `PATCH/DELETE /api/admin/events/[id]` | System B | Keep as-is |
| `POST /api/admin/hosts` | System B | Keep as-is |
| `POST /api/admin/hosts/events` | System B | Keep as-is |
| `POST /api/admin/hosts/magic-link` | System B (dead) | Dead — organizer verify is 410 |
| `GET/PATCH /api/admin/reports` | System A | **Adapt** (add P2PReport) |
| `PATCH /api/admin/reports/[id]` | System A | Keep |
| `GET/PUT /api/admin/settings` | Both | Keep as-is |
| `POST /api/admin/geocode-events` | System B | Keep as-is (utility) |
| `POST /api/admin/generate-slugs` | System A | Keep as-is (utility) |
| `POST /api/admin/assign-neighborhoods` | System A | Keep as-is (utility) |
| `POST /api/admin/fix-dates` | System B | Keep as-is (utility) |
| `POST /api/admin/fix-event-dates` | System B | Keep as-is (utility) |
| `POST /api/admin/fix-activity-dates` | System A | Keep as-is (utility) |

---

## Host UI Pages (all DEAD)

All `/host/*` routes redirect to `/organizer-deprecated` via `next.config.js`.

| Page | Was Purpose | Status |
|---|---|---|
| `/host` | Event creation entry → EventWizard | ➡ Redirected |
| `/host/dashboard` | System B host overview | ➡ Redirected |
| `/host/events` | Event list | ➡ Redirected |
| `/host/events/[id]` | Event detail | ➡ Redirected |
| `/host/events/[id]/attendees` | Attendee list | ➡ Redirected |
| `/host/events/[id]/checkin` | Check-in scanner | ➡ Redirected |
| `/host/events/[id]/duplicate` | Duplicate event | ➡ Redirected |
| `/host/events/[id]/edit` | Edit event | ➡ Redirected |
| `/host/events/[id]/summary` | Post-event summary | ➡ Redirected |
| `/host/analytics` | Traffic + retention analytics | ➡ Redirected |
| `/host/earnings` | Revenue + payouts | ➡ Redirected |
| `/host/community` | Community management | ➡ Redirected |

**P2P equivalent:** Session management is done via `/activities/[id]` (existing System A page).

---

## Host API Routes (~30 files — effectively dead)

All use `getHostSession()` → requires organizer magic link cookie → set via `/api/organizer/verify` → **410 Gone**.

Every authenticated request to `/api/host/*` silently fails auth and returns 401/redirect. No organizer can reach these endpoints anymore.

| Group | Routes | Status |
|---|---|---|
| Dashboard | `/api/host/dashboard` | Dead (auth broken) |
| Events | `/api/host/events/[id]/*` (10 subroutes) | Dead |
| Analytics | `/api/host/analytics`, `/api/host/retention`, `/api/host/growth` | Dead |
| Community | `/api/host/community/*` | Dead |
| Earnings | `/api/host/earnings`, `/api/host/payments/*` | Dead |
| AI | `/api/host/ai/plan`, `/api/host/ai/pricing` | Dead |
| Engagement | `/api/host/reengagement/*`, `/api/host/post-event-drafts/*` | Dead |
| Misc | `/api/host/followers`, `/api/host/stats`, `/api/host/pulse`, etc | Dead |

**Recommendation:** Leave as dead code for now. No user-facing impact (they fail auth silently). Deleting later is safe — just not urgent.

---

## Prioritized Action Plan

### 🔴 High Priority (do next)

**1. Adapt `/admin/activities` — Primary P2P session moderation tool**
- Add `activityMode` filter buttons: All / P2P_FREE / P2P_PAID / Marketplace
- Show activityMode badge on each card
- Add ability to delete P2P sessions (same as reject)
- This is where you'll manage session quality/safety

**2. Adapt `/admin/reports` — Show P2PReport alongside UserReport**
- `P2PReport` model exists (created Day 1) but isn't in the queue
- Add a tab or merged view for P2PReport records
- Same warn/suspend/ban action flow applies

**3. Adapt `/admin` main dashboard — Add P2P stats row**
- Current: attendees, newsletter, host inquiries (all System B)
- Add: Total Clerk users, P2P sessions created, P2P attendances (UserActivity count), active sessions today

### 🟡 Medium Priority (do after launch)

**4. Adapt `/admin/hosts` — Add P2P user management tab**
- View all Clerk users (`User` model)
- Manually set `user.isHost = true` for trusted hosts
- View `sessionsHostedCount`, `sessionsAttendedCount`, `p2pOnboardingCompleted`
- Ban by setting `user.accountStatus = 'SUSPENDED'` (if that field exists)

**5. Admin stats API — Add P2P counts**
- `User.count()` (total Clerk users)
- `Activity.count({ where: { activityMode: { in: ['P2P_FREE', 'P2P_PAID'] } } })`
- `UserActivity.count()` (total P2P join events)

### 🟢 Low Priority / Leave as-is

- `/admin/event-submissions` — System B data, don't touch
- `/admin/events` — System B data, don't touch
- `/admin/pending` — System B data, don't touch
- `/admin/attendees` — System B data, don't touch
- `/admin/newsletter` — keep as-is
- `/admin/settings` — keep as-is
- All `/api/host/*` routes — dead, leave as-is

---

## What P2P Does NOT Need (confirm deletions are correct)

| Feature | Status | Why |
|---|---|---|
| Host application approval | ✅ Deleted Day 1 | Anyone can host in P2P |
| Payment/earnings dashboards | ✅ Dead (host UI gone) | Free sessions; Stripe Connect is self-serve |
| EventSubmission approval workflow | Kept for System B | 175 existing events, 212 attendances |
| Magic link generation | ✅ Dead (API 410) | System B organizer auth sunsetted |
| Wave / Crew features | ✅ Deleted Day 1 | Replaced by P2P |
| Commission tracking | Never existed | Not applicable |
| Premium listing features | Never existed | Not applicable |
