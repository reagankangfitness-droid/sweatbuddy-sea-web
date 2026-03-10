# DAY 1: Nuclear Reset — P2P Focus
Date: 2026-03-11
Branch: `nuclear-reset-p2p`

## Objective
Strip everything that isn't the P2P path. Preserve all data. Disable System B UI.
Remove dead models (0 records or user-decided sunset).

---

## What Was Disabled (410 Gone)

### System B — Organizer Portal API Routes
All replaced with `410 Gone` + "Contact support@sweatbuddies.sg":
- `GET/POST /api/organizer/conversations`
- `GET/POST /api/organizer/events`
- `GET/PUT/DELETE /api/organizer/events/[id]`
- `GET /api/organizer/events/[id]/attendees`
- `POST /api/organizer/login`
- `POST /api/organizer/register`
- `POST /api/organizer/verify`

### Wave API Routes (feature sunset)
All replaced with `410 Gone`:
- `GET/POST /api/wave/activities`
- `GET/PUT/DELETE /api/wave/activities/[id]`
- `POST /api/wave/activities/[id]/join`
- `POST /api/wave/activities/[id]/leave`

---

## What Was Deleted

| File | Reason |
|---|---|
| `src/app/api/host-applications/route.ts` | 0 records ever, intake form never used |

---

## What Was Redirected

| Route | → | Destination |
|---|---|---|
| `/host` | → | `/buddy/host/new` |
| `/host/:path*` | → | `/organizer-deprecated` |
| `/organizer/:path*` | → | `/organizer-deprecated` |
| `/crews` | → | `/organizer-deprecated` |

Implemented via `next.config.js` `redirects()` — no individual page files needed.

Page `src/app/organizer-deprecated/page.tsx` created with:
- "We've Rebuilt SweatBuddies" notice
- Links to /sign-up and /buddy

---

## Schema Changes (via `prisma db push --accept-data-loss`)

### Removed Models
| Model | Table | Records Dropped |
|---|---|---|
| `WaveActivity` | `wave_activities` | 10 rows (test data) |
| `WaveParticipant` | `wave_participants` | 10 rows (test data) |
| `CrewChat` | `crew_chats` | 0 rows |
| `CrewChatMember` | `crew_chat_members` | 0 rows |
| `CrewMessage` | `crew_messages` | 0 rows |
| `HostApplication` | `host_applications` | 0 rows |

### Removed Enums
- `WaveActivityType` (53 sport values)
- `HostApplicationStatus` (PENDING / APPROVED / REJECTED)

### Removed Relations from User Model
- `waveActivitiesCreated WaveActivity[]`
- `waveParticipations WaveParticipant[]`
- `crewChatMemberships CrewChatMember[]`
- `crewMessagesSent CrewMessage[]`

---

## Vercel Crons — Reduced to 3

| Cron | Schedule | Purpose |
|---|---|---|
| `/api/cron/daily-jobs` | `0 8 * * *` | System A: reminders, reviews, followups |
| `/api/cron/process-nudges` | `0 1 * * *` | Re-engagement nudges |
| `/api/cron/weekly-pulse` | `0 0 * * 1` | AI pulse + WeeklyPulse DB write |

Removed System B crons:
- `/api/cron/process-event-reminders`
- `/api/cron/host-weekly-summary`
- `/api/cron/process-icebreakers`
- `/api/cron/draft-post-event-emails`

---

## Navigation — Simplified to 3 Items

**Before**: Events / Buddies / Community / Profile + `/host` CTA
**After**: Discover / My Sessions / Profile + `/buddy/host/new` CTA

Removed tabs: Events (`/events` = System B), Community (`/communities`)

---

## Landing Page

**Before**: ISR page fetching EventSubmissions, organizer stats, System B marketing copy
**After**: Simple P2P placeholder — "Browse Sessions" → /buddy, "Sign Up Free" → /sign-up

---

## Data Preserved

All database tables untouched except the 6 dropped above:
- `EventSubmission`: 175 records ✅
- `EventAttendance`: 212 records ✅
- `Organizer`: 8 records ✅
- `User`: 14 records ✅
- `Activity`: 33 records ✅
- `UserActivity`: 8 records ✅

---

## Rollback

```bash
git checkout main
# Restore dropped tables from backup if needed:
# pg_dump was recommended before this operation — see PRE_RESET_BACKUP.md
```

Wave data (10 WaveActivity, 10 WaveParticipant rows) is permanently deleted.
HostApplication (0 rows) — no data loss.
All other data is safe.
