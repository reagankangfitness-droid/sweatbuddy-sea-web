# Feature Status Inventory
*Generated: March 2026 | Based on production DB snapshot*

---

## ✅ PRODUCTION — System B (Organizer Portal / Magic Link)
*This is where the real usage is: 212 attendances, 175 events*

| Feature | Model(s) | Records | Notes |
|---|---|---|---|
| EventSubmission system | `EventSubmission` | 175 total, 126 approved | Core of live business |
| EventAttendance tracking | `EventAttendance` | 212 total | Main booking system in use |
| Public event pages | `/e/[id]`, `/event/[slug]` | — | Consumer-facing event URLs |
| Event listing | `/events` | — | Browse approved events |
| Attendee self-service | `/my-events/[token]` | — | Token-based, no login required |
| Magic link auth | `OrganizerMagicLink` | 8 portal users | Login for 8 organizers |
| Organizer portal | `Organizer` | 8 records | Management dashboard |
| Organizer conversations | `EventDirectConversation` | — | Direct messaging |
| Event group chat | `EventMessage` | — | Per-event chat |
| Event reminders (cron) | `EventReminder` | — | 24h/2h social reminders |
| Icebreaker questions (cron) | — | — | AI questions in group chats |
| Post-event emails (cron) | `PostEventFollowUp` | 46 pending | AI-drafted thank-you emails |
| Weekly host summary (cron) | `WeeklyPulse`, `Organizer` | 0 pulse records yet | Email + DB, idempotent |
| AI weekly pulse (cron) | `WeeklyPulse` | 0 records yet | Stores to DB for dashboard |
| Host dashboard (System B) | `EventSubmission` | — | `/host/*` routes (Clerk auth) |
| Check-in system | `EventAttendance` | — | `/host/events/[id]/checkin` |
| Event duplication | `EventSubmission` | — | `/host/events/[id]/duplicate` |
| Attendance summary | `EventAttendance` | — | `/host/events/[id]/summary` |
| Host earnings view | `EventTransaction` | 0 records | `/host/earnings` — no data |
| Submit event form | `EventSubmission` | — | Public event submission |

---

## ✅ PRODUCTION — System A (Marketplace / Clerk)
*Small usage (8 bookings, 14 users), but this is the future platform*

| Feature | Model(s) | Records | Notes |
|---|---|---|---|
| Clerk authentication | `User` | 14 users | JWT-based, primary auth |
| User profiles | `User` | 14 records | `/user/[slug]`, `/profile` |
| Activity creation (marketplace) | `Activity` | 33 total | EventWizard |
| Activity detail + RSVP | `Activity`, `UserActivity` | 8 bookings | `/activities/[id]` |
| Activity editing | `Activity` | — | `/activities/[id]/edit` |
| Discover / browse | `Activity` | — | Feed with filters |
| Checkout flow | `Payment` | 1 record | Stripe checkout session |
| Booking confirmation | `UserActivity` | — | `/booking/success` |
| Booking tickets | `UserActivity` | — | `/booking/ticket`, `/ticket/[code]` |
| Activity group chat | `ActivityMessage` | — | Per-activity chat |
| Communities | `Community`, `CommunityMember` | 6 / 10 | `/communities/*` |
| Saved activities | `SavedActivity` | — | `/saved` |
| User dashboard | `User`, `Activity` | — | `/dashboard` |
| Referral system | `Referral` | — | `/join/[code]` |
| Admin panel | All models | — | `/admin/*` |
| Notifications | `Notification` | — | In-app notifications |
| Push subscriptions | `PushSubscription` | — | Web push (partial impl) |
| Reminder preferences | `ReminderPreferences` | — | User notification settings |
| Reminder scheduling (cron) | `ScheduledReminder` | 0 records | Fires when bookings exist |
| Review system | `Review`, `ReviewPrompt` | 0 records | Fires after events complete |
| Post-event followups (cron) | `PostEventFollowUp` | 46 records | 46 scheduled but nothing sent |
| Daily jobs orchestrator (cron) | Multiple | — | Master daily cron |
| Nudges (cron) | `Nudge` | — | Re-engagement nudges |
| Stats aggregation (cron) | `UserStats`, `ActivityStats` | — | Analytics aggregation |
| Waitlist | `Waitlist` | — | Activity waitlist |
| Host reminder settings | `HostReminderSettings` | — | Per-host reminder config |
| Delivery logs | `ReminderDeliveryLog` | — | Email open tracking |
| Settings | `User` | — | `/settings/profile` |
| City pages | `Activity` | — | `/cities/[slug]` |
| h/[slug] host profile | `User` or `Organizer` | — | Public host page |

---

## ✅ PRODUCTION — P2P System (NEW — System A extension)
*1 test record. Feature is built, not yet user-adopted*

| Feature | Model(s) | Records | Notes |
|---|---|---|---|
| P2P session feed | `Activity` (P2P_* mode) | 1 P2P_FREE | `/buddy` |
| P2P session creation | `Activity` | — | `/buddy/host/new` (4-step wizard) |
| P2P join (free) | `UserActivity` | — | `POST /api/buddy/sessions/[id]/join` |
| P2P leave | `UserActivity` | — | `POST /api/buddy/sessions/[id]/leave` |
| P2P onboarding | `User` (p2p fields) | 1 completed | `/onboarding/p2p` |
| P2P Stripe Connect | `User.p2pStripeConnectId` | 0 connected | `/buddy/host/connect`, `POST /api/stripe/connect/p2p` |
| Session comments | `SessionComment` | 0 | Built, not yet used |
| Report user/session | `P2PReport` | 0 | Built, not yet used |
| Block user | `UserBlock` | — | Built, not yet used |
| Manage attendees (host) | `UserActivity` | — | `ManageAttendeesModal` |
| P2P join emails | — | — | `sendP2PSessionConfirmationEmail` |
| P2P host notifications | — | — | `sendP2PHostJoinNotificationEmail` |

---

## 🚧 INCOMPLETE — Started but not finished

| Feature | Model(s) | Records | Issue |
|---|---|---|---|
| **WaveActivity** | `WaveActivity`, `WaveParticipant` | 10 / 10 | Routes exist (`/api/wave`), some UI (`/wave`, `/crews`), but no prominent user-facing flow. No clear path from onboarding → Wave. **Decision needed: invest or sunset.** |
| **Push notifications** | `PushSubscription` | — | Code written (`sendPushReminder`), VAPID keys referenced but implementation comment says "will implement with actual push library." Currently falls back to in-app notifications. |
| **Review system** | `Review`, `ReviewPrompt` | 0 records | System exists (cron, email templates, `/review/[bookingId]` page) but 0 reviews because there are almost no completed bookings in System A. Will activate naturally as bookings grow. |
| **AI agent / organizer conversations** | `AgentConversation`, `GeneratedContent` | — | `/api/host/ai`, `/api/ai/*` routes exist. AI agent infrastructure built for organizer portal. Used in `weekly-pulse` and `host-weekly-summary`. Complete for those use cases. |
| **HostApplication approval flow** | `HostApplication` | 0 records | Form exists at `/host`, API writes to table, but: (1) table has 0 records ever submitted, (2) status never feeds back into activity creation permissions. Broken intake flow. |
| **Organizer portal → Clerk auth migration** | — | — | 45 organizer Instagram handles have no portal account. 8 have portal accounts but separate from `User`. No migration path built yet. |

---

## ⚠️ LEGACY — Has data, potentially being phased out

| Feature | Model(s) | Records | Status |
|---|---|---|---|
| **Magic link auth** | `OrganizerMagicLink` | 8 organizers | Active for organizer portal only. Will become legacy once organizer portal migrates to Clerk. |
| **HostStripeAccount** | `HostStripeAccount` | 0 records | Model exists, routes built, but never used. The 20 "paid" EventAttendances were processed externally. System B Stripe Connect has never been activated. |
| **Paid EventAttendance tracking** | `EventAttendance.paymentStatus` | 20 "paid" | These appear to be manually-marked. No EventTransaction records to correspond. |

---

## ❌ DEAD — Zero or near-zero usage, safe to remove eventually

| Feature | Model(s) | Records | Recommendation |
|---|---|---|---|
| **HostApplication model** | `HostApplication` | 0 records | Remove the route from intake flow or actually enforce it. Currently: submits to DB but approval has no system effect. |
| **EventTransaction** | `EventTransaction` | 0 records | Model built for System B revenue tracking, never populated. Stripe never connected (0 HostStripeAccount records). |
| **WeeklyPulse** | `WeeklyPulse` | 0 records | Cron exists but has never run against real data. Will populate once cron fires and organizers have activity. Not dead — just hasn't run yet. |
| **ScheduledReminder** | `ScheduledReminder` | 0 records | Works correctly, fires when bookings exist. No bookings = no reminders. Will activate. |
| **ReviewPrompt** | `ReviewPrompt` | 0 records | Same — activates after System A bookings complete. |

---

## ❓ UNRESOLVED — Need decisions

| Question | Context | Recommendation |
|---|---|---|
| **WaveActivity: invest or sunset?** | 10 activities, 10 participants (likely test data). Routes exist. No prominent UX entry point. | **Sunset** — P2P serves the same "find workout partners" need more directly. Remove `/wave` and `/crews` pages in a future cleanup. |
| **HostApplication: enforce or remove?** | 0 records, admin sets isHost manually. Approval has no system effect. | **Remove the form** — redirect `/host` to P2P onboarding (`/onboarding/p2p`) since P2P is the new self-serve host path. Archive the model. |
| **System A + B merge?** | System B has 26x more engagement. System A is the future. | **Not now.** Keep separate. Build P2P on System A. Plan System B→A migration in 6+ months once P2P has traction. |
| **Organizer portal: migrate to Clerk?** | 45 organizers without portal accounts. 8 with. | **Low priority.** Organizer portal has active events but is admin-managed. Migrate when business requires self-serve organizer onboarding. |
| **Paid EventAttendances with no transactions?** | 20 "paid" records, 0 EventTransactions. | These were collected manually/externally. No action needed for historical data. Stripe Connect is now the path for new paid events. |

---

## Summary Scorecard

| System | Users/Orgs | Events | Bookings | Revenue | Verdict |
|---|---|---|---|---|---|
| **System A** (Activity/Clerk) | 14 users | 33 activities | 8 bookings | ~$0 | Future platform — invest here |
| **System B** (EventSubmission/Portal) | 8 portal, 53 handles | 175 events | 212 attendances | $0 tracked | Live business — maintain, don't break |
| **P2P** (System A extension) | 1 onboarded | 1 session | 0 joins | $0 | Building now |
| **Wave** | — | 10 activities | 10 participants | $0 | Sunset |
