# SweatBuddies Cleanup Plan
**Phase 0: Codebase Consolidation Before P2P Buildout**

---

## Priority Tiers

- **P0 — Blocker**: Must fix before P2P launch (risk of data corruption or duplicate emails)
- **P1 — High**: Do in Phase 0 before adding more features
- **P2 — Medium**: Do in Phase 1 (next sprint)
- **P3 — Low**: Backlog, nice to have

---

## P0: Blockers (Do First)

### P0-1: Fix Cron Job Scheduling Conflicts
**Problem:** `daily-jobs` and `process-event-reminders` both run at 8am daily. Unknown if this causes duplicate emails.
**Action:**
1. Read `/api/cron/daily-jobs/route.ts` to understand what it calls
2. Read `/api/cron/process-event-reminders/route.ts` to compare
3. If they overlap: merge into `daily-jobs`, remove `process-event-reminders` cron entry from `vercel.json`
4. Same check for `weekly-pulse` + `host-weekly-summary` (both Monday 12am)
5. Same check for `review-prompts` + `schedule-review-prompts` (9am and 9:30am)

**Effort:** 2-4 hours
**Risk:** Low — read-only analysis first, then targeted deletion
**Files:** `vercel.json`, `/api/cron/*.ts`

---

### P0-2: Verify P2P Stripe Connect Path
**Problem:** `HostStripeAccount` is linked to `EventSubmission`, not `User`. P2P paid sessions use `User.p2pStripeConnectId` — need to confirm this field exists and is used correctly.
**Action:**
1. Confirm `User.p2pStripeConnectId` was added to schema in P2P Phase 2
2. Confirm `/api/buddy/sessions/create/route.ts` checks this field before allowing paid session creation
3. Confirm Stripe Connect onboarding flow writes to `User.p2pStripeConnectId` not `HostStripeAccount`

**Effort:** 1-2 hours
**Risk:** Low — verification only
**Files:** `schema.prisma`, `/api/buddy/sessions/create/route.ts`, `/api/stripe/connect/route.ts`

---

## P1: High Priority (Phase 0 Core)

### P1-1: Audit and Tombstone HostApplication Model
**Problem:** `HostApplication` has no foreign key relations to `User` or `Organizer`. No routes create or read it in any meaningful flow.
**Action:**
1. Grep all files for `HostApplication` usage
2. If only referenced in schema with no active API routes: add `@@deprecated` comment
3. Do NOT delete from schema yet — confirm zero writes first
4. Add tracking comment in schema: `// AUDIT: orphaned model, no active usage found YYYY-MM`

**Effort:** 1 hour
**Risk:** Low — no schema deletion, just annotation
**Files:** `schema.prisma`, grep across `/api/**`

---

### P1-2: Consolidate Dual Weekly Cron Jobs
**Problem:** `weekly-pulse` and `host-weekly-summary` both run Monday at 12am. Could be sending duplicate emails or doing redundant work.
**Action:**
1. Read both route files
2. If separate concerns: stagger by 30 min (one at 12am, one at 12:30am)
3. If overlapping: merge into `weekly-pulse`, deprecate `host-weekly-summary` route

**Effort:** 2 hours
**Risk:** Medium — involves email sending logic

---

### P1-3: Clarify WaveActivity vs Activity
**Problem:** `WaveActivity` model may be a legacy alias or duplicate of `Activity`.
**Action:**
1. Check if `WaveActivity` has any data or active routes writing to it
2. Check the `/api/waves/*` routes — are they active or dead?
3. If dead: annotate both model and routes as deprecated
4. If alias: document the relationship clearly in schema comments

**Effort:** 1-2 hours
**Risk:** Low — read/annotate only

---

### P1-4: Remove or Redirect Duplicate Event URL Patterns
**Problem:** `/events/[id]`, `/event/[id]`, `/e/[id]`, `/my-events/[id]` all relate to events but serve different purposes without clear differentiation.
**Action:**
1. Document what each pattern is actually for:
   - `/e/[id]` — short-link redirect (keep, needed for emails/shares)
   - `/activities/[id]` — primary detail page (keep, this is canonical)
   - `/event/[id]` — organizer-portal event (document clearly)
   - `/events/[id]` — check if this redirects or is a full page
   - `/my-events/[id]` — attendee management page
2. Add canonical `<link>` meta tag to any duplicate pages pointing to `/activities/[id]`
3. If any route is entirely unreachable: 404 redirect

**Effort:** 3-4 hours
**Risk:** Medium — SEO impact if done wrong

---

### P1-5: Document Dual Auth System Boundaries
**Problem:** Clerk and OrganizerMagicLink coexist with no documented boundary. This causes confusion when adding new features (which auth system to use?).
**Action:**
1. Add `/docs/AUTH_ARCHITECTURE.md` documenting:
   - Clerk: all `/app/*` routes (users, attendees, hosts)
   - OrganizerMagicLink: only `/organizer/*` routes
   - Middleware rules
2. Add comments to `middleware.ts` clarifying the split
3. Establish rule: **all new P2P features use Clerk only**

**Effort:** 2 hours
**Risk:** None — documentation only

---

## P2: Medium Priority (Phase 1)

### P2-1: Evaluate Organizer Portal Merger
**Problem:** `Organizer` and `User` are separate entities. A host is simultaneously both.
**Decision required:** Do we want to eventually merge organizer portal into Clerk-based user system?
**Action (Phase 1):**
1. Count active organizers (query `Organizer` table size)
2. If small (< 50): plan a migration path to link `Organizer.email` → `User.email`
3. Design migration: add `userId String? @unique` to `Organizer`, backfill by email match
4. Add `User` → `Organizer` soft relation for unified host profiles

**Effort:** 8-16 hours
**Risk:** High — requires data migration and auth system changes

---

### P2-2: Consolidate Stats Fields
**Problem:** `UserStats` model + inline `sessionsHostedCount`/`sessionsAttendedCount` on `User` serve the same purpose.
**Action:**
1. Check if `UserStats` is actively written to or just read
2. If unused: deprecate model
3. If active: migrate reads/writes to inline User fields
4. Remove `UserStats` model after migration

**Effort:** 3-4 hours
**Risk:** Low

---

### P2-3: Group vs Community Evaluation
**Problem:** `Group` (per-activity chat) and `Community` (standalone group) overlap conceptually.
**Action:**
1. Check if either model has active UI
2. If `Group` has no UI: deprecate (comments are covered by P2P SessionComments now)
3. If `Community` is used for neighborhood/interest groups: keep but document clearly

**Effort:** 2 hours
**Risk:** Low

---

## P3: Low Priority (Backlog)

### P3-1: API Route Audit — Dead Routes
**Problem:** 211 API routes is a lot for a pre-launch product. Some may be dead.
**Action:**
1. Run grep to find routes with no corresponding page or component calling them
2. Tag candidates as potentially dead
3. Remove in batch after confirming no external callers

**Effort:** 4-8 hours
**Risk:** Medium (might break integrations if any route is called externally)

---

### P3-2: Schema Model Count Reduction
**Problem:** 94 models is high. Some may be unused or mergeable.
**Action:**
1. For each model, check if it has any active API route writing to it
2. Models with zero writes are candidates for removal
3. Batch removal after confirming no active usage

**Effort:** 8-16 hours
**Risk:** High — schema deletions require careful migration

---

## Execution Order

```
Week 1 (Phase 0):
  Day 1:  P0-1 (cron audit), P0-2 (Stripe verify)
  Day 2:  P1-1 (HostApplication tombstone), P1-3 (WaveActivity clarify)
  Day 3:  P1-2 (weekly cron consolidate), P1-5 (auth docs)
  Day 4:  P1-4 (URL pattern audit)
  Day 5:  Review + commit

Week 2+ (Phase 1):
  P2-1 through P2-3 in priority order
  P3 items as bandwidth allows
```

---

## Definition of Done for Phase 0

- [x] No duplicate cron emails possible — removed review-prompts, schedule-review-prompts, process-post-event-followups from vercel.json; staggered host-weekly-summary to 12:30am
- [x] P2P Stripe Connect path complete — POST /api/stripe/connect/p2p (Clerk auth, writes User.p2pStripeConnectId); return page at /buddy/host/connect; wizard updated
- [x] Schema models annotated — HostApplication (standalone intake), HostStripeAccount (System B only), WaveActivity (distinct from Activity)
- [x] Auth system boundaries documented — docs/AUTH_ARCHITECTURE.md, middleware.ts comments
- [x] URL patterns mapped — middleware.ts header comment documents all URL ownership
- [x] No new feature work starts until above are checked off
