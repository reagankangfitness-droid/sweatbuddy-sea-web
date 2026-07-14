# SweatBuddies Project Contracts

Last updated: 2026-07-14

This document captures the current product and engineering contracts that should stay stable while the codebase is being simplified.

## Product Contract

SweatBuddies is a social fitness discovery app for Southeast Asia.

Primary user promise:

- Find your people through fitness.
- Discover social fitness and wellness events with people already going.
- Make it easier to show up solo, choose beginner-friendly sessions, and return to familiar faces.

## Canonical Surfaces

| Surface | Contract |
| --- | --- |
| `/` | Consumer landing page for social fitness event discovery. |
| `/buddy` | Canonical discovery surface for upcoming sessions/events. |
| `/activities/[id]` | Canonical Activity detail page. |
| `/communities/[slug]` | Trust/source layer for hosts and communities. |
| `/host` | Public host acquisition page. |
| `/hub` | Logged-in host/member operating surface. |
| `/admin` | Admin moderation and curation surface. |

Legacy discovery URLs such as `/events`, `/browse`, `/cities`, `/discover`, `/explore`, and `/community` should redirect into the current surfaces instead of growing new product behavior.

## Canonical Data Model

| Model | Contract |
| --- | --- |
| `Activity` | Canonical joinable fitness or wellness event/session. |
| `UserActivity` | Attendance, RSVP state, going-solo signal, and attendee relationship to an Activity. |
| `Community` | Verified host/source/trust layer behind events. |
| `CommunityMember` | Manager/member relationship to a Community. |
| `CommunityClaim` + `VerificationChallenge` | Challenge-based community manager verification. |

`EventSubmission`, organizer routes, wave/crew routes, and older host subsystems are legacy or transitional. New discovery work should not extend those unless explicitly scoped.

## Discovery Contract

Public discovery must show only broadly safe listings:

- `moderationStatus: 'LIVE'`
- upcoming or active events
- visible people signals where available
- verified source/host context where available

Limited, rejected, blocked, or under-review listings must not appear in broad public discovery.

## Auth Contract

Clerk is the primary auth system for user-facing product routes.

Route-level requirements:

- Public reads can be unauthenticated.
- Mutating user routes must call Clerk auth or `getCurrentDbUser`.
- Admin routes must call `isAdminRequest`.
- Cron routes must require `CRON_SECRET`.
- Admin browser access is Clerk allowlist only; legacy password/session admin login is removed.

The proxy currently leaves several API namespaces public so public reads can work. Because of that, mutating route auth is protected by route-contract tests and must not be removed.

## Deployment Contract

Production deploys use the Vercel `web` project.

Current custom domains must point at the latest production deployment:

- `sweatbuddies.co`
- `www.sweatbuddies.co`
- `web-kappa-two-24.vercel.app`

After every deploy, inspect the deployment and verify the custom domain aliases, not only the generated Vercel URL.

## Stabilization Priorities

1. Keep `/buddy` as the canonical event discovery surface.
2. Keep product copy centered on social fitness events, people already going, and solo-friendly discovery.
3. Add tests before changing RSVP, going-solo, community claims, host event creation, admin moderation, or payment behavior.
4. Prefer redirecting/removing legacy surfaces over adding behavior to them.
5. Commit and deploy in small checkpoints; avoid another large uncommitted product state.
