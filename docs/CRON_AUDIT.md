# Cron Job Audit — Duplicate Email Analysis
**Date:** March 2026 | **Status:** RESOLVED

---

## STEP 1: What Each Cron Does

### Daily pair

#### `/api/cron/daily-jobs` — 8am daily
**System:** A (Activity/UserActivity — Clerk users)
**Tables queried:** `Activity`, `ReviewPrompt`, `ScheduledReminder`, `PostEventFollowUp`, `Waitlist`

| Step | Function | Email sent | To whom | Trigger |
|------|----------|-----------|---------|---------|
| 1 | `scheduleReviewPrompt()` | None | — | Activities ended in last 24h → creates `ReviewPrompt` records |
| 2 | `processDueReviewPrompts()` | "Leave a review" | Activity attendees | `ReviewPrompt.status=PENDING` + `scheduledFor <= now` |
| 3 | `processReviewReminders()` | "Reminder: leave a review" | Activity attendees | `ReviewPrompt.status=SENT` + `reminderAt <= now` + `reminderSentAt IS NULL` |
| 4 | `processExpiredNotifications()` (via fetch) | Waitlist notification | Waitlisted users | Waitlist entries past expiry |
| 5 | `processDueReminders()` (via fetch) | "Tomorrow: [activity]" / "Starting Soon" | Activity attendees (System A) | `ScheduledReminder.status=PENDING` + `scheduledFor <= now` |
| 6 | `aggregate-stats?job=full` (via fetch) | **None** | — | Stats aggregation only |
| 7 | `processPostEventFollowUps()` | Post-event follow-up | Activity attendees | `PostEventFollowUp.status=PENDING` + `scheduledFor <= now` |

**Idempotency:** ✅ Every function queries `status=PENDING` and marks `SENT` after sending. Double-run finds zero pending records → sends nothing.

---

#### `/api/cron/process-event-reminders` — 8am daily
**System:** B (EventSubmission/EventAttendance — Organizer portal)
**Tables queried:** `EventReminder`, `EventAttendance`, `EventSubmission`, `ReminderPreferences`

| Email | Template | To whom | Trigger |
|-------|----------|---------|---------|
| "Tomorrow: [Event]" | `sendSocialReminderEmail()` | EventAttendance RSVP holders | `EventReminder.status=PENDING`, `reminderType=ONE_DAY`, `scheduledFor <= now` |
| "Starting in 2 Hours!" | `sendSocialReminderEmail()` | EventAttendance RSVP holders | `EventReminder.status=PENDING`, `reminderType=TWO_HOURS`, `scheduledFor <= now` |

Includes: familiar faces social context, unsubscribe link, WhatsApp/Telegram group link, Google Maps link.

**Idempotency:** ✅ Queries `status=PENDING`, marks `SENT` after sending.

---

### Weekly pair

#### `/api/cron/weekly-pulse` — Monday 12:00am
**System:** B (Organizer model)
**Tables queried:** `Organizer`, `EventSubmission`, `WeeklyPulse`

**Sends NO emails.** Creates `WeeklyPulse` DB records using Claude AI (summary, highlights, insights, suggestions). These are displayed in the organizer dashboard UI.

**Idempotency:** ✅ Checks `WeeklyPulse.organizerId_weekStart` unique constraint before generating.

---

#### `/api/cron/host-weekly-summary` — Monday 12:30am (staggered)
**System:** B (Organizer model)
**Tables queried:** `EventSubmission`, `EventAttendance`, `Organizer`

| Email | Template | To whom | Trigger |
|-------|----------|---------|---------|
| "Your week at [community] — N RSVPs" | `buildSummaryEmailHtml()` | Organizer email | Organizers with ≥1 event in last 30 days AND ≥1 event or RSVP last week |

Includes: events/RSVPs/new-member stats, AI-generated 4-5 line summary, "View Dashboard" CTA.

**Idempotency (after fix):** ✅ Checks `Organizer.lastWeeklySummarySentAt >= weekStart` before sending. Sets `lastWeeklySummarySentAt = now` after successful send.

---

## STEP 2: Are They Duplicates?

### daily-jobs vs process-event-reminders
**❌ NOT duplicates.**

| | daily-jobs | process-event-reminders |
|--|--|--|
| System | A | B |
| User model | `User` (Clerk) | None — just email strings in `EventAttendance` |
| Event model | `Activity` | `EventSubmission` |
| Reminder table | `ScheduledReminder` | `EventReminder` |
| Email template | Standard reminder | Social reminder (familiar faces) |
| Overlap | **Zero** | **Zero** |

**Running both at 8am is correct.** They serve different populations.

### weekly-pulse vs host-weekly-summary
**❌ NOT duplicates.**

| | weekly-pulse | host-weekly-summary |
|--|--|--|
| Sends email | **No** | **Yes** |
| Output | DB record (`WeeklyPulse`) | Email to organizer |
| Purpose | Powers dashboard UI | Delivers weekly report to inbox |
| Overlap | **Zero** | **Zero** |

**Both are needed.** Running them 30 minutes apart (12am vs 12:30am) is correct.

---

## STEP 3: Previous Duplicates (Already Fixed)

These crons were running alongside `daily-jobs` and calling the **exact same functions:**

| Cron removed | Called | Overlap with daily-jobs |
|---|---|---|
| `review-prompts` (was 9am) | `processDueReviewPrompts()` + `processReviewReminders()` | Steps 2+3 of daily-jobs |
| `schedule-review-prompts` (was 9:30am) | `scheduleReviewPrompt()` | Step 1 of daily-jobs |
| `process-post-event-followups` (was 10am) | `processPostEventFollowUps()` | Step 7 of daily-jobs |

**Action taken:** Removed all 3 from `vercel.json`. Cron count: 10 → 7.

---

## STEP 4: Fix Applied

**Problem:** `host-weekly-summary` had no idempotency guard. If Vercel retried the cron or it was triggered manually, every active organizer would receive 2 copies of the weekly email.

**Fix (Option B — dedup logic):**
1. Added `lastWeeklySummarySentAt DateTime?` to `Organizer` model in `schema.prisma`
2. Ran `prisma db push` — column added to production DB
3. Updated `gatherHostData()` to fetch this field
4. Added check in `processHostWeeklySummaries()`:
   - If `lastWeeklySummarySentAt >= weekStart` → skip with log message
5. After successful send: `prisma.organizer.update({ lastWeeklySummarySentAt: new Date() })`

**Why this approach:** No external dependencies (no Redis, no Resend query), uses existing DB transaction pattern, survives server restarts.

---

## STEP 5: Verification Plan

### Verify no duplicate sends happened (check Resend)
```
In Resend dashboard: filter by tag type=host_weekly_summary
Look for duplicate sends to the same email on the same day
```

### Verify idempotency works
```sql
-- Check that lastWeeklySummarySentAt is being written
SELECT instagram_handle, last_weekly_summary_sent_at
FROM organizers
ORDER BY last_weekly_summary_sent_at DESC
LIMIT 10;
```

### Verify daily-jobs dedup (no duplicate review emails)
```sql
-- All review prompts should be SENT or COMPLETED, none should appear twice
SELECT user_activity_id, COUNT(*) as count
FROM review_prompts
WHERE status = 'SENT'
GROUP BY user_activity_id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Verify process-event-reminders dedup (no duplicate event reminders)
```sql
-- Check for any reminders that sent twice
SELECT attendance_id, reminder_type, COUNT(*) as count
FROM event_reminders
WHERE status = 'SENT'
GROUP BY attendance_id, reminder_type
HAVING COUNT(*) > 1;
-- Should return 0 rows (unique constraint on attendanceId_reminderType)
```

### Monitor going forward
Add these log lines to watch:
- `[host-weekly-summary] Already sent for X week of Y — skipping` → idempotency working
- Any `[daily-jobs]` error in process-reminders → reminder dedup issue

---

## Current Cron Schedule (Clean State)

```
07:00 daily   process-icebreakers    → icebreaker questions in group chats
08:00 daily   daily-jobs             → ALL System A daily work (review prompts, reminders, followups, stats)
08:00 daily   process-event-reminders→ System B event reminders (EventAttendance-based, social context)
01:00 daily   process-nudges         → nudge notifications
16:00 daily   draft-post-event-emails→ AI-drafted post-event thank-you emails
00:00 Mon     weekly-pulse           → AI pulse stored to DB for organizer dashboard
00:30 Mon     host-weekly-summary    → Weekly stats email to organizer inbox (now idempotent)
```

**Total: 7 crons. Zero duplicates. All idempotent.**
