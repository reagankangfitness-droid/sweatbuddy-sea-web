# SweatBuddies P2P Launch Checklist

**Kill Metric:** 100 P2P sessions/week by Day 90
**Check current count:** /admin dashboard → Kill Metric box

---

## ✅ COMPLETED (Pre-Launch)

### Core P2P Features
- [x] User signup + Clerk auth
- [x] P2P onboarding (photo, bio, fitness level, interests)
- [x] Create free P2P sessions — 4-step wizard (type → details → pricing → preview)
- [x] Browse sessions — public page at /browse
- [x] Authenticated feed at /buddy (filters: type, fitness level, free/paid)
- [x] Join sessions (one-click, with waitlist support)
- [x] My Sessions — /buddy/mine (hosting + attending tabs)
- [x] User profiles with stats (sessionsHostedCount, sessionsAttendedCount)
- [x] Session detail pages at /activities/[id]
- [x] Soft delete — deletedAt filter on all user-facing queries

### Admin Panel (/admin)
- [x] Admin auth guard (Clerk userId + ADMIN_EMAILS env var)
- [x] P2P metrics dashboard (totalUsers, onboarded, P2P sessions, upcoming)
- [x] P2P breakdown by mode (Free / Paid / Marketplace / Avg Attendees)
- [x] Top hosts leaderboard with avatars
- [x] Kill Metric box (100 sessions/week by Day 90)
- [x] Session management — /admin/activities (filter by status + mode, delete)
- [x] Deleted sessions show DELETED badge in admin, hidden from users
- [x] User management — /admin/users (ban/unban with reason + timestamp)
- [x] Banned users redirected to /banned page

### Mobile (375px+)
- [x] Responsive grids (1 col mobile → 2 col tablet → 3-4 col desktop)
- [x] Admin tables scroll horizontally (overflow-x-auto, min-w)
- [x] Filter pills scroll horizontally on mobile
- [x] Activity type grid: 3 cols on mobile (was 4, too cramped)
- [x] No horizontal page scroll (body overflow-x: hidden on mobile)
- [x] Bottom navigation
- [x] Fixed bottom CTA in session wizard

### Security
- [x] Clerk middleware protects all non-public routes
- [x] Admin APIs use isAdminRequest() — returns 401 for non-admin
- [x] Ban API requires admin auth
- [x] Banned users can't access /buddy or /profile (redirect to /banned)
- [x] Deleted sessions return 404 on detail page
- [x] Join API blocks joining deleted sessions (deletedAt: null check)

### SEO
- [x] Root metadata: title + description in app/layout.tsx
- [x] OG tags for social sharing
- [x] Twitter card meta tags
- [x] metadataBase set for absolute URLs

### Cleanup
- [x] Marketplace earnings page disabled (shows placeholder)
- [x] Earnings API returns 410 Gone
- [x] Earnings stat card + quick link removed from host dashboard
- [x] Deleted sessions filtered from all user-facing queries (9 files fixed)
- [x] docs/MARKETPLACE_CLEANUP.md documents all decisions

---

## 🚀 LAUNCH ACTIONS (Do Before Going Live)

### Environment Variables
- [ ] `ADMIN_EMAILS` — comma-separated admin email(s) in production .env
- [ ] `DATABASE_URL` — production Neon DB connection string
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — production Clerk key
- [ ] `CLERK_SECRET_KEY` — production Clerk secret
- [ ] `STRIPE_SECRET_KEY` — production Stripe key (for P2P paid later)
- [ ] `NEXT_PUBLIC_APP_URL` — production URL (e.g. https://sweatbuddies.sg)

### Deployment
- [ ] Deploy to Vercel production (`vercel --prod`)
- [ ] Verify production site loads at custom domain
- [ ] Test signup flow on production (not localhost)
- [ ] Test session creation on production
- [ ] Check /admin loads with correct admin email

### Initial Seed Content (Do Manually)
Create 10 sessions across different categories before first user arrives:
- [ ] 2× Running (Marina Bay, East Coast Park)
- [ ] 2× Gym/Strength (CBD area)
- [ ] 2× Yoga (Sentosa, Fort Canning)
- [ ] 2× HIIT/Bootcamp (various)
- [ ] 1× Cycling (East Coast)
- [ ] 1× Swimming or other

Time distribution:
- [ ] 3× morning (6-8am)
- [ ] 2× lunchtime (12-1pm)
- [ ] 5× evening (6-8pm)

### Monitoring (First 48h)
- [ ] Check Vercel error logs every 4 hours
- [ ] Monitor /admin for new signups
- [ ] Watch for ban-worthy users (spam, fake accounts)
- [ ] Check session join rate (are people actually joining?)

---

## 📊 90-DAY EXECUTION PLAN

### Week 1–4: Prove People Show Up
**Targets:** 20 sessions/week · 40% show-up rate · 300 users

Daily actions:
- [ ] Post 1 TikTok (POV: moved to SG, stop working out alone)
- [ ] Post in 3 FB expat groups
- [ ] Reply to every "gym buddy" / "running buddy" post on Reddit r/singapore

Weekly actions:
- [ ] Host 1–2 sessions yourself
- [ ] Attend 1 session hosted by someone else (show it works both ways)
- [ ] DM 5 people who posted about fitness/working out

Content angles that work:
- "POV: You moved to Singapore 3 months ago and still can't find gym friends"
- "How I finally made real friends in Singapore (not through apps)"
- "Stop working out alone — free fitness sessions in Singapore this week"

### Week 5–8: Prove Retention
**Targets:** 50 sessions/week · 1,200 users · 15% week-2 retention

- [ ] Post-session follow-up email (send within 24h of session)
- [ ] Host nurture program (help top hosts create more sessions)
- [ ] WhatsApp community group for active users
- [ ] Ask for UGC after every session (photos for social proof)
- [ ] Feature top hosts on Instagram/TikTok

### Week 9–12: Prove Organic Growth
**Targets:** 100 sessions/week · 4,000 users

- [ ] Referral program (invite friends to join a session)
- [ ] 3–5 micro-influencer partnerships ($200–500 each, fitness expats)
- [ ] Paid ads test — $500 budget, TikTok + Meta
- [ ] PR pitch to TimeOut Singapore, The Smart Local, Expat Living

### Week 4 Decision Gate
If **< 20 sessions/week** OR **< 40% show-up rate** by end of Week 4:
→ Stop, diagnose root cause, pivot before spending more on growth

Possible pivots:
- Problem: People sign up but don't create sessions → More seeded content + host coaching
- Problem: People create sessions but nobody joins → SEO/discovery fix
- Problem: People join but don't show up → Add reminders, social accountability
- Problem: Nobody signs up → Distribution problem, not product problem

---

## 🎯 KILL METRIC TRACKING

**Goal: 100 P2P sessions/week by Day 90**

| Week | Sessions Created | Show-up Rate | New Users | Notes |
|------|-----------------|--------------|-----------|-------|
| 1    |                 |              |           |       |
| 2    |                 |              |           |       |
| 3    |                 |              |           |       |
| 4    |                 |              |           |       |
| 8    |                 |              |           |       |
| 12   |                 |              |           |       |

Check /admin weekly for live numbers.

---

## ⚠️ KNOWN GAPS (Ship Later Based on Feedback)

These are intentionally deferred. Only build if users ask for them.

| Feature | Why Deferred | Build If... |
|---|---|---|
| Email reminders | Complex infra, not MVP | >50% users miss sessions |
| Reviews/ratings | Need session volume first | After 100+ sessions |
| WhatsApp share button | Nice-to-have | Users ask for it |
| In-app search | Browse + filters work for now | Feed gets too big |
| Map view | /browse works | Mobile users complain |
| Photo upload for sessions | Text works | Hosts request it |
| Paid P2P sessions | Free sessions first | After proving retention |
| Notifications | Can use email for now | Engagement drops |

---

## 📞 SUPPORT & OPERATIONS

**User issues:** Check /admin/users → ban if needed
**Session spam:** Check /admin/activities → delete + ban user
**Bugs:** Check Vercel error logs → fix + redeploy
**Support email:** support@sweatbuddies.sg

**Admin login:** Go to /admin → enter admin password
**Admin email:** Set in ADMIN_EMAILS env var

---

## CODE-LEVEL VERIFICATION (Completed 2026-03-12)

All verified programmatically before launch:

| Check | Status |
|---|---|
| SEO metadata (title, description, OG, Twitter) | ✅ Present in app/layout.tsx |
| Clerk auth middleware on all protected routes | ✅ clerkMiddleware configured |
| Banned user redirect to /banned | ✅ buddy/layout + profile/layout |
| Admin API auth guard (isAdminRequest) | ✅ All admin APIs |
| Session detail 404 for deleted/missing | ✅ notFound() called + deletedAt filter |
| Join API blocks deleted sessions | ✅ deletedAt: null in where clause |
| TypeScript errors | ✅ Only stale .next cache (clears on build) |
| deletedAt filter on all user queries | ✅ 9 files fixed across prompts 3+4 |

---

**Launch Date:** ___________
**First 100 Users Goal:** ___________ (Launch + 30 days)
**100 Sessions/Week Goal:** ___________ (Launch + 90 days)
