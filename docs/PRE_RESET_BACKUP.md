# Pre-Reset State Backup
Date: 2026-03-11

## What We're Preserving
All data remains in the database — we are disabling UI access, not dropping tables.

| Table | Records | Preserved? |
|-------|---------|-----------|
| `EventSubmission` | 175 events (126 approved) | ✅ |
| `EventAttendance` | 212 attendances (20 paid) | ✅ |
| `Organizer` | 8 portal accounts, 53 handles | ✅ |
| `User` | 14 users | ✅ |
| `Activity` | 33 activities | ✅ |
| `UserActivity` | 8 bookings | ✅ |
| `WaveActivity` | 10 records | ❌ DROPPED (user decision — sunset Wave feature) |
| `WaveParticipant` | 10 records | ❌ DROPPED (user decision) |
| `HostApplication` | 0 records | ❌ DROPPED (0 records, never used) |

## Database Backup
Backup method: Git branch preserves full codebase + schema.
Full DB dump: run `pg_dump $DATABASE_URL > backup_pre_reset_20260311.sql` if needed.

## Code Backup
Branch: `main` (pre-nuclear-reset state)
Commit: e405569 — docs: add full system state audit, cron audit, auth architecture, and cleanup plan

## What Was Disabled (Routes → 410 Gone)
- `GET/POST /api/organizer/conversations` → 410
- `GET/POST /api/organizer/events` → 410
- `GET/PUT/DELETE /api/organizer/events/[id]` → 410
- `GET /api/organizer/events/[id]/attendees` → 410
- `POST /api/organizer/login` → 410
- `POST /api/organizer/register` → 410
- `POST /api/organizer/verify` → 410

## What Was Deleted
- `POST /api/host-applications` — 0 records, intake form never used
- `/api/wave/*` (6 routes) — Wave feature sunset
- `/crews` page — Wave UI sunset
- `model WaveActivity`, `model WaveParticipant`, `enum WaveActivityType` — dropped from schema
- `model HostApplication`, `enum HostApplicationStatus` — dropped from schema

## What Was Redirected
- `/host/*` → `/organizer-deprecated` (System B host dashboard, 0 P2P usage)
- `/organizer/*` → `/organizer-deprecated`
- `/crews` → `/organizer-deprecated`
- `/host` (root) → `/buddy/host/new` (P2P session creation)

## System B CRONs Stopped
- `/api/cron/process-event-reminders` — removed from vercel.json
- `/api/cron/host-weekly-summary` — removed from vercel.json
- `/api/cron/process-icebreakers` — removed from vercel.json
- `/api/cron/draft-post-event-emails` — removed from vercel.json
(EventSubmission data untouched, just no more automated emails)

## Rollback Plan
If we need to revert everything:
```bash
git checkout main
git push origin main --force  # if needed
# Restore DB from backup if data was lost
```
Full rollback estimated time: <15 minutes.
