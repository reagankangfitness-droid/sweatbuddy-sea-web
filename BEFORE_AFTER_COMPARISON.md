# Before / After Comparison
**SweatBuddies — Phase 0 Target State**

This document describes the desired end state after Phase 0 cleanup is complete.
Items marked ✅ are already done. Items marked 🔲 are planned.

---

## 1. Authentication

### Before
```
User visits /app route        → Clerk middleware (JWT)
User visits /organizer route  → OrganizerMagicLink cookie check
                                No connection between User and Organizer records
                                Same person = 2 accounts, 2 email addresses
```

### After (Target)
```
User visits /app route        → Clerk middleware (JWT)               ✅ unchanged
User visits /organizer route  → Clerk middleware (JWT)               🔲 future migration
                                Organizer.userId links to User.id     🔲 future migration
                                One account, one profile              🔲 future migration
```

**Phase 0 scope:** Document the boundary, establish the rule "P2P uses Clerk only."
Full merger is a Phase 1 migration.

---

## 2. Booking / Event Systems

### Before
```
System A (Clerk users):
  Activity → UserActivity → Payment
  Used by: /activities/*, /buddy/*, checkout

System B (Organizer portal):
  EventSubmission → EventAttendance → EventTransaction
  Used by: /organizer/*, /my-events/*

P2P (new):
  Activity (activityMode=P2P_FREE|P2P_PAID) → UserActivity → Payment
  Used by: /buddy/*

= 3 parallel booking systems
```

### After (Target — Phase 0)
```
System A (Clerk users):
  Activity → UserActivity → Payment           ✅ primary system
  P2P: same models, activityMode differentiates ✅ already implemented

System B (Organizer portal):
  EventSubmission → EventAttendance           still separate for now
  Documented as "organizer portal only"       🔲 add comments to schema

= 2 systems, clearly documented, with P2P folded into System A
```

---

## 3. Host Models

### Before
```
User.isHost (Clerk)           → hosts activities in System A
Organizer (magic link)        → hosts events in System B
HostApplication               → orphaned, no relations, unknown purpose
HostStripeAccount             → linked to EventSubmission, not User
User.p2pStripeConnectId       → for P2P paid sessions
```

### After (Target — Phase 0)
```
User.isHost (Clerk)           → hosts activities in System A          ✅
Organizer (magic link)        → hosts events in System B              ✅ (documented scope)
HostApplication               → annotated as deprecated               🔲
HostStripeAccount             → annotated as System B only            🔲
User.p2pStripeConnectId       → verified and documented               🔲
```

---

## 4. User Journeys

### 4.1 Attendee Joining a Free Event

**Before (marketplace)**
```
Browse /discover → Click event → /activities/[id] → "Join" → POST /api/activities/[id]/rsvp
                                                             → UserActivity created
                                                             → Confirmation email (Resend)
```

**After (P2P — already implemented)**
```
Browse /buddy → Click session → /activities/[id] → "Join" → POST /api/buddy/sessions/[id]/join
                                                           → UserActivity created (JOINED)
                                                           → P2P confirmation email (Resend)  ✅
                                                           → Host notification email (Resend)  ✅
```

---

### 4.2 Host Creating a Session

**Before (marketplace)**
```
No self-serve creation for marketplace events
Organizer portal: /organizer/events/new → EventSubmission → admin review → publish
```

**After (P2P — already implemented)**
```
/buddy → "Host a Session" → /buddy/host/new (4-step wizard) → POST /api/buddy/sessions/create
                                                             → Activity (P2P_FREE|P2P_PAID) created  ✅
                                                             → Redirect to /activities/[id]           ✅
```

---

### 4.3 Organizer Managing Events

**Before**
```
/organizer/login → magic link email → /organizer/dashboard → manage EventSubmissions
```

**After (Phase 0 — no change)**
```
Same flow. Scope documented. No migration yet.   🔲 document only
```

---

## 5. URL Routing

### Before
```
/activities/[id]    → Primary event detail page (System A)
/events/[id]        → Organizer-portal event view
/event/[id]         → Another event view variant
/e/[id]             → Short-link redirect (for emails)
/my-events/[id]     → Attendee's event management
/buddy              → P2P feed (new)
/buddy/host/new     → Create P2P session (new)
```

### After (Target — Phase 0)
```
/activities/[id]    → PRIMARY canonical URL for all events     ✅ canonical link meta tag
/e/[id]             → Short-link redirect (keep for emails)    ✅ unchanged
/event/[id]         → Redirect to /activities/[id] OR         🔲 audit + redirect
                       documented as organizer-portal only
/events/[id]        → Audit: redirect or document             🔲
/my-events/[id]     → Keep: attendee management (distinct UX) ✅ unchanged
/buddy              → P2P feed                                 ✅ already live
/buddy/host/new     → Create P2P session                       ✅ already live
```

---

## 6. Database Schema

### Before: Key Model Counts
```
Total models:          94
Booking models:        6 (Activity, UserActivity, Payment, EventSubmission, EventAttendance, EventTransaction)
Host models:           4 (User.isHost, Organizer, HostApplication, HostStripeAccount)
Auth models:           3 (User via Clerk, Organizer, OrganizerMagicLink)
Communication:         4 (Group, Community, SessionComment, P2PReport)  — 2 unused, 2 new
Stats models:          2 (UserStats, User inline fields)  — duplicate
```

### After Phase 0 (annotations only, no deletions)
```
Total models:          94  (no change — annotation only)
Deprecated/annotated:  HostApplication, UserStats (if unused), WaveActivity (if confirmed)
Documented scope:      Organizer, OrganizerMagicLink, EventSubmission, EventAttendance, EventTransaction
                       = "organizer portal only, separate system"
Active P2P models:     Activity (P2P_FREE|P2P_PAID), UserActivity, Payment, SessionComment, P2PReport  ✅
```

### After Phase 1 (actual migrations)
```
Total models:          ~75  (remove confirmed orphans)
Booking models:        3 (Activity, UserActivity, Payment) — one unified system
Host models:           2 (User.isHost, Organizer with userId backlink)
Stats models:          1 (inline User fields only)
```

---

## 7. Cron Jobs

### Before
```
13 cron routes, several with same or adjacent schedules:
  8am daily:   daily-jobs + process-event-reminders (both! potential duplicate)
  9am daily:   review-prompts
  9:30am daily: schedule-review-prompts (why 2 crons for one feature?)
  12am Monday: weekly-pulse + host-weekly-summary (both! potential duplicate)
  1am daily:   process-nudges
  7am daily:   process-icebreakers
  10am daily:  process-post-event-followups
  4pm daily:   draft-post-event-emails
```

### After Phase 0
```
8am daily:   daily-jobs (consolidated — process-event-reminders merged in if overlapping)
9am daily:   review-prompts (schedule-review-prompts merged in or staggered to 9:30am)
12am Monday: weekly-pulse (host-weekly-summary merged in if overlapping)
1am daily:   process-nudges
7am daily:   process-icebreakers
10am daily:  process-post-event-followups
4pm daily:   draft-post-event-emails

= max 7 cron routes (down from 13), zero duplicate-send risk
```

---

## 8. Summary Scorecard

| Dimension | Before Phase 0 | After Phase 0 | After Phase 1 |
|-----------|---------------|---------------|---------------|
| Auth systems | 2 (separate) | 2 (documented) | 1 (merged) |
| Booking systems | 2 + P2P = 3 | 2 (P2P in System A) | 1 unified |
| Host models | 4 (confusing) | 4 (annotated) | 2 (clean) |
| Cron jobs | 13 (overlapping) | 7-9 (consolidated) | 7-9 |
| URL patterns for events | 5 | 3-4 (redirects added) | 3 |
| Orphaned models | 1+ | 3 annotated | 0 |
| Complexity score | 7.5/10 | 5/10 | 3/10 |
